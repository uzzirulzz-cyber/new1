'use client';

import React, { useEffect, useState } from 'react';
import {
  Home, LineChart, Star, ArrowLeftRight, Wallet2, ArrowDownToLine, ArrowUpFromLine,
  Landmark, History, UserRound, Bell, Settings, LifeBuoy, LogOut, ShieldCheck,
  Users, BarChart3, Receipt, MessageSquare, PieChart, KeyRound, Menu, X, Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession, fmtUsd } from '@/lib/session';

export type View =
  | 'home' | 'login' | 'signup' | 'markets' | 'watchlist' | 'trade' | 'assets'
  | 'deposit' | 'withdraw' | 'wallet' | 'history' | 'profile' | 'notifications'
  | 'settings' | 'support' | 'staff-login' | 'admin' | 'agent';

export const PATHS: Record<View, string> = {
  home: '/', login: '/login', signup: '/signup', markets: '/markets',
  watchlist: '/watchlist', trade: '/trade', assets: '/assets', deposit: '/deposit',
  withdraw: '/withdraw', wallet: '/wallet', history: '/history', profile: '/profile',
  notifications: '/notifications', settings: '/settings', support: '/support',
  'staff-login': '/staff/login', admin: '/admin', agent: '/agent',
};

export function viewFromPath(pathname: string): View {
  const p = ('/' + pathname.replace(/^\/+|\/+$/g, '')) || '/';
  const found = (Object.entries(PATHS) as [View, string][]).find(([, path]) => path === p);
  return found ? found[0] : 'home';
}

export function navigate(v: View) {
  const path = PATHS[v];
  if (window.location.pathname !== path) window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/blockexchange-logo.png" alt="BLOCKEXCHANGE" className="w-9 h-9 rounded-lg glow-border" />
      {!compact && (
        <div>
          <div className="font-display font-bold tracking-wide text-[15px] leading-none text-white">BLOCK<span className="text-[#00A3FF]">EXCHANGE</span></div>
          <div className="text-[8.5px] tracking-[0.28em] text-slate-400 mt-1">TRADE · INVEST · GROW</div>
        </div>
      )}
    </div>
  );
}

const CUSTOMER_NAV: { view: View; label: string; icon: React.ElementType }[] = [
  { view: 'home', label: 'Home', icon: Home },
  { view: 'markets', label: 'Markets', icon: LineChart },
  { view: 'watchlist', label: 'Watchlist', icon: Star },
  { view: 'trade', label: 'Trade', icon: ArrowLeftRight },
  { view: 'assets', label: 'Assets', icon: PieChart },
  { view: 'deposit', label: 'Deposit', icon: ArrowDownToLine },
  { view: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { view: 'wallet', label: 'Wallet', icon: Wallet2 },
  { view: 'history', label: 'History', icon: History },
  { view: 'profile', label: 'Profile', icon: UserRound },
  { view: 'notifications', label: 'Notifications', icon: Bell },
  { view: 'settings', label: 'Settings', icon: Settings },
  { view: 'support', label: 'Support', icon: LifeBuoy },
];

const MOBILE_NAV: View[] = ['home', 'markets', 'trade', 'wallet', 'support'];

const ADMIN_NAV: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'wallet', label: 'Wallet Management', icon: Wallet2 },
  { id: 'trades', label: 'Trade Management', icon: ArrowLeftRight },
  { id: 'markets', label: 'Market Management', icon: LineChart },
  { id: 'payments', label: 'Payments', icon: Receipt },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'security', label: 'Security', icon: KeyRound },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function CustomerShell({ view, children }: { view: View; children: React.ReactNode }) {
  const { user, wallet, unreadNotifs, unreadSupport, logout } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const badge = unreadNotifs > 0;

  const sideNav = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 thin-scrollbar">
      {CUSTOMER_NAV.map(({ view: v, label, icon: Icon }) => {
        const active = view === v;
        const locked = !user && ['watchlist', 'trade', 'assets', 'deposit', 'withdraw', 'wallet', 'history', 'profile', 'notifications', 'settings'].includes(v);
        return (
          <button
            key={v}
            onClick={() => { navigate(v); setMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all ${active ? 'bg-[#00A3FF]/12 text-white shadow-[inset_0_0_0_1px_rgba(0,163,255,0.25)]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'} ${locked ? 'opacity-55' : ''}`}
          >
            <Icon size={16} className={active ? 'text-[#00A3FF]' : ''} />
            <span className="flex-1 text-left">{label}</span>
            {v === 'notifications' && badge && <span className="w-2 h-2 rounded-full bg-[#FF4D4D] pulse-dot" />}
            {v === 'support' && unreadSupport && <span className="w-2 h-2 rounded-full bg-[#FFB800] pulse-dot" />}
            {locked && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">login</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#050B18] text-slate-100">
      {/* topbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#050B18]/80 hairline-b">
        <div className="flex items-center gap-3 px-4 h-16">
          <button className="lg:hidden text-slate-300" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button onClick={() => navigate('home')}><Logo /></button>
          <div className="flex-1" />
          {user && wallet && (
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass">
              <Wallet2 size={14} className="text-[#00A3FF]" />
              <span className="text-[13px] font-semibold text-white">{fmtUsd(wallet.balance)}</span>
              <span className="text-[10px] text-slate-400">USDT</span>
            </div>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('notifications')} className="relative p-2 rounded-lg hover:bg-white/5 text-slate-300">
                <Bell size={17} />
                {badge && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF4D4D] pulse-dot" />}
              </button>
              <Button size="sm" onClick={() => navigate('trade')} className="hidden md:inline-flex bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-semibold hover:brightness-110">Trade Now</Button>
              <button onClick={() => navigate('profile')} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00A3FF] to-[#005f9e] grid place-items-center text-[11px] font-bold text-[#04101F]">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden md:block text-[12px] text-slate-200">{user.name.split(' ')[0]}</span>
              </button>
              <button onClick={logout} className="p-2 rounded-lg hover:bg-white/5 text-slate-400" title="Sign out"><LogOut size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => navigate('login')} className="text-slate-200">Sign in</Button>
              <Button size="sm" onClick={() => navigate('signup')} className="bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-semibold hover:brightness-110">Open Account</Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 hairline-r bg-[#060D1B]/60">
          {sideNav}
          <div className="p-3">
            {!user ? (
              <button onClick={() => navigate('staff-login')} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] text-slate-500 hover:text-[#FFB800] hover:bg-white/[0.03]">
                <ShieldCheck size={14} /> Staff Portal
              </button>
            ) : (
              <div className="px-3 py-2.5 rounded-xl glass text-[11px] text-slate-400">
                <div className="flex items-center gap-2 text-slate-200 font-medium">{user.name}</div>
                <div className="mt-0.5">UID {user.uid} · VIP {user.vipLevel}</div>
                <div className="mt-0.5 capitalize">KYC: <span className={user.kycStatus === 'VERIFIED' ? 'text-[#00FF88]' : 'text-[#FFB800]'}>{user.kycStatus.toLowerCase()}</span></div>
              </div>
            )}
          </div>
        </aside>

        {/* mobile drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#060D1B] flex flex-col hairline-r">
              <div className="h-16 flex items-center px-4 hairline-b"><Logo /></div>
              {sideNav}
              <div className="p-3">
                <button onClick={() => { navigate('staff-login'); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] text-slate-500 hover:text-[#FFB800]">
                  <ShieldCheck size={14} /> Staff Portal
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</main>
      </div>

      {/* mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#060D1B]/95 backdrop-blur-xl hairline-t flex">
        {MOBILE_NAV.map(v => {
          const { icon: Icon, label } = CUSTOMER_NAV.find(n => n.view === v)!;
          const active = view === v;
          return (
            <button key={v} onClick={() => navigate(v)} className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[10px] ${active ? 'text-[#00A3FF]' : 'text-slate-500'}`}>
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/** Staff chrome for /admin and /agent. */
export function StaffShell({ view, activeModule, onModule, children }: {
  view: 'admin' | 'agent';
  activeModule?: string;
  onModule?: (id: string) => void;
  children: React.ReactNode;
}) {
  const { user, logout } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = view === 'admin' ? ADMIN_NAV : [{ id: 'overview', label: 'Overview', icon: Megaphone }];

  const sideNav = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 thin-scrollbar">
      {nav.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => { onModule?.(id); setMenuOpen(false); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all ${activeModule === id ? 'bg-[#FFB800]/10 text-white shadow-[inset_0_0_0_1px_rgba(255,184,0,0.25)]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}
        >
          <Icon size={16} className={activeModule === id ? 'text-[#FFB800]' : ''} />
          {label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#04080F] text-slate-100">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#04080F]/85 hairline-b">
        <div className="flex items-center gap-3 px-4 h-16">
          <button className="lg:hidden text-slate-300" onClick={() => setMenuOpen(o => !o)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <button onClick={() => navigate('home')} className="flex items-center gap-2.5">
            <img src="/blockexchange-logo.png" alt="BLOCKEXCHANGE" className="w-9 h-9 rounded-lg" />
            <div>
              <div className="font-display font-bold text-[14px] leading-none text-white">BLOCK<span className="text-[#FFB800]">EXCHANGE</span></div>
              <div className="text-[8.5px] tracking-[0.26em] text-slate-500 mt-1">{view === 'admin' ? 'SUPER ADMIN CONSOLE' : 'SUB-AGENT PORTAL'}</div>
            </div>
          </button>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-[12.5px] text-white font-medium">{user.name}</div>
                <div className="text-[10px] text-slate-500">{user.role.replace('_', '-')} · {user.uid}</div>
              </div>
              <button onClick={logout} className="p-2 rounded-lg hover:bg-white/5 text-slate-400" title="Sign out"><LogOut size={16} /></button>
            </div>
          )}
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden lg:flex flex-col w-56 shrink-0 hairline-r bg-[#050B14]/70">
          {sideNav}
          <div className="p-3">
            <button onClick={() => navigate('home')} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] text-slate-500 hover:text-[#00A3FF] hover:bg-white/[0.03]">
              <Home size={14} /> Customer Site
            </button>
          </div>
        </aside>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#050B14] flex flex-col hairline-r">
              <div className="h-16 flex items-center px-4 hairline-b"><Logo compact /></div>
              {sideNav}
              <div className="p-3">
                <button onClick={() => { navigate('home'); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] text-slate-500 hover:text-[#00A3FF]">
                  <Home size={14} /> Customer Site
                </button>
              </div>
            </aside>
          </div>
        )}
        <main className="flex-1 min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
