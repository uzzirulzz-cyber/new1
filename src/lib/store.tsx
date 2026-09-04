'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  PAIRS, MarketPair, Candle, genCandles, genBook, genTrades, nextPrice, change24h,
  Trade, BookLevel, COPY_TRADERS, STAKING_POOLS, TIMEFRAMES,
} from '@/lib/market';

export type Route =
  | 'home' | 'dashboard' | 'markets' | 'trade-spot' | 'trade-futures' | 'trade-options'
  | 'copy' | 'staking' | 'launchpad' | 'wallet' | 'deposit' | 'withdraw' | 'transactions'
  | 'portfolio' | 'kyc' | 'affiliate' | 'support' | 'settings' | 'login' | 'signup' | 'admin';

/** Real, indexable URL path for every route (replaces legacy hash URLs). */
export const ROUTE_PATHS: Record<Route, string> = {
  home: '/',
  dashboard: '/dashboard',
  markets: '/markets',
  'trade-spot': '/trade/spot',
  'trade-futures': '/trade/futures',
  'trade-options': '/trade/options',
  copy: '/copy-trading',
  staking: '/staking',
  launchpad: '/launchpad',
  wallet: '/wallet',
  deposit: '/deposit',
  withdraw: '/withdraw',
  transactions: '/transactions',
  portfolio: '/portfolio',
  kyc: '/kyc',
  affiliate: '/affiliate',
  support: '/support',
  settings: '/settings',
  login: '/login',
  signup: '/signup',
  admin: '/admin',
};

const PATH_TO_ROUTE: Record<string, Route> = Object.fromEntries(
  (Object.entries(ROUTE_PATHS) as [Route, string][]).map(([r, p]) => [p, r]),
);

export function routeFromPath(pathname: string): Route {
  const p = ('/' + pathname.replace(/^\/+|\/+$/g, '')).replace(/\/+$/, '') || '/';
  return PATH_TO_ROUTE[p] ?? 'home';
}

export interface Order {
  id: string; pairId: string; symbol: string; type: 'Limit' | 'Market' | 'Stop' | 'OCO';
  side: 'Buy' | 'Sell'; price: number; amount: number; filled: number;
  total: number; time: number; status: 'Open' | 'Filled' | 'Cancelled' | 'Partial';
  stopPrice?: number; tp?: number; sl?: number;
}

export interface Position {
  id: string; pairId: string; symbol: string; side: 'Long' | 'Short';
  leverage: number; marginMode: 'Cross' | 'Isolated'; entry: number; amount: number;
  margin: number; liq: number; pnl: number; time: number;
}

export interface WalletTx {
  id: string; type: 'Deposit' | 'Withdraw' | 'Trade' | 'Transfer' | 'Reward' | 'Copy' | 'Staking';
  asset: string; amount: number; usd: number; time: number;
  status: 'Completed' | 'Pending' | 'Failed'; detail: string;
}

export interface StakeRecord { id: string; poolId: string; asset: string; amount: number; apy: number; since: number; type: string }

export interface Notif { id: string; title: string; body: string; time: number; type: 'trade' | 'security' | 'system' | 'reward'; read: boolean }

export interface Balances { [asset: string]: { free: number; locked: number } }

export interface AuthUser {
  name: string; email: string; tier: string; verified: boolean;
  joinedAt: number; twoFA: boolean; kyc: 'unverified' | 'pending' | 'verified' | 'institutional';
}

interface ExchangeState {
  route: Route; navigate: (r: Route) => void;
  loggedIn: boolean; login: (name?: string) => void; logout: () => void;
  user: AuthUser;
  pairs: MarketPair[]; pairMap: Record<string, MarketPair>;
  pairQuotes: Record<string, { seq: number; dir: 1 | -1 | 0 }>;
  candles: Record<string, Candle[]>;
  books: Record<string, { asks: BookLevel[]; bids: BookLevel[] }>;
  trades: Record<string, Trade[]>;
  setSeedPair: (id: string) => void;
  balances: Balances; deposit: (asset: string, amount: number) => void;
  placeOrder: (o: Omit<Order, 'id' | 'time' | 'status' | 'filled'>) => void;
  cancelOrder: (id: string) => void;
  openOrders: Order[]; orderHistory: Order[];
  positions: Position[]; openPosition: (p: Omit<Position, 'id' | 'time' | 'pnl'>) => void;
  closePosition: (id: string) => void;
  txs: WalletTx[];
  watchlist: Set<string>; toggleWatch: (id: string) => void;
  stakes: StakeRecord[]; addStake: (poolId: string, asset: string, amount: number, apy: number, type: string) => void;
  copies: Record<string, number>; toggleCopy: (traderId: string, amount: number) => void;
  notifs: Notif[]; markAllRead: () => void;
  stats: { volume24h: number; liquidity: number; traders: number; sentiment: number };
  toast: (title: string, body?: string) => void;
  authView: 'login' | 'signup'; setAuthView: (v: 'login' | 'signup') => void;
}

const Ctx = createContext<ExchangeState | null>(null);

const initialBalances: Balances = {
  USDT: { free: 48392.72, locked: 2150.00 },
  BTC: { free: 0.8412, locked: 0 },
  ETH: { free: 6.204, locked: 1.5 },
  SOL: { free: 84.5, locked: 0 },
  BNB: { free: 12.06, locked: 0 },
  XRP: { free: 5200, locked: 0 },
  LINK: { free: 210.4, locked: 0 },
};

const seedTxs = (): WalletTx[] => {
  const now = Date.now();
  return [
    { id: 'tx1', type: 'Deposit', asset: 'USDT', amount: 25000, usd: 25000, time: now - 86400000 * 26, status: 'Completed', detail: 'TRC-20 · TxDx…8f2a' },
    { id: 'tx2', type: 'Trade', asset: 'BTC', amount: 0.15, usd: 9842.11, time: now - 86400000 * 22, status: 'Completed', detail: 'Bought BTC/USDT @ 65,614' },
    { id: 'tx3', type: 'Trade', asset: 'ETH', amount: 2.4, usd: 8395.20, time: now - 86400000 * 18, status: 'Completed', detail: 'Bought ETH/USDT @ 3,498' },
    { id: 'tx4', type: 'Reward', asset: 'USDT', amount: 128.44, usd: 128.44, time: now - 86400000 * 12, status: 'Completed', detail: 'Staking rewards payout' },
    { id: 'tx5', type: 'Withdraw', asset: 'ETH', amount: 0.5, usd: 1799.10, time: now - 86400000 * 9, status: 'Completed', detail: 'ERC-20 · 0x91c…4e21' },
    { id: 'tx6', type: 'Copy', asset: 'USDT', amount: 500, usd: 500, time: now - 86400000 * 6, status: 'Completed', detail: 'Allocated to @quantedge' },
    { id: 'tx7', type: 'Deposit', asset: 'USDT', amount: 10000, usd: 10000, time: now - 86400000 * 3, status: 'Completed', detail: 'ERC-20 · 0x77b…9d02' },
    { id: 'tx8', type: 'Trade', asset: 'SOL', amount: 40, usd: 6291.60, time: now - 86400000 * 1.2, status: 'Completed', detail: 'Bought SOL/USDT @ 157.29' },
    { id: 'tx9', type: 'Withdraw', asset: 'USDT', amount: 1200, usd: 1200, time: now - 3600e3 * 8, status: 'Pending', detail: 'TRC-20 · TXqL…33ba' },
  ];
};

const seedNotifs = (): Notif[] => [
  { id: 'n1', title: 'Withdrawal pending approval', body: 'Your 1,200 USDT withdrawal is under review (est. 10 min).', time: Date.now() - 3600e3 * 8, type: 'security', read: false },
  { id: 'n2', title: 'AI Signal: BTC breakout', body: 'BTC broke resistance at $66,900 — momentum score 82/100.', time: Date.now() - 3600e3 * 3, type: 'trade', read: false },
  { id: 'n3', title: 'Staking rewards credited', body: '+$128.44 USDT earned from Flexible pools.', time: Date.now() - 86400e3 * 1, type: 'reward', read: false },
  { id: 'n4', title: 'New login from Chrome', body: 'Karachi, PK · 103.22.x.x — if this was not you, secure your account.', time: Date.now() - 86400e3 * 2, type: 'security', read: true },
];

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<Route>(() =>
    typeof window !== 'undefined' ? routeFromPath(window.location.pathname) : 'home',
  );
  const [loggedIn, setLoggedIn] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [pairs, setPairs] = useState<MarketPair[]>(() => PAIRS.map(p => ({ ...p })));
  const [pairQuotes, setPairQuotes] = useState<Record<string, { seq: number; dir: 1 | -1 | 0 }>>({});
  const seqRef = useRef(0);
  const [candles, setCandles] = useState<Record<string, Candle[]>>({});
  const [books, setBooks] = useState<Record<string, { asks: BookLevel[]; bids: BookLevel[] }>>({});
  const [trades, setTrades] = useState<Record<string, Trade[]>>({});
  const seedPairRef = useRef('btc');
  const [openOrders, setOpenOrders] = useState<Order[]>([
    { id: 'ord-9412', pairId: 'btc', symbol: 'BTC/USDT', type: 'Limit', side: 'Buy', price: 64800, amount: 0.12, filled: 0, total: 7776, time: Date.now() - 5400e3, status: 'Open' },
    { id: 'ord-9415', pairId: 'eth', symbol: 'ETH/USDT', type: 'Limit', side: 'Sell', price: 3750, amount: 1.5, filled: 0, total: 5625, time: Date.now() - 4200e3, status: 'Open' },
    { id: 'ord-9417', pairId: 'sol', symbol: 'SOL/USDT', type: 'Stop', side: 'Sell', price: 148.5, amount: 20, filled: 0, total: 2970, time: Date.now() - 2400e3, status: 'Open', stopPrice: 149.2 },
    { id: 'ord-9418', pairId: 'rndr', symbol: 'RNDR/USDT', type: 'OCO', side: 'Buy', price: 9.2, amount: 300, filled: 0, total: 2760, time: Date.now() - 1200e3, status: 'Open', tp: 11.4, sl: 8.6 },
  ]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([
    { id: 'ord-9398', pairId: 'btc', symbol: 'BTC/USDT', type: 'Limit', side: 'Buy', price: 65500, amount: 0.15, filled: 0.15, total: 9825, time: Date.now() - 86400e3 * 2, status: 'Filled' },
    { id: 'ord-9401', pairId: 'eth', symbol: 'ETH/USDT', type: 'Market', side: 'Buy', price: 3498, amount: 2.4, filled: 2.4, total: 8395.2, time: Date.now() - 86400e3 * 4, status: 'Filled' },
    { id: 'ord-9405', pairId: 'doge', symbol: 'DOGE/USDT', type: 'Limit', side: 'Sell', price: 0.171, amount: 40000, filled: 0, total: 6840, time: Date.now() - 86400e3 * 6, status: 'Cancelled' },
    { id: 'ord-9409', pairId: 'link', symbol: 'LINK/USDT', type: 'Limit', side: 'Buy', price: 16.4, amount: 210, filled: 210, total: 3444, time: Date.now() - 86400e3 * 8, status: 'Filled' },
  ]);
  const [positions, setPositions] = useState<Position[]>([
    { id: 'pos-201', pairId: 'btc', symbol: 'BTC/USDT', side: 'Long', leverage: 10, marginMode: 'Cross', entry: 65240, amount: 0.35, margin: 2273.8, liq: 59880, pnl: 715.6, time: Date.now() - 86400e3 * 2.1 },
    { id: 'pos-202', pairId: 'eth', symbol: 'ETH/USDT', side: 'Short', leverage: 5, marginMode: 'Isolated', entry: 3660, amount: 4, margin: 2928, liq: 4120, pnl: 247.2, time: Date.now() - 86400e3 * 0.8 },
    { id: 'pos-203', pairId: 'sol', symbol: 'SOL/USDT', side: 'Long', leverage: 20, marginMode: 'Isolated', entry: 152.8, amount: 60, margin: 458.4, liq: 138.4, pnl: 269.4, time: Date.now() - 3600e3 * 9 },
  ]);
  const [balances, setBalances] = useState<Balances>(initialBalances);
  const [txs, setTxs] = useState<WalletTx[]>(seedTxs);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(['btc', 'eth', 'sol', 'rndr', 'ton']));
  const [stakes, setStakes] = useState<StakeRecord[]>([
    { id: 'st1', poolId: 's1', asset: 'USDT', amount: 8000, apy: 12.6, since: Date.now() - 86400e3 * 40, type: 'Flexible' },
    { id: 'st2', poolId: 's3', asset: 'ETH', amount: 1.5, apy: 8.9, since: Date.now() - 86400e3 * 21, type: 'Locked 90d' },
  ]);
  const [copies, setCopies] = useState<Record<string, number>>({ t1: 500 });
  const [notifs, setNotifs] = useState<Notif[]>(seedNotifs);
  const [stats] = useState({ volume24h: 8.42e9, liquidity: 1.92e9, traders: 184732, sentiment: 73 });

  const toast = useCallback((_title: string, _body?: string) => {
    // handled via sonner in components directly
  }, []);

  const navigate = useCallback((r: Route) => {
    setRoute(r);
    try {
      const path = ROUTE_PATHS[r];
      if (window.location.pathname !== path) window.history.pushState(null, '', path);
    } catch { /* noop */ }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    // Real pathname routing — every route is a directly linkable, indexable URL
    const applyPath = () => setRoute(routeFromPath(window.location.pathname));
    // Migrate legacy hash URLs (#/dashboard → /dashboard) so old links keep working
    const legacy = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
    if (legacy) {
      const mapped = PATH_TO_ROUTE[`/${legacy}`];
      if (mapped) window.history.replaceState(null, '', ROUTE_PATHS[mapped]);
    }
    applyPath();
    window.addEventListener('popstate', applyPath);
    return () => window.removeEventListener('popstate', applyPath);
  }, []);

  // seed candle/book/trade data once
  useEffect(() => {
    const cs: Record<string, Candle[]> = {};
    const bs: Record<string, { asks: BookLevel[]; bids: BookLevel[] }> = {};
    const ts: Record<string, Trade[]> = {};
    for (const p of PAIRS) {
      cs[p.id] = genCandles(p, 120, TIMEFRAMES[3].ms, p.price);
      bs[p.id] = genBook(p.price);
      ts[p.id] = genTrades(p.price);
    }
    setCandles(cs); setBooks(bs); setTrades(ts);
  }, []);

  // live market tick
  useEffect(() => {
    const iv = setInterval(() => {
      setPairs(prev => {
        const next = prev.map(p => ({ ...p, price: nextPrice(p, p.price) }));
        seqRef.current += 1;
        const q: Record<string, { seq: number; dir: 1 | -1 | 0 }> = {};
        for (let i = 0; i < next.length; i++) {
          q[next[i].id] = { seq: seqRef.current, dir: next[i].price > prev[i].price ? 1 : next[i].price < prev[i].price ? -1 : 0 };
        }
        setPairQuotes(q);
        const seedId = seedPairRef.current;
        setTrades((t) => {
          const list = t[seedId] ?? [];
          const np = next.find(x => x.id === seedId)!.price;
          const head = {
            id: Date.now(), price: np * (1 + (Math.random() - 0.5) * 0.0006),
            amount: Math.random() ** 2 * 3 + 0.001,
            time: Date.now(), side: Math.random() > 0.48 ? 'buy' : 'sell',
          } as Trade;
          return { ...t, [seedId]: [head, ...list].slice(0, 30) };
        });
        setBooks((b) => {
          const np = next.find(x => x.id === seedId)!.price;
          return { ...b, [seedId]: genBook(np) };
        });
        return next;
      });
    }, 1400);
    return () => clearInterval(iv);
  }, []);

  const setSeedPair = useCallback((id: string) => { seedPairRef.current = id; }, []);

  const login = useCallback((name?: string) => {
    setLoggedIn(true);
    setNotifs(n => [{ id: `n${Date.now()}`, title: 'Welcome back', body: `Signed in${name ? ' as ' + name : ''} — markets are live.`, time: Date.now(), type: 'system', read: false }, ...n]);
    navigate('dashboard');
  }, [navigate]);

  const logout = useCallback(() => { setLoggedIn(false); navigate('home'); }, [navigate]);

  const deposit = useCallback((asset: string, amount: number) => {
    setBalances(b => ({ ...b, [asset]: { free: (b[asset]?.free ?? 0) + amount, locked: b[asset]?.locked ?? 0 } }));
    setTxs(t => [{ id: `tx${Date.now()}`, type: 'Deposit', asset, amount, usd: amount, time: Date.now(), status: 'Completed', detail: 'Credited instantly (demo)' }, ...t]);
  }, []);

  const placeOrder = useCallback((o: Omit<Order, 'id' | 'time' | 'status' | 'filled'>) => {
    const order: Order = { ...o, id: `ord-${Date.now() % 100000}`, time: Date.now(), status: o.type === 'Market' ? 'Filled' : 'Open', filled: o.type === 'Market' ? o.amount : 0 };
    setOpenOrders(prev => order.status === 'Open' ? [order, ...prev] : prev);
    setOrderHistory(prev => [order, ...prev]);
    if (order.status === 'Filled') {
      // market order: update balances immediately
      const { base, quote } = { base: o.symbol.split('/')[0], quote: o.symbol.split('/')[1] };
      setBalances(b => {
        const nb = { ...b };
        if (o.side === 'Buy') {
          const q = nb[quote] ?? { free: 0, locked: 0 };
          nb[quote] = { free: Math.max(0, q.free - o.total), locked: q.locked };
          const ba = nb[base] ?? { free: 0, locked: 0 };
          nb[base] = { free: ba.free + o.amount, locked: ba.locked };
        } else {
          const ba = nb[base] ?? { free: 0, locked: 0 };
          nb[base] = { free: Math.max(0, ba.free - o.amount), locked: ba.locked };
          const q = nb[quote] ?? { free: 0, locked: 0 };
          nb[quote] = { free: q.free + o.total, locked: q.locked };
        }
        return nb;
      });
      setTxs(t => [{ id: `tx${Date.now()}`, type: 'Trade', asset: base, amount: o.amount, usd: o.total, time: Date.now(), status: 'Completed', detail: `${o.side} ${o.symbol} @ ${o.type}` }, ...t]);
    }
  }, []);

  const cancelOrder = useCallback((id: string) => {
    setOpenOrders(prev => prev.filter(o => o.id !== id));
    setOrderHistory(prev => prev.map(o => o.id === id ? { ...o, status: 'Cancelled' as const } : o));
  }, []);

  const openPosition = useCallback((p: Omit<Position, 'id' | 'time' | 'pnl'>) => {
    setPositions(prev => [{ ...p, id: `pos-${Date.now() % 100000}`, time: Date.now(), pnl: 0 }, ...prev]);
  }, []);

  const closePosition = useCallback((id: string) => {
    setPositions(prev => {
      const pos = prev.find(x => x.id === id);
      if (pos) {
        setBalances(b => ({ ...b, USDT: { free: (b.USDT?.free ?? 0) + pos.margin + pos.pnl, locked: b.USDT?.locked ?? 0 } }));
        setTxs(t => [{ id: `tx${Date.now()}`, type: 'Trade', asset: 'USDT', amount: pos.margin + pos.pnl, usd: pos.margin + pos.pnl, time: Date.now(), status: 'Completed', detail: `Closed ${pos.side} ${pos.symbol} ${pos.leverage}x` }, ...t]);
      }
      return prev.filter(x => x.id !== id);
    });
  }, []);

  const toggleWatch = useCallback((id: string) => {
    setWatchlist(w => { const n = new Set(w); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const addStake = useCallback((poolId: string, asset: string, amount: number, apy: number, type: string) => {
    setStakes(s => [...s, { id: `st${Date.now()}`, poolId, asset, amount, apy, since: Date.now(), type }]);
    setBalances(b => ({ ...b, USDT: { free: Math.max(0, (b.USDT?.free ?? 0) - (asset === 'USDT' ? amount : 0)), locked: b.USDT?.locked ?? 0 } }));
    setTxs(t => [{ id: `tx${Date.now()}`, type: 'Staking', asset, amount, usd: amount, time: Date.now(), status: 'Completed', detail: `Staked to ${type} pool` }, ...t]);
  }, []);

  const toggleCopy = useCallback((traderId: string, amount: number) => {
    setCopies(c => {
      const n = { ...c };
      if (n[traderId]) delete n[traderId]; else n[traderId] = amount;
      return n;
    });
  }, []);

  const markAllRead = useCallback(() => setNotifs(n => n.map(x => ({ ...x, read: true }))), []);

  const [user] = useState<AuthUser>({
    name: 'Muhammad Uzair', email: 'uzair@blockexchange.io', tier: 'VIP 3', verified: true,
    joinedAt: Date.now() - 86400e3 * 212, twoFA: true, kyc: 'verified',
  });

  const value = useMemo<ExchangeState>(() => ({
    route, navigate, loggedIn, login, logout, user,
    pairs, pairMap: Object.fromEntries(pairs.map(p => [p.id, p])),
    pairQuotes, candles, books, trades, setSeedPair,
    balances, deposit, placeOrder, cancelOrder, openOrders, orderHistory,
    positions, openPosition, closePosition, txs,
    watchlist, toggleWatch, stakes, addStake, copies, toggleCopy,
    notifs, markAllRead, stats, toast, authView, setAuthView,
  }), [route, loggedIn, user, pairs, pairQuotes, candles, books, trades, balances, openOrders, orderHistory, positions, txs, watchlist, stakes, copies, notifs, navigate, login, logout, deposit, placeOrder, cancelOrder, openPosition, closePosition, toggleWatch, addStake, toggleCopy, markAllRead, stats, authView]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExchange(): ExchangeState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useExchange outside provider');
  return ctx;
}

export { change24h };
