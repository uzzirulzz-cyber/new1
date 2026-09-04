'use client';

import React, { useState, useEffect } from 'react';
import { useSession, api, fmtUsd, timeAgo } from '@/lib/session';
import { navigate, StaffShell } from '@/components/shell';
import { AdminShell, AdminDashboard, UsersModule, UserDetailModal, CenteredLoader, StatCard, StatusPill, Modal } from '@/components/staff/admin-core';
import { PaymentsModule, TradesModule, MarketsModule, MessagesModule, ReportsModule, SecurityModule, SettingsModule, ForcedPasswordChange } from '@/components/staff/admin-more';
import { Button } from '@/components/ui/button';
import { Copy, Users, Wallet2, ArrowLeftRight, Ticket } from 'lucide-react';
import { toast } from 'sonner';

export function AdminView() {
  const { user, loading } = useSession();
  const [module, setModule] = useState('dashboard');
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [pwdDone, setPwdDone] = useState(false);

  useEffect(() => {
    if (loading || user) return;
    navigate('staff-login');
  }, [loading, user]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center bg-[#04080F]"><CenteredLoader /></div>;
  if (user.role === 'CUSTOMER') {
    return <RoleRedirect to="home" note="Redirecting to the customer site…" />;
  }
  if (user.role === 'SUB_AGENT') {
    return <RoleRedirect to="agent" note="Redirecting to your sub-agent dashboard…" />;
  }

  return (
    <>
      {user.mustChangePassword && !pwdDone && <ForcedPasswordChange onDone={() => setPwdDone(true)} />}
      <AdminShell module={module} onModule={setModule}>
        {module === 'dashboard' && <AdminDashboard onModule={setModule} />}
        {module === 'users' && <UsersModule onOpenUser={setOpenUser} />}
        {module === 'wallet' && <UsersModule onOpenUser={setOpenUser} />}
        {module === 'payments' && <PaymentsModule />}
        {module === 'trades' && <TradesModule />}
        {module === 'markets' && <MarketsModule />}
        {module === 'messages' && <MessagesModule />}
        {module === 'reports' && <ReportsModule />}
        {module === 'security' && <SecurityModule />}
        {module === 'settings' && <SettingsModule />}
      </AdminShell>
      {openUser && <UserDetailModal userId={openUser} onClose={() => setOpenUser(null)} />}
    </>
  );
}

function RoleRedirect({ to, note }: { to: 'home' | 'admin' | 'agent'; note: string }) {
  useEffect(() => { navigate(to); }, [to]);
  return <div className="min-h-screen grid place-items-center bg-[#04080F] text-slate-400 text-[13px]">{note}</div>;
}

/* --------------------------- Sub-Agent portal --------------------------- */

interface AgentData {
  agent: { uid: string; name: string; invitationCode: string | null; createdAt: string };
  customers: { id: string; uid: string; name: string; email: string; status: string; vipLevel: number; kycStatus: string; balance: number; frozen: number; trades: number; createdAt: string }[];
  stats: { customers: number; active: number; frozen: number; totalBalance: number; totalTrades: number; customerVolume: number };
}

export function AgentView() {
  const { user, loading } = useSession();
  const [data, setData] = useState<AgentData | null>(null);
  const [detail, setDetail] = useState<{ customer: { uid: string; name: string; email: string; balance: number; frozen: number; status: string }; trades: { id: string; symbol: string; direction: string; amount: number; result: string; profit: number; openedAt: string }[] } | null>(null);

  useEffect(() => {
    const load = () => api<AgentData>('/api/agent').then(setData).catch(() => {});
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (loading || user) return;
    navigate('staff-login');
  }, [loading, user]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center bg-[#04080F]"><CenteredLoader /></div>;
  if (user.role === 'CUSTOMER') return <RoleRedirect to="home" note="Redirecting to the customer site…" />;
  if (user.role !== 'SUB_AGENT') return <RoleRedirect to="admin" note="Redirecting to the admin console…" />;

  const openCustomer = async (id: string) => {
    const d = await api<typeof detail>(`/api/agent?customerId=${id}`);
    setDetail(d);
  };

  return (
    <StaffShell view="agent" activeModule="overview">
      {!data ? <CenteredLoader /> : (
        <div className="animate-in">
          <div className="glass rounded-2xl p-5 flex flex-wrap items-center gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Invitation code</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-display text-2xl font-bold text-[#FFB800] tracking-wider">{data.agent.invitationCode}</span>
                <button
                  onClick={() => { navigator.clipboard?.writeText(data.agent.invitationCode ?? '').catch(() => {}); toast.success('Invitation code copied'); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
                ><Copy size={14} /></button>
              </div>
              <div className="text-[11.5px] text-slate-500 mt-1">Customers register at /signup with this code — they appear only in your network.</div>
            </div>
            <div className="flex-1" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-[280px]">
              <StatCard label="Customers" value={data.stats.customers} />
              <StatCard label="Total balance" value={`$${fmtUsd(data.stats.totalBalance)}`} tone="up" />
              <StatCard label="Customer trades" value={data.stats.totalTrades} />
              <StatCard label="Volume" value={`$${fmtUsd(data.stats.customerVolume)}`} tone="gold" />
            </div>
          </div>

          <div className="mt-3 glass rounded-2xl overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="hairline-b"><tr>
                <th className="text-[10.5px] uppercase tracking-wider text-slate-500 font-medium px-3 py-2.5 text-left">Customer</th>
                <th className="text-[10.5px] uppercase tracking-wider text-slate-500 font-medium px-3 py-2.5 text-left">Status</th>
                <th className="text-[10.5px] uppercase tracking-wider text-slate-500 font-medium px-3 py-2.5 text-right">Balance</th>
                <th className="text-[10.5px] uppercase tracking-wider text-slate-500 font-medium px-3 py-2.5 text-right">Frozen</th>
                <th className="text-[10.5px] uppercase tracking-wider text-slate-500 font-medium px-3 py-2.5 text-right">Trades</th>
                <th className="text-[10.5px] uppercase tracking-wider text-slate-500 font-medium px-3 py-2.5 text-left">KYC</th>
                <th className="text-[10.5px] uppercase tracking-wider text-slate-500 font-medium px-3 py-2.5 text-right">Joined</th>
              </tr></thead>
              <tbody>
                {data.customers.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-[13px]">No customers yet — share your invitation code to grow your network.</td></tr>}
                {data.customers.map(c => (
                  <tr key={c.id} className="hairline-b last:border-0 hover:bg-white/[0.02] cursor-pointer" onClick={() => openCustomer(c.id)}>
                    <td className="px-3 py-2.5"><div className="text-white font-medium text-[12.5px]">{c.name}</div><div className="text-[10.5px] text-slate-500">{c.uid} · {c.email}</div></td>
                    <td className="px-3 py-2.5"><StatusPill status={c.status} /></td>
                    <td className="px-3 py-2.5 text-right text-white tabular-nums text-[12.5px]">${fmtUsd(c.balance)}</td>
                    <td className="px-3 py-2.5 text-right text-[#FFB800] tabular-nums text-[12.5px]">{c.frozen > 0 ? `$${fmtUsd(c.frozen)}` : '—'}</td>
                    <td className="px-3 py-2.5 text-right text-slate-300 text-[12.5px]">{c.trades}</td>
                    <td className="px-3 py-2.5"><span className={`text-[11px] ${c.kycStatus === 'VERIFIED' ? 'text-[#00FF88]' : 'text-[#FFB800]'}`}>{c.kycStatus}</span></td>
                    <td className="px-3 py-2.5 text-right text-slate-500 text-[11.5px]">{timeAgo(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detail && (
        <Modal title={`Customer — ${detail.customer.name}`} onClose={() => setDetail(null)} width={560}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatCard label="Balance" value={`$${fmtUsd(detail.customer.balance)}`} />
            <StatCard label="Frozen" value={`$${fmtUsd(detail.customer.frozen)}`} tone="gold" />
            <StatCard label="Status" value={<StatusPill status={detail.customer.status} />} />
          </div>
          <div className="text-[12.5px] font-semibold text-white mb-1.5">Trading activity</div>
          <div className="rounded-xl overflow-hidden border border-white/5 max-h-60 overflow-y-auto thin-scrollbar">
            {detail.trades.length === 0 && <div className="px-3 py-5 text-[12px] text-slate-500 text-center">No trades yet.</div>}
            {detail.trades.map(t => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 hairline-b last:border-0 text-[11.5px]">
                <span className="text-white font-medium">{t.symbol}</span>
                <span className={t.direction === 'UP' ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}>{t.direction}</span>
                <span className="text-slate-300">${fmtUsd(t.amount)}</span>
                <StatusPill status={t.result} />
                <span className="text-slate-500">{timeAgo(t.openedAt)}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </StaffShell>
  );
}
