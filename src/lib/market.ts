// BLOCKEXCHANGE — market data core: pairs, simulation engine, generators

export interface Candle {
  t: number; // timestamp ms
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface MarketPair {
  id: string;
  symbol: string; // BTC/USDT
  base: string;
  quote: string;
  name: string;
  price: number;
  open24h: number;
  high24h: number;
  low24h: number;
  volBase: number; // in base asset
  volQuote: number; // USD
  mcap: number; // USD
  color: string;
  vola: number; // volatility factor
  cat: ('spot' | 'defi' | 'ai' | 'gaming' | 'new')[];
  leverageMax: number;
}

export interface BookLevel { price: number; amount: number; total: number }
export interface Trade { id: number; price: number; amount: number; time: number; side: 'buy' | 'sell' }

const P = (
  id: string, base: string, name: string, price: number, chgPct: number,
  volQuote: number, mcap: number, color: string, vola: number,
  cats: MarketPair['cat'], lev = 20,
): MarketPair => {
  const open = price / (1 + chgPct / 100);
  return {
    id, symbol: `${base}/USDT`, base, quote: 'USDT', name,
    price, open24h: open,
    high24h: Math.max(price, open) * (1 + 0.006 + vola * 0.01),
    low24h: Math.min(price, open) * (1 - 0.006 - vola * 0.01),
    volBase: volQuote / price,
    volQuote, mcap, color, vola, cat: cats, leverageMax: lev,
  };
};

export const PAIRS: MarketPair[] = [
  P('btc', 'BTC', 'Bitcoin', 67284.59, 2.45, 2.88e9, 1.328e12, '#F7931A', 1.0, ['spot'], 125),
  P('eth', 'ETH', 'Ethereum', 3598.20, 1.23, 1.664e9, 434.2e9, '#627EEA', 1.1, ['spot', 'defi'], 100),
  P('sol', 'SOL', 'Solana', 157.29, -0.75, 7.4e8, 76.8e9, '#14F195', 1.6, ['spot'], 75),
  P('bnb', 'BNB', 'BNB', 595.68, 0.98, 4.32e8, 86.4e9, '#F3BA2F', 0.9, ['spot'], 50),
  P('xrp', 'XRP', 'XRP', 0.6221, 1.45, 1.735e8, 34.7e9, '#00A3FF', 1.4, ['spot'], 50),
  P('ada', 'ADA', 'Cardano', 0.4073, -1.12, 7.3e7, 14.6e9, '#3468D1', 1.5, ['spot'], 25),
  P('doge', 'DOGE', 'Dogecoin', 0.1583, 4.82, 3.91e8, 22.9e9, '#C2A633', 2.4, ['spot', 'gaming'], 50),
  P('avax', 'AVAX', 'Avalanche', 34.86, -2.31, 2.24e8, 13.5e9, '#E84142', 1.8, ['spot', 'defi'], 50),
  P('link', 'LINK', 'Chainlink', 17.42, 3.16, 1.42e8, 10.2e9, '#2A5ADA', 1.7, ['spot', 'defi'], 25),
  P('dot', 'DOT', 'Polkadot', 7.038, -0.54, 6.5e7, 9.9e9, '#E6007A', 1.5, ['spot'], 25),
  P('ton', 'TON', 'Toncoin', 6.842, 2.08, 8.8e7, 17.1e9, '#0098EC', 1.6, ['spot', 'gaming'], 25),
  P('trx', 'TRX', 'TRON', 0.1362, 0.42, 4.6e7, 11.9e9, '#EB0029', 1.0, ['spot'], 10),
  P('near', 'NEAR', 'NEAR Protocol', 5.487, -1.87, 9.2e7, 6.4e9, '#00C1DE', 1.9, ['spot', 'ai'], 25),
  P('rndr', 'RNDR', 'Render', 9.845, 6.73, 1.9e8, 5.1e9, '#FF4D4D', 2.6, ['ai'], 25),
  P('fetc', 'FET', 'Artificial SI', 1.642, 5.28, 1.48e8, 4.1e9, '#1B4ADD', 2.5, ['ai'], 25),
  P('imx', 'IMX', 'Immutable', 1.538, -3.42, 5.6e7, 2.7e9, '#00ADFF', 2.3, ['gaming'], 20),
];

export const PAIR_MAP: Record<string, MarketPair> = Object.fromEntries(PAIRS.map(p => [p.id, p]));

export const change24h = (p: MarketPair) => ((p.price - p.open24h) / p.open24h) * 100;

/* ---------------------------------- RNG ---------------------------------- */
let seed = 987654321;
export function rnd(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
const randn = () => {
  const u = Math.max(rnd(), 1e-9), v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/* ------------------------------ Candle series ---------------------------- */
export function genCandles(pair: MarketPair, count: number, tfMs: number, endPrice?: number): Candle[] {
  const out: Candle[] = [];
  let price = endPrice ?? pair.open24h * (1 + (rnd() - 0.5) * 0.02);
  const now = Date.now();
  const start = now - count * tfMs;
  // walk forward then pin last candle close to current price
  const sigma = pair.vola * 0.006;
  let drift = (endPrice ?? pair.price - price) / count;
  const candles: Candle[] = [];
  for (let i = 0; i < count; i++) {
    const o = price;
    const c = Math.max(o * (1 + randn() * sigma + drift / o * 0.4), o * 0.9);
    const h = Math.max(o, c) * (1 + Math.abs(randn()) * sigma * 0.45);
    const l = Math.min(o, c) * (1 - Math.abs(randn()) * sigma * 0.45);
    const v = pair.volBase / 96 * (0.55 + rnd()) * (1 + Math.abs(c - o) / o * 30);
    candles.push({ t: start + i * tfMs, o, h, l, c, v });
    price = c;
  }
  if (endPrice != null) {
    const last = candles[candles.length - 1];
    last.c = endPrice;
    last.h = Math.max(last.h, endPrice);
    last.l = Math.min(last.l, endPrice);
  }
  return candles.concat(out);
}

export const TIMEFRAMES: { id: string; label: string; ms: number }[] = [
  { id: '1m', label: '1m', ms: 60_000 },
  { id: '5m', label: '5m', ms: 300_000 },
  { id: '15m', label: '15m', ms: 900_000 },
  { id: '1H', label: '1H', ms: 3_600_000 },
  { id: '4H', label: '4H', ms: 14_400_000 },
  { id: '1D', label: '1D', ms: 86_400_000 },
];

/* ------------------------------- Order book ------------------------------ */
export function genBook(price: number, levels = 14): { asks: BookLevel[]; bids: BookLevel[] } {
  const tick = Math.max(price * 0.00008, 0.00000001);
  const asks: BookLevel[] = [], bids: BookLevel[] = [];
  let at = 0, bt = 0;
  for (let i = 0; i < levels; i++) {
    const ap = price * (1 + tick / price * (i + 1) * 8 + rnd() * 0.00012);
    const bp = price * (1 - tick / price * (i + 1) * 8 - rnd() * 0.00012);
    const aa = (rnd() * 2.4 + 0.05) * (1 + i * 0.14);
    const ba = (rnd() * 2.4 + 0.05) * (1 + i * 0.14);
    at += aa; bt += ba;
    asks.push({ price: ap, amount: aa, total: at });
    bids.push({ price: bp, amount: ba, total: bt });
  }
  return { asks: asks.reverse(), bids };
}

/* ------------------------------ Recent trades ---------------------------- */
let tradeId = 1;
export function genTrades(price: number, n = 22): Trade[] {
  const out: Trade[] = [];
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const side = rnd() > 0.48 ? 'buy' : 'sell';
    out.push({
      id: tradeId++,
      price: price * (1 + (rnd() - 0.5) * 0.0009),
      amount: rnd() ** 2 * 3.2 + 0.001,
      time: now - i * (1200 + rnd() * 4200),
      side,
    });
  }
  return out;
}

/* ------------------------------ Tick engine ------------------------------ */
export function nextPrice(p: MarketPair, price: number): number {
  const sigma = p.vola * 0.00075;
  const meanRev = (p.price - price) / p.price * 0.02;
  const np = price * (1 + randn() * sigma + meanRev);
  return np;
}

/* ------------------------------ Formatters ------------------------------- */
export function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (n >= 0.01) return n.toFixed(4);
  return n.toFixed(6);
}

export function fmtAmt(n: number): string {
  if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}

export function fmtUsd(n: number, compactSmall = false): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (compactSmall && abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function fmtPct(n: number, digits = 2): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`;
}

export function timeAgo(t: number): string {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function fmtTime(t: number): string {
  return new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function fmtDate(t: number | string): string {
  return new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ------------------------------- Other data ------------------------------ */
export interface CopyTrader {
  id: string; name: string; handle: string; initials: string; color: string;
  roi30d: number; winRate: number; profitShare: number; copiers: number; aum: number;
  risk: 'Low' | 'Medium' | 'High'; specialty: string; chart: number[]; verified: boolean;
}

export const COPY_TRADERS: CopyTrader[] = [
  { id: 't1', name: 'Marcus Chen', handle: '@quantedge', initials: 'MC', color: '#00A3FF', roi30d: 34.6, winRate: 78, profitShare: 12, copiers: 4821, aum: 8.9e6, risk: 'Medium', specialty: 'BTC · ETH swing', verified: true, chart: [10, 14, 12, 18, 22, 19, 26, 24, 31, 34] },
  { id: 't2', name: 'Aisha Rahman', handle: '@defialpha', initials: 'AR', color: '#FFB800', roi30d: 28.1, winRate: 82, profitShare: 15, copiers: 3247, aum: 6.2e6, risk: 'Low', specialty: 'DeFi blue chips', verified: true, chart: [8, 11, 15, 14, 17, 21, 20, 24, 26, 28] },
  { id: 't3', name: 'Viktor Petrov', handle: '@bullmomentum', initials: 'VP', color: '#00FF88', roi30d: 61.4, winRate: 64, profitShare: 20, copiers: 8934, aum: 12.4e6, risk: 'High', specialty: 'Altcoin momentum', verified: true, chart: [5, 12, 9, 22, 18, 30, 27, 41, 52, 61] },
  { id: 't4', name: 'Sofia Laurent', handle: '@stableyield', initials: 'SL', color: '#9D7BFF', roi30d: 9.7, winRate: 91, profitShare: 10, copiers: 6892, aum: 15.1e6, risk: 'Low', specialty: 'Delta neutral', verified: true, chart: [4, 5, 6, 6, 7, 8, 8, 9, 9, 10] },
  { id: 't5', name: 'David Okafor', handle: '@ai_oracle', initials: 'DO', color: '#FF4D6D', roi30d: 45.2, winRate: 71, profitShare: 18, copiers: 5681, aum: 9.8e6, risk: 'High', specialty: 'AI narrative', verified: true, chart: [12, 10, 18, 24, 21, 29, 33, 30, 39, 45] },
  { id: 't6', name: 'Elena Volkova', handle: '@macrofx', initials: 'EV', color: '#14F195', roi30d: 19.3, winRate: 76, profitShare: 14, copiers: 2756, aum: 4.7e6, risk: 'Medium', specialty: 'Futures macro', verified: false, chart: [6, 9, 8, 12, 14, 13, 16, 15, 18, 19] },
];

export interface StakingPool {
  id: string; asset: string; name: string; color: string;
  type: 'Flexible' | 'Locked 30d' | 'Locked 90d' | 'Locked 120d';
  apy: number; min: number; maxApy?: number; totalStaked: number; userStaked: number;
}

export const STAKING_POOLS: StakingPool[] = [
  { id: 's1', asset: 'USDT', name: 'TetherUS', color: '#26A17B', type: 'Flexible', apy: 12.6, min: 10, totalStaked: 84.2e6, userStaked: 0 },
  { id: 's2', asset: 'BTC', name: 'Bitcoin', color: '#F7931A', type: 'Flexible', apy: 3.8, min: 0.001, totalStaked: 12.6e6, userStaked: 0 },
  { id: 's3', asset: 'ETH', name: 'Ethereum', color: '#627EEA', type: 'Locked 90d', apy: 8.9, min: 0.05, totalStaked: 48.9e6, userStaked: 0 },
  { id: 's4', asset: 'BNB', name: 'BNB', color: '#F3BA2F', type: 'Locked 30d', apy: 15.2, min: 0.1, totalStaked: 21.3e6, userStaked: 0 },
  { id: 's5', asset: 'SOL', name: 'Solana', color: '#14F195', type: 'Locked 120d', apy: 18.4, min: 1, totalStaked: 9.7e6, userStaked: 0 },
  { id: 's6', asset: 'ADA', name: 'Cardano', color: '#3468D1', type: 'Flexible', apy: 7.1, min: 10, totalStaked: 6.2e6, userStaked: 0 },
];

export interface LaunchProject {
  id: string; name: string; ticker: string; color: string; tagline: string;
  raise: number; raised: number; price: number; listing: string;
  status: 'live' | 'upcoming' | 'ended'; participants: number; startsIn?: string; category: string;
}

export const LAUNCHPAD: LaunchProject[] = [
  { id: 'l1', name: 'NexusAI', ticker: 'NXAI', color: '#00A3FF', tagline: 'Decentralized AI inference network for on-chain agents', raise: 2_000_000, raised: 1_640_000, price: 0.08, listing: 'Q4 2026', status: 'live', participants: 12480, category: 'AI' },
  { id: 'l2', name: 'MetaArena', ticker: 'MTA', color: '#FFB800', tagline: 'AAA blockchain gaming ecosystem with real asset ownership', raise: 1_500_000, raised: 320_000, price: 0.045, listing: 'Q1 2027', status: 'live', participants: 4820, category: 'Gaming' },
  { id: 'l3', name: 'FlowPay', ticker: 'FPAY', color: '#00FF88', tagline: 'Instant cross-border settlement on lightning rails', raise: 3_000_000, raised: 0, price: 0.12, listing: 'TBA', status: 'upcoming', participants: 0, startsIn: '2d 14h', category: 'Payments' },
  { id: 'l4', name: 'QuantumLedger', ticker: 'QLG', color: '#9D7BFF', tagline: 'Post-quantum secure layer-2 for institutional assets', raise: 2_500_000, raised: 2_500_000, price: 0.09, listing: 'Listed · +412%', status: 'ended', participants: 21300, category: 'Infrastructure' },
];

export interface CopyPosition {
  traderId: string; allocated: number; pnl: number; since: number;
}

export function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
