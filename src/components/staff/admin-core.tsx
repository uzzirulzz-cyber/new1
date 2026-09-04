'use client';

import React, { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, fmtUsd, timeAgo } from '@/lib/session';
import { StaffShell } from '@/components/shell';
import { AreaChart } from '@/components/charts';
import { Loader2, X, TrendingUp, Users, Wallet2, ArrowLeftRight, Receipt, Search, MinusCircle, PlusCircle, Lock, Unlock, Snowflake, Flame, BellRing } from 'lucide-react';
import { toast } from 'sonner';

/* ---------------------------- shared widgets ---------------------------- */

export function StatCard({ label, value, sub, tone = 'default' }: { label: string; value: string | number; sub?: string; tone?: 'default' | 'up' | 'down' | 'gold' }) {
  const color = tone === 'up' ? 'text-[#00FF88]' : tone === 'down' ? 'text-[#FF4D4D]' : tone === 'gold' ? 'text-[#FFB800]' : 'text-white';
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10.5px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 font-display text-xl md:text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, width = 440 }: { title: string; onClose: () => void; children: ReactNode; width?: number }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-5 w-full bg-[#081221]" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[16px] font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminShell({ module, onModule, children }: { module: string; onModule: (m: string) => void; children: ReactNode }) {
  return <StaffShell view="admin" activeModule={module} onModule={onModule}>{children}</StaffShell>;
}

export function CenteredLoader() {
  return <div className="py-24 text-center text-slate-500 text-[13px]"><Loader2 className="animate-spin inline mr-2" size={16} /> Loading…</div>;
}

export function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`text-[10.5px] uppercase tracking-wider text-slate-500 font-medium px-3 py-2.5 text-left ${className}`}>{children}</th>;
}
export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 text-[12.5px] ${className}`}>{children}</td>;
}
export function StatusPill({ status }: { status: string }) {
  const s = status.replace('_', ' ');
  const cls = s === 'APPROVED' || s === 'COMPLETED' || s === 'ACTIVE' || s === 'WON' ? 'bg-[#00FF88]/12 text-[#00FF88]' :
    s === 'PENDING' || s === 'ON HOLD' || s === 'REFUND' ? 'bg-[#FFB800]/12 text-[#FFB800]' :
      s === 'REJECTED' || s === 'FROZEN' || s === 'LOST' || s === 'FAILED' ? 'bg-[#FF4D4D]/12 text-[#FF4D4D]' : 'bg-white/10 text-slate-300';
  return <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold ${cls}`}>{s}</span>;
}

/* ------------------------------ Dashboard ------------------------------ */

interface Stats {
  stats: {
    totalUsers: number; activeUsers: number; frozenUsers: number; adminCount: number; agentCount: number;
    totalTrades: number; activeTrades: number; revenue: number;
    totalDeposits: number; totalWithdrawals: number;
    todayDeposits: { count: number; total: number }; todayWithdrawals: { count: number; total: number };
    pendingDeposits: number; pendingWithdrawals: number;
  };
  revenueSeries: { day: string; value: number }[];
  coinVolume: { symbol: string; volume: number }[];
}

export function AdminDashboard({ onModule }: { onModule: (m: string) => void }) {
  const [data, setData] = useState<Stats | null>(null);
  React.useEffect(() => {
    const load = () => api<Stats>('/api/admin/stats').then(setData).catch(() => {});
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, []);
  if (!data) return <CenteredLoader />;
  const s = data.stats;
  return (
    <div className="animate-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Revenue / house profit" value={`$${fmtUsd(s.revenue)}`} tone="up" sub="settled trades, all time" />
        <StatCard label="Total users" value={s.totalUsers} sub={`${s.activeUsers} active · ${s.frozenUsers} frozen`} />
        <StatCard label="Total trades" value={s.totalTrades} sub={`${s.activeTrades} open now`} />
        <StatCard label="Pending reviews" value={s.pendingDeposits + s.pendingWithdrawals} tone={s.pendingDeposits + s.pendingWithdrawals > 0 ? 'gold' : 'default'} sub={`${s.pendingDeposits} deposits · ${s.pendingWithdrawals} withdrawals`} />
        <StatCard label="Total deposits" value={`$${fmtUsd(s.totalDeposits)}`} sub={`today +$${fmtUsd(s.todayDeposits.total)} (${s.todayDeposits.count})`} />
        <StatCard label="Total withdrawals" value={`$${fmtUsd(s.totalWithdrawals)}`} sub={`today +$${fmtUsd(s.todayWithdrawals.total)} (${s.todayWithdrawals.count})`} />
        <StatCard label="Staff" value={s.adminCount + s.agentCount} sub={`${s.agentCount} sub-agents`} />
        <StatCard label="Open trade exposure" value={s.activeTrades} tone="gold" sub="positions awaiting expiry" />
      </div>

      <div className="mt-3 grid lg:grid-cols-[1.4fr_1fr] gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="text-[13px] font-semibold text-white flex items-center gap-2"><TrendingUp size={14} className="text-[#00FF88]" /> Revenue · last 14 days</div>
          <div className="mt-3"><AreaChart data={data.revenueSeries.map((r, i) => ({ x: i, y: r.value }))} color="#00FF88" height={170} /></div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-[13px] font-semibold text-white flex items-center gap-2"><Receipt size={14} className="text-[#FFB800]" /> Coin trading volume · 14d</div>
          <div className="mt-3 space-y-1.5 max-h-[190px] overflow-y-auto thin-scrollbar">
            {data.coinVolume.map(c => (
              <div key={c.symbol} className="flex items-center gap-2 text-[12px]">
                <span className="w-24 text-slate-300 truncate">{c.symbol}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#00A3FF] to-[#0077d4]" style={{ width: `${Math.max(4, (c.volume / (data.coinVolume[0]?.volume || 1)) * 100)}%` }} />
                </div>
                <span className="w-24 text-right text-slate-400 tabular-nums">${fmtUsd(c.volume, 0)}</span>
              </div>
            ))}
            {data.coinVolume.length === 0 && <div className="text-[12px] text-slate-500 py-6 text-center">No settled trades in the window yet.</div>}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['users', 'User Management', Users], ['wallet', 'Wallet Controls', Wallet2],
          ['payments', 'Review Payments', Receipt], ['trades', 'Trade Management', ArrowLeftRight],
        ].map(([id, label, Icon]) => (
          <button key={id as string} onClick={() => onModule(id as string)} className="glass rounded-2xl p-4 text-left hover:border-[#FFB800]/30 transition-colors group">
            <Icon size={17} className="text-[#FFB800] group-hover:brightness-110" />
            <div className="mt-2 text-[13px] font-semibold text-white">{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- User Management --------------------------- */

interface AdminUser {
  id: string; uid: string; name: string; email: string; role: string; status: string;
  vipLevel: number; kycStatus: string; walletLocked: boolean;
  balance: number; frozen: number; trades: number; createdAt: string;
}

export function UsersModule({ onOpenUser }: { onOpenUser: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('ALL');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; frozen: number; admins: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionUser, setActionUser] = useState<AdminUser | null>(null);
  const [notifUser, setNotifUser] = useState<AdminUser | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    api<{ users: AdminUser[]; stats: { total: number; active: number; frozen: number; admins: number } }>(`/api/admin/users?q=${encodeURIComponent(q)}&role=${role}`)
      .then(d => { setUsers(d.users); setStats(d.stats); })
      .finally(() => setLoading(false));
  }, [q, role]);
  React.useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const act = async (userId: string, action: string) => {
    try {
      await api('/api/admin/users', { method: 'POST', body: JSON.stringify({ userId, action }) });
      toast.success(`${action.replace('_', ' ').toLowerCase()} done`);
      load();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="animate-in">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-bold text-white">User Management</h1>
        <div className="flex-1" />
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search UID, name or email…" className="pl-9 h-9 bg-white/[0.04] border-white/10 text-[13px]" />
        </div>
        <select value={role} onChange={e => setRole(e.target.value)} className="h-9 rounded-lg bg-white/[0.04] border border-white/10 px-2 text-[12.5px] text-slate-300">
          {['ALL', 'CUSTOMER', 'SUB_AGENT', 'ADMIN', 'SUPER_ADMIN'].map(r => <option key={r} value={r} className="bg-[#081221]">{r.replace('_', '-')}</option>)}
        </select>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-3">
        <StatCard label="Total users" value={stats?.total ?? '—'} />
        <StatCard label="Active" value={stats?.active ?? '—'} tone="up" />
        <StatCard label="Frozen" value={stats?.frozen ?? '—'} tone="down" />
        <StatCard label="Staff & agents" value={stats?.admins ?? '—'} tone="gold" />
      </div>

      <div className="mt-3 glass rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="hairline-b"><tr>
            <Th>User</Th><Th>Role</Th><Th>Status</Th><Th className="text-right">Balance</Th><Th className="text-right">Frozen</Th><Th className="text-right">Trades</Th><Th>KYC</Th><Th className="text-right">Actions</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2" size={14} />Loading users…</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500 text-[13px]">No users match.</td></tr>}
            {users.map(u => (
              <tr key={u.id} className="hairline-b last:border-0 hover:bg-white/[0.02]">
                <Td>
                  <button onClick={() => onOpenUser(u.id)} className="text-left">
                    <div className="text-white font-medium">{u.name} <span className="text-slate-500 font-normal">· VIP {u.vipLevel}</span></div>
                    <div className="text-[10.5px] text-slate-500">{u.uid} · {u.email}</div>
                  </button>
                </Td>
                <Td><span className="text-[11.5px] text-slate-300">{u.role.replace('_', '-')}</span></Td>
                <Td><StatusPill status={u.status} />{u.walletLocked && <span className="ml-1.5 text-[10px] text-[#FFB800]">wallet-locked</span>}</Td>
                <Td className="text-right text-white tabular-nums">${fmtUsd(u.balance)}</Td>
                <Td className="text-right text-[#FFB800] tabular-nums">{u.frozen > 0 ? `$${fmtUsd(u.frozen)}` : '—'}</Td>
                <Td className="text-right text-slate-300">{u.trades}</Td>
                <Td><span className={`text-[11px] ${u.kycStatus === 'VERIFIED' ? 'text-[#00FF88]' : 'text-[#FFB800]'}`}>{u.kycStatus}</span></Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-slate-300" onClick={() => setActionUser(u)} title="Wallet controls"><Wallet2 size={12} /></Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-slate-300" onClick={() => setNotifUser(u)} title="Send notification"><BellRing size={12} /></Button>
                    {u.status === 'ACTIVE'
                      ? <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-[#FF4D4D]" onClick={() => act(u.id, 'FREEZE_ACCOUNT')} title="Freeze account"><Snowflake size={12} /></Button>
                      : <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-[#00FF88]" onClick={() => act(u.id, 'UNFREEZE_ACCOUNT')} title="Unfreeze account"><Flame size={12} /></Button>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {actionUser && <WalletActionModal user={actionUser} onClose={() => setActionUser(null)} onDone={load} />}
      {notifUser && <NotifyModal user={notifUser} onClose={() => setNotifUser(null)} onDone={load} />}
    </div>
  );
}

export function WalletActionModal({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: string, needAmount: boolean) => {
    if (needAmount && !(parseFloat(amount) > 0)) { toast.error('Enter a valid amount'); return; }
    setBusy(true);
    try {
      const r = await api<{ detail: string }>('/api/admin/wallet', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, action, amount: parseFloat(amount) || 0, note }),
      });
      toast.success(r.detail || `${action.replace('_', ' ').toLowerCase()} done`);
      onDone(); onClose();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Modal title={`Wallet controls — ${user.name} (${user.uid})`} onClose={onClose}>
      <div className="text-[12px] text-slate-400 mb-3">Balance <span className="text-white font-semibold">${fmtUsd(user.balance)}</span> · Frozen <span className="text-[#FFB800] font-semibold">${fmtUsd(user.frozen)}</span></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-[11px] text-slate-400">Amount (USDT)</Label><Input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="mt-1 h-9 bg-white/[0.04] border-white/10" inputMode="decimal" /></div>
        <div><Label className="text-[11px] text-slate-400">Note</Label><Input value={note} onChange={e => setNote(e.target.value)} className="mt-1 h-9 bg-white/[0.04] border-white/10" placeholder="reason" /></div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button disabled={busy} onClick={() => run('CREDIT', true)} className="h-9 bg-[#00FF88]/15 text-[#00FF88] hover:bg-[#00FF88]/25 shadow-none"><PlusCircle size={13} className="mr-1.5" /> CREDIT</Button>
        <Button disabled={busy} onClick={() => run('DEBIT', true)} className="h-9 bg-[#FF4D4D]/15 text-[#FF4D4D] hover:bg-[#FF4D4D]/25 shadow-none"><MinusCircle size={13} className="mr-1.5" /> DEBIT</Button>
        <Button disabled={busy} onClick={() => run('FREEZE_FUNDS', true)} className="h-9 bg-[#FFB800]/15 text-[#FFB800] hover:bg-[#FFB800]/25 shadow-none"><Lock size={13} className="mr-1.5" /> FREEZE_FUNDS</Button>
        <Button disabled={busy} onClick={() => run('UNFREEZE_FUNDS', true)} className="h-9 bg-white/[0.06] text-slate-200 hover:bg-white/[0.1] shadow-none"><Unlock size={13} className="mr-1.5" /> UNFREEZE_FUNDS</Button>
        <Button disabled={busy} onClick={() => run('LOCK_WALLET', false)} className="h-9 bg-white/[0.06] text-slate-200 hover:bg-white/[0.1] shadow-none"><Lock size={13} className="mr-1.5" /> LOCK_WALLET</Button>
        <Button disabled={busy} onClick={() => run('UNLOCK_WALLET', false)} className="h-9 bg-white/[0.06] text-slate-200 hover:bg-white/[0.1] shadow-none"><Unlock size={13} className="mr-1.5" /> UNLOCK_WALLET</Button>
        <Button disabled={busy} onClick={() => run('FREEZE_ACCOUNT', false)} className="h-9 bg-[#FF4D4D]/15 text-[#FF4D4D] hover:bg-[#FF4D4D]/25 shadow-none"><Snowflake size={13} className="mr-1.5" /> FREEZE_ACCOUNT</Button>
        <Button disabled={busy} onClick={() => run('UNFREEZE_ACCOUNT', false)} className="h-9 bg-[#00FF88]/15 text-[#00FF88] hover:bg-[#00FF88]/25 shadow-none"><Flame size={13} className="mr-1.5" /> UNFREEZE_ACCOUNT</Button>
      </div>
    </Modal>
  );
}

export function NotifyModal({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={`Send notification — ${user.name}`} onClose={onClose}>
      <div className="space-y-3">
        <div><Label className="text-[11px] text-slate-400">Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 h-9 bg-white/[0.04] border-white/10" /></div>
        <div><Label className="text-[11px] text-slate-400">Message</Label><Input value={body} onChange={e => setBody(e.target.value)} className="mt-1 h-9 bg-white/[0.04] border-white/10" /></div>
        <Button
          disabled={busy || (!title && !body)}
          onClick={async () => {
            setBusy(true);
            try {
              await api('/api/admin/users', { method: 'POST', body: JSON.stringify({ userId: user.id, action: 'SEND_NOTIFICATION', title, body }) });
              toast.success('Notification sent'); onDone(); onClose();
            } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
          }}
          className="w-full h-9 bg-[#00A3FF] text-[#04101F] font-semibold"
        >{busy ? <Loader2 size={14} className="animate-spin" /> : 'Send notification'}</Button>
      </div>
    </Modal>
  );
}

/* --------------------------- User detail modal --------------------------- */

export function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<{
    user: { id: string; uid: string; name: string; email: string; phone: string | null; country: string | null; kycStatus: string; vipLevel: number; status: string };
    trades: { id: string; symbol: string; direction: string; amount: number; result: string; profit: number; openedAt: string }[];
    loginLogs: { id: string; ip?: string | null; success: boolean; detail?: string | null; createdAt: string }[];
  } | null>(null);

  React.useEffect(() => {
    api<typeof data>(`/api/admin/users/${userId}`).then(setData).catch(() => {});
  }, [userId]);

  return (
    <Modal title="Customer profile" onClose={onClose} width={720}>
      {!data ? <CenteredLoader /> : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto thin-scrollbar pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard label="UID" value={data.user.uid} />
            <StatCard label="KYC" value={data.user.kycStatus} tone="gold" />
            <StatCard label="VIP" value={data.user.vipLevel} />
            <StatCard label="Status" value={<StatusPill status={data.user.status} />} />
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4 grid grid-cols-2 gap-2 text-[12.5px]">
            <div><span className="text-slate-500">Name:</span> <span className="text-white">{data.user.name}</span></div>
            <div><span className="text-slate-500">Email:</span> <span className="text-white">{data.user.email}</span></div>
            <div><span className="text-slate-500">Phone:</span> <span className="text-white">{data.user.phone || '—'}</span></div>
            <div><span className="text-slate-500">Country:</span> <span className="text-white">{data.user.country || '—'}</span></div>
          </div>
          <div>
            <div className="text-[12.5px] font-semibold text-white mb-1.5">Individual trading history</div>
            <div className="rounded-xl overflow-hidden border border-white/5">
              {data.trades.slice(0, 8).map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2 hairline-b last:border-0 text-[11.5px]">
                  <span className="text-white font-medium">{t.symbol}</span>
                  <span className={t.direction === 'UP' ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}>{t.direction}</span>
                  <span className="text-slate-300">${fmtUsd(t.amount)}</span>
                  <StatusPill status={t.result} />
                  <span className="text-slate-500">{timeAgo(t.openedAt)}</span>
                </div>
              ))}
              {data.trades.length === 0 && <div className="px-3 py-4 text-[12px] text-slate-500 text-center">No trades yet.</div>}
            </div>
          </div>
          <div>
            <div className="text-[12.5px] font-semibold text-white mb-1.5">Login history</div>
            <div className="rounded-xl overflow-hidden border border-white/5">
              {data.loginLogs.slice(0, 10).map(l => (
                <div key={l.id} className="flex items-center justify-between px-3 py-2 hairline-b last:border-0 text-[11.5px]">
                  <span className={l.success ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}>{l.success ? '● success' : '● failed'}</span>
                  <span className="text-slate-400">{l.ip ?? '—'} {l.detail ? `· ${l.detail}` : ''}</span>
                  <span className="text-slate-500">{timeAgo(l.createdAt)}</span>
                </div>
              ))}
              {data.loginLogs.length === 0 && <div className="px-3 py-4 text-[12px] text-slate-500 text-center">No logins recorded.</div>}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
