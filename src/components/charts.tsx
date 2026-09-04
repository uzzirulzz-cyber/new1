'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Candle } from '@/lib/market';

/* ------------------------- Sparkline (SVG, cheap) ------------------------ */
export function Sparkline({ data, w = 96, h = 32, up, strokeWidth = 1.6, glow = true }: {
  data: number[]; w?: number; h?: number; up?: boolean; strokeWidth?: number; glow?: boolean;
}) {
  const { d, area, isUp } = useMemo(() => {
    if (!data || data.length < 2) return { d: '', area: '', isUp: true };
    const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
    const step = w / (data.length - 1);
    const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - ((v - min) / rng) * (h - 6)).toFixed(1)}`);
    return {
      d: `M${pts.join(' L')}`,
      area: `M${pts.join(' L')} L${w},${h} L0,${h} Z`,
      isUp: data[data.length - 1] >= data[0],
    };
  }, [data, w, h]);
  const color = up !== undefined ? (up ? '#00FF88' : '#FF4D4D') : isUp ? '#00FF88' : '#FF4D4D';
  const gid = useMemo(() => `sg${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round"
        style={glow ? { filter: `drop-shadow(0 0 4px ${color}66)` } : undefined} />
    </svg>
  );
}

/* --------------------- Live sparkline from price seq -------------------- */
export function LiveSparkline({ history, w = 110, h = 36 }: { history: number[]; w?: number; h?: number }) {
  return <Sparkline data={history.slice(-40)} w={w} h={h} />;
}

/* --------------------------- Candlestick chart -------------------------- */
export function CandleChart({ candles, livePrice, height = 380, showVolume = true, pairName, timeframeLabel, showMA = true, showRSI = false }: {
  candles: Candle[]; livePrice: number; height?: number; showVolume?: boolean;
  pairName?: string; timeframeLabel?: string; showMA?: boolean; showRSI?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: height });
  const mouse = useRef<{ x: number; y: number } | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: height });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: height });
    return () => ro.disconnect();
  }, [height]);

  useEffect(() => {
    const onMove = (e: React.MouseEvent) => {
      const r = canvasRef.current?.getBoundingClientRect();
      if (!r) return;
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      force(x => x + 1);
    };
    const onLeave = () => { mouse.current = null; force(x => x + 1); };
    const cvs = canvasRef.current;
    cvs?.addEventListener('mousemove', onMove as unknown as EventListener);
    cvs?.addEventListener('mouseleave', onLeave);
    return () => {
      cvs?.removeEventListener('mousemove', onMove as unknown as EventListener);
      cvs?.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || candles.length < 2) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = size.w, H = size.h;
    cvs.width = W * dpr; cvs.height = H * dpr;
    cvs.style.width = `${W}px`; cvs.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const padR = 64, padB = 22, padT = 8;
    const volH = showVolume ? H * 0.16 : 0;
    const rsiH = showRSI ? 46 : 0;
    const chartH = H - padB - volH - rsiH - padT;

    const data = candles.slice(-Math.min(candles.length, Math.max(40, Math.floor(W / 8))));
    const n = data.length;
    const lows = Math.min(...data.map(c => c.l), livePrice);
    const highs = Math.max(...data.map(c => c.h), livePrice);
    const pad = (highs - lows) * 0.08;
    const min = lows - pad, max = highs + pad;
    const plotW = W - padR;
    const cw = plotW / n;
    const bw = Math.max(2, cw * 0.62);
    const yOf = (p: number) => padT + (1 - (p - min) / (max - min)) * chartH;

    // grid + price axis
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 5; i++) {
      const p = min + ((max - min) * i) / 5;
      const y = yOf(p);
      ctx.strokeStyle = 'rgba(0,163,255,0.07)';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(plotW, y); ctx.stroke();
      ctx.fillStyle = '#5E769A';
      const lbl = p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 0 }) : p >= 1 ? p.toFixed(2) : p.toFixed(5);
      ctx.fillText(lbl, plotW + 8, y + 3);
    }
    // time axis
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i += Math.ceil(n / 6)) {
      const x = i * cw + cw / 2;
      ctx.fillStyle = '#5E769A';
      const d = new Date(data[i].t);
      ctx.fillText(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, Math.min(x, plotW - 20), H - 6);
    }

    // MA lines
    const ma = (period: number) => data.map((c, i) => {
      if (i < period - 1) return null;
      let s = 0; for (let j = i - period + 1; j <= i; j++) s += data[j].c;
      return s / period;
    });
    const ma7 = showMA ? ma(7) : null;
    const ma25 = showMA ? ma(25) : null;
    const drawLine = (arr: (number | null)[], color: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = 1.1; ctx.beginPath();
      let started = false;
      arr.forEach((v, i) => {
        if (v == null) return;
        const x = i * cw + cw / 2, y = yOf(v);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };
    if (ma7) drawLine(ma7, 'rgba(255,184,0,0.55)');
    if (ma25) drawLine(ma25, 'rgba(157,123,255,0.5)');

    // candles
    for (let i = 0; i < n; i++) {
      const c = data[i];
      const x = i * cw + cw / 2;
      const up = c.c >= c.o;
      const col = up ? '#00FF88' : '#FF4D4D';
      ctx.strokeStyle = col; ctx.fillStyle = up ? 'rgba(0,255,136,0.9)' : 'rgba(255,77,77,0.9)';
      ctx.lineWidth = 1;
      // wick
      ctx.beginPath(); ctx.moveTo(x, yOf(c.h)); ctx.lineTo(x, yOf(c.l)); ctx.stroke();
      // body
      const y1 = yOf(Math.max(c.o, c.c)), y2 = yOf(Math.min(c.o, c.c));
      ctx.fillRect(x - bw / 2, y1, bw, Math.max(1.4, y2 - y1));
    }

    // volume bars
    if (showVolume) {
      const vMax = Math.max(...data.map(c => c.v));
      const vy0 = padT + chartH + 6;
      for (let i = 0; i < n; i++) {
        const c = data[i];
        const up = c.c >= c.o;
        const hgt = (c.v / vMax) * (volH - 8);
        ctx.fillStyle = up ? 'rgba(0,255,136,0.24)' : 'rgba(255,77,77,0.24)';
        ctx.fillRect(i * cw + (cw - bw) / 2, vy0 + (volH - 8 - hgt), bw, hgt);
      }
    }

    // RSI panel
    if (showRSI && rsiH > 0) {
      const rsi: number[] = [];
      let gain = 0, loss = 0;
      for (let i = 0; i < data.length; i++) {
        if (i === 0) { rsi.push(50); continue; }
        const diff = data[i].c - data[i - 1].c;
        gain = (gain * 13 + Math.max(diff, 0)) / 14;
        loss = (loss * 13 + Math.max(-diff, 0)) / 14;
        rsi.push(100 - 100 / (1 + gain / (loss || 1e-9)));
      }
      const ry0 = H - padB - rsiH;
      ctx.strokeStyle = 'rgba(0,163,255,0.08)';
      [30, 50, 70].forEach(v => {
        const y = ry0 + (1 - v / 100) * (rsiH - 8);
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(plotW, y); ctx.stroke();
        ctx.setLineDash([]);
      });
      ctx.strokeStyle = '#FFB800'; ctx.lineWidth = 1.2; ctx.beginPath();
      rsi.forEach((v, i) => {
        const x = i * cw + cw / 2;
        const y = ry0 + (1 - v / 100) * (rsiH - 8);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // last price line
    const ylp = yOf(livePrice);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(255,184,0,0.7)';
    ctx.beginPath(); ctx.moveTo(0, ylp); ctx.lineTo(plotW, ylp); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#FFB800';
    const lbl = livePrice >= 1000 ? livePrice.toLocaleString('en-US', { maximumFractionDigits: 1 }) : livePrice >= 1 ? livePrice.toFixed(2) : livePrice.toFixed(5);
    const tw = ctx.measureText(lbl).width;
    ctx.fillRect(plotW + 2, ylp - 9, Math.max(tw + 10, 56), 18);
    ctx.fillStyle = '#101c30';
    ctx.fillText(lbl, plotW + 8, ylp + 3);

    // crosshair
    const m = mouse.current;
    if (m && m.x < plotW && m.y < H - padB) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(127,212,255,0.35)';
      ctx.beginPath(); ctx.moveTo(m.x, 0); ctx.lineTo(m.x, H - padB); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, m.y); ctx.lineTo(plotW, m.y); ctx.stroke();
      ctx.setLineDash([]);
      const idx = Math.min(n - 1, Math.floor(m.x / cw));
      const c = data[idx];
      const tip = `${pairName ?? ''} ${timeframeLabel ?? ''}  O:${c.o.toFixed(2)} H:${c.h.toFixed(2)} L:${c.l.toFixed(2)} C:${c.c.toFixed(2)}`;
      ctx.font = '10px ui-monospace, monospace';
      const w2 = ctx.measureText(tip).width + 14;
      ctx.fillStyle = 'rgba(8,18,33,0.92)';
      ctx.fillRect(8, 8, w2, 20);
      ctx.strokeStyle = 'rgba(0,163,255,0.3)';
      ctx.strokeRect(8, 8, w2, 20);
      ctx.fillStyle = '#BFE3FF';
      ctx.textAlign = 'left';
      ctx.fillText(tip, 15, 21);
    }
  }, [candles, livePrice, size, showVolume, showRSI, showMA, pairName, timeframeLabel]);

  return (
    <div ref={wrapRef} className="w-full relative" style={{ height }}>
      <canvas ref={canvasRef} className="block cursor-crosshair" />
    </div>
  );
}

/* ------------------------------ Depth chart ------------------------------ */
export function DepthChart({ asks, bids, height = 120 }: {
  asks: { price: number; total: number }[]; bids: { price: number; total: number }[]; height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(400);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    cvs.width = w * dpr; cvs.height = height * dpr;
    cvs.style.width = `${w}px`; cvs.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, height);
    if (!asks.length || !bids.length) return;
    const maxP = asks[asks.length - 1].price;
    const minP = bids[bids.length - 1].price;
    const maxT = Math.max(asks[asks.length - 1].total, bids[bids.length - 1].total);
    const xOf = (p: number) => ((p - minP) / (maxP - minP)) * (w - 8) + 4;
    const yOf = (t: number) => height - 6 - (t / maxT) * (height - 14);
    // bids
    ctx.beginPath(); ctx.moveTo(xOf(bids[bids.length - 1].price), height);
    bids.forEach(l => ctx.lineTo(xOf(l.price), yOf(l.total)));
    ctx.lineTo(xOf(bids[0].price), height);
    ctx.closePath();
    const g1 = ctx.createLinearGradient(0, 0, 0, height);
    g1.addColorStop(0, 'rgba(0,255,136,0.35)'); g1.addColorStop(1, 'rgba(0,255,136,0.02)');
    ctx.fillStyle = g1; ctx.fill();
    ctx.beginPath();
    bids.forEach((l, i) => i === 0 ? ctx.moveTo(xOf(l.price), yOf(l.total)) : ctx.lineTo(xOf(l.price), yOf(l.total)));
    ctx.strokeStyle = '#00FF88'; ctx.lineWidth = 1.4; ctx.stroke();
    // asks
    ctx.beginPath(); ctx.moveTo(xOf(asks[0].price), height);
    [...asks].reverse().forEach(l => ctx.lineTo(xOf(l.price), yOf(l.total)));
    ctx.lineTo(xOf(asks[asks.length - 1].price), height);
    ctx.closePath();
    const g2 = ctx.createLinearGradient(0, 0, 0, height);
    g2.addColorStop(0, 'rgba(255,77,77,0.35)'); g2.addColorStop(1, 'rgba(255,77,77,0.02)');
    ctx.fillStyle = g2; ctx.fill();
    ctx.beginPath();
    [...asks].reverse().forEach((l, i) => i === 0 ? ctx.moveTo(xOf(l.price), yOf(l.total)) : ctx.lineTo(xOf(l.price), yOf(l.total)));
    ctx.strokeStyle = '#FF4D4D'; ctx.lineWidth = 1.4; ctx.stroke();
  }, [asks, bids, w, height]);

  return <div ref={wrap} className="w-full" style={{ height }}><canvas ref={ref} /></div>;
}

/* ------------------------------- Donut chart ----------------------------- */
export function Donut({ segments, size = 180, thickness = 22, center }: {
  segments: { label: string; value: number; color: string }[]; size?: number; thickness?: number;
  center?: React.ReactNode;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  // precompute cumulative offsets immutably
  const offsets = segments.map((s, i) => segments.slice(0, i).reduce((acc, x) => acc + x.value / total, 0));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(0,163,255,0.08)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * 2 * Math.PI * r;
          const acc = offsets[i];
          return (
            <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={s.color}
              strokeWidth={thickness} strokeDasharray={`${dash} ${2 * Math.PI * r - dash}`}
              strokeDashoffset={-acc * 2 * Math.PI * r} strokeLinecap="butt"
              style={{ filter: `drop-shadow(0 0 5px ${s.color}44)` }} />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">{center}</div>
    </div>
  );
}

/* --------------------------- Area chart (pnl etc) ------------------------ */
export function AreaChart({ data, height = 160, color = '#00A3FF', showAxis = true }: {
  data: number[]; height?: number; color?: string; showAxis?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(400);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const cvs = ref.current; if (!cvs || data.length < 2) return;
    const ctx = cvs.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    cvs.width = w * dpr; cvs.height = height * dpr;
    cvs.style.width = `${w}px`; cvs.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, height);
    const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
    const step = w / (data.length - 1);
    const yOf = (v: number) => 10 + (1 - (v - min) / rng) * (height - 26);
    // grid
    if (showAxis) {
      ctx.strokeStyle = 'rgba(0,163,255,0.07)';
      for (let i = 0; i <= 3; i++) {
        const y = 10 + (i * (height - 26)) / 3;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    }
    ctx.beginPath();
    data.forEach((v, i) => i === 0 ? ctx.moveTo(0, yOf(v)) : ctx.lineTo(i * step, yOf(v)));
    ctx.strokeStyle = color; ctx.lineWidth = 1.6;
    ctx.shadowColor = `${color}55`; ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineTo(w, height); ctx.lineTo(0, height); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, `${color}33`); g.addColorStop(1, `${color}00`);
    ctx.fillStyle = g; ctx.fill();
  }, [data, w, height, color, showAxis]);
  return <div ref={wrap} className="w-full" style={{ height }}><canvas ref={ref} /></div>;
}

/* --------------------- Animated hero background chart -------------------- */
export function HeroChartCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{ candles: { o: number; c: number; h: number; l: number }[]; ticked: boolean } | null>(null);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext('2d'); if (!ctx) return;
    if (!stateRef.current) {
      let price = 50;
      const candles: { o: number; c: number; h: number; l: number }[] = [];
      for (let i = 0; i < 60; i++) {
        const o = price;
        price *= 1 + (Math.random() - 0.47) * 0.045;
        const c = price;
        candles.push({ o, c, h: Math.max(o, c) * (1 + Math.random() * 0.02), l: Math.min(o, c) * (1 - Math.random() * 0.02) });
      }
      stateRef.current = { candles, ticked: false };
    }
    let raf = 0;
    let t = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      cvs.width = el.clientWidth * dpr; cvs.height = el.clientHeight * dpr;
      cvs.style.width = `${el.clientWidth}px`; cvs.style.height = `${el.clientHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);
    const draw = () => {
      t += 0.25;
      const W = el.clientWidth, H = el.clientHeight;
      const st = stateRef.current!;
      ctx.clearRect(0, 0, W, H);
      // advance one candle every few frames
      if (Math.floor(t) % 6 === 0 && !st.ticked) {
        st.ticked = true;
        const last = st.candles[st.candles.length - 1];
        const o = last.c;
        const c = o * (1 + (Math.random() - 0.47) * 0.035);
        st.candles.push({ o, c, h: Math.max(o, c) * (1 + Math.random() * 0.018), l: Math.min(o, c) * (1 - Math.random() * 0.018) });
        if (st.candles.length > 90) st.candles.shift();
      }
      if (Math.floor(t) % 6 !== 0) st.ticked = false;
      const n = st.candles.length;
      const cw = (W / n) * 1.6;
      const off = W - n * cw;
      const vals = st.candles.flatMap(c => [c.h, c.l]);
      const min = Math.min(...vals), max = Math.max(...vals);
      const yOf = (v: number) => H * 0.86 - ((v - min) / (max - min || 1)) * H * 0.7;
      st.candles.forEach((c, i) => {
        const x = off + i * cw + cw / 2;
        if (x < -cw) return;
        const up = c.c >= c.o;
        const col = up ? '0,255,136' : '255,77,77';
        ctx.strokeStyle = `rgba(${col},0.30)`;
        ctx.fillStyle = `rgba(${col},0.22)`;
        ctx.lineWidth = Math.max(1.5, cw * 0.14);
        ctx.beginPath(); ctx.moveTo(x, yOf(c.h)); ctx.lineTo(x, yOf(c.l)); ctx.stroke();
        const y1 = yOf(Math.max(c.o, c.c)), y2 = yOf(Math.min(c.o, c.c));
        ctx.fillRect(x - cw * 0.28, y1, cw * 0.56, Math.max(1.5, y2 - y1));
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return (
    <div ref={wrap} className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
      <canvas ref={ref} className="absolute inset-0" />
      <div className="absolute inset-0 hero-grid" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050B18]/40 to-[#050B18]" />
    </div>
  );
}
