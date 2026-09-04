'use client';

import React, { useState } from 'react';
import { Coins, Rocket, Flame, Clock3, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import { useExchange } from '@/lib/store';
import { STAKING_POOLS, LAUNCHPAD, fmtUsd, fmtNum } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { GlassCard, StatCard, Tag, CoinIcon } from '@/components/shared';

/* ------------------------------ Staking view ----------------------------- */
export function StakingView() {
  const { stakes, addStake, balances } = useExchange();
  const [pool, setPool] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const selected = STAKING_POOLS.find(p => p.id === pool);
  const totalStakedUsd = stakes.reduce((s, st) => s + (st.asset === 'USDT' ? st.amount : st.amount * (st.asset === 'ETH' ? 3598 : st.asset === 'BTC' ? 67284 : 1)), 0);
  const annualYield = stakes.reduce((s, st) => s + st.amount * (st.apy / 100) * (st.asset === 'USDT' ? 1 : st.asset === 'ETH' ? 3598 : st.asset === 'BTC' ? 67284 : 1), 0);

  const stake = () => {
    const amt = parseFloat(amount);
    if (!selected || !amt || amt <= 0) { toast.error('Invalid amount'); return; }
    addStake(selected.id, selected.asset, amt, selected.apy, selected.type);
    toast.success('Stake confirmed', `${amt} ${selected.asset} → ${selected.type} pool @ ${selected.apy}% APY`);
    setPool(null); setAmount('');
  };

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Staking & Earn</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Institutional yield vaults with daily reward settlement</p>
        </div>
        <Tag color="gold"><Flame size={10} /> VIP members earn +1.2% boosted APY</Tag>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard label="Total Staked" value={fmtUsd(totalStakedUsd)} icon={<Coins size={15} />} accent="blue" sub={`${stakes.length} active positions`} />
        <StatCard label="Est. Annual Yield" value={fmtUsd(annualYield)} icon={<TrendingUp size={15} />} accent="green" sub="paid daily in-kind" />
        <StatCard label="Best APY" value="18.4%" icon={<Flame size={15} />} accent="gold" sub="SOL locked 120d" />
        <StatCard label="Platform Staked" value="$182.9M" icon={<Users size={15} />} accent="violet" sub="across all pools" />
      </div>

      {stakes.length > 0 && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b hairline"><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">My Staking Positions</p></div>
          <div className="overflow-x-auto">
            <table className="bx-table">
              <thead><tr><th>Asset</th><th>Pool</th><th>Amount</th><th>APY</th><th>Est. Daily</th><th>Since</th><th>Status</th></tr></thead>
              <tbody>
                {stakes.map(st => {
                  const price = st.asset === 'USDT' ? 1 : st.asset === 'ETH' ? 3598 : st.asset === 'BTC' ? 67284 : 1;
                  return (
                    <tr key={st.id}>
                      <td><div className="flex items-center gap-2"><CoinIcon symbol={st.asset} color={st.asset === 'USDT' ? '#26A17B' : st.asset === 'ETH' ? '#627EEA' : '#F7931A'} size={24} /><span className="font-semibold text-[12px]">{st.asset}</span></div></td>
                      <td><Tag color="gold">{st.type}</Tag></td>
                      <td className="tabular">{st.amount} {st.asset}</td>
                      <td className="tabular text-[#00FF88] font-semibold">{st.apy}%</td>
                      <td className="tabular">{(st.amount * price * st.apy / 100 / 365).toFixed(4)} {st.asset}</td>
                      <td className="text-slate-400 text-[11px]">{new Date(st.since).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                      <td><Tag color="green"><CheckCircle2 size={9} /> Earning</Tag></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {STAKING_POOLS.map(p => (
          <GlassCard key={p.id} hover className="relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-28 h-28 blur-3xl rounded-full opacity-20" style={{ background: p.color }} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CoinIcon symbol={p.asset} color={p.color} size={38} />
                <div>
                  <p className="text-[13.5px] font-semibold">{p.asset}</p>
                  <p className="text-[10.5px] text-muted-foreground">{p.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[#00FF88] tabular">{p.apy}%</p>
                <p className="text-[9.5px] text-muted-foreground uppercase tracking-wider">APY</p>
              </div>
            </div>
            <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-[#0B1A30]/60 border hairline px-2.5 py-1.5">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Term</p>
                <p className="font-medium mt-0.5">{p.type}</p>
              </div>
              <div className="rounded-lg bg-[#0B1A30]/60 border hairline px-2.5 py-1.5">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Min stake</p>
                <p className="font-medium tabular mt-0.5">{p.min} {p.asset}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-muted-foreground">
              <span>Pool TVL <span className="text-slate-300 tabular">{fmtUsd(p.totalStaked)}</span></span>
            </div>
            <Button onClick={() => { setPool(p.id); setAmount(String(p.min * (p.min < 1 ? 10 : 100))); }}
              className="w-full mt-3 h-9 text-[12px] font-bold bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] border-0 shadow-[0_0_16px_rgba(0,163,255,0.25)]">
              Stake {p.asset}
            </Button>
          </GlassCard>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={o => !o && setPool(null)}>
        <DialogContent className="glass max-w-sm border-[#00A3FF]/30">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[15px]">Stake {selected.asset}</DialogTitle>
                <DialogDescription className="text-[11.5px]">{selected.type} · {selected.apy}% APY · rewards settle daily</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5">
                  <div className="flex justify-between text-[10.5px] text-muted-foreground mb-1">
                    <span>Amount</span>
                    <span>Available: {selected.asset === 'USDT' ? fmtNum(balances.USDT?.free ?? 0) : '—'} {selected.asset}</span>
                  </div>
                  <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal"
                    className="w-full bg-transparent outline-none text-[15px] tabular" placeholder={`Min ${selected.min}`} />
                </div>
                <div className="rounded-lg border hairline bg-[#0B1A30]/60 p-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Est. daily reward</span><span className="tabular text-[#00FF88]">{((parseFloat(amount) || 0) * selected.apy / 100 / 365).toFixed(6)} {selected.asset}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Redemption</span><span>{selected.type === 'Flexible' ? 'Instant' : selected.type.replace('Locked ', 'After ')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Early redemption fee</span><span>{selected.type === 'Flexible' ? 'None' : '1.5%'}</span></div>
                </div>
                <Button onClick={stake} className="w-full h-10 bg-gradient-to-r from-[#FFD35C] to-[#FFB800] text-[#181200] font-bold border-0">
                  Confirm Stake
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------------------- Launchpad view ---------------------------- */
export function LaunchpadView() {
  const [tab, setTab] = useState<'all' | 'live' | 'upcoming' | 'ended'>('all');
  const list = LAUNCHPAD.filter(p => tab === 'all' || p.status === tab);
  const [commit, setCommit] = useState<LaunchProjectLike | null>(null);
  const [amount, setAmount] = useState('100');

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Launchpad</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Curated token sales with guaranteed pro-rata allocations</p>
        </div>
        <Tag color="blue">Stake BNB to raise your allocation tier</Tag>
      </div>

      <div className="flex items-center gap-2">
        {(['all', 'live', 'upcoming', 'ended'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('rounded-lg px-3.5 py-2 text-[12px] font-medium border capitalize transition-colors',
              tab === t ? 'bg-[#00A3FF]/15 text-[#33B5FF] border-[#00A3FF]/40' : 'text-slate-400 hairline hover:text-white')}>
            {t === 'live' ? 'Sale Live' : t}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {list.map(p => {
          const pct = p.raise > 0 ? (p.raised / p.raise) * 100 : 100;
          return (
            <GlassCard key={p.id} hover className="relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20" style={{ background: p.color }} />
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-bold shrink-0"
                  style={{ background: `${p.color}1c`, color: p.color, border: `1px solid ${p.color}50`, boxShadow: `0 0 18px ${p.color}30` }}>
                  {p.ticker.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold font-[family-name:var(--font-display)]">{p.name}</p>
                    <Tag color={p.status === 'live' ? 'green' : p.status === 'upcoming' ? 'gold' : 'gray'}>
                      {p.status === 'live' ? <><span className="live-dot w-1 h-1 rounded-full bg-[#00FF88]" /> LIVE</> : p.status === 'upcoming' ? <><Clock3 size={9} /> {p.startsIn}</> : 'ENDED'}
                    </Tag>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground">{p.ticker} · {p.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sale price</p>
                  <p className="text-[13px] font-semibold tabular">${p.price}</p>
                </div>
              </div>
              <p className="mt-3 text-[12px] text-slate-300/85 leading-relaxed">{p.tagline}</p>
              <div className="mt-3.5">
                <div className="flex justify-between text-[10.5px] mb-1.5">
                  <span className="text-muted-foreground">Raised <span className="text-slate-200 tabular">{fmtUsd(p.raised)}</span> / {fmtUsd(p.raise)}</span>
                  <span className={cn('tabular font-semibold', pct >= 100 ? 'text-[#00FF88]' : 'text-[#33B5FF]')}>{pct.toFixed(0)}%</span>
                </div>
                <Progress value={pct} className="h-1.5 bg-[#0B1A30]" />
                <div className="flex justify-between mt-2 text-[10.5px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Users size={10} /> {fmtNum(p.participants)} participants</span>
                  <span>Listing {p.listing}</span>
                </div>
              </div>
              <Button
                onClick={() => p.status === 'live' ? setCommit(p) : toast(p.status === 'upcoming' ? 'Sale not started' : 'Sale ended', p.status === 'upcoming' ? `${p.name} opens in ${p.startsIn}.` : 'This sale has concluded.')}
                disabled={p.status !== 'live'}
                className={cn('w-full mt-3.5 h-9 text-[12px] font-bold border-0',
                  p.status === 'live' ? 'bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] shadow-[0_0_16px_rgba(0,163,255,0.25)]' : 'bg-[#0B1A30] text-muted-foreground')}>
                {p.status === 'live' ? 'Commit USDT' : p.status === 'upcoming' ? 'Set Reminder' : 'View Results'}
              </Button>
            </GlassCard>
          );
        })}
      </div>

      <Dialog open={!!commit} onOpenChange={o => !o && setCommit(null)}>
        <DialogContent className="glass max-w-sm border-[#00A3FF]/30">
          {commit && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[15px]">Commit to {commit.name}</DialogTitle>
                <DialogDescription className="text-[11.5px]">Pro-rata allocation · tokens vest 25% at TGE</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5">
                  <p className="text-[10.5px] text-muted-foreground mb-1">Commitment (USDT)</p>
                  <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal"
                    className="w-full bg-transparent outline-none text-[15px] tabular" />
                </div>
                <div className="rounded-lg border hairline bg-[#0B1A30]/60 p-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Est. tokens</span><span className="tabular">{((parseFloat(amount) || 0) / commit.price).toLocaleString('en-US', { maximumFractionDigits: 0 })} {commit.ticker}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Your tier</span><span className="text-[#FFD35C]">VIP 3 · 1.25× weight</span></div>
                </div>
                <Button onClick={() => { toast.success('Commitment placed', `$${amount} USDT committed to ${commit.name}`); setCommit(null); }}
                  className="w-full h-10 bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-bold border-0">
                  Confirm Commitment
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface LaunchProjectLike { name: string; ticker: string; price: number }
