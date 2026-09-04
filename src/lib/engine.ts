/**
 * BLOCKEXCHANGE deterministic market engine.
 *
 * price(symbol, t) is a pure function of time — every client and the server
 * compute identical prices, so binary-option settlement is consistent no
 * matter when an expired trade is settled.
 */

function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface EngineParams {
  basePrice: number;
  volatility: number; // 0.5 .. 3
  trendBias: number;  // slow drift, -0.3..0.3
}

const engineCache = new Map<string, { waves: { amp: number; period: number; phase: number }[]; params: EngineParams; jitterSeed: number }>();

function getEngine(symbol: string, p?: Partial<EngineParams>) {
  const key = `${symbol}|${p?.basePrice ?? ''}|${p?.volatility ?? ''}|${p?.trendBias ?? ''}`;
  let e = engineCache.get(key);
  if (!e) {
    const seed = hash32(symbol);
    const rnd = mulberry32(seed);
    const basePrice = p?.basePrice ?? 100;
    const volatility = p?.volatility ?? 1;
    const trendBias = p?.trendBias ?? 0;
    // 6 superposed waves: periods 40s → 6h
    const waves = [0, 1, 2, 3, 4, 5].map(k => ({
      amp: (basePrice * 0.006 * volatility) * (1 + k * 0.9) * (0.75 + rnd() * 0.5),
      period: 45e3 * Math.pow(2.35, k) * (0.85 + rnd() * 0.3),
      phase: rnd() * Math.PI * 2,
    }));
    e = { waves, params: { basePrice, volatility, trendBias }, jitterSeed: seed ^ 0x9e3779b9 };
    if (engineCache.size > 256) engineCache.clear();
    engineCache.set(key, e);
  }
  return e;
}

/** Deterministic price of `symbol` at time `tMs`. */
export function priceAt(
  symbol: string,
  tMs: number,
  basePrice: number,
  volatility = 1,
  trendBias = 0,
): number {
  const e = getEngine(symbol, { basePrice, volatility, trendBias });
  const t = tMs / 1000;
  let noise = 0;
  for (const w of e.waves) noise += Math.sin((2 * Math.PI * t) / (w.period / 1000) + w.phase) * w.amp;
  // slow macro trend (bounded — no exponential drift)
  noise += Math.sin((2 * Math.PI * t) / (86400 * 2.7) + (hash32(symbol) % 100)) * e.params.basePrice * 0.02 * (trendBias * 4 + 0.4);
  noise += Math.sin((2 * Math.PI * t) / (86400 * 9.1) + (hash32(symbol) % 53)) * e.params.basePrice * 0.03 * trendBias;
  // deterministic 2s jitter (live feel, still pure)
  const bucket = Math.floor(tMs / 2000);
  const j = mulberry32(e.jitterSeed ^ bucket)();
  noise += (j - 0.5) * e.params.basePrice * 0.0012 * volatility;
  const px = basePrice + noise;
  return px > 0 ? px : Math.abs(px) + 0.0001;
}

export interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number }

/** Deterministic OHLC candles for a timeframe. */
export function candlesFor(
  symbol: string,
  tfMs: number,
  count: number,
  nowMs: number,
  basePrice: number,
  volatility = 1,
  trendBias = 0,
): Candle[] {
  const out: Candle[] = [];
  const end = Math.floor(nowMs / tfMs) * tfMs;
  for (let i = count - 1; i >= 0; i--) {
    const t0 = end - i * tfMs;
    const t1 = t0 + tfMs;
    const p0 = priceAt(symbol, t0, basePrice, volatility, trendBias);
    const p1 = priceAt(symbol, t1 - 1, basePrice, volatility, trendBias);
    const p2 = priceAt(symbol, t0 + tfMs * 0.33, basePrice, volatility, trendBias);
    const p3 = priceAt(symbol, t0 + tfMs * 0.66, basePrice, volatility, trendBias);
    const high = Math.max(p0, p1, p2, p3);
    const low = Math.min(p0, p1, p2, p3);
    const vol = (0.6 + mulberry32(hash32(symbol) ^ t0)() * 1.8) * (1000 / Math.max(1, basePrice / 100)) * tfMs / 60000;
    out.push({ time: t0, open: p0, close: p1, high, low, volume: Math.round(vol * 10) / 10 });
  }
  return out;
}

/** Sparkline points for the last `points` minutes. */
export function sparkFor(symbol: string, nowMs: number, basePrice: number, volatility = 1, trendBias = 0, points = 36, stepMs = 60_000): number[] {
  const arr: number[] = [];
  for (let i = points - 1; i >= 0; i--) arr.push(priceAt(symbol, nowMs - i * stepMs, basePrice, volatility, trendBias));
  return arr;
}

export function change24h(symbol: string, nowMs: number, basePrice: number, volatility = 1, trendBias = 0): number {
  const prev = priceAt(symbol, nowMs - 86400e3, basePrice, volatility, trendBias);
  const cur = priceAt(symbol, nowMs, basePrice, volatility, trendBias);
  return ((cur - prev) / prev) * 100;
}

/* ------------------------- indicator math (shared) ------------------------- */

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(null); continue; }
    if (prev === null) {
      let s = 0;
      for (let j = i - period + 1; j <= i; j++) s += values[j];
      prev = s / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

export function bollinger(values: number[], period = 20, mult = 2): { mid: (number | null)[]; upper: (number | null)[]; lower: (number | null)[] } {
  const mid = sma(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (mid[i] === null) { upper.push(null); lower.push(null); continue; }
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += (values[j] - (mid[i] as number)) ** 2;
    const sd = Math.sqrt(s / period);
    upper.push((mid[i] as number) + mult * sd);
    lower.push((mid[i] as number) - mult * sd);
  }
  return { mid, upper, lower };
}

/** Support / resistance from swing highs & lows (fractal, window=2). */
export function supportResistance(values: number[], lookback = 90): { supports: number[]; resistances: number[] } {
  const win = values.slice(-lookback);
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = 2; i < win.length - 2; i++) {
    if (win[i] > win[i - 1] && win[i] > win[i - 2] && win[i] > win[i + 1] && win[i] > win[i + 2]) highs.push(win[i]);
    if (win[i] < win[i - 1] && win[i] < win[i - 2] && win[i] < win[i + 1] && win[i] < win[i + 2]) lows.push(win[i]);
  }
  const cluster = (arr: number[]) => {
    const cs: number[] = [];
    for (const v of arr.sort((a, b) => a - b)) {
      const last = cs[cs.length - 1];
      if (last !== undefined && Math.abs(v - last) / last < 0.004) continue;
      cs.push(v);
    }
    return cs;
  };
  return { supports: cluster(lows).slice(-3), resistances: cluster(highs).slice(-3) };
}
