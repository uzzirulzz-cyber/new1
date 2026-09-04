'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, fmtPrice, useSession, countdown, timeAgo, fmtUsd } from '@/lib/session';
import { navigate } from '@/components/shell';
import { IndicatorChart } from '@/components/indicators-chart';
import { useMarkets } from '@/components/views/home';
import { TrendingUp, TrendingDown, Search, Loader2, Lock, Layers, Activity, Star, Clock3, Wallet2 } from 'lucide-react';

interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number }
interface Trade {
  id: string; symbol: string; direction: 'UP' | 'DOWN'; amount: number; duration: number;
  entryPrice: number; exitPrice: number | null; payoutRate: number;
  result: 'PENDING' | 'WON' | 'LOST' | 'REFUND'; profit: number;
  openedAt: string; expiresAt: string;
}

const TFS = [{ label: '1m', v: 1 }, { label: '5m', v: 5 }, { label: '15m', v: 15 }];

export function TradeView() {
  const { user, wallet, refresh } = useSession();
  const markets = useMarkets(3000);
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [tf, setTf] = useState(1);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [toggles, setToggles] = useState({ bb: true, sma: true, ema: false, sr: true });
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [side, setSide] = useState<'UP' | 'DOWN'>('UP');
  const [amount, setAmount] = useState('50');
  const [duration, setDuration] = useState(60);
  const [placing, setPlacing] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [watch, setWatch] = useState<Set<string>>(new Set());
  const [pendingResult, setPendingResult] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const market = markets.find(m => m.symbol === symbol);
  const price = market?.price ?? 0;

  const loadCandles = useCallback(async () => {
    if (!user) return;
    try {
      const d = await api<{ candles: Candle[] }>(`/api/markets/candles?symbol=${encodeURIComponent(symbol)}&tf=${tf}&count=120`);
      setCandles(d.candles);
    } catch { /* retry */ }
  }, [symbol, tf, user]);

  const loadTrades = useCallback(async () => {
    if (!user) return;
    try {
      const d = await api<{ trades: Trade[] }>('/api/trades');
      setTrades(d.trades);
      const resolved = pendingResult && d.trades.find(t => t.id === pendingResult && t.result !== 'PENDING');
      if (resolved) {
        setPendingResult(null);
        refresh();
      }
    } catch { /* retry */ }
  }, [user, pendingResult, refresh]);

  useEffect(() => {
    if (!user) return;
    api<{ watchlist: string[] }>('/api/watchlist').then(d => setWatch(new Set(d.watchlist))).catch(() => {});
  }, [user]);

  useEffect(() => { loadCandles(); const iv = setInterval(loadCandles, 3000); return () => clearInterval(iv); }, [loadCandles]);
  useEffect(() => { loadTrades(); const iv = setInterval(loadTrades, 2000); return () => clearInterval(iv); }, [loadTrades]);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const open = trades.filter(t => t.result === 'PENDING');
  const closed = trades.filter(t => t.result !== 'PENDING').slice(0, 12);
  const payout = market?.payoutRate ?? 0.85;
  const amt = parseFloat(amount) || 0;

  const filtered = useMemo(() => {
    let r = markets.filter(m => cat === 'All' || m.category === cat);
    if (q.trim()) r = r.filter(m => m.symbol.toLowerCase().includes(q.toLowerCase()));
    return r;
  }, [markets, q, cat]);

  const place = async () => {
    setPlacing(true); setMsg(null);
    try {
      const d = await api<{ trade: Trade }>('/api/trades', {
        method: 'POST',
        body: JSON.stringify({ symbol, direction: side, amount: amt, duration }),
      });
      setMsg({ ok: true, text: `${side === 'UP' ? 'BUY UP' : 'BUY DOWN'} placed · ${symbol} · $${amt.toFixed(2)} · ${duration}s` });
      setPendingResult(d.trade.id);
      loadTrades(); refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally { setPlacing(false); }
  };

  const toggleWatch = async () => {
    const d = await api<{ watching: boolean }>('/api/watchlist', { method: 'POST', body: JSON.stringify({ symbol }) });
    setWatch(w => { const n = new Set(w); if (d.watching) n.add(symbol); else n.delete(symbol); return n; });
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-10 text-center animate-in">
        <Lock size={30} className="mx-auto text-slate-600" />
        <h1 className="mt-3 font-display text-xl font-bold text-white">Trading is members-only</h1>
        <p className="mt-2 text-[13px] text-slate-400 leading-relaxed">Charts, indicators and order execution are protected. Guests can browse <button onClick={() => navigate('markets')} className="text-[#00A3FF] hover:underline">market prices</button>, but full trading requires a registered account.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={() => navigate('login')} className="bg-[#00A3FF] text-[#04101F] font-semibold">Sign in</Button>
          <Button variant="outline" onClick={() => navigate('signup')} className="border-white/15 text-white">Open Account</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto p-3 md:p-5 animate-in">
      <div className="grid lg:grid-cols-[240px_1fr_290px] gap-3">
        {/* market list */}
        <div className="glass rounded-2xl p-3 order-2 lg:order-1 max-h-[420px] lg:max-h-[560px] overflow-y-auto thin-scrollbar">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search markets…" className="pl-8 h-9 bg-white/[0.04] border-white/10 text-[13px]" />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {['All', 'Majors', 'Altcoin', 'DeFi', 'AI / Compute', 'Meme'].map(c => (
              <button key={c} onClick={() => setCat(c)} className={`px-2 py-1 rounded-md text-[10.5px] ${cat === c ? 'bg-[#00A3FF]/15 text-[#00A3FF]' : 'bg-white/[0.04] text-slate-400'}`}>{c}</button>
            ))}
          </div>
          <div className="mt-2 space-y-0.5">
            {filtered.map(m => {
              const up = m.change24h >= 0;
              return (
                <button key={m.symbol} onClick={() => setSymbol(m.symbol)} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${symbol === m.symbol ? 'bg-[#00A3FF]/12 shadow-[inset_0_0_0_1px_rgba(0,163,255,0.25)]' : 'hover:bg-white/[0.04]'}`}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-white">{m.symbol}</div>
                    <div className="text-[9.5px] text-slate-500">{m.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11.5px] font-semibold text-white tabular-nums">${fmtPrice(m.price)}</div>
                    <div className={`text-[10px] font-medium ${up ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}`}>{m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(2)}%</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* chart */}
        <div className="glass rounded-2xl p-3 order-1 lg:order-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-white">{symbol}</h2>
                <button onClick={toggleWatch}><Star size={14} className={watch.has(symbol) ? 'text-[#FFB800] fill-[#FFB800]' : 'text-slate-600'} /></button>
              </div>
              <div className="text-[10.5px] text-slate-500">{market?.name} · payout {(payout * 100).toFixed(0)}%</div>
            </div>
            <div className="flex-1" />
            <div className="font-display text-xl font-bold tabular-nums" style={{ color: (market?.change24h ?? 0) >= 0 ? '#00FF88' : '#FF4D4D' }}>${fmtPrice(price)}</div>
            <div className="flex gap-1">
              {TFS.map(t => (
                <button key={t.v} onClick={() => setTf(t.v)} className={`px-2.5 py-1 rounded-md text-[11px] ${tf === t.v ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>{t.label}</button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {([['bb', 'Bollinger'], ['sma', 'SMA 20'], ['ema', 'EMA 9'], ['sr', 'S/R Levels']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setToggles(t => ({ ...t, [k]: !t[k] }))}
                className={`px-2.5 py-1 rounded-md text-[10.5px] transition-colors ${toggles[k] ? 'bg-[#00A3FF]/15 text-[#00A3FF] shadow-[inset_0_0_0_1px_rgba(0,163,255,0.3)]' : 'bg-white/[0.04] text-slate-500'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2">
            {candles.length > 5
              ? <IndicatorChart candles={candles} livePrice={price} toggles={toggles} pairLabel={symbol} tfLabel={TFS.find(t => t.v === tf)!.label} height={380} />
              : <div className="h-[380px] grid place-items-center text-slate-500 text-[13px]"><Loader2 className="animate-spin mr-2 inline" size={16} /> Loading chart…</div>}
          </div>
        </div>

        {/* trade panel */}
        <div className="order-3 space-y-3">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[12px] text-slate-400"><Activity size={13} className="text-[#00A3FF]" /> Binary options · {symbol}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => setSide('UP')} className={`h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${side === 'UP' ? 'bg-[#00FF88]/15 text-[#00FF88] shadow-[inset_0_0_0_1.5px_rgba(0,255,136,0.5)]' : 'bg-white/[0.04] text-slate-400 hover:text-white'}`}>
                <TrendingUp size={17} /><span className="text-[11.5px] font-bold tracking-wide">BUY UP</span>
              </button>
              <button onClick={() => setSide('DOWN')} className={`h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${side === 'DOWN' ? 'bg-[#FF4D4D]/15 text-[#FF4D4D] shadow-[inset_0_0_0_1.5px_rgba(255,77,77,0.5)]' : 'bg-white/[0.04] text-slate-400 hover:text-white'}`}>
                <TrendingDown size={17} /><span className="text-[11.5px] font-bold tracking-wide">BUY DOWN</span>
              </button>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span>Amount (USDT)</span><span>Avail: {fmtUsd(wallet?.balance ?? 0)}</span>
              </div>
              <Input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="h-10 bg-white/[0.04] border-white/10 font-semibold text-white" inputMode="decimal" />
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {[10, 50, 100, 500].map(v => (
                  <button key={v} onClick={() => setAmount(String(v))} className={`h-7 rounded-md text-[11px] ${parseFloat(amount) === v ? 'bg-[#00A3FF]/20 text-[#00A3FF]' : 'bg-white/[0.04] text-slate-400 hover:text-white'}`}>${v}</button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1.5"><Clock3 size={12} /> Expiry</div>
              <div className="grid grid-cols-3 gap-1.5">
                {[30, 60, 120].map(d => (
                  <button key={d} onClick={() => setDuration(d)} className={`h-9 rounded-lg text-[12px] font-semibold ${duration === d ? 'bg-[#FFB800]/15 text-[#FFB800] shadow-[inset_0_0_0_1px_rgba(255,184,0,0.4)]' : 'bg-white/[0.04] text-slate-400 hover:text-white'}`}>{d}s</button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5 text-[12px]">
              <span className="text-slate-400">Potential profit</span>
              <span className="font-display font-bold text-[#00FF88]">+{fmtUsd(amt * payout)} <span className="text-[10px] text-slate-500 font-normal">({(payout * 100).toFixed(0)}%)</span></span>
            </div>
            {msg && <div className={`mt-2.5 rounded-lg px-3 py-2 text-[12px] ${msg.ok ? 'bg-[#00FF88]/8 text-[#00FF88] border border-[#00FF88]/25' : 'bg-[#FF4D4D]/8 text-[#FF4D4D] border border-[#FF4D4D]/25'}`}>{msg.text}</div>}
            <Button onClick={place} disabled={placing || amt <= 0} className={`mt-3 w-full h-12 font-bold text-[14px] ${side === 'UP' ? 'bg-[#00FF88] text-[#04140b] hover:brightness-110' : 'bg-[#FF4D4D] text-[#1f0606] hover:brightness-110'} shadow-[0_0_24px_rgba(0,0,0,0.35)]`}>
              {placing ? <Loader2 className="animate-spin" size={16} /> : side === 'UP' ? <><TrendingUp size={16} className="mr-1.5" /> BUY UP {amt > 0 ? `$${fmtUsd(amt)}` : ''}</> : <><TrendingDown size={16} className="mr-1.5" /> BUY DOWN {amt > 0 ? `$${fmtUsd(amt)}` : ''}</>}
            </Button>
            <div className="mt-2 text-center text-[10.5px] text-slate-500">Entry {price ? `$${fmtPrice(price)}` : '—'} · settles automatically at expiry</div>
          </div>

          {/* open positions */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[12px] text-slate-300 font-semibold"><Layers size={13} className="text-[#FFB800]" /> Open trades <span className="text-slate-500 font-normal">({open.length})</span></div>
            <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto thin-scrollbar">
              {open.length === 0 && <div className="text-[11.5px] text-slate-500 py-3 text-center">No open trades — pick a direction above.</div>}
              {open.map(t => {
                const remain = (new Date(t.expiresAt).getTime() - Date.now()) / 1000;
                const cur = markets.find(m => m.symbol === t.symbol)?.price ?? t.entryPrice;
                const winning = t.direction === 'UP' ? cur > t.entryPrice : cur < t.entryPrice;
                return (
                  <div key={t.id} className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${t.direction === 'UP' ? 'bg-[#00FF88]/15 text-[#00FF88]' : 'bg-[#FF4D4D]/15 text-[#FF4D4D]'}`}>{t.direction === 'UP' ? 'UP' : 'DOWN'}</span>
                        <span className="text-[12px] font-semibold text-white">{t.symbol}</span>
                        <span className="text-[10.5px] text-slate-500">${t.amount.toFixed(0)}</span>
                      </div>
                      <span className={`text-[12px] font-bold tabular-nums ${remain <= 0 ? 'text-slate-500' : winning ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}`}>{remain <= 0 ? 'settling…' : countdown(remain)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10.5px] text-slate-500">
                      <span>Entry {fmtPrice(t.entryPrice)}</span>
                      <span>Now {fmtPrice(cur)} <span className={winning ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}>{winning ? 'in the money' : 'out of the money'}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* closed history */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[12px] text-slate-300 font-semibold"><Wallet2 size={13} className="text-[#00A3FF]" /> Recent results</div>
            <div className="mt-2 space-y-1 max-h-44 overflow-y-auto thin-scrollbar">
              {closed.length === 0 && <div className="text-[11.5px] text-slate-500 py-3 text-center">No settled trades yet.</div>}
              {closed.map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] text-[11.5px]">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${t.result === 'WON' ? 'bg-[#00FF88]/15 text-[#00FF88]' : t.result === 'LOST' ? 'bg-[#FF4D4D]/15 text-[#FF4D4D]' : 'bg-white/10 text-slate-400'}`}>{t.result}</span>
                    <span className="text-slate-200 font-medium">{t.symbol}</span>
                    <span className="text-slate-500">{t.direction} · ${t.amount.toFixed(0)} · {timeAgo(t.openedAt)}</span>
                  </div>
                  <span className={t.result === 'WON' ? 'text-[#00FF88] font-semibold' : t.result === 'LOST' ? 'text-[#FF4D4D]' : 'text-slate-400'}>
                    {t.result === 'WON' ? `+$${t.profit.toFixed(2)}` : t.result === 'LOST' ? `-$${t.amount.toFixed(2)}` : 'refund'}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('history')} className="mt-2 w-full text-center text-[11px] text-[#00A3FF] hover:underline">Full trading history →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
