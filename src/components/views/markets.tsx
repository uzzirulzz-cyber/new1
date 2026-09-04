'use client';

import React, { useMemo, useState } from 'react';
import { Search, Star, Flame, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { useExchange } from '@/lib/store';
import { change24h, fmtPrice, fmtUsd, fmtPct } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GlassCard, PctBadge, LiveBadge, CoinIcon, Tag } from '@/components/shared';
import { Sparkline } from '@/components/charts';

type Cat = 'all' | 'spot' | 'defi' | 'ai' | 'gaming' | 'new' | 'gainers' | 'losers';

export default function MarketsView() {
  const { pairs, watchlist, toggleWatch, navigate, setSeedPair, stats } = useExchange();
  const [cat, setCat] = useState<Cat>('all');
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState<'vol' | 'price' | 'chg'>('vol');

  const change = (id: string) => { const p = pairs.find(x => x.id === id); return p ? change24h(p) : 0; };

  const list = useMemo(() => {
    let l = [...pairs];
    if (cat === 'gainers') l.sort((a, b) => change24h(b) - change24h(a));
    else if (cat === 'losers') l.sort((a, b) => change24h(a) - change24h(b));
    else if (cat !== 'all') l = l.filter(p => p.cat.includes(cat as 'spot' | 'defi' | 'ai' | 'gaming' | 'new'));
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter(p => p.symbol.toLowerCase().includes(s) || p.name.toLowerCase().includes(s));
    }
    if (cat !== 'gainers' && cat !== 'losers') {
      if (sortBy === 'vol') l.sort((a, b) => b.volQuote - a.volQuote);
      if (sortBy === 'chg') l.sort((a, b) => change24h(b) - change24h(a));
    }
    return l;
  }, [pairs, cat, q, sortBy]);

  const totalVol = pairs.reduce((s, p) => s + p.volQuote, 0);
  const rising = pairs.filter(p => change24h(p) >= 0).length;

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Markets</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-2">
            <LiveBadge /> {pairs.length} pairs · 24h volume {fmtUsd(totalVol)} · {rising} advancing / {pairs.length - rising} declining
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border hairline bg-[#081221]/80 px-3 h-9 w-full sm:w-72">
          <Search size={14} className="text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search markets…" className="bg-transparent outline-none text-[12.5px] w-full" />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {([
          ['all', 'All Markets', null], ['spot', 'Spot', null], ['gainers', 'Top Gainers', <TrendingUp size={12} key="g" />],
          ['losers', 'Top Losers', <TrendingDown size={12} key="l" />], ['defi', 'DeFi', null], ['ai', 'AI & Data', <Sparkles size={12} key="a" />],
          ['gaming', 'Gaming', null], ['new', 'New Listings', <Flame size={12} key="n" />],
        ] as [Cat, string, React.ReactNode][]).map(([id, label, icon]) => (
          <button key={id} onClick={() => setCat(id)}
            className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-[12px] font-medium border transition-all',
              cat === id ? 'bg-[#00A3FF]/15 text-[#33B5FF] border-[#00A3FF]/40 shadow-[0_0_16px_rgba(0,163,255,0.12)]' : 'text-slate-400 hairline hover:text-white hover:border-[#00A3FF]/30')}>
            {icon}{label}
          </button>
        ))}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b hairline">
          <div className="flex items-center gap-2"><LiveBadge /><p className="text-[12px] text-muted-foreground">Prices update in real time</p></div>
          <div className="flex gap-1 text-[11px]">
            {([['vol', 'Sort: Volume'], ['chg', 'Sort: Change']] as const).map(([v, label]) => (
              <button key={v} onClick={() => setSortBy(v)}
                className={cn('rounded-md px-2 py-1 border transition-colors', sortBy === v ? 'text-[#33B5FF] border-[#00A3FF]/40 bg-[#00A3FF]/10' : 'text-muted-foreground hairline')}>{label}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="bx-table">
            <thead>
              <tr><th>Market</th><th>Last Price</th><th>24h Change</th><th>24h High / Low</th><th>24h Volume</th><th>Market Cap</th><th>Max Lev</th><th>7d Trend</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.map(p => {
                const ch = change(p.id);
                const dir = change24h(p) >= 0 ? 1 : -1;
                return (
                  <tr key={p.id} className="cursor-pointer" onClick={() => { setSeedPair(p.id); navigate('trade-spot'); }}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Star size={13} onClick={e => { e.stopPropagation(); toggleWatch(p.id); }}
                          className={cn('shrink-0 transition-colors', watchlist.has(p.id) ? 'text-[#FFB800] fill-[#FFB800]' : 'text-slate-600 hover:text-[#FFB800]')} />
                        <CoinIcon symbol={p.base} color={p.color} size={28} />
                        <div>
                          <p className="font-semibold text-[12.5px]">{p.symbol}{cat === 'new' && <Tag color="gold" className="ml-1.5">NEW</Tag>}</p>
                          <p className="text-[10.5px] text-muted-foreground">{p.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className={cn('tabular font-semibold', dir >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>${fmtPrice(p.price)}</td>
                    <td><PctBadge value={ch} /></td>
                    <td className="tabular text-[11.5px] text-slate-400">{fmtPrice(p.high24h)} / {fmtPrice(p.low24h)}</td>
                    <td className="tabular text-slate-300">{fmtUsd(p.volQuote)}</td>
                    <td className="tabular text-slate-300">{fmtUsd(p.mcap)}</td>
                    <td><Tag color="gold">{p.leverageMax}×</Tag></td>
                    <td><Sparkline data={Array.from({ length: 20 }, (_, i) => p.price * (1 + Math.sin(i * 0.8 + p.base.length * 2) * (ch >= 0 ? 0.008 : -0.008)))} w={96} h={26} /></td>
                    <td>
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 text-[10.5px] px-2.5 bg-[#00A3FF]/15 text-[#33B5FF] border border-[#00A3FF]/35 hover:bg-[#00A3FF]/25"
                          onClick={e => { e.stopPropagation(); setSeedPair(p.id); navigate('trade-spot'); }}>Spot</Button>
                        <Button size="sm" className="h-7 text-[10.5px] px-2.5 bg-[#FFB800]/10 text-[#FFD35C] border border-[#FFB800]/30 hover:bg-[#FFB800]/20"
                          onClick={e => { e.stopPropagation(); setSeedPair(p.id); navigate('trade-futures'); }}>{Math.min(50, p.leverageMax)}x</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <p className="text-[10.5px] text-muted-foreground">Demo environment — market data is simulated for illustration. {fmtPct(rising / pairs.length * 100 - 100, 0)} market breadth.</p>
    </div>
  );
}
