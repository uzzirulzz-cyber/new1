'use client';

import { useEffect, useRef } from 'react';
import { bollinger, ema, sma, supportResistance } from '@/lib/engine';

export interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number }

export interface IndicatorToggles {
  bb: boolean; sma: boolean; ema: boolean; sr: boolean;
}

/**
 * Candlestick chart with Bollinger Bands, SMA, EMA, Support/Resistance
 * and a live price indicator line.
 */
export function IndicatorChart({
  candles, livePrice, height = 420, toggles, pairLabel, tfLabel,
}: {
  candles: Candle[];
  livePrice?: number;
  height?: number;
  toggles: IndicatorToggles;
  pairLabel: string;
  tfLabel: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || candles.length < 5) return;
    const parent = canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const W = parent.clientWidth;
    const H = height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const padR = 64, padB = 24, volH = 44;
    const padT = 8;
    const plotW = W - padR;
    const plotH = H - padB - padT - volH;

    const closes = candles.map(c => c.close);
    const bb = bollinger(closes, 20, 2);
    const sma20 = sma(closes, 20);
    const ema9 = ema(closes, 9);
    const { supports, resistances } = supportResistance(closes, 120);

    const data = livePrice ? [...candles.slice(0, -1), { ...candles[candles.length - 1], close: livePrice, high: Math.max(candles[candles.length - 1].high, livePrice), low: Math.min(candles[candles.length - 1].low, livePrice) }] : candles;
    let min = Math.min(...data.map(c => c.low));
    let max = Math.max(...data.map(c => c.high));
    if (toggles.bb) {
      for (let i = 0; i < data.length; i++) {
        const u = bb.upper[i], l = bb.lower[i];
        if (u !== null) max = Math.max(max, u);
        if (l !== null) min = Math.min(min, l);
      }
    }
    if (toggles.sr) {
      for (const s of supports) min = Math.min(min, s);
      for (const r of resistances) max = Math.max(max, r);
    }
    const range = (max - min) || 1;
    min -= range * 0.05; max += range * 0.05;

    const x = (i: number) => (i / (data.length - 1)) * (plotW - 12) + 6;
    const y = (p: number) => padT + plotH - ((p - min) / (max - min)) * plotH;

    // grid + price axis
    ctx.strokeStyle = 'rgba(148,163,184,0.09)';
    ctx.fillStyle = 'rgba(148,163,184,0.55)';
    ctx.font = '10px Geist, sans-serif';
    ctx.textAlign = 'left';
    for (let g = 0; g <= 5; g++) {
      const p = min + ((max - min) * g) / 5;
      const gy = y(p);
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(plotW, gy); ctx.stroke();
      ctx.fillText(p >= 1000 ? p.toFixed(0) : p >= 1 ? p.toFixed(3) : p.toPrecision(4), plotW + 8, gy + 3);
    }

    // support / resistance zones
    if (toggles.sr) {
      for (const s of supports) {
        ctx.strokeStyle = 'rgba(0,255,136,0.35)';
        ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(0, y(s)); ctx.lineTo(plotW, y(s)); ctx.stroke();
        ctx.fillStyle = 'rgba(0,255,136,0.7)';
        ctx.fillText(`S ${s >= 1 ? s.toFixed(3) : s.toPrecision(4)}`, plotW + 8, y(s) - 4);
      }
      for (const r of resistances) {
        ctx.strokeStyle = 'rgba(255,77,77,0.35)';
        ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(0, y(r)); ctx.lineTo(plotW, y(r)); ctx.stroke();
        ctx.fillStyle = 'rgba(255,77,77,0.7)';
        ctx.fillText(`R ${r >= 1 ? r.toFixed(3) : r.toPrecision(4)}`, plotW + 8, y(r) + 10);
      }
      ctx.setLineDash([]);
    }

    // bollinger band area
    if (toggles.bb) {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < data.length; i++) {
        if (bb.upper[i] === null) continue;
        if (!started) { ctx.moveTo(x(i), y(bb.upper[i] as number)); started = true; }
        else ctx.lineTo(x(i), y(bb.upper[i] as number));
      }
      for (let i = data.length - 1; i >= 0; i--) {
        if (bb.lower[i] === null) continue;
        ctx.lineTo(x(i), y(bb.lower[i] as number));
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,163,255,0.07)';
      ctx.fill();
      const line = (arr: (number | null)[], color: string, w = 1) => {
        ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath();
        let st = false;
        for (let i = 0; i < data.length; i++) {
          if (arr[i] === null) continue;
          if (!st) { ctx.moveTo(x(i), y(arr[i] as number)); st = true; }
          else ctx.lineTo(x(i), y(arr[i] as number));
        }
        ctx.stroke();
      };
      line(bb.upper, 'rgba(0,163,255,0.5)');
      line(bb.lower, 'rgba(0,163,255,0.5)');
      line(bb.mid, 'rgba(255,184,0,0.45)', 1);
    }

    // candles
    const cw = Math.max(1.5, (plotW / data.length) * 0.62);
    for (let i = 0; i < data.length; i++) {
      const c = data[i];
      const up = c.close >= c.open;
      ctx.strokeStyle = up ? '#00FF88' : '#FF4D4D';
      ctx.fillStyle = up ? 'rgba(0,255,136,0.9)' : 'rgba(255,77,77,0.9)';
      const cx = x(i);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, y(c.high)); ctx.lineTo(cx, y(c.low)); ctx.stroke();
      const yo = y(c.open), yc = y(c.close);
      const top = Math.min(yo, yc);
      const h = Math.max(1.2, Math.abs(yc - yo));
      ctx.fillRect(cx - cw / 2, top, cw, h);
    }

    // SMA / EMA lines
    if (toggles.sma) {
      ctx.strokeStyle = '#FFB800'; ctx.lineWidth = 1.4; ctx.beginPath();
      let st = false;
      for (let i = 0; i < data.length; i++) {
        if (sma20[i] === null) continue;
        if (!st) { ctx.moveTo(x(i), y(sma20[i] as number)); st = true; } else ctx.lineTo(x(i), y(sma20[i] as number));
      }
      ctx.stroke();
    }
    if (toggles.ema) {
      ctx.strokeStyle = '#C084FC'; ctx.lineWidth = 1.4; ctx.beginPath();
      let st = false;
      for (let i = 0; i < data.length; i++) {
        if (ema9[i] === null) continue;
        if (!st) { ctx.moveTo(x(i), y(ema9[i] as number)); st = true; } else ctx.lineTo(x(i), y(ema9[i] as number));
      }
      ctx.stroke();
    }

    // volume bars
    const vMax = Math.max(...data.map(c => c.volume), 1);
    for (let i = 0; i < data.length; i++) {
      const c = data[i];
      const up = c.close >= c.open;
      ctx.fillStyle = up ? 'rgba(0,255,136,0.28)' : 'rgba(255,77,77,0.28)';
      const vh = (c.volume / vMax) * (volH - 8);
      ctx.fillRect(x(i) - cw / 2, H - padB - vh, cw, vh);
    }

    // live price marker
    const last = livePrice ?? data[data.length - 1].close;
    const lastUp = data[data.length - 1].close >= data[data.length - 1].open;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = lastUp ? 'rgba(0,255,136,0.7)' : 'rgba(255,77,77,0.7)';
    ctx.beginPath(); ctx.moveTo(0, y(last)); ctx.lineTo(plotW, y(last)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = lastUp ? '#00FF88' : '#FF4D4D';
    ctx.fillRect(plotW + 2, y(last) - 8, padR - 4, 16);
    ctx.fillStyle = '#04101F';
    ctx.font = 'bold 10px Geist, sans-serif';
    ctx.fillText(last >= 1000 ? last.toFixed(1) : last >= 1 ? last.toFixed(3) : last.toPrecision(4), plotW + 6, y(last) + 4);

    // pulsing live dot
    const t = Date.now() % 1600;
    const pulse = 2 + 2 * (1 - Math.abs(t / 800 - 1));
    ctx.fillStyle = lastUp ? 'rgba(0,255,136,0.25)' : 'rgba(255,77,77,0.25)';
    ctx.beginPath(); ctx.arc(x(data.length - 1), y(last), pulse + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lastUp ? '#00FF88' : '#FF4D4D';
    ctx.beginPath(); ctx.arc(x(data.length - 1), y(last), 3, 0, Math.PI * 2); ctx.fill();

    // watermark
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.font = 'bold 22px Space Grotesk, sans-serif';
    ctx.fillText(`${pairLabel} · ${tfLabel}`, 14, 30);
  }, [candles, livePrice, height, toggles.bb, toggles.sma, toggles.ema, toggles.sr, pairLabel, tfLabel]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={ref} className="block" />
    </div>
  );
}
