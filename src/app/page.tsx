'use client';

import dynamic from 'next/dynamic';
import { ExchangeProvider, useExchange } from '@/lib/store';
import { AppShell } from '@/components/layout';

import HomeView from '@/components/views/home';
import DashboardView from '@/components/views/dashboard';
import MarketsView from '@/components/views/markets';
import SpotTradeView from '@/components/views/spot-trade';
import FuturesTradeView from '@/components/views/futures-trade';
import OptionsTradeView from '@/components/views/options-trade';
import CopyTradingView from '@/components/views/copy-trading';
import { StakingView, LaunchpadView } from '@/components/views/earn';
import { WalletView, DepositView, WithdrawView, TransactionsView } from '@/components/views/wallet';
import PortfolioView from '@/components/views/portfolio';
import { KycView, AffiliateView, SupportView, SettingsView } from '@/components/views/account';
import AuthView from '@/components/views/auth';
import AdminView from '@/components/views/admin';

function Router() {
  const { route } = useExchange();

  const view = (() => {
    switch (route) {
      case 'home': return <HomeView />;
      case 'dashboard': return <DashboardView />;
      case 'markets': return <MarketsView />;
      case 'trade-spot': return <SpotTradeView />;
      case 'trade-futures': return <FuturesTradeView />;
      case 'trade-options': return <OptionsTradeView />;
      case 'copy': return <CopyTradingView />;
      case 'staking': return <StakingView />;
      case 'launchpad': return <LaunchpadView />;
      case 'wallet': return <WalletView />;
      case 'deposit': return <DepositView />;
      case 'withdraw': return <WithdrawView />;
      case 'transactions': return <TransactionsView />;
      case 'portfolio': return <PortfolioView />;
      case 'kyc': return <KycView />;
      case 'affiliate': return <AffiliateView />;
      case 'support': return <SupportView />;
      case 'settings': return <SettingsView />;
      case 'admin': return <AdminView />;
      case 'login': return <AuthView mode="login" />;
      case 'signup': return <AuthView mode="signup" />;
      default: return <HomeView />;
    }
  })();

  return <AppShell>{view}</AppShell>;
}

const App = dynamic(() => Promise.resolve(Router), { ssr: false });

export default function Page() {
  return (
    <ExchangeProvider>
      <App />
    </ExchangeProvider>
  );
}
