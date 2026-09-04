'use client';

import React, { useMemo } from 'react';
import { PieChart, TrendingUp, ArrowUpRight, ArrowDownRight, Layers3, Percent } from 'lucide-react';
import { useExchange } from '@/lib/store';
import { fmtAmt, fmtUsd, change24h, fmtMoney } from '@/lib/market';
import { cn } from '@/lib/utils';
import { GlassCard, StatCard, PctBadge, CoinIcon, Tag, SectionTitle } from '@/components/shared';
import { Donut, AreaChart, Sparkline } from '@/components/charts';

export default function PortfolioView() {
  const { balances, pairs, positions, txs, navigate, setSeedPair } = useExchange();

  const priceOf = (asset: string) => asset === 'USDT' ? 1 : (pairs.find(p => p.base === asset)?.price ?? 0);
  const rows = useMemo(() => {
    const priceIn = (asset: string) => asset === 'USDT' ? 1 : (pairs.find(p => p.base === asset)?.price ?? 0);
    const chgOf = (asset: string) => asset === 'USDT' ? 0 : (pairs.find(p => p.base === asset) ? change24h(pairs.find(p => p.base === asset)!) : 0);
    return Object.entries(balances).map(([asset, b]) => ({
      asset, free: b.free, locked: b.locked, price: priceIn(asset),
      usd: (b.free + b.locked) * priceIn(asset),
      chg: chgOf(asset),
      alloc24h: (b.free + b.locked) * priceIn(asset) * 0.0034,
    })).filter(r => r.usd > 0.01).sort((a, b) => b.usd - a.usd);
  }, [balances, pairs]);

  const total = rows.reduce((s, r) => s + r.usd, 0);
  const dayChange = rows.reduce((s, r) => s + r.alloc24h * (r.chg >= 0 ? 1 : -1), 0);
  const upnl = positions.reduce((s, p) => {
    const cur = priceOf(p.pairId.toUpperCase()) || p.entry;
    return s + (p.side === 'Long' ? cur - p.entry : p.entry - cur) * p.amount;
  }, 0);
  const costBasis = total - dayChange * 30 - 8420.55; // derived demo basis
  const roi = ((total - Math.max(costBasis, 1)) / Math.max(costBasis, 1)) * 100;

  const alloc = rows.slice(0, 6).map((r, i) => ({
    label: r.asset, value: r.usd,
    color: ['#00A3FF', '#FFB800', '#9D7BFF', '#00FF88', '#FF4D6D', '#14F195'][i % 6],
  }));

  const series = useMemo(() => {
    const hist = [42, 43.1, 42.6, 44.2, 45.4, 44.9, 46.3, 47.1, 46.6, 48.2, 49.1, 48.7, 50.0, 51.2, 50.8, 52.3, 51.9, 53.1, 54.4, 53.8, 55.2, 56.0, 55.5, 57.1, 58.2, 57.8, 59.3, 58.9, 60.4];
    const target = total / 1e3;
    return hist.map(x => (x / 60.4) * target);
  }, [total]);

  const best = [...rows].sort((a, b) => b.chg - a.chg)[0];
  const worst = [...rows].sort((a, b) => a.chg - b.chg)[0];

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Portfolio Analytics</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Unified view across spot, futures and earn positions</p>
        </div>
        <Tag color="green"><TrendingUp size={10} /> Outperforming BTC by 12.4% this quarter</Tag>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard label="Net Worth" value={fmtUsd(total)} icon={<PieChart size={15} />} accent="gold" delta={2.14} />
        <StatCard label="24h Change" value={`${dayChange >= 0 ? '+' : '-'}${fmtUsd(Math.abs(dayChange))}`} icon={dayChange >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />} accent={dayChange >= 0 ? 'green' : 'red'} sub="all wallets" />
        <StatCard label="Unrealized P&L" value={`${upnl >= 0 ? '+' : '-'}$${fmtMoney(Math.abs(upnl))}`} icon={<Layers3 size={15} />} accent={upnl >= 0 ? 'green' : 'red'} sub={`${positions.length} futures positions`} />
        <StatCard label="All-time ROI" value={`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`} icon={<Percent size={15} />} accent="violet" sub="since account opening" />
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <GlassCard className="lg:col-span-2">
          <SectionTitle title="Equity Curve" sub="Net worth · 30 days" right={<PctBadge value={roi} />} />
          <AreaChart data={series} height={180} color="#00A3FF" />
        </GlassCard>
        <GlassCard>
          <SectionTitle title="Allocation" sub="Top holdings" />
          <div className="flex items-center gap-4">
            <Donut segments={alloc} size={140} thickness={19}
              center={<div><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Assets</p><p className="text-[14px] font-bold">{rows.length}</p></div>} />
            <div className="space-y-1.5 flex-1 min-w-0">
              {alloc.map(a => (
                <div key={a.label} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color }} />
                  <span>{a.label}</span>
                  <span className="ml-auto tabular text-muted-foreground">{((a.value / (total || 1)) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Holdings */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b hairline"><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Holdings</p></div>
        <div className="overflow-x-auto">
          <table className="bx-table">
            <thead><tr><th>Asset</th><th>Balance</th><th>Price</th><th>Value</th><th>Allocation</th><th>24h</th><th>Trend</th><th></th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.asset}>
                  <td><div className="flex items-center gap-2.5"><CoinIcon symbol={r.asset} color={r.asset === 'USDT' ? '#26A17B' : pairs.find(p => p.base === r.asset)?.color ?? '#00A3FF'} size={26} />
                    <span className="font-semibold text-[12px]">{r.asset}</span></div></td>
                  <td className="tabular">{fmtAmt(r.free + r.locked)}</td>
                  <td className="tabular">${fmtAmt(r.price)}</td>
                  <td className="tabular font-medium text-[#FFD35C]">{fmtUsd(r.usd)}</td>
                  <td>
                    <div className="flex items-center gap-2 min-w-[110px]">
                      <div className="h-1.5 rounded-full bg-[#0B1A30] flex-1 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#00A3FF] to-[#00A3FF]/50" style={{ width: `${(r.usd / (total || 1)) * 100}%` }} />
                      </div>
                      <span className="text-[10.5px] tabular text-muted-foreground w-10">{((r.usd / (total || 1)) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td><PctBadge value={r.chg} size="sm" /></td>
                  <td><Sparkline data={Array.from({ length: 14 }, (_, i) => r.price * (1 + Math.sin(i + r.asset.length) * 0.004))} w={80} h={22} /></td>
                  <td>{r.asset !== 'USDT' && <button className="text-[10.5px] text-[#33B5FF] hover:underline" onClick={() => { const p = pairs.find(x => x.base === r.asset); if (p) { setSeedPair(p.id); navigate('trade-spot'); } }}>Trade</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Performance stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { label: 'Best Performer', asset: best?.asset, val: best ? `+${best.chg.toFixed(2)}%` : '—', accent: 'text-[#00FF88]' },
          { label: 'Worst Performer', asset: worst?.asset, val: worst ? `${worst.chg.toFixed(2)}%` : '—', accent: 'text-[#FF4D4D]' },
          { label: 'Realized P&L (30d)', asset: 'Trading', val: '+$3,412.90', accent: 'text-[#00FF88]' },
          { label: 'Yield Earned (30d)', asset: 'Staking', val: '+$386.44', accent: 'text-[#FFD35C]' },
        ].map(x => (
          <GlassCard key={x.label}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{x.label}</p>
            <p className={cn('text-lg font-semibold tabular mt-1', x.accent)}>{x.val}</p>
            <p className="text-[10.5px] text-muted-foreground">{x.asset}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
