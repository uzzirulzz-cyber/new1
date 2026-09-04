'use client';

import React, { useMemo } from 'react';
import {
  Wallet2, TrendingUp, Flame, Target, Banknote, Gauge, Sparkles, CalendarDays,
  Star, ArrowRight, Activity, Newspaper,
} from 'lucide-react';
import { useExchange, Route } from '@/lib/store';
import { change24h, fmtPrice, fmtAmt, fmtUsd, fmtPct, fmtMoney } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GlassCard, StatCard, PctBadge, LiveBadge, SectionTitle, CoinIcon, Tag } from '@/components/shared';
import { Sparkline, Donut, AreaChart } from '@/components/charts';

const ECON_EVENTS = [
  { time: '13:30', day: 'Today', flag: 'US', title: 'Non-Farm Payrolls', impact: 'high', actual: '—', forecast: '185K' },
  { time: '15:00', day: 'Today', flag: 'US', title: 'ISM Services PMI', impact: 'medium', actual: '—', forecast: '52.4' },
  { time: '07:00', day: 'Tomorrow', flag: 'EU', title: 'ECB Rate Decision', impact: 'high', actual: '—', forecast: '4.25%' },
  { time: '20:30', day: 'Tomorrow', flag: 'US', title: 'FOMC Minutes', impact: 'high', actual: '—', forecast: '—' },
  { time: '09:00', day: 'Fri', flag: 'CN', title: 'Trade Balance', impact: 'medium', actual: '82.1B', forecast: '85.0B' },
];

const AI_INSIGHTS = [
  { pair: 'BTC/USDT', signal: 'Bullish breakout above $66,900 confirmed. Momentum 82/100 — trend continuation likely toward $69.5K.', tone: 'up' as const, conf: 82 },
  { pair: 'ETH/USDT', signal: 'Funding rates cooling while price holds $3,580 support — accumulation pattern detected.', tone: 'up' as const, conf: 71 },
  { pair: 'SOL/USDT', signal: 'Volume divergence on 4H — short-term exhaustion risk below $152 support.', tone: 'down' as const, conf: 64 },
  { pair: 'RNDR/USDT', signal: 'AI sector rotation inflows +34% WoW. RNDR leading with highest social velocity.', tone: 'up' as const, conf: 77 },
];

export default function DashboardView() {
  const { pairs, pairMap, balances, positions, openOrders, orderHistory, txs, navigate, setSeedPair, watchlist, stats, user } = useExchange();

  const change = (id: string) => { const p = pairs.find(x => x.id === id); return p ? change24h(p) : 0; };

  // portfolio valuation
  const valuation = useMemo(() => {
    let total = 0;
    const rows = Object.entries(balances).map(([asset, b]) => {
      const price = asset === 'USDT' ? 1 : (pairs.find(p => p.base === asset)?.price ?? 0);
      const usd = (b.free + b.locked) * price;
      total += usd;
      return { asset, free: b.free, locked: b.locked, usd, price };
    }).filter(r => r.usd > 0.5).sort((a, b) => b.usd - a.usd);
    return { rows, total };
  }, [balances, pairs]);

  const upnl = useMemo(() => positions.reduce((s, p) => {
    const cur = pairMap[p.pairId]?.price ?? p.entry;
    return s + (p.side === 'Long' ? cur - p.entry : p.entry - cur) * p.amount;
  }, 0), [positions, pairMap]);

  const dailyProfit = 1247.83;
  const marginRatio = valuation.total > 0 ? (positions.reduce((s, p) => s + p.margin, 0) / valuation.total) * 100 : 0;
  const pnlSeries = useMemo(() => [48.2, 49.1, 48.6, 50.2, 51.4, 50.9, 52.3, 53.1, 52.6, 54.2, 55.1, 54.7, 56.0, 57.2, 56.8, 58.3, 57.9, 59.1, 60.4, 59.8, 61.2, 62.0, 61.5, 63.1, 64.2, 63.8, 65.3, 64.9, 66.4, 67.6].map(x => x * 780), []);

  const gainers = useMemo(() => [...pairs].sort((a, b) => change24h(b) - change24h(a)), [pairs]);
  const watchPairs = useMemo(() => pairs.filter(p => watchlist.has(p.id)), [pairs, watchlist]);
  const alloc = valuation.rows.slice(0, 6).map((r, i) => ({
    label: r.asset, value: r.usd,
    color: ['#00A3FF', '#FFB800', '#9D7BFF', '#00FF88', '#FF4D6D', '#14F195'][i % 6],
  }));
  const colors: Record<string, string> = { high: '#FF4D4D', medium: '#FFB800', low: '#00FF88' };

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1600px] mx-auto">
      {/* Welcome + stats */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">
            Welcome back, <span className="text-gradient-blue">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Markets are live · your desk is fully operational</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="h-8.5 h-9 text-[12px] bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-semibold" onClick={() => navigate('trade-spot')}>Trade Spot</Button>
          <Button size="sm" variant="outline" className="h-9 text-[12px] border-[#FFB800]/40 text-[#FFD35C]" onClick={() => navigate('trade-futures')}>Trade Futures</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        <StatCard label="Portfolio Value" value={fmtUsd(valuation.total)} delta={3.42} icon={<Wallet2 size={15} />} accent="gold" />
        <StatCard label="Unrealized P&L" value={`${upnl >= 0 ? '+' : '-'}$${fmtMoney(Math.abs(upnl))}`} icon={<TrendingUp size={15} />} accent={upnl >= 0 ? 'green' : 'red'} sub={`${positions.length} live positions`} />
        <StatCard label="Daily Profit" value={`+$${fmtAmt(dailyProfit)}`} delta={12.4} icon={<Flame size={15} />} accent="green" sub="realized + funding" />
        <StatCard label="Open Positions" value={positions.length} icon={<Target size={15} />} accent="violet" sub={`${openOrders.length} open orders`} />
        <StatCard label="Available Balance" value={fmtUsd(balances.USDT?.free ?? 0)} icon={<Banknote size={15} />} accent="blue" sub="USDT spot wallet" />
        <StatCard label="Margin Ratio" value={`${marginRatio.toFixed(1)}%`} icon={<Gauge size={15} />} accent={marginRatio > 60 ? 'red' : 'gold'} sub={marginRatio > 60 ? 'Reduce leverage' : 'Healthy'} />
      </div>

      {/* Row: pnl chart + allocation */}
      <div className="grid lg:grid-cols-3 gap-3">
        <GlassCard className="lg:col-span-2">
          <SectionTitle title="Portfolio Performance" sub="Equity curve · 30 days" right={<Tag color="green">+40.2% all-time</Tag>} icon={<Activity size={15} />} />
          <AreaChart data={pnlSeries} height={170} color="#00A3FF" />
          <div className="grid grid-cols-4 gap-2 mt-3 text-center">
            {[['Best day', '+$2,481', 'text-[#00FF88]'], ['Worst day', '-$612', 'text-[#FF4D4D]'], ['Sharpe', '2.41', 'text-[#33B5FF]'], ['Max DD', '-8.4%', 'text-[#FFD35C]']].map(([l, v, c]) => (
              <div key={l} className="rounded-lg bg-[#0B1A30]/60 border hairline py-2">
                <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground">{l}</p>
                <p className={cn('text-[13px] font-semibold tabular mt-0.5', c)}>{v}</p>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <SectionTitle title="Portfolio Allocation" sub="By asset value" icon={<Target size={15} />} />
          <div className="flex items-center gap-4">
            <Donut segments={alloc} size={148} thickness={20}
              center={
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Total</p>
                  <p className="text-[15px] font-bold tabular">{fmtUsd(valuation.total, true)}</p>
                </div>
              } />
            <div className="space-y-1.5 min-w-0 flex-1">
              {alloc.map(a => (
                <div key={a.label} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color, boxShadow: `0 0 6px ${a.color}66` }} />
                  <span className="text-slate-300">{a.label}</span>
                  <span className="ml-auto tabular text-muted-foreground">{((a.value / (valuation.total || 1)) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Row: market overview + watchlist */}
      <div className="grid lg:grid-cols-3 gap-3">
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <div className="flex items-center gap-2"><h3 className="font-[family-name:var(--font-display)] font-semibold text-[14px]">Market Overview</h3><LiveBadge /></div>
            <Button size="sm" variant="ghost" className="text-[#33B5FF] text-[11.5px] h-7" onClick={() => navigate('markets')}>View all <ArrowRight size={12} /></Button>
          </div>
          <div className="overflow-x-auto max-h-[320px]">
            <table className="bx-table">
              <thead><tr><th>Market</th><th>Last Price</th><th>24h %</th><th>24h Volume</th><th>Trend</th><th></th></tr></thead>
              <tbody>
                {gainers.slice(0, 8).map(p => {
                  const ch = change(p.id);
                  const dir = change24h(p) >= 0 ? 1 : -1;
                  return (
                    <tr key={p.id} className="cursor-pointer" onClick={() => { setSeedPair(p.id); navigate('trade-spot'); }}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <CoinIcon symbol={p.base} color={p.color} size={24} />
                          <div><p className="font-semibold text-[12px]">{p.symbol}</p><p className="text-[10px] text-muted-foreground">{p.name}</p></div>
                        </div>
                      </td>
                      <td className={cn('tabular font-medium', dir >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>${fmtPrice(p.price)}</td>
                      <td><PctBadge value={ch} size="sm" /></td>
                      <td className="tabular text-slate-300">{fmtUsd(p.volQuote)}</td>
                      <td><Sparkline data={Array.from({ length: 14 }, (_, i) => p.price * (1 + Math.sin(i + p.base.length) * 0.005))} w={80} h={22} /></td>
                      <td><Button size="sm" className="h-6.5 h-7 text-[10.5px] px-2.5 bg-[#00A3FF]/15 text-[#33B5FF] border border-[#00A3FF]/35 hover:bg-[#00A3FF]/25">Trade</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-display)] font-semibold text-[14px] flex items-center gap-2"><Star size={13} className="text-[#FFB800]" /> Watchlist</h3>
            <span className="text-[10.5px] text-muted-foreground">{watchPairs.length} pairs</span>
          </div>
          <div className="flex-1 overflow-y-auto scroll-thin max-h-[320px]">
            {watchPairs.map(p => {
              const ch = change(p.id);
              return (
                <button key={p.id} onClick={() => { setSeedPair(p.id); navigate('trade-spot'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#00A3FF]/5 transition-colors text-left border-b hairline/50">
                  <CoinIcon symbol={p.base} color={p.color} size={24} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold">{p.symbol}</p>
                    <p className="text-[10px] text-muted-foreground tabular">Vol {fmtUsd(p.volQuote, true)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] tabular font-medium">${fmtPrice(p.price)}</p>
                    <p className={cn('text-[10px] tabular', ch >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>{fmtPct(ch)}</p>
                  </div>
                </button>
              );
            })}
            {watchPairs.length === 0 && <p className="text-[11.5px] text-muted-foreground text-center py-10">Star markets to build your watchlist.</p>}
          </div>
        </GlassCard>
      </div>

      {/* Row: positions + orders + AI */}
      <div className="grid lg:grid-cols-3 gap-3">
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-display)] font-semibold text-[14px]">Active Positions</h3>
            <Button size="sm" variant="ghost" className="text-[#33B5FF] text-[11px] h-7" onClick={() => navigate('trade-futures')}>Futures <ArrowRight size={11} /></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="bx-table">
              <thead><tr><th>Market</th><th>Side</th><th>uPnL</th><th>ROI</th></tr></thead>
              <tbody>
                {positions.map(p => {
                  const cur = pairMap[p.pairId]?.price ?? p.entry;
                  const pnl = (p.side === 'Long' ? cur - p.entry : p.entry - cur) * p.amount;
                  const roi = (pnl / p.margin) * 100;
                  return (
                    <tr key={p.id}>
                      <td className="font-semibold text-[11.5px]">{p.symbol} <span className="text-[9px] text-muted-foreground">{p.leverage}×</span></td>
                      <td><Tag color={p.side === 'Long' ? 'green' : 'red'}>{p.side}</Tag></td>
                      <td className={cn('tabular', pnl >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>{pnl >= 0 ? '+' : '-'}${fmtMoney(Math.abs(pnl))}</td>
                      <td><PctBadge value={roi} size="sm" /></td>
                    </tr>
                  );
                })}
                {positions.length === 0 && <tr><td colSpan={4} className="text-center text-[11.5px] text-muted-foreground py-8">No active positions</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-display)] font-semibold text-[14px]">Open Orders</h3>
            <span className="text-[10.5px] text-muted-foreground">{openOrders.length} active</span>
          </div>
          <div className="overflow-x-auto max-h-[240px]">
            <table className="bx-table">
              <thead><tr><th>Pair</th><th>Type</th><th>Side</th><th>Price</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {openOrders.map(o => (
                  <tr key={o.id}>
                    <td className="font-semibold text-[11.5px]">{o.symbol}</td>
                    <td><Tag color={o.type === 'Limit' ? 'blue' : 'violet'}>{o.type}</Tag></td>
                    <td className={o.side === 'Buy' ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}>{o.side}</td>
                    <td className="tabular">{fmtPrice(o.price)}</td>
                    <td className="tabular">{fmtAmt(o.amount)}</td>
                    <td className="text-[10px] text-muted-foreground">{Math.floor((Date.now() - o.time) / 60000)}m</td>
                  </tr>
                ))}
                {openOrders.length === 0 && <tr><td colSpan={6} className="text-center text-[11.5px] text-muted-foreground py-8">No open orders</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#9D7BFF]/15 blur-3xl rounded-full" />
          <SectionTitle title="AI Trading Insights" sub="Neural engine v4.2 · refreshed 2m ago" icon={<Sparkles size={15} className="text-[#9D7BFF]" />} right={<Tag color="violet">PRO</Tag>} />
          <div className="space-y-2.5">
            {AI_INSIGHTS.map(ins => (
              <div key={ins.pair} className="rounded-lg border hairline bg-[#0B1A30]/50 p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11.5px] font-semibold">{ins.pair}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', ins.tone === 'up' ? 'bg-[#00FF88]/12 text-[#00FF88]' : 'bg-[#FF4D4D]/12 text-[#FF4D4D]')}>
                      {ins.tone === 'up' ? 'LONG BIAS' : 'SHORT BIAS'}
                    </span>
                    <span className="text-[9.5px] text-muted-foreground tabular">{ins.conf}%</span>
                  </div>
                </div>
                <p className="text-[10.5px] text-muted-foreground leading-relaxed">{ins.signal}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Row: trade history + econ calendar */}
      <div className="grid lg:grid-cols-3 gap-3">
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-display)] font-semibold text-[14px]">Trade History</h3>
            <Button size="sm" variant="ghost" className="text-[#33B5FF] text-[11px] h-7" onClick={() => navigate('transactions')}>All transactions <ArrowRight size={11} /></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="bx-table">
              <thead><tr><th>Time</th><th>Type</th><th>Asset</th><th>Amount</th><th>Value</th><th>Status</th></tr></thead>
              <tbody>
                {txs.slice(0, 7).map(t => (
                  <tr key={t.id}>
                    <td className="text-slate-400 text-[11px]">{new Date(t.time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                    <td><Tag color={t.type === 'Deposit' ? 'green' : t.type === 'Withdraw' ? 'red' : t.type === 'Reward' ? 'gold' : 'blue'}>{t.type}</Tag></td>
                    <td className="font-medium text-[11.5px]">{t.asset}</td>
                    <td className="tabular">{fmtAmt(t.amount)}</td>
                    <td className="tabular text-slate-300">${fmtAmt(t.usd)}</td>
                    <td><Tag color={t.status === 'Completed' ? 'green' : 'gold'}>{t.status}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b hairline">
            <h3 className="font-[family-name:var(--font-display)] font-semibold text-[14px] flex items-center gap-2"><CalendarDays size={14} className="text-[#FFD35C]" /> Economic Calendar</h3>
          </div>
          <div className="divide-y hairline/50 max-h-[260px] overflow-y-auto scroll-thin">
            {ECON_EVENTS.map((e, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                <div className="text-center w-10 shrink-0">
                  <p className="text-[11px] font-semibold tabular">{e.time}</p>
                  <p className="text-[9px] text-muted-foreground">{e.day}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-medium truncate">{e.title}</p>
                  <p className="text-[9.5px] text-muted-foreground">{e.flag} · Forecast {e.forecast}</p>
                </div>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colors[e.impact], boxShadow: `0 0 8px ${colors[e.impact]}` }} />
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t hairline flex items-center gap-2 text-[9.5px] text-muted-foreground">
            <Newspaper size={10} /> Impact: <span className="text-[#FF4D4D]">High</span> <span className="text-[#FFB800]">Medium</span> <span className="text-[#00FF88]">Low</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
