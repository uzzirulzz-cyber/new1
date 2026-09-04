'use client';

import React, { useMemo, useState } from 'react';
import { Layers, Clock, Target, Activity } from 'lucide-react';
import { useExchange } from '@/lib/store';
import { fmtPrice, fmtUsd } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChartPanel, PairHeader } from './trade-shared';
import { GlassCard, Tag, StatCard, PctBadge } from '@/components/shared';

interface OptionRow { strike: number; callMark: number; putMark: number; callIv: number; putIv: number; callDelta: number; putDelta: number; callOi: number; putOi: number }

const EXPIRIES = [
  { id: 'd1', label: 'Today · 08H', iv: 62 },
  { id: 'd2', label: 'Tomorrow · 32H', iv: 58 },
  { id: 'w1', label: '7D · Weekly', iv: 55 },
  { id: 'w2', label: '14D · Biweekly', iv: 53 },
  { id: 'm1', label: '30D · Monthly', iv: 51 },
];

function normCdf(x: number): number {
  // approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) prob = 1 - prob;
  return prob;
}

export default function OptionsTradeView() {
  const { pairMap, setSeedPair } = useExchange();
  const [pairId, setPairId] = useState('btc');
  const [expiry, setExpiry] = useState(EXPIRIES[2]);
  const [side, setSide] = useState<'Buy Call' | 'Buy Put'>('Buy Call');
  const [sel, setSel] = useState<number | null>(null);
  const [size, setSize] = useState('0.5');

  const pair = pairMap[pairId];
  const spot = pair?.price ?? 0;

  const chain: OptionRow[] = useMemo(() => {
    if (!pair) return [];
    const t = expiry.id === 'd1' ? 0.02 : expiry.id === 'd2' ? 0.06 : expiry.id === 'w1' ? 0.12 : expiry.id === 'w2' ? 0.24 : 0.5;
    const rows: OptionRow[] = [];
    const stepPct = spot > 1000 ? 0.025 : 0.05;
    const stepSize = spot > 1000 ? 250 : spot > 10 ? 0.5 : 0.005;
    for (let i = -5; i <= 5; i++) {
      const strike = Math.round((spot * (1 + i * stepPct)) / stepSize) * stepSize;
      const d1 = (Math.log(spot / strike) + (expiry.iv / 100) ** 2 * t / 2) / ((expiry.iv / 100) * Math.sqrt(t));
      const nd1 = normCdf(d1);
      const nd2 = normCdf(d1 - (expiry.iv / 100) * Math.sqrt(t));
      const call = spot * nd1 - strike * nd2;
      const put = call - spot + strike;
      rows.push({
        strike,
        callMark: Math.max(call, spot * 0.0004),
        putMark: Math.max(put, spot * 0.0004),
        callIv: expiry.iv + i * 0.8,
        putIv: expiry.iv - i * 0.6,
        callDelta: nd1,
        putDelta: nd1 - 1,
        callOi: (1200 + Math.abs(i) * -180 + Math.sin(i * 3) * 300) * (spot > 100 ? 1 : 900),
        putOi: (1050 + Math.abs(i) * -160 + Math.cos(i * 2.4) * 260) * (spot > 100 ? 1 : 900),
      });
    }
    return rows;
  }, [pair, spot, expiry]);

  const fmtStrike = (v: number) => v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : v >= 1 ? v.toFixed(2) : v.toFixed(4);

  const selected = chain.find(r => r.strike === sel);
  const sizeNum = parseFloat(size) || 0;
  const premium = selected ? (side === 'Buy Call' ? selected.callMark : selected.putMark) * sizeNum : 0;
  const maxLoss = premium;
  const breakeven = selected ? (side === 'Buy Call' ? selected.strike + selected.callMark : selected.strike - selected.putMark) : 0;

  const atm = chain.reduce((best, r) => Math.abs(r.strike - spot) < Math.abs(best.strike - spot) ? r : best, chain[6] ?? chain[0]);
  const totalCallOi = chain.reduce((s, r) => s + r.callOi, 0);
  const totalPutOi = chain.reduce((s, r) => s + r.putOi, 0);
  const putCallRatio = totalPutOi / totalCallOi;

  const selectPair = (id: string) => { setPairId(id); setSeedPair(id); };

  return (
    <div className="p-2 md:p-3 space-y-2.5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard label="Spot Price" value={`$${fmtPrice(spot)}`} icon={<Activity size={15} />} accent="blue" sub={pair?.symbol} />
        <StatCard label="30D IV" value={`${expiry.iv}%`} icon={<Layers size={15} />} accent="violet" sub={expiry.label} />
        <StatCard label="Put/Call OI" value={putCallRatio.toFixed(2)} icon={<Target size={15} />} accent={putCallRatio > 1 ? 'red' : 'green'} sub={putCallRatio > 1 ? 'Put skew — defensive' : 'Call skew — bullish'} />
        <StatCard label="Max Pain" value={`$${fmtPrice(atm?.strike ?? spot)}`} icon={<Clock size={15} />} accent="gold" sub="highest OI concentration" />
      </div>

      <div className="grid lg:grid-cols-[1fr_290px] gap-2.5">
        <div className="space-y-2.5">
          <div className="glass rounded-xl overflow-hidden">
            <PairHeader pairId={pairId} />
          </div>
          <GlassCard className="p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b hairline overflow-x-auto no-scrollbar">
              <p className="text-[12px] font-semibold font-[family-name:var(--font-display)] shrink-0">Expiry</p>
              {EXPIRIES.map(e => (
                <button key={e.id} onClick={() => setExpiry(e)}
                  className={cn('px-2.5 py-1.5 rounded-md text-[11px] whitespace-nowrap transition-colors border',
                    expiry.id === e.id ? 'bg-[#00A3FF]/15 text-[#33B5FF] border-[#00A3FF]/35' : 'text-muted-foreground hairline hover:text-white')}>
                  {e.label}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="bx-table">
                <thead>
                  <tr>
                    <th className="text-[#FF4D4D]">PUT OI</th><th className="text-[#FF4D4D]">Put IV</th><th className="text-[#FF4D4D]">Put Mark</th>
                    <th className="text-center">Strike</th>
                    <th className="text-[#00FF88]">Call Mark</th><th className="text-[#00FF88]">Call IV</th><th className="text-[#00FF88]">CALL OI</th>
                  </tr>
                </thead>
                <tbody>
                  {chain.map(r => {
                    const isAtm = r.strike === atm?.strike;
                    const isSel = r.strike === sel;
                    return (
                      <tr key={r.strike} className={cn('cursor-pointer', isAtm && 'bg-[#FFB800]/[0.05]', isSel && 'bg-[#00A3FF]/10')}
                        onClick={() => setSel(r.strike)}>
                        <td className="tabular text-[#FF4D4D]/80">{fmtUsd(r.putOi, true)}</td>
                        <td className="tabular text-slate-400">{r.putIv.toFixed(1)}%</td>
                        <td className="tabular text-[#FF6B6B] font-medium">{fmtPrice(r.putMark)}</td>
                        <td className={cn('text-center font-semibold tabular border-x hairline', isAtm ? 'text-[#FFD35C]' : 'text-slate-200')}>
                          {fmtStrike(r.strike)}
                          {isAtm && <span className="ml-1.5 text-[8.5px] text-[#FFB800]">ATM</span>}
                        </td>
                        <td className="tabular text-[#00E57F] font-medium">{fmtPrice(r.callMark)}</td>
                        <td className="tabular text-slate-400">{r.callIv.toFixed(1)}%</td>
                        <td className="tabular text-[#00FF88]/80">{fmtUsd(r.callOi, true)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Payoff summary */}
          <div className="grid sm:grid-cols-3 gap-2.5">
            <GlassCard>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Premium Cost</p>
              <p className="text-lg font-semibold tabular text-[#FFD35C]">{selected ? `$${premium.toFixed(2)}` : '—'}</p>
              <p className="text-[10.5px] text-muted-foreground">{sizeNum} contracts · {pair?.base}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Breakeven</p>
              <p className="text-lg font-semibold tabular">{selected ? fmtPrice(breakeven) : '—'}</p>
              <p className="text-[10.5px] text-muted-foreground">{selected ? `${(((breakeven - spot) / spot) * 100).toFixed(2)}% from spot` : 'Select a strike'}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Profit / Loss</p>
              <p className="text-[14px] font-semibold tabular"><span className="text-[#00FF88]">Unlimited</span> / <span className="text-[#FF4D4D]">{selected ? `$${maxLoss.toFixed(2)}` : '—'}</span></p>
              <p className="text-[10.5px] text-muted-foreground">Defined-risk structure</p>
            </GlassCard>
          </div>
        </div>

        {/* Ticket */}
        <GlassCard className="h-fit lg:sticky lg:top-[104px] space-y-3">
          <p className="text-[13px] font-semibold font-[family-name:var(--font-display)]">Options Ticket</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(['Buy Call', 'Buy Put'] as const).map(s => (
              <button key={s} onClick={() => setSide(s)}
                className={cn('rounded-lg py-2 text-[12px] font-bold border transition-all',
                  side === s
                    ? s === 'Buy Call' ? 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40' : 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/40'
                    : 'text-muted-foreground hairline hover:text-white')}>
                {s}
              </button>
            ))}
          </div>
          {selected ? (
            <>
              <div className="rounded-lg bg-[#0B1A30]/70 border hairline px-3 py-2 space-y-1.5 text-[11.5px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Strike</span><span className="tabular font-medium">{fmtPrice(selected.strike)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Expiry</span><span>{expiry.label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mark</span><span className="tabular">{fmtPrice(side === 'Buy Call' ? selected.callMark : selected.putMark)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delta</span><span className="tabular">{(side === 'Buy Call' ? selected.callDelta : selected.putDelta).toFixed(3)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IV</span><span className="tabular">{(side === 'Buy Call' ? selected.callIv : selected.putIv).toFixed(1)}%</span></div>
              </div>
              <div className="rounded-lg bg-[#0B1A30]/80 border hairline px-3 py-1.5">
                <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Contracts</p>
                <input value={size} onChange={e => setSize(e.target.value)} inputMode="decimal" className="w-full bg-transparent outline-none text-[12.5px] tabular" />
              </div>
              <Button onClick={() => toast.success('Options order placed', `${side} ${sizeNum}× ${pair.base}-${fmtPrice(selected.strike)}-${expiry.label}`)}
                className={cn('w-full h-10 text-[12.5px] font-bold border-0',
                  side === 'Buy Call' ? 'bg-gradient-to-r from-[#00E57F] to-[#00b35f] text-[#03150b]' : 'bg-gradient-to-r from-[#FF6666] to-[#e03030] text-white')}>
                {side} · ${premium.toFixed(2)}
              </Button>
            </>
          ) : (
            <p className="text-[11.5px] text-muted-foreground text-center py-6">Select a strike from the chain to build your ticket.</p>
          )}
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            European-style cash-settled options. Premium settled in USDT. Exercise is automatic at expiry.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
