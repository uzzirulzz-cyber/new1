'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { SessionProvider } from '@/lib/session';
import { CustomerShell, viewFromPath, type View } from '@/components/shell';

import { HomeView } from '@/components/views/home';
import { MarketsView, WatchlistView } from '@/components/views/markets';
import { TradeView } from '@/components/views/trade';
import { AssetsView, DepositView, WithdrawView, WalletView, HistoryView } from '@/components/views/funds';
import { ProfileView, NotificationsView, SettingsView, SupportView } from '@/components/views/account';
import { LoginView, SignupView, StaffLoginView } from '@/components/views/auth';
import { AdminView, AgentView } from '@/components/staff/views';

function Router() {
  const [view, setView] = useState<View>('home');

  useEffect(() => {
    const apply = () => setView(viewFromPath(window.location.pathname));
    // migrate legacy #/ hash links from v1
    const legacy = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
    if (legacy) {
      const map: Record<string, string> = {
        dashboard: '/assets', markets: '/markets', 'trade-spot': '/trade',
        'trade-futures': '/trade', 'trade-options': '/trade', copy: '/markets',
        staking: '/assets', launchpad: '/markets', wallet: '/wallet',
        deposit: '/deposit', withdraw: '/withdraw', transactions: '/wallet',
        portfolio: '/assets', kyc: '/profile', affiliate: '/support',
        support: '/support', settings: '/settings', login: '/login', signup: '/signup', admin: '/admin',
      };
      const target = map[legacy];
      if (target) window.history.replaceState(null, '', target);
    }
    apply();
    window.addEventListener('popstate', apply);
    return () => window.removeEventListener('popstate', apply);
  }, []);

  if (view === 'admin') return <AdminView />;
  if (view === 'agent') return <AgentView />;
  if (view === 'login') return <LoginView />;
  if (view === 'signup') return <SignupView />;
  if (view === 'staff-login') return <StaffLoginView />;

  return (
    <CustomerShell view={view}>
      {view === 'home' && <HomeView />}
      {view === 'markets' && <MarketsView />}
      {view === 'watchlist' && <WatchlistView />}
      {view === 'trade' && <TradeView />}
      {view === 'assets' && <AssetsView />}
      {view === 'deposit' && <DepositView />}
      {view === 'withdraw' && <WithdrawView />}
      {view === 'wallet' && <WalletView />}
      {view === 'history' && <HistoryView />}
      {view === 'profile' && <ProfileView />}
      {view === 'notifications' && <NotificationsView />}
      {view === 'settings' && <SettingsView />}
      {view === 'support' && <SupportView />}
    </CustomerShell>
  );
}

const App = dynamic(() => Promise.resolve(Router), { ssr: false });

export default function Page() {
  return (
    <SessionProvider>
      <App />
    </SessionProvider>
  );
}
