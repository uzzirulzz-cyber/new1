'use client';

import React, { useMemo, useState } from 'react';
import {
  CandlestickChart, TrendingUp, Copy, Coins, Building2, Code2, ArrowRight, ShieldCheck,
  Zap, Globe2, Lock, Gauge, ChevronRight, Activity, Droplets, Users2, BrainCircuit, Menu, X,
} from 'lucide-react';
import { useExchange, Route } from '@/lib/store';
import { change24h, fmtPrice, fmtPct, fmtUsd, fmtNum } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GlassCard, PctBadge, LiveBadge, Tag, CoinIcon } from '@/components/shared';
import { Sparkline, HeroChartCanvas } from '@/components/charts';

const FEATURES: { icon: React.ReactNode; title: string; body: string; accent: string; route: Route }[] = [
  { icon: <CandlestickChart size={20} />, title: 'Spot Trading', body: 'Trade 200+ pairs with deep liquidity, sub-second matching and pro charting.', accent: '#00A3FF', route: 'trade-spot' },
  { icon: <TrendingUp size={20} />, title: 'Futures Trading', body: 'Up to 125× leverage, cross & isolated margin, funding-rate arbitrage.', accent: '#FFB800', route: 'trade-futures' },
  { icon: <Gauge size={20} />, title: 'Margin Trading', body: 'Borrow against your portfolio with real-time risk and liquidation buffers.', accent: '#9D7BFF', route: 'trade-futures' },
  { icon: <Copy size={20} />, title: 'Copy Trading', body: 'Mirror elite traders with transparent track records and risk controls.', accent: '#00FF88', route: 'copy' },
  { icon: <Coins size={20} />, title: 'Staking & Earn', body: 'Flexible and locked pools up to 18.4% APY with daily rewards.', accent: '#14F195', route: 'staking' },
  { icon: <Building2 size={20} />, title: 'Institutional Accounts', body: 'Dedicated coverage, OTC desk, sub-accounts and white-glove onboarding.', accent: '#FF4D6D', route: 'kyc' },
  { icon: <Code2 size={20} />, title: 'API Trading', body: 'REST & WebSocket APIs with colocation for HFT and algo strategies.', accent: '#33B5FF', route: 'settings' },
];

export default function HomeView() {
  const { pairs, stats, navigate, loggedIn, setSeedPair, pairQuotes } = useExchange();
  const [menu, setMenu] = useState(false);

  const heroPairs = useMemo(() => pairs.slice(0, 4), [pairs]);
  const change = (id: string) => { const p = pairs.find(x => x.id === id); return p ? change24h(p) : 0; };
  const topMovers = useMemo(() => [...pairs].sort((a, b) => Math.abs(change24h(b)) - Math.abs(change24h(a))).slice(0, 5), [pairs]);

  const go = (r: Route) => { setMenu(false); navigate(r); };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-[#050B18]/85 backdrop-blur-md border-b hairline">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            { }
            <img src="/blockexchange-logo.png" alt="BLOCKEXCHANGE" className="w-10 h-10 rounded-lg object-cover border border-[#FFB800]/30 shadow-[0_0_20px_rgba(255,184,0,0.3)]" />
            <div className="leading-none">
              <p className="font-[family-name:var(--font-display)] font-bold text-[16px] tracking-wide">BLOCK<span className="text-gradient-gold">EXCHANGE</span></p>
              <p className="text-[9px] text-muted-foreground tracking-[0.24em] mt-1">TRADE · INVEST · GROW</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-slate-300">
            <button onClick={() => go('markets')} className="hover:text-white transition-colors">Markets</button>
            <button onClick={() => go('trade-spot')} className="hover:text-white transition-colors">Trade</button>
            <button onClick={() => go('copy')} className="hover:text-white transition-colors">Copy Trading</button>
            <button onClick={() => go('staking')} className="hover:text-white transition-colors">Earn</button>
            <button onClick={() => go('launchpad')} className="hover:text-white transition-colors">Launchpad</button>
          </nav>
          <div className="hidden md:flex items-center gap-2.5">
            {loggedIn ? (
              <Button onClick={() => go('dashboard')} className="bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-semibold shadow-[0_0_20px_rgba(0,163,255,0.4)] hover:brightness-110">
                Enter Dashboard <ArrowRight size={15} />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => go('login')} className="text-slate-200 hover:text-white">Sign In</Button>
                <Button onClick={() => go('signup')} className="bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-semibold shadow-[0_0_20px_rgba(0,163,255,0.4)] hover:brightness-110">Get Started</Button>
              </>
            )}
          </div>
          <button className="md:hidden text-slate-300" onClick={() => setMenu(m => !m)}>{menu ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        {menu && (
          <div className="md:hidden border-t hairline bg-[#060E1C] px-4 py-3 space-y-1 fade-up">
            {(['markets', 'trade-spot', 'copy', 'staking', 'launchpad', loggedIn ? 'dashboard' : 'login'] as Route[]).map(r => (
              <button key={r} onClick={() => go(r)} className="w-full text-left text-[13px] py-2 capitalize text-slate-200">
                {r.replace('-', ' ')}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <HeroChartCanvas />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-14 md:pt-24 md:pb-20">
          <div className="max-w-3xl fade-up">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <Tag color="blue" className="text-[10.5px]"><LiveBadge label="MARKETS OPEN" /></Tag>
              <Tag color="gold"><BrainCircuit size={9} /> AI SENTIMENT: {stats.sentiment}% BULLISH</Tag>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-bold leading-[1.06] tracking-tight">
              Institutional-Grade<br />
              <span className="text-gradient-blue">Crypto Trading</span> <span className="text-gradient-gold">Engine</span>
            </h1>
            <p className="mt-5 text-[14.5px] md:text-base text-slate-300/90 leading-relaxed max-w-xl">
              Execute spot, futures and options strategies on a sub-second matching engine.
              Deep liquidity, bank-grade custody, and AI-powered market intelligence — built for professionals.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button onClick={() => go(loggedIn ? 'trade-spot' : 'signup')} size="lg"
                className="h-12 px-7 text-[14px] bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-bold shadow-[0_0_35px_rgba(0,163,255,0.45)] hover:brightness-110 hover:scale-[1.02] transition-all">
                Start Trading <ArrowRight size={16} />
              </Button>
              <Button onClick={() => go('markets')} size="lg" variant="outline"
                className="h-12 px-7 text-[14px] border-[#FFB800]/45 text-[#FFD35C] bg-[#FFB800]/6 hover:bg-[#FFB800]/14 hover:scale-[1.02] transition-all">
                View Markets
              </Button>
            </div>

            {/* Live hero tickers */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
              {heroPairs.map(p => {
                const ch = change(p.id);
                const dir = pairQuotes[p.id]?.dir ?? (ch >= 0 ? 1 : -1);
                return (
                  <button key={p.id} onClick={() => { setSeedPair(p.id); go('trade-spot'); }}
                    className="glass rounded-xl p-3 text-left hover:border-[#00A3FF]/40 transition-all group">
                    <div className="flex items-center gap-2">
                      <CoinIcon symbol={p.base} color={p.color} size={22} />
                      <span className="text-[12px] font-semibold text-slate-200">{p.base}<span className="text-muted-foreground">/USDT</span></span>
                    </div>
                    <p className={cn('mt-2 text-[15px] font-semibold tabular', dir >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>
                      ${fmtPrice(p.price)}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <PctBadge value={ch} size="sm" />
                      <Sparkline data={[...Array(14)].map((_, i) => p.price * (1 + Math.sin(i + p.id.length) * 0.004))} w={52} h={18} glow={false} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y hairline bg-[#060E1C]/70">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { icon: <Activity size={15} />, label: '24h Trading Volume', value: fmtUsd(stats.volume24h), live: true },
            { icon: <Droplets size={15} />, label: 'Total Exchange Liquidity', value: fmtUsd(stats.liquidity) },
            { icon: <Users2 size={15} />, label: 'Active Traders', value: fmtNum(stats.traders) },
            { icon: <BrainCircuit size={15} />, label: 'AI Market Sentiment', value: `${stats.sentiment}% Bullish`, gold: true },
          ].map(s => (
            <div key={s.label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg border border-[#00A3FF]/25 bg-[#00A3FF]/8 text-[#33B5FF] flex items-center justify-center shrink-0">{s.icon}</div>
              <div className="min-w-0">
                <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{s.label}</p>
                <p className={cn('mt-1 font-[family-name:var(--font-display)] font-semibold text-lg tabular', s.gold ? 'text-[#FFD35C]' : 'text-white')}>
                  {s.value} {s.live && <LiveBadge />}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto w-full px-4 md:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#33B5FF] mb-2">Trading Infrastructure</p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">Everything a professional desk needs</h2>
          <p className="mt-3 text-[14px] text-slate-400">One platform for execution, analytics, yield and risk — engineered for reliability at scale.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <button key={f.title} onClick={() => go(f.route)}
              className={cn('glass rounded-xl p-5 text-left group transition-all duration-300 hover:-translate-y-1 hover:border-[#00A3FF]/40 hover:shadow-[0_10px_40px_rgba(0,163,255,0.15)] fade-up')}
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3.5 border"
                style={{ background: `${f.accent}14`, borderColor: `${f.accent}45`, color: f.accent, boxShadow: `0 0 18px ${f.accent}25` }}>
                {f.icon}
              </div>
              <h3 className="font-[family-name:var(--font-display)] font-semibold text-[15px]">{f.title}</h3>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">{f.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#33B5FF] opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ChevronRight size={12} />
              </span>
            </button>
          ))}
          {/* Trust card */}
          <div className="glass-gold rounded-xl p-5 relative overflow-hidden fade-up" style={{ animationDelay: '420ms' }}>
            <ShieldCheck size={20} className="text-[#FFB800] mb-3.5" />
            <h3 className="font-[family-name:var(--font-display)] font-semibold text-[15px] text-[#FFD35C]">Enterprise Security</h3>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">
              MPC custody, $750M insurance fund, 99.99% uptime SLA and 24/7 SOC monitoring.
            </p>
            <div className="mt-3 flex gap-1.5 flex-wrap">
              <Tag color="gold">SOC 2</Tag><Tag color="gold">ISO 27001</Tag><Tag color="gold">MPC</Tag>
            </div>
          </div>
        </div>
      </section>

      {/* Top movers */}
      <section className="max-w-7xl mx-auto w-full px-4 md:px-6 pb-16">
        <GlassCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b hairline">
            <div className="flex items-center gap-2.5">
              <h3 className="font-[family-name:var(--font-display)] font-semibold">Top Movers</h3>
              <LiveBadge />
            </div>
            <Button variant="ghost" size="sm" className="text-[#33B5FF] text-[12px]" onClick={() => go('markets')}>
              View all markets <ArrowRight size={13} />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="bx-table">
              <thead><tr><th>Market</th><th>Price</th><th>24h Change</th><th>24h Volume</th><th>Market Cap</th><th>Trend</th><th></th></tr></thead>
              <tbody>
                {topMovers.map(p => {
                  const ch = change(p.id);
                  return (
                    <tr key={p.id} className="cursor-pointer" onClick={() => { setSeedPair(p.id); go('trade-spot'); }}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <CoinIcon symbol={p.base} color={p.color} size={26} />
                          <div>
                            <p className="font-semibold text-[12.5px]">{p.symbol}</p>
                            <p className="text-[10.5px] text-muted-foreground">{p.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="tabular font-medium">${fmtPrice(p.price)}</td>
                      <td><PctBadge value={ch} /></td>
                      <td className="tabular text-slate-300">{fmtUsd(p.volQuote)}</td>
                      <td className="tabular text-slate-300">{fmtUsd(p.mcap)}</td>
                      <td><Sparkline data={Array.from({ length: 16 }, (_, i) => p.price * (1 + Math.sin(i * 0.9 + p.base.length) * (ch >= 0 ? 0.006 : -0.006)))} w={90} h={26} /></td>
                      <td>
                        <Button size="sm" className="h-7 text-[11px] bg-[#00A3FF]/15 text-[#33B5FF] border border-[#00A3FF]/35 hover:bg-[#00A3FF]/25">Trade</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </section>

      {/* Trust strip */}
      <section className="border-t hairline bg-[#060E1C]/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid md:grid-cols-3 gap-6">
          {[
            { icon: <Zap size={18} />, t: 'Sub-second matching engine', b: '2.4M orders/second capacity with colocation access for market makers and HFT desks.' },
            { icon: <Globe2 size={18} />, t: 'Global liquidity network', b: 'Aggregated depth from 40+ venues keeps spreads tight even in volatile sessions.' },
            { icon: <Lock size={18} />, t: 'Custody you can audit', b: 'Proof-of-reserves published monthly with on-chain attestation and MPC key sharding.' },
          ].map(x => (
            <div key={x.t} className="flex gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#00A3FF]/10 border border-[#00A3FF]/25 text-[#33B5FF] flex items-center justify-center shrink-0">{x.icon}</div>
              <div>
                <h4 className="font-semibold text-[13.5px]">{x.t}</h4>
                <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">{x.b}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto w-full px-4 md:px-6 pb-20">
        <div className="relative overflow-hidden rounded-2xl border border-[#00A3FF]/25 bg-gradient-to-br from-[#081221] via-[#0A1A33] to-[#050B18] p-8 md:p-12 text-center neon-edge">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#00A3FF]/12 blur-[90px] rounded-full" />
          <div className="relative">
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-4xl font-bold">
              Trade with an <span className="text-gradient-gold">institutional edge</span>
            </h2>
            <p className="mt-3 text-slate-300/85 text-[13.5px] md:text-[15px] max-w-xl mx-auto">
              Join 184,000+ professional traders. Zero-fee spot promotions, VIP maker rebates and dedicated support.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button onClick={() => go(loggedIn ? 'dashboard' : 'signup')} size="lg" className="h-12 px-8 bg-gradient-to-r from-[#FFD35C] to-[#FFB800] text-[#181200] font-bold shadow-[0_0_30px_rgba(255,184,0,0.35)] hover:brightness-110">
                {loggedIn ? 'Open Dashboard' : 'Create Free Account'}
              </Button>
              <Button onClick={() => go('trade-futures')} size="lg" variant="outline" className="h-12 px-8 border-white/20 text-white hover:bg-white/5">
                Explore Futures
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t hairline bg-[#060E1C]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid md:grid-cols-4 gap-8 text-[12.5px]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              { }
              <img src="/blockexchange-logo.png" alt="" className="w-8 h-8 rounded-md object-cover" />
              <p className="font-[family-name:var(--font-display)] font-bold text-[14px]">BLOCK<span className="text-gradient-gold">EXCHANGE</span></p>
            </div>
            <p className="text-muted-foreground leading-relaxed">Institutional-grade digital asset exchange. Trade futures, spot and options with confidence.</p>
          </div>
          {[
            { t: 'Products', l: [['Spot', 'trade-spot'], ['Futures', 'trade-futures'], ['Copy Trading', 'copy'], ['Staking', 'staking']] },
            { t: 'Platform', l: [['Markets', 'markets'], ['Portfolio', 'portfolio'], ['Launchpad', 'launchpad'], ['API Docs', 'settings']] },
            { t: 'Company', l: [['Support', 'support'], ['KYC & Compliance', 'kyc'], ['Affiliate', 'affiliate'], ['Admin', 'admin']] },
          ].map(col => (
            <div key={col.t}>
              <p className="font-semibold mb-3 text-[13px]">{col.t}</p>
              <ul className="space-y-2 text-muted-foreground">
                {col.l.map(([label, r]) => (
                  <li key={label}><button className="hover:text-[#33B5FF] transition-colors" onClick={() => go(r as Route)}>{label}</button></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t hairline py-4 px-4 md:px-6 text-center text-[11px] text-muted-foreground">
          © 2026 BLOCKEXCHANGE · Trading digital assets involves risk. Demo environment — no real funds are used.
        </div>
      </footer>
    </div>
  );
}
