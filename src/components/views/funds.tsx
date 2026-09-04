'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, fmtUsd, useSession, timeAgo } from '@/lib/session';
import { navigate } from '@/components/shell';
import { Donut, AreaChart } from '@/components/charts';
import { ArrowDownToLine, ArrowUpFromLine, Wallet2, Loader2, Lock, Copy, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

/* ------------------------------ Assets ------------------------------ */

export function AssetsView() {
  const { user, wallet, loading } = useSession();
  const [openTrades, setOpenTrades] = useState(0);
  const [staked, setStaked] = useState(0);

  useEffect(() => {
    if (!user) return;
    api<{ summary: { open: number } }>('/api/trades').then(d => setOpenTrades(d.summary.open)).catch(() => {});
    api<{ openTrades: { count: number; staked: number } }>('/api/wallet').then(d => setStaked(d.openTrades.staked)).catch(() => {});
  }, [user]);

  if (!loading && !user) {
    return <Gate title="Assets overview" cta="Sign in" note="Your balances, frozen funds and allocations live here." />;
  }

  const balance = wallet?.balance ?? 0;
  const frozen = wallet?.frozen ?? 0;
  const segments = [
    { label: 'Available', value: Math.max(0.001, balance - frozen), color: '#00A3FF' },
    { label: 'Frozen / reserved', value: Math.max(0.0001, frozen), color: '#FFB800' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Assets</h1>
          <p className="text-[12.5px] text-slate-400 mt-0.5">USDT trading account · {user?.walletLocked ? <span className="text-[#FF4D4D]">wallet locked</span> : 'operational'}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('deposit')} className="bg-[#00FF88] text-[#04140b] font-semibold hover:brightness-110"><ArrowDownToLine size={15} className="mr-1.5" /> Deposit</Button>
          <Button onClick={() => navigate('withdraw')} variant="outline" className="border-white/15 text-white hover:bg-white/[0.06]"><ArrowUpFromLine size={15} className="mr-1.5" /> Withdraw</Button>
        </div>
      </div>

      <div className="mt-5 grid md:grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-5 md:col-span-2">
          <div className="text-[11.5px] text-slate-400">Total portfolio value</div>
          <div className="mt-1 font-display text-4xl font-bold text-white tabular-nums">${fmtUsd(balance + frozen)}</div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-white/[0.03] p-3">
              <div className="text-[10.5px] text-slate-500">Available</div>
              <div className="mt-0.5 text-[15px] font-semibold text-[#00A3FF] tabular-nums">${fmtUsd(balance)}</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
              <div className="text-[10.5px] text-slate-500">Frozen / reserved</div>
              <div className="mt-0.5 text-[15px] font-semibold text-[#FFB800] tabular-nums">${fmtUsd(frozen)}</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
              <div className="text-[10.5px] text-slate-500">In open trades</div>
              <div className="mt-0.5 text-[15px] font-semibold text-white tabular-nums">${fmtUsd(staked)}</div>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-5 flex items-center justify-center">
          <Donut segments={segments} size={150} thickness={20} center={<div className="text-center"><div className="text-[10px] text-slate-500">Allocation</div><div className="text-[12px] font-bold text-white">USDT</div></div>} />
        </div>
      </div>

      <div className="mt-3 glass rounded-2xl p-5">
        <div className="text-[13px] font-semibold text-white flex items-center gap-2"><Wallet2 size={14} className="text-[#00A3FF]" /> Holdings</div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00A3FF]/12 grid place-items-center text-[11px] font-bold text-[#00A3FF]">₮</div>
            <div>
              <div className="text-[13.5px] font-semibold text-white">Tether USDT</div>
              <div className="text-[11px] text-slate-500">Tron · TRC-20 / ERC-20</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[14px] font-semibold text-white tabular-nums">{fmtUsd(balance + frozen)} USDT</div>
            <div className="text-[11px] text-slate-500">≈ ${fmtUsd(balance + frozen)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Gate({ title, cta, note }: { title: string; cta: string; note: string }) {
  return (
    <div className="max-w-md mx-auto p-10 text-center animate-in">
      <Lock size={30} className="mx-auto text-slate-600" />
      <h1 className="mt-3 font-display text-xl font-bold text-white">{title} is members-only</h1>
      <p className="mt-2 text-[13px] text-slate-400">{note}</p>
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={() => navigate('login')} className="bg-[#00A3FF] text-[#04101F] font-semibold">{cta}</Button>
        <Button variant="outline" onClick={() => navigate('signup')} className="border-white/15 text-white">Open Account</Button>
      </div>
    </div>
  );
}

/* ------------------------------ Deposit ------------------------------ */

const DEP_METHODS: [string, string, string][] = [
  ['USDT TRC-20', 'Tron TRC-20', 'TQn9Y2khDD95J42FQtQTdwVVRZq5Hq8f2a'],
  ['USDT ERC-20', 'Ethereum ERC-20', '0x77b1a4Cc9E1f3F8bB0e5Cd29Ac41e6D3f9D02ab1'],
  ['Bitcoin BTC', 'Bitcoin network', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'],
  ['Bank Transfer', 'Manual wire — 1-2h', 'HSBC 741-009-2231 · BLOCKEXCHANGE LTD'],
  ['Card Payment', 'Visa / Mastercard', 'Instant via checkout link'],
];

export function DepositView() {
  const { user, refresh } = useSession();
  const [method, setMethod] = useState(DEP_METHODS[0][0]);
  const [amount, setAmount] = useState('100');
  const [busy, setBusy] = useState(false);
  const [deposits, setDeposits] = useState<{ id: string; method: string; amount: number; status: string; createdAt: string; reference?: string }[]>([]);

  const load = useCallback(() => {
    if (!user) return;
    api<{ deposits: typeof deposits }>('/api/deposits').then(d => setDeposits(d.deposits)).catch(() => {});
  }, [user]);
  useEffect(() => { load(); const iv = setInterval(load, 6000); return () => clearInterval(iv); }, [load]);

  if (!user) return <Gate title="Deposits" cta="Sign in" note="Fund your wallet with crypto, bank transfer or card." />;

  const submit = async () => {
    setBusy(true);
    try {
      await api('/api/deposits', { method: 'POST', body: JSON.stringify({ method, amount: parseFloat(amount) }) });
      toast.success('Deposit submitted', { description: `${method} · $${fmtUsd(parseFloat(amount))} — pending review` });
      setAmount(''); load(); refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const active = DEP_METHODS.find(m => m[0] === method)!;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-in">
      <h1 className="font-display text-2xl font-bold text-white">Deposit funds</h1>
      <p className="text-[12.5px] text-slate-400 mt-0.5">Choose a payment method, send funds, submit the amount — an operator reviews it shortly.</p>
      <div className="mt-5 grid lg:grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-5">
          <div className="text-[13px] font-semibold text-white">1 · Payment method</div>
          <div className="mt-3 space-y-1.5">
            {DEP_METHODS.map(([m, desc]) => (
              <button key={m} onClick={() => setMethod(m)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${method === m ? 'bg-[#00A3FF]/12 shadow-[inset_0_0_0_1px_rgba(0,163,255,0.35)]' : 'bg-white/[0.03] hover:bg-white/[0.05]'}`}>
                <div>
                  <div className="text-[13px] font-semibold text-white">{m}</div>
                  <div className="text-[11px] text-slate-500">{desc}</div>
                </div>
                {method === m && <div className="w-2 h-2 rounded-full bg-[#00A3FF]" />}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="glass rounded-2xl p-5">
            <div className="text-[13px] font-semibold text-white">2 · Destination</div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
              <code className="text-[11.5px] text-slate-300 truncate pr-2">{active[2]}</code>
              <button onClick={() => { navigator.clipboard?.writeText(active[2]).catch(() => {}); toast.success('Address copied'); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><Copy size={14} /></button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Send only <span className="text-slate-300">{active[0]}</span> to this address — other assets will be lost.</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-[13px] font-semibold text-white">3 · Amount deposited</div>
            <div className="mt-3">
              <Label className="text-[11.5px] text-slate-400">Amount (USDT)</Label>
              <Input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="mt-1.5 h-11 bg-white/[0.04] border-white/10 font-semibold text-white" inputMode="decimal" placeholder="0.00" />
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[50, 100, 500, 1000].map(v => <button key={v} onClick={() => setAmount(String(v))} className={`h-8 rounded-lg text-[12px] ${parseFloat(amount) === v ? 'bg-[#00A3FF]/20 text-[#00A3FF]' : 'bg-white/[0.04] text-slate-400 hover:text-white'}`}>${v}</button>)}
              </div>
              <Button onClick={submit} disabled={busy || !(parseFloat(amount) >= 10)} className="mt-4 w-full h-11 bg-[#00FF88] text-[#04140b] font-bold hover:brightness-110">
                {busy ? <Loader2 className="animate-spin" size={15} /> : `I have sent $${fmtUsd(parseFloat(amount) || 0)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 glass rounded-2xl p-5">
        <div className="text-[13px] font-semibold text-white">Deposit history</div>
        <div className="mt-2 space-y-1">
          {deposits.length === 0 && <div className="text-[12px] text-slate-500 py-4 text-center">No deposits yet.</div>}
          {deposits.map(d => (
            <div key={d.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] text-[12.5px]">
              <div>
                <span className="text-white font-medium">${fmtUsd(d.amount)}</span>
                <span className="text-slate-500"> · {d.method} · {timeAgo(d.createdAt)}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold ${d.status === 'APPROVED' ? 'bg-[#00FF88]/12 text-[#00FF88]' : d.status === 'REJECTED' ? 'bg-[#FF4D4D]/12 text-[#FF4D4D]' : 'bg-[#FFB800]/12 text-[#FFB800]'}`}>{d.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Withdraw ------------------------------ */

const WD_METHODS = ['USDT TRC-20', 'USDT ERC-20', 'Bitcoin BTC', 'Bank Transfer'];

export function WithdrawView() {
  const { user, refresh } = useSession();
  const [method, setMethod] = useState(WD_METHODS[0]);
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [max, setMax] = useState(0);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<{ id: string; method: string; amount: number; address: string; status: string; createdAt: string }[]>([]);

  const load = useCallback(() => {
    if (!user) return;
    api<{ withdrawals: typeof rows; available: number }>('/api/withdrawals').then(d => { setRows(d.withdrawals); setMax(d.available); }).catch(() => {});
  }, [user]);
  useEffect(() => { load(); const iv = setInterval(load, 6000); return () => clearInterval(iv); }, [load]);

  if (!user) return <Gate title="Withdrawals" cta="Sign in" note="Send your available funds to an external wallet." />;

  const submit = async () => {
    setBusy(true);
    try {
      await api('/api/withdrawals', { method: 'POST', body: JSON.stringify({ method, address, amount: parseFloat(amount) }) });
      toast.success('Withdrawal requested', { description: 'Funds are reserved pending operator review.' });
      setAddress(''); setAmount(''); load(); refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-in">
      <h1 className="font-display text-2xl font-bold text-white">Withdraw funds</h1>
      <p className="text-[12.5px] text-slate-400 mt-0.5">Requested amounts are reserved from your balance until an operator approves them.</p>
      <div className="mt-5 grid lg:grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-semibold text-white">Withdrawal request</div>
            <div className="text-[11.5px] text-slate-400">Available: <span className="text-[#00A3FF] font-semibold">${fmtUsd(max)}</span></div>
          </div>
          <div className="mt-3">
            <Label className="text-[11.5px] text-slate-400">Method</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {WD_METHODS.map(m => (
                <button key={m} onClick={() => setMethod(m)} className={`h-10 rounded-xl text-[12px] font-medium ${method === m ? 'bg-[#00A3FF]/15 text-[#00A3FF] shadow-[inset_0_0_0_1px_rgba(0,163,255,0.35)]' : 'bg-white/[0.03] text-slate-400 hover:text-white'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-[11.5px] text-slate-400">Wallet address / account</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} className="mt-1.5 h-10 bg-white/[0.04] border-white/10 text-white text-[13px]" placeholder="Destination address" />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <Label className="text-[11.5px] text-slate-400">Amount (USDT)</Label>
              <button onClick={() => setAmount(max.toFixed(2))} className="text-[11px] text-[#FFB800] hover:underline">MAX</button>
            </div>
            <Input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="mt-1.5 h-11 bg-white/[0.04] border-white/10 font-semibold text-white" inputMode="decimal" placeholder="0.00" />
          </div>
          <Button onClick={submit} disabled={busy || !(parseFloat(amount) >= 20) || address.trim().length < 8} className="mt-4 w-full h-11 bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-bold hover:brightness-110">
            {busy ? <Loader2 className="animate-spin" size={15} /> : `Request withdrawal $${fmtUsd(parseFloat(amount) || 0)}`}
          </Button>
          <p className="mt-2 text-[10.5px] text-slate-500">Minimum $20 · processed after security review · double-check the address.</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-[13px] font-semibold text-white">Withdrawal history</div>
          <div className="mt-2 space-y-1">
            {rows.length === 0 && <div className="text-[12px] text-slate-500 py-4 text-center">No withdrawals yet.</div>}
            {rows.map(w => (
              <div key={w.id} className="px-4 py-2.5 rounded-xl bg-white/[0.03]">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-white font-medium">${fmtUsd(w.amount)}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold ${w.status === 'APPROVED' ? 'bg-[#00FF88]/12 text-[#00FF88]' : w.status === 'REJECTED' ? 'bg-[#FF4D4D]/12 text-[#FF4D4D]' : w.status === 'ON_HOLD' ? 'bg-white/10 text-slate-300' : 'bg-[#FFB800]/12 text-[#FFB800]'}`}>{w.status.replace('_', ' ')}</span>
                </div>
                <div className="mt-0.5 text-[10.5px] text-slate-500 truncate">{w.method} → {w.address} · {timeAgo(w.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Wallet ------------------------------ */

interface Tx { id: string; type: string; amount: number; status: string; detail?: string; createdAt: string }
const TX_FILTERS = ['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRADE_STAKE', 'TRADE_PAYOUT', 'ADMIN_CREDIT', 'ADMIN_DEBIT'];

export function WalletView() {
  const { user } = useSession();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [wallet, setWallet] = useState<{ balance: number; frozen: number } | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    api<{ transactions: Tx[] }>(`/api/transactions${filter === 'ALL' ? '' : `?type=${filter}`}`).then(d => setTxs(d.transactions)).catch(() => {});
    api<{ balance: number; frozen: number }>('/api/wallet').then(d => setWallet(d)).catch(() => {});
  }, [user, filter]);
  useEffect(() => { load(); const iv = setInterval(load, 8000); return () => clearInterval(iv); }, [load]);

  if (!user) return <Gate title="Wallet" cta="Sign in" note="Real-time balance, frozen funds and the full transaction ledger." />;

  const icon = (t: string) => t === 'DEPOSIT' ? <ArrowDownToLine size={14} className="text-[#00FF88]" /> :
    t === 'WITHDRAWAL' ? <ArrowUpFromLine size={14} className="text-[#FF4D4D]" /> :
      t === 'TRADE_PAYOUT' ? <TrendingUp size={14} className="text-[#00FF88]" /> :
        <TrendingDown size={14} className="text-[#FFB800]" />;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Wallet</h1>
          <p className="text-[12.5px] text-slate-400 mt-0.5">Real-time balance & ledger</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('deposit')} className="bg-[#00FF88] text-[#04140b] font-semibold"><ArrowDownToLine size={14} className="mr-1" /> Deposit</Button>
          <Button size="sm" variant="outline" onClick={() => navigate('withdraw')} className="border-white/15 text-white"><ArrowUpFromLine size={14} className="mr-1" /> Withdraw</Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4"><div className="text-[11px] text-slate-400">Balance</div><div className="mt-1 font-display text-xl md:text-2xl font-bold text-white tabular-nums">${fmtUsd(wallet?.balance ?? 0)}</div></div>
        <div className="glass rounded-2xl p-4"><div className="text-[11px] text-slate-400">Frozen / reserved</div><div className="mt-1 font-display text-xl md:text-2xl font-bold text-[#FFB800] tabular-nums">${fmtUsd(wallet?.frozen ?? 0)}</div></div>
        <div className="glass rounded-2xl p-4"><div className="text-[11px] text-slate-400">Available</div><div className="mt-1 font-display text-xl md:text-2xl font-bold text-[#00A3FF] tabular-nums">${fmtUsd(Math.max(0, (wallet?.balance ?? 0) - (wallet?.frozen ?? 0)))}</div></div>
      </div>
      <div className="mt-3 glass rounded-2xl p-4">
        <div className="flex flex-wrap gap-1.5">
          {TX_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-lg text-[11px] ${filter === f ? 'bg-[#00A3FF]/15 text-[#00A3FF]' : 'bg-white/[0.04] text-slate-400 hover:text-white'}`}>{f.replace('_', ' ')}</button>
          ))}
        </div>
        <div className="mt-3 space-y-1 max-h-[420px] overflow-y-auto thin-scrollbar">
          {txs.length === 0 && <div className="text-[12px] text-slate-500 py-6 text-center">No transactions in this filter.</div>}
          {txs.map(t => (
            <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03]">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] grid place-items-center">{icon(t.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-white">{t.type.replace(/_/g, ' ')}</div>
                <div className="text-[10.5px] text-slate-500 truncate">{t.detail ?? ''} · {timeAgo(t.createdAt)}</div>
              </div>
              <div className={`text-[13px] font-semibold tabular-nums ${t.amount >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}`}>{t.amount >= 0 ? '+' : ''}{fmtUsd(t.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ History ------------------------------ */

interface HistTrade {
  id: string; symbol: string; direction: 'UP' | 'DOWN'; amount: number; duration: number;
  entryPrice: number; exitPrice: number | null; result: string; profit: number;
  openedAt: string; settledAt?: string | null;
}

export function HistoryView() {
  const { user } = useSession();
  const [trades, setTrades] = useState<HistTrade[]>([]);
  const [summary, setSummary] = useState<{ wins: number; losses: number; profit: number; winRate: number } | null>(null);
  const [chart, setChart] = useState<number[]>([]);

  const load = useCallback(() => {
    if (!user) return;
    api<{ trades: HistTrade[]; summary: { wins: number; losses: number; profit: number; winRate: number } }>('/api/trades')
      .then(d => {
        setTrades(d.trades);
        setSummary(d.summary);
        const closed = d.trades.filter(t => t.result !== 'PENDING').slice(0, 20).reverse();
        let cum = 0;
        setChart(closed.map(t => { cum += t.result === 'WON' ? t.profit : t.result === 'LOST' ? -t.amount : 0; return cum; }));
      }).catch(() => {});
  }, [user]);
  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [load]);

  if (!user) return <Gate title="Trading history" cta="Sign in" note="Every trade with direction, duration, stake, result and profit." />;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-in">
      <h1 className="font-display text-2xl font-bold text-white">Trading history</h1>
      <p className="text-[12.5px] text-slate-400 mt-0.5">Symbol · direction · duration · stake · result · profit</p>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-2xl p-4"><div className="text-[11px] text-slate-400">Wins</div><div className="mt-1 font-display text-2xl font-bold text-[#00FF88]">{summary?.wins ?? '—'}</div></div>
        <div className="glass rounded-2xl p-4"><div className="text-[11px] text-slate-400">Losses</div><div className="mt-1 font-display text-2xl font-bold text-[#FF4D4D]">{summary?.losses ?? '—'}</div></div>
        <div className="glass rounded-2xl p-4"><div className="text-[11px] text-slate-400">Win rate</div><div className="mt-1 font-display text-2xl font-bold text-white">{summary ? `${summary.winRate.toFixed(0)}%` : '—'}</div></div>
        <div className="glass rounded-2xl p-4"><div className="text-[11px] text-slate-400">Net profit</div><div className={`mt-1 font-display text-2xl font-bold tabular-nums ${(summary?.profit ?? 0) >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}`}>{summary ? `${summary.profit >= 0 ? '+' : ''}$${fmtUsd(summary.profit)}` : '—'}</div></div>
      </div>
      {chart.length > 2 && (
        <div className="mt-3 glass rounded-2xl p-4">
          <div className="text-[12px] text-slate-400 mb-2">Cumulative P&L (last {chart.length} settled trades)</div>
          <AreaChart data={chart.map((v, i) => ({ x: i, y: v }))} color={chart[chart.length - 1] >= 0 ? '#00FF88' : '#FF4D4D'} height={140} />
        </div>
      )}
      <div className="mt-3 glass rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.2fr_0.7fr_0.6fr_0.8fr_1fr_0.8fr_0.8fr] gap-2 px-4 py-2.5 hairline-b text-[10.5px] uppercase tracking-wider text-slate-500">
          <span>Symbol / time</span><span>Direction</span><span className="text-right">Duration</span><span className="text-right">Stake</span><span className="text-right">Entry → Exit</span><span className="text-right">Result</span><span className="text-right">Profit</span>
        </div>
        {trades.length === 0 && <div className="px-4 py-10 text-center text-slate-500 text-[13px]">No trades yet — open your first position in <button onClick={() => navigate('trade')} className="text-[#00A3FF] hover:underline">Trade</button>.</div>}
        {trades.map(t => (
          <div key={t.id} className="grid grid-cols-2 md:grid-cols-[1.2fr_0.7fr_0.6fr_0.8fr_1fr_0.8fr_0.8fr] gap-2 px-4 py-3 hairline-b last:border-0 items-center text-[12px]">
            <div>
              <div className="font-semibold text-white">{t.symbol}</div>
              <div className="text-[10.5px] text-slate-500">{timeAgo(t.openedAt)}</div>
            </div>
            <div><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.direction === 'UP' ? 'bg-[#00FF88]/12 text-[#00FF88]' : 'bg-[#FF4D4D]/12 text-[#FF4D4D]'}`}>{t.direction === 'UP' ? 'UP' : 'DOWN'}</span></div>
            <div className="text-right text-slate-300">{t.duration}s</div>
            <div className="text-right text-white font-semibold tabular-nums">${fmtUsd(t.amount)}</div>
            <div className="text-right text-slate-400 tabular-nums text-[11px]">{fmtPrice(t.entryPrice)} → {t.exitPrice ? fmtPrice(t.exitPrice) : '…'}</div>
            <div className="text-right"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${t.result === 'WON' ? 'bg-[#00FF88]/12 text-[#00FF88]' : t.result === 'LOST' ? 'bg-[#FF4D4D]/12 text-[#FF4D4D]' : t.result === 'REFUND' ? 'bg-white/10 text-slate-300' : 'bg-[#FFB800]/12 text-[#FFB800]'}`}>{t.result}</span></div>
            <div className={`text-right font-semibold tabular-nums ${t.result === 'WON' ? 'text-[#00FF88]' : t.result === 'LOST' ? 'text-[#FF4D4D]' : 'text-slate-400'}`}>
              {t.result === 'WON' ? `+${fmtUsd(t.profit)}` : t.result === 'LOST' ? `-${fmtUsd(t.amount)}` : t.result === 'REFUND' ? '±0' : '…'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
