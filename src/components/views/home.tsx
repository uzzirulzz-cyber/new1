'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api, fmtPrice, fmtPct, useSession, fmtUsd } from '@/lib/session';
import { navigate } from '@/components/shell';
import { Sparkline } from '@/components/charts';
import { HeroChartCanvas } from '@/components/charts';
import { ArrowRight, ShieldCheck, Timer, TrendingUp, TrendingDown, Zap, Users, Lock, LineChart } from 'lucide-react';

interface MarketRow {
  symbol: string; name: string; category: string;
  price: number; change24h: number; spark: number[]; payoutRate: number;
}

export function useMarkets(pollMs = 4000) {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const d = await api<{ markets: MarketRow[] }>('/api/markets');
        if (alive) setMarkets(d.markets);
      } catch { /* polling */ }
    };
    load();
    const iv = setInterval(load, pollMs);
    return () => { alive = false; clearInterval(iv); };
  }, [pollMs]);
  return markets;
}

export function HomeView() {
  const { user } = useSession();
  const markets = useMarkets(5000);
  const movers = markets.slice(0, 6);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 2000); return () => clearInterval(iv); }, []);

  return (
    <div className="animate-in">
      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-70"><HeroChartCanvas /></div>
        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[11px] text-[#00A3FF] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] pulse-dot" />
            LIVE MARKETS · 18 PAIRS · UP TO 92% PAYOUT
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-[1.05] max-w-3xl">
            Predict the market.<br />
            <span className="bg-gradient-to-r from-[#00A3FF] to-[#FFB800] bg-clip-text text-transparent">Win in 30 seconds.</span>
          </h1>
          <p className="mt-5 text-slate-300 text-[15px] md:text-lg max-w-xl leading-relaxed">
            BLOCKEXCHANGE is the institutional binary trading desk for crypto. Pick a direction — BUY UP or BUY DOWN — choose your expiry and let real-time pricing settle the trade instantly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate(user ? 'trade' : 'signup')} className="h-12 px-7 bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-semibold hover:brightness-110 shadow-[0_0_30px_rgba(0,163,255,0.35)]">
              {user ? 'Start Trading' : 'Open Free Account'} <ArrowRight size={17} className="ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('markets')} className="h-12 px-7 border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07]">
              Explore Markets
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
            {[['2.4s', 'Avg. execution'], ['92%', 'Max payout'], ['30s', 'Fastest expiry'], ['18', 'Live markets']].map(([v, l]) => (
              <div key={l} className="glass rounded-2xl p-4">
                <div className="font-display text-2xl font-bold text-white">{v}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* live market strip */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-white">Live markets</h2>
          <button onClick={() => navigate('markets')} className="text-[12.5px] text-[#00A3FF] hover:underline">View all 18 →</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {movers.length === 0 && Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />)}
          {movers.map(m => {
            const up = m.change24h >= 0;
            return (
              <button key={m.symbol} onClick={() => navigate('trade')} className="text-left glass rounded-2xl p-4 hover:border-[#00A3FF]/30 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[14px] font-semibold text-white">{m.symbol}</div>
                    <div className="text-[11px] text-slate-500">{m.name}</div>
                  </div>
                  <Sparkline data={m.spark} up={up} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div className="font-display text-lg font-bold text-white tabular-nums">${fmtPrice(m.price)}</div>
                  <div className={`text-[12.5px] font-semibold flex items-center gap-1 ${up ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}`}>
                    {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {fmtPct(m.change24h)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* how it works */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <h2 className="font-display text-xl font-bold text-white">Binary trading in three steps</h2>
        <div className="mt-5 grid md:grid-cols-3 gap-3">
          {[
            { icon: LineChart, t: 'Pick a market', d: 'Browse 18 live crypto markets with real-time prices, sparklines and 24h trends.' },
            { icon: Timer, t: 'Choose UP or DOWN', d: 'Will price be higher or lower at expiry? Select 30s, 60s or 120s and your stake.' },
            { icon: Zap, t: 'Instant settlement', d: 'At expiry the trade settles automatically — wins credit your wallet immediately.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="glass rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl bg-[#00A3FF]/12 grid place-items-center"><Icon size={17} className="text-[#00A3FF]" /></div>
              <div className="mt-3 font-semibold text-white text-[15px]">{t}</div>
              <p className="mt-1.5 text-[13px] text-slate-400 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* trust */}
      <section className="max-w-6xl mx-auto px-5 py-10 pb-24">
        <div className="glass rounded-3xl p-7 md:p-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Institutional guardrails, retail simplicity.</h2>
            <p className="mt-3 text-[14px] text-slate-400 leading-relaxed">
              Segregated wallets with available & frozen balances, audited admin operations, invitation-only onboarding through verified sub-agents, and full trade history with transparent win/loss tracking. Trading data and charts are reserved for registered members.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['bcrypt passwords', 'Session audit', 'Frozen-funds protection', 'Sub-agent isolation'].map(f => (
                <span key={f} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] text-[11.5px] text-slate-300">
                  <ShieldCheck size={12} className="text-[#00FF88]" /> {f}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, v: '184,000+', l: 'Registered traders' },
              { icon: Lock, v: '100%', l: 'Guests blocked from charts' },
              { icon: TrendingUp, v: '58M+', l: 'Trades settled' },
              { icon: Timer, v: '24/7', l: 'Markets never sleep' },
            ].map(({ icon: Icon, v, l }) => (
              <div key={l} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <Icon size={16} className="text-[#FFB800]" />
                <div className="mt-2 font-display text-xl font-bold text-white">{v}</div>
                <div className="text-[11px] text-slate-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 text-center pb-6">
          <span className="text-[12px] text-slate-500">Staff member? </span>
          <button onClick={() => navigate('staff-login')} className="text-[12px] text-[#FFB800] hover:underline">Enter the staff portal</button>
        </div>
      </section>
    </div>
  );
}

export { useMarkets };
