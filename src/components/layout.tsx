'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard, LineChart, CandlestickChart, TrendingUp, Layers, Copy, Coins, Rocket,
  Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, PieChart, ShieldCheck, Users,
  LifeBuoy, Settings, Landmark, Bell, Search, LogOut, Menu, Home, X, ChevronDown, Gauge,
  Activity, CheckCircle2, Award,
} from 'lucide-react';
import { useExchange, Route } from '@/lib/store';
import { change24h, fmtPrice, fmtPct } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TickerTape, Tag } from '@/components/shared';

interface NavItem { id: Route; label: string; icon: React.ReactNode; badge?: string }
interface NavSection { title: string; items: NavItem[] }

const NAV: NavSection[] = [
  {
    title: 'Overview', items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
      { id: 'markets', label: 'Markets', icon: <LineChart size={16} /> },
    ],
  },
  {
    title: 'Trading', items: [
      { id: 'trade-spot', label: 'Spot', icon: <CandlestickChart size={16} /> },
      { id: 'trade-futures', label: 'Futures', icon: <TrendingUp size={16} /> },
      { id: 'trade-options', label: 'Options', icon: <Layers size={16} /> },
      { id: 'copy', label: 'Copy Trading', icon: <Copy size={16} />, badge: 'HOT' },
      { id: 'staking', label: 'Staking & Earn', icon: <Coins size={16} /> },
      { id: 'launchpad', label: 'Launchpad', icon: <Rocket size={16} /> },
    ],
  },
  {
    title: 'Wallet', items: [
      { id: 'wallet', label: 'Wallet', icon: <Wallet size={16} /> },
      { id: 'deposit', label: 'Deposit', icon: <ArrowDownToLine size={16} /> },
      { id: 'withdraw', label: 'Withdraw', icon: <ArrowUpFromLine size={16} /> },
      { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight size={16} /> },
      { id: 'portfolio', label: 'Portfolio', icon: <PieChart size={16} /> },
    ],
  },
  {
    title: 'Account', items: [
      { id: 'kyc', label: 'KYC Verification', icon: <ShieldCheck size={16} /> },
      { id: 'affiliate', label: 'Affiliate', icon: <Users size={16} /> },
      { id: 'support', label: 'Support', icon: <LifeBuoy size={16} /> },
      { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
    ],
  },
  {
    title: 'Administration', items: [
      { id: 'admin', label: 'Admin Panel', icon: <Landmark size={16} /> },
    ],
  },
];

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      { }
      <img src="/blockexchange-logo.png" alt="BLOCKEXCHANGE" className="w-9 h-9 rounded-lg object-cover border border-[#FFB800]/30 shadow-[0_0_18px_rgba(255,184,0,0.25)]" />
      {!compact && (
        <div className="leading-none">
          <p className="font-[family-name:var(--font-display)] font-bold text-[15px] tracking-wide">
            BLOCK<span className="text-gradient-gold">EXCHANGE</span>
          </p>
          <p className="text-[9.5px] text-muted-foreground tracking-[0.22em] mt-1">TRADE · INVEST · GROW</p>
        </div>
      )}
    </div>
  );
}

function SearchBox() {
  const { pairs, navigate, setSeedPair } = useExchange();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const results = useMemo(() => {
    if (!q.trim()) return pairs.slice(0, 7);
    const s = q.toLowerCase();
    return pairs.filter(p => p.symbol.toLowerCase().includes(s) || p.name.toLowerCase().includes(s)).slice(0, 8);
  }, [q, pairs]);

  return (
    <div ref={ref} className="relative hidden md:block flex-1 max-w-md">
      <div className={cn('flex items-center gap-2 rounded-lg border bg-[#081221]/80 px-3 h-9 transition-all', open ? 'border-[#00A3FF]/50 shadow-[0_0_20px_rgba(0,163,255,0.15)]' : 'hairline')}>
        <Search size={14} className="text-muted-foreground" />
        <input
          value={q} onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search markets, pairs, assets…"
          className="bg-transparent outline-none text-[13px] w-full placeholder:text-muted-foreground/70"
        />
        <kbd className="text-[10px] text-muted-foreground border hairline rounded px-1.5 py-0.5">Ctrl K</kbd>
      </div>
      {open && (
        <div className="absolute top-11 left-0 right-0 glass rounded-xl p-1.5 z-50 fade-up">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2.5 py-1.5">Markets</p>
          {results.map(p => {
            const ch = change24h(p);
            return (
              <button key={p.id}
                onClick={() => { setSeedPair(p.id); setOpen(false); setQ(''); navigate('trade-spot'); }}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[#00A3FF]/10 transition-colors text-left">
                <span className="w-6 h-6 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: `${p.color}22`, color: p.color, border: `1px solid ${p.color}44` }}>
                  {p.base.slice(0, 2)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium">{p.symbol}</p>
                  <p className="text-[10.5px] text-muted-foreground">{p.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] tabular">${fmtPrice(p.price)}</p>
                  <p className={cn('text-[10px] tabular', ch >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>{fmtPct(ch)}</p>
                </div>
              </button>
            );
          })}
          {results.length === 0 && <p className="text-xs text-muted-foreground px-3 py-4 text-center">No markets found</p>}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { notifs, markAllRead } = useExchange();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const unread = notifs.filter(n => !n.read).length;
  const icons = { trade: Activity, security: ShieldCheck, system: Gauge, reward: Award };
  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white" onClick={() => { setOpen(o => !o); if (open) markAllRead(); }}>
        <Bell size={17} />
        {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF4D4D] text-[9px] font-bold flex items-center justify-center text-white">{unread}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 top-11 w-80 glass rounded-xl z-50 fade-up overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-3 border-b hairline">
            <p className="text-[13px] font-semibold">Notifications</p>
            <button className="text-[11px] text-[#33B5FF] hover:underline" onClick={markAllRead}>Mark all read</button>
          </div>
          <div className="max-h-80 overflow-y-auto scroll-thin">
            {notifs.map(n => {
              const Ico = icons[n.type];
              return (
                <div key={n.id} className={cn('px-3.5 py-3 border-b hairline/60 flex gap-2.5 hover:bg-[#00A3FF]/5', !n.read && 'bg-[#00A3FF]/[0.04]')}>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border',
                    n.type === 'trade' ? 'bg-[#00FF88]/10 border-[#00FF88]/25 text-[#00FF88]' :
                    n.type === 'reward' ? 'bg-[#FFB800]/10 border-[#FFB800]/25 text-[#FFB800]' :
                    'bg-[#00A3FF]/10 border-[#00A3FF]/25 text-[#33B5FF]')}>
                    <Ico size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium leading-snug">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{Math.floor((Date.now() - n.time) / 3600e3)}h ago</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, logout, navigate } = useExchange();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2.5 rounded-lg pl-1.5 pr-2 py-1 hover:bg-[#00A3FF]/8 transition-colors">
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00A3FF] to-[#0077d4] text-[12px] font-bold flex items-center justify-center text-white shadow-[0_0_14px_rgba(0,163,255,0.4)]">
          {user.name.split(' ').map(x => x[0]).join('').slice(0, 2)}
        </span>
        <span className="hidden lg:block text-left leading-tight">
          <span className="block text-[12.5px] font-semibold">{user.name}</span>
          <span className="block text-[10px] text-[#FFB800]">{user.tier}</span>
        </span>
        <ChevronDown size={13} className="text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-60 glass rounded-xl z-50 fade-up overflow-hidden p-1.5">
          <div className="px-3 py-2.5 border-b hairline mb-1.5">
            <p className="text-[13px] font-semibold">{user.name}</p>
            <p className="text-[11px] text-muted-foreground">{user.email}</p>
            <div className="flex gap-1.5 mt-2">
              <Tag color="green"><CheckCircle2 size={9} /> KYC Verified</Tag>
              <Tag color="gold">VIP 3</Tag>
            </div>
          </div>
          {([
            ['Portfolio', 'portfolio'], ['Settings', 'settings'], ['KYC Verification', 'kyc'], ['Affiliate', 'affiliate'],
          ] as [string, Route][]).map(([label, r]) => (
            <button key={r} onClick={() => { setOpen(false); navigate(r); }}
              className="w-full text-left text-[12.5px] px-3 py-2 rounded-lg hover:bg-[#00A3FF]/10 transition-colors">
              {label}
            </button>
          ))}
          <button onClick={() => { setOpen(false); logout(); }}
            className="w-full text-left text-[12.5px] px-3 py-2 rounded-lg hover:bg-[#FF4D4D]/10 text-[#FF6B6B] transition-colors flex items-center gap-2">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { route, navigate, pairs, loggedIn } = useExchange();
  const [drawer, setDrawer] = useState(false);
  const { pairQuotes } = useExchange();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        (document.querySelector<HTMLInputElement>('input[placeholder^="Search markets"]'))?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tickerPairs = useMemo(() => pairs.slice(0, 10).map(p => ({ id: p.id, symbol: p.symbol, price: p.price, color: p.color, dir: pairQuotes[p.id]?.dir })), [pairs, pairQuotes]);
  const change = (id: string) => { const p = pairs.find(x => x.id === id); return p ? change24h(p) : 0; };

  const SidebarBody = (
    <div className="flex flex-col h-full">
      <div className="px-4 h-16 flex items-center border-b hairline shrink-0">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto scroll-thin px-2.5 py-3 space-y-4">
        {NAV.map(sec => (
          <div key={sec.title}>
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/80 px-2.5 mb-1.5">{sec.title}</p>
            <div className="space-y-0.5">
              {sec.items.map(item => {
                const active = route === item.id;
                return (
                  <button key={item.id} onClick={() => { navigate(item.id); setDrawer(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-all group relative',
                      active
                        ? 'bg-gradient-to-r from-[#00A3FF]/16 to-[#00A3FF]/4 text-white border border-[#00A3FF]/30 shadow-[0_0_18px_rgba(0,163,255,0.12)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent',
                    )}>
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-5 rounded-full bg-[#00A3FF] shadow-[0_0_8px_#00A3FF]" />}
                    <span className={active ? 'text-[#33B5FF]' : 'text-slate-500 group-hover:text-[#33B5FF] transition-colors'}>{item.icon}</span>
                    {item.label}
                    {item.badge && <Tag color="gold" className="ml-auto">{item.badge}</Tag>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 shrink-0">
        <button onClick={() => navigate('staking')} className="w-full glass-gold rounded-xl p-3.5 text-left relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-6 opacity-30 group-hover:opacity-50 transition-opacity"><Award size={64} className="text-[#FFB800]" /></div>
          <p className="text-[12.5px] font-semibold text-[#FFD35C]">Premium Account</p>
          <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">Reduced fees, boosted APY & VIP signals</p>
          <span className="inline-block mt-2 text-[10.5px] font-semibold text-[#050B18] bg-gradient-to-r from-[#FFD35C] to-[#FFB800] rounded-md px-2.5 py-1">Upgrade Now</span>
        </button>
      </div>
    </div>
  );

  if (!loggedIn || route === 'login' || route === 'signup' || route === 'home') {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sidebar desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-[228px] bg-[#060E1C]/95 border-r hairline z-40 hidden lg:block">
        {SidebarBody}
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[264px] bg-[#060E1C] border-r hairline fade-up">
            <button className="absolute right-3 top-5 text-muted-foreground" onClick={() => setDrawer(false)}><X size={18} /></button>
            {SidebarBody}
          </aside>
        </div>
      )}

      <div className="lg:pl-[228px] flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-[#050B18]/92 backdrop-blur-md">
          <div className="h-14 flex items-center gap-3 px-3 md:px-5 border-b hairline">
            <button className="lg:hidden text-slate-300" onClick={() => setDrawer(true)}><Menu size={20} /></button>
            <div className="lg:hidden"><Logo compact /></div>
            <SearchBox />
            <div className="flex-1" />
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => navigate('deposit')}
                className="h-8.5 h-[34px] rounded-lg text-[12px] font-semibold px-3.5 bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] shadow-[0_0_18px_rgba(0,163,255,0.35)] hover:brightness-110 transition-all">
                Deposit
              </button>
              <button onClick={() => navigate('withdraw')}
                className="h-[34px] rounded-lg text-[12px] font-semibold px-3.5 border border-[#FFB800]/40 text-[#FFD35C] bg-[#FFB800]/8 hover:bg-[#FFB800]/15 transition-all">
                Withdraw
              </button>
            </div>
            <Notifications />
            <UserMenu />
          </div>
          <TickerTape pairs={tickerPairs} change24h={change} fmtPrice={fmtPrice} navigate={(r) => navigate(r as Route)} />
        </header>

        <main className="flex-1 pb-20 lg:pb-6">{children}</main>

        <footer className="hidden lg:block mt-auto border-t hairline bg-[#060E1C]/70">
          <div className="px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <p>© 2026 BLOCKEXCHANGE. Institutional-grade digital asset trading.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="live-dot w-1.5 h-1.5 rounded-full bg-[#00FF88]" /> All systems operational</span>
              <button className="hover:text-[#33B5FF]" onClick={() => navigate('support')}>Support</button>
              <button className="hover:text-[#33B5FF]" onClick={() => navigate('kyc')}>Compliance</button>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#060E1C]/95 backdrop-blur-md border-t hairline pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-14">
          {([
            ['home', 'Home', <Home size={18} key="h" />],
            ['markets', 'Markets', <LineChart size={18} key="m" />],
            ['trade-spot', 'Trade', <CandlestickChart size={18} key="t" />],
            ['wallet', 'Wallet', <Wallet size={18} key="w" />],
            ['dashboard', 'More', <LayoutDashboard size={18} key="d" />],
          ] as [Route, string, React.ReactNode][]).map(([r, label, icon]) => {
            const active = route === r;
            return (
              <button key={r} onClick={() => navigate(r)}
                className={cn('flex flex-col items-center justify-center gap-0.5 text-[9.5px] transition-colors', active ? 'text-[#33B5FF]' : 'text-slate-500')}>
                <span className={active ? 'drop-shadow-[0_0_8px_rgba(0,163,255,0.6)]' : ''}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
