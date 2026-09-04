'use client';

import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fmtPrice, fmtPct, useSession, api, timeAgo } from '@/lib/session';
import { navigate } from '@/components/shell';
import { Sparkline } from '@/components/charts';
import { useMarkets } from '@/components/views/home';
import { Search, Star, ArrowRight, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

const CATEGORIES = ['All', 'Majors', 'Altcoin', 'DeFi', 'AI / Compute', 'Meme'];
type SortKey = 'volume' | 'gainers' | 'losers' | 'name';

export function MarketsView() {
  const markets = useMarkets(3500);
  const { user, refresh } = useSession();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [sort, setSort] = useState<SortKey>('volume');
  const [watch, setWatch] = useState<Set<string>>(new Set());
  const [watchLoaded, setWatchLoaded] = useState(false);
  const [busy, setBusy] = useState('');

  React.useEffect(() => {
    if (!user) { setWatch(new Set()); setWatchLoaded(true); return; }
    api<{ watchlist: string[] }>('/api/watchlist').then(d => { setWatch(new Set(d.watchlist)); setWatchLoaded(true); }).catch(() => setWatchLoaded(true));
  }, [user]);

  const toggleWatch = async (symbol: string) => {
    if (!user) { navigate('login'); return; }
    setBusy(symbol);
    try {
      const d = await api<{ watching: boolean }>('/api/watchlist', { method: 'POST', body: JSON.stringify({ symbol }) });
      setWatch(w => { const n = new Set(w); if (d.watching) n.add(symbol); else n.delete(symbol); return n; });
      refresh();
    } catch { /* noop */ } finally { setBusy(''); }
  };

  const rows = useMemo(() => {
    let r = markets.filter(m => cat === 'All' || m.category === cat);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter(m => m.symbol.toLowerCase().includes(s) || m.name.toLowerCase().includes(s));
    }
    if (sort === 'gainers') r = [...r].sort((a, b) => b.change24h - a.change24h);
    if (sort === 'losers') r = [...r].sort((a, b) => a.change24h - b.change24h);
    if (sort === 'name') r = [...r].sort((a, b) => a.symbol.localeCompare(b.symbol));
    return r;
  }, [markets, q, cat, sort]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Markets</h1>
          <p className="text-[12.5px] text-slate-400 mt-0.5">Live prices · 24h change · sparklines · binary payouts</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search coin or symbol…" className="pl-9 bg-white/[0.04] border-white/10" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors ${cat === c ? 'bg-[#00A3FF]/15 text-[#00A3FF] shadow-[inset_0_0_0_1px_rgba(0,163,255,0.3)]' : 'bg-white/[0.04] text-slate-400 hover:text-white'}`}>
            {c}
          </button>
        ))}
        <div className="flex-1" />
        <select value={sort} onChange={e => setSort(e.target.value as SortKey)} className="h-8 rounded-lg bg-white/[0.04] border border-white/10 px-2 text-[12px] text-slate-300 outline-none">
          <option value="volume" className="bg-[#081221]">Sort: Default</option>
          <option value="gainers" className="bg-[#081221]">Top gainers</option>
          <option value="losers" className="bg-[#081221]">Top losers</option>
          <option value="name" className="bg-[#081221]">Name A–Z</option>
        </select>
      </div>

      <div className="mt-4 glass rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[28px_1.5fr_1fr_0.9fr_88px_92px] md:grid-cols-[36px_1.6fr_1.1fr_1fr_1fr_96px] gap-2 px-4 py-2.5 hairline-b text-[10.5px] uppercase tracking-wider text-slate-500">
          <span /><span>Coin</span><span className="text-right">Price</span><span className="text-right">24h</span><span className="text-right hidden md:block">Spark · 60m</span><span className="text-right">Trade</span>
        </div>
        {rows.length === 0 && (
          <div className="px-4 py-10 text-center text-slate-500 text-[13px]">{markets.length === 0 ? 'Loading markets…' : 'No markets match your search.'}</div>
        )}
        {rows.map(m => {
          const up = m.change24h >= 0;
          const watching = watch.has(m.symbol);
          return (
            <div key={m.symbol} className="grid grid-cols-[28px_1.5fr_1fr_0.9fr_88px_92px] md:grid-cols-[36px_1.6fr_1.1fr_1fr_1fr_96px] gap-2 items-center px-4 py-3 hairline-b last:border-0 hover:bg-white/[0.025] transition-colors">
              <button onClick={() => toggleWatch(m.symbol)} className="justify-self-center" title={user ? 'Watchlist' : 'Sign in to use watchlist'}>
                {busy === m.symbol ? <Loader2 size={14} className="animate-spin text-slate-500" /> :
                  <Star size={15} className={watching ? 'text-[#FFB800] fill-[#FFB800]' : 'text-slate-600 hover:text-slate-400'} />}
              </button>
              <button className="flex items-center gap-2.5 text-left" onClick={() => navigate('trade')}>
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] grid place-items-center text-[10px] font-bold text-[#00A3FF]">{m.symbol.slice(0, 2)}</div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-white truncate">{m.symbol}</div>
                  <div className="text-[10.5px] text-slate-500 truncate">{m.name} · {m.category}</div>
                </div>
              </button>
              <div className="text-right font-display text-[13.5px] font-semibold text-white tabular-nums">${fmtPrice(m.price)}</div>
              <div className={`text-right text-[12.5px] font-semibold ${up ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}`}>{fmtPct(m.change24h)}</div>
              <div className="hidden md:block justify-self-end"><Sparkline data={m.spark} up={up} /></div>
              <Button size="sm" onClick={() => navigate('trade')} className="justify-self-end h-8 px-3 bg-[#00A3FF]/15 text-[#00A3FF] hover:bg-[#00A3FF]/25 shadow-none">
                Trade <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          );
        })}
      </div>
      {!user && (
        <div className="mt-4 glass rounded-2xl p-4 flex items-center gap-3">
          <TrendingUp size={17} className="text-[#FFB800]" />
          <p className="text-[12.5px] text-slate-400 flex-1">Sign in to access trading charts, indicators and the watchlist — chart data is members-only.</p>
          <Button size="sm" onClick={() => navigate('signup')} className="bg-[#00A3FF] text-[#04101F] font-semibold">Open Account</Button>
        </div>
      )}
    </div>
  );
}

export function WatchlistView() {
  const { user, loading } = useSession();
  const markets = useMarkets(3500);
  const [watch, setWatch] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!user) return;
    api<{ watchlist: string[] }>('/api/watchlist').then(d => setWatch(new Set(d.watchlist))).catch(() => {});
  }, [user]);

  const toggle = async (symbol: string) => {
    const d = await api<{ watching: boolean }>('/api/watchlist', { method: 'POST', body: JSON.stringify({ symbol }) });
    setWatch(w => { const n = new Set(w); if (d.watching) n.add(symbol); else n.delete(symbol); return n; });
  };

  if (!loading && !user) {
    return (
      <div className="max-w-md mx-auto p-10 text-center animate-in">
        <Star size={30} className="mx-auto text-slate-600" />
        <h1 className="mt-3 font-display text-xl font-bold text-white">Watchlist is members-only</h1>
        <p className="mt-2 text-[13px] text-slate-400">Sign in to track your favorite markets, or open an account with an invitation code.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={() => navigate('login')} className="bg-[#00A3FF] text-[#04101F] font-semibold">Sign in</Button>
          <Button variant="outline" onClick={() => navigate('signup')} className="border-white/15 text-white">Open Account</Button>
        </div>
      </div>
    );
  }

  const rows = markets.filter(m => watch.has(m.symbol));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 animate-in">
      <h1 className="font-display text-2xl font-bold text-white">Watchlist</h1>
      <p className="text-[12.5px] text-slate-400 mt-0.5">Your starred markets with live pricing.</p>
      <div className="mt-4 glass rounded-2xl overflow-hidden">
        {rows.length === 0 && <div className="px-4 py-12 text-center text-slate-500 text-[13px]">Nothing starred yet — tap the star on any market in <button onClick={() => navigate('markets')} className="text-[#00A3FF] hover:underline">Markets</button>.</div>}
        {rows.map(m => {
          const up = m.change24h >= 0;
          return (
            <div key={m.symbol} className="flex items-center gap-3 px-4 py-3 hairline-b last:border-0">
              <button onClick={() => toggle(m.symbol)}><Star size={15} className="text-[#FFB800] fill-[#FFB800]" /></button>
              <div className="w-9 h-9 rounded-lg bg-white/[0.05] grid place-items-center text-[10px] font-bold text-[#00A3FF]">{m.symbol.slice(0, 2)}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-white">{m.symbol}</div>
                <div className="text-[10.5px] text-slate-500">{m.name}</div>
              </div>
              <Sparkline data={m.spark} up={up} />
              <div className="w-28 text-right font-display text-[13.5px] font-semibold text-white tabular-nums">${fmtPrice(m.price)}</div>
              <div className={`w-16 text-right text-[12.5px] font-semibold ${up ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}`}>{fmtPct(m.change24h)}</div>
              <Button size="sm" onClick={() => navigate('trade')} className="h-8 px-3 bg-[#00A3FF]/15 text-[#00A3FF] hover:bg-[#00A3FF]/25 shadow-none">Trade</Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
