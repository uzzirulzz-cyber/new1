'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, fmtUsd, timeAgo, useSession } from '@/lib/session';
import { Modal, AdminShell, CenteredLoader, StatCard, Th, Td, StatusPill } from '@/components/staff/admin-core';
import { StaffShell } from '@/components/shell';
import { AreaChart } from '@/components/charts';
import { Check, X, Pause, Download, Send, ShieldCheck, Loader2, KeyRound, Copy } from 'lucide-react';
import { toast } from 'sonner';

/* ------------------------------ Payments ------------------------------ */

interface PayRow { id: string; method: string; amount: number; status: string; createdAt: string; address?: string; reference?: string; user: { uid: string; name: string; email: string } }

export function PaymentsModule() {
  const [data, setData] = useState<{ deposits: PayRow[]; withdrawals: PayRow[] } | null>(null);
  const [tab, setTab] = useState<'deposits' | 'withdrawals'>('deposits');

  const load = React.useCallback(() => {
    api<{ deposits: PayRow[]; withdrawals: PayRow[] }>('/api/admin/payments').then(setData).catch(() => {});
  }, []);
  React.useEffect(() => { load(); const iv = setInterval(load, 6000); return () => clearInterval(iv); }, [load]);

  const act = async (kind: string, id: string, action: string) => {
    try {
      await api('/api/admin/payments', { method: 'POST', body: JSON.stringify({ kind: kind === 'deposits' ? 'deposit' : 'withdrawal', id, action }) });
      toast.success(`${kind === 'deposits' ? 'Deposit' : 'Withdrawal'} ${action.toLowerCase()}d`);
      load();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (!data) return <CenteredLoader />;
  const rows = tab === 'deposits' ? data.deposits : data.withdrawals;

  return (
    <div className="animate-in">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-bold text-white">Payments</h1>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {(['deposits', 'withdrawals'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-1.5 rounded-lg text-[12.5px] capitalize ${tab === t ? 'bg-[#FFB800]/15 text-[#FFB800] shadow-[inset_0_0_0_1px_rgba(255,184,0,0.3)]' : 'bg-white/[0.04] text-slate-400'}`}>
              {t} ({(t === 'deposits' ? data.deposits : data.withdrawals).filter(r => r.status === 'PENDING' || r.status === 'ON_HOLD').length})
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 glass rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <thead className="hairline-b"><tr>
            <Th>Customer</Th><Th>{tab === 'deposits' ? 'Method' : 'Method → Address'}</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th>Submitted</Th><Th className="text-right">Review</Th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-[13px]">Nothing here.</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="hairline-b last:border-0 hover:bg-white/[0.02]">
                <Td><div className="text-white font-medium">{r.user.name}</div><div className="text-[10.5px] text-slate-500">{r.user.uid}</div></Td>
                <Td>
                  <div className="text-slate-300">{r.method}</div>
                  <div className="text-[10.5px] text-slate-500 truncate max-w-[220px]">{r.address ?? r.reference ?? '—'}</div>
                </Td>
                <Td className="text-right text-white font-semibold tabular-nums">${fmtUsd(r.amount)}</Td>
                <Td><StatusPill status={r.status} /></Td>
                <Td className="text-slate-500 text-[11.5px]">{timeAgo(r.createdAt)}</Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    {(r.status === 'PENDING' || (tab === 'withdrawals' && r.status === 'ON_HOLD')) && (
                      <>
                        <Button size="sm" onClick={() => act(tab, r.id, 'APPROVE')} className="h-7 px-2.5 bg-[#00FF88]/15 text-[#00FF88] hover:bg-[#00FF88]/25 shadow-none"><Check size={12} /></Button>
                        <Button size="sm" onClick={() => act(tab, r.id, 'REJECT')} className="h-7 px-2.5 bg-[#FF4D4D]/15 text-[#FF4D4D] hover:bg-[#FF4D4D]/25 shadow-none"><X size={12} /></Button>
                        {tab === 'withdrawals' && r.status === 'PENDING' && (
                          <Button size="sm" onClick={() => act(tab, r.id, 'HOLD')} className="h-7 px-2.5 bg-white/[0.07] text-slate-300 hover:bg-white/[0.12] shadow-none"><Pause size={12} /></Button>
                        )}
                      </>
                    )}
                    {(r.status === 'APPROVED' || r.status === 'REJECTED') && <span className="text-[11px] text-slate-600 pr-2">reviewed</span>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------- Trade Management -------------------------- */

interface AdminTrade { id: string; symbol: string; direction: string; amount: number; duration: number; entryPrice: number; exitPrice: number | null; result: string; profit: number; openedAt: string; user: { uid: string; name: string } }

export function TradesModule() {
  const [trades, setTrades] = useState<AdminTrade[] | null>(null);
  const [filter, setFilter] = useState('ALL');
  const load = React.useCallback(() => {
    api<{ trades: AdminTrade[] }>(`/api/admin/trades${filter === 'ALL' ? '' : `?result=${filter}`}`).then(d => setTrades(d.trades)).catch(() => {});
  }, [filter]);
  React.useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [load]);

  return (
    <div className="animate-in">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-bold text-white">Trade Management</h1>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {['ALL', 'PENDING', 'WON', 'LOST', 'REFUND'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-[12px] ${filter === f ? 'bg-[#FFB800]/15 text-[#FFB800]' : 'bg-white/[0.04] text-slate-400'}`}>{f}</button>
          ))}
        </div>
      </div>
      <div className="mt-3 glass rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[840px]">
          <thead className="hairline-b"><tr>
            <Th>Customer</Th><Th>Market</Th><Th>Direction</Th><Th className="text-right">Stake</Th><Th className="text-right">Expiry</Th><Th className="text-right">Entry → Exit</Th><Th>Result</Th><Th className="text-right">Profit</Th><Th className="text-right">Opened</Th>
          </tr></thead>
          <tbody>
            {!trades && <tr><td colSpan={9}><CenteredLoader /></td></tr>}
            {trades?.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500 text-[13px]">No trades.</td></tr>}
            {trades?.map(t => (
              <tr key={t.id} className="hairline-b last:border-0 hover:bg-white/[0.02]">
                <Td><div className="text-white font-medium">{t.user.name}</div><div className="text-[10.5px] text-slate-500">{t.user.uid}</div></Td>
                <Td className="text-slate-200 font-medium">{t.symbol}</Td>
                <Td><span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${t.direction === 'UP' ? 'bg-[#00FF88]/12 text-[#00FF88]' : 'bg-[#FF4D4D]/12 text-[#FF4D4D]'}`}>{t.direction}</span></Td>
                <Td className="text-right text-white tabular-nums">${fmtUsd(t.amount)}</Td>
                <Td className="text-right text-slate-400">{t.duration}s</Td>
                <Td className="text-right text-slate-400 text-[11.5px] tabular-nums">{t.entryPrice.toPrecision(6)} → {t.exitPrice ? t.exitPrice.toPrecision(6) : '…'}</Td>
                <Td><StatusPill status={t.result} /></Td>
                <Td className={`text-right tabular-nums font-semibold ${t.result === 'WON' ? 'text-[#FF4D4D]' : t.result === 'LOST' ? 'text-[#00FF88]' : 'text-slate-400'}`}>
                  {t.result === 'WON' ? `-$${fmtUsd(t.profit)}` : t.result === 'LOST' ? `+$${fmtUsd(t.amount)}` : '—'}
                </Td>
                <Td className="text-right text-slate-500 text-[11.5px]">{timeAgo(t.openedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">House view: WON costs the house (−profit), LOST earns the stake. Expiry settlement runs automatically on every sweep.</p>
    </div>
  );
}

/* -------------------------- Market Management -------------------------- */

interface MarketRow { id: string; symbol: string; name: string; category: string; basePrice: number; volatility: number; payoutRate: number; trendBias: number; active: boolean; sortOrder: number }

export function MarketsModule() {
  const [markets, setMarkets] = useState<MarketRow[] | null>(null);
  const [edit, setEdit] = useState<MarketRow | null>(null);
  const load = React.useCallback(() => { api<{ markets: MarketRow[] }>('/api/admin/markets').then(d => setMarkets(d.markets)).catch(() => {}); }, []);
  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="animate-in">
      <h1 className="font-display text-xl font-bold text-white">Market Management</h1>
      <div className="mt-3 glass rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="hairline-b"><tr>
            <Th>Market</Th><Th>Category</Th><Th className="text-right">Base price</Th><Th className="text-right">Volatility</Th><Th className="text-right">Payout</Th><Th className="text-right">Trend bias</Th><Th>Status</Th><Th className="text-right">Edit</Th>
          </tr></thead>
          <tbody>
            {!markets && <tr><td colSpan={8}><CenteredLoader /></td></tr>}
            {markets?.map(m => (
              <tr key={m.id} className="hairline-b last:border-0 hover:bg-white/[0.02]">
                <Td><div className="text-white font-medium">{m.symbol}</div><div className="text-[10.5px] text-slate-500">{m.name}</div></Td>
                <Td className="text-slate-300">{m.category}</Td>
                <Td className="text-right text-white tabular-nums">{m.basePrice.toPrecision(6)}</Td>
                <Td className="text-right text-slate-300">{m.volatility.toFixed(1)}</Td>
                <Td className="text-right text-[#00FF88]">{(m.payoutRate * 100).toFixed(0)}%</Td>
                <Td className="text-right text-slate-300">{m.trendBias.toFixed(2)}</Td>
                <Td><StatusPill status={m.active ? 'ACTIVE' : 'FROZEN'} /></Td>
                <Td className="text-right"><Button size="sm" variant="ghost" className="h-7 px-3 text-[11.5px] text-[#00A3FF]" onClick={() => setEdit(m)}>Edit</Button></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <MarketEditModal market={edit} onClose={() => setEdit(null)} onDone={load} />}
    </div>
  );
}

function MarketEditModal({ market, onClose, onDone }: { market: MarketRow; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ basePrice: String(market.basePrice), volatility: String(market.volatility), payoutRate: String(market.payoutRate), active: market.active });
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={`Edit ${market.symbol}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-[11px] text-slate-400">Base price</Label><Input value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} className="mt-1 h-9 bg-white/[0.04] border-white/10" /></div>
        <div><Label className="text-[11px] text-slate-400">Volatility</Label><Input value={form.volatility} onChange={e => setForm(f => ({ ...f, volatility: e.target.value }))} className="mt-1 h-9 bg-white/[0.04] border-white/10" /></div>
        <div><Label className="text-[11px] text-slate-400">Payout rate (0-1)</Label><Input value={form.payoutRate} onChange={e => setForm(f => ({ ...f, payoutRate: e.target.value }))} className="mt-1 h-9 bg-white/[0.04] border-white/10" /></div>
        <div><Label className="text-[11px] text-slate-400">Active</Label>
          <button onClick={() => setForm(f => ({ ...f, active: !f.active }))} className={`mt-1 w-full h-9 rounded-lg text-[12.5px] ${form.active ? 'bg-[#00FF88]/15 text-[#00FF88]' : 'bg-[#FF4D4D]/15 text-[#FF4D4D]'}`}>{form.active ? 'ACTIVE' : 'PAUSED'}</button>
        </div>
      </div>
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api('/api/admin/markets', { method: 'PUT', body: JSON.stringify({ id: market.id, ...form, basePrice: parseFloat(form.basePrice), volatility: parseFloat(form.volatility), payoutRate: parseFloat(form.payoutRate) }) });
            toast.success('Market updated'); onDone(); onClose();
          } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
        }}
        className="mt-3 w-full h-9 bg-[#00A3FF] text-[#04101F] font-semibold"
      >{busy ? <Loader2 size={14} className="animate-spin" /> : 'Save changes'}</Button>
    </Modal>
  );
}

/* ------------------------------ Messages ------------------------------ */

interface Thread { id: string; subject: string; unreadForUser: boolean; unreadForAdmin: boolean; lastMessageAt: string; user: { uid: string; name: string; email: string }; messages: { body: string; sender: string; createdAt: string }[] }

export function MessagesModule() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [open, setOpen] = useState<Thread | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const load = React.useCallback(() => {
    api<{ threads: Thread[] }>('/api/admin/messages').then(d => setThreads(d.threads)).catch(() => {});
  }, []);
  React.useEffect(() => {
    load();
    const iv = setInterval(() => { if (!open) load(); }, 5000);
    return () => clearInterval(iv);
  }, [load, open?.id]);

  const openThread = async (t: Thread) => {
    const d = await api<{ thread: Thread }>(`/api/admin/messages?threadId=${t.id}`);
    setOpen(d.thread); load();
  };

  const send = async () => {
    if (!open || !reply.trim()) return;
    setBusy(true);
    try {
      await api('/api/admin/messages', { method: 'POST', body: JSON.stringify({ threadId: open.id, body: reply }) });
      setReply('');
      const d = await api<{ thread: Thread }>(`/api/admin/messages?threadId=${open.id}`);
      setOpen(d.thread); load();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  if (!threads) return <CenteredLoader />;

  if (open) {
    return (
      <div className="animate-in max-w-3xl">
        <button onClick={() => setOpen(null)} className="text-[12.5px] text-slate-400 hover:text-white mb-3">← All conversations</button>
        <div className="glass rounded-2xl">
          <div className="px-4 py-3 hairline-b flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-white">{open.user.name} <span className="text-slate-500 font-normal text-[11.5px]">{open.user.uid} · {open.user.email}</span></div>
              <div className="text-[10.5px] text-slate-500">{open.subject}</div>
            </div>
            <span className="text-[10.5px] px-2 py-1 rounded-md bg-white/5 text-slate-400">auto-refresh 5s</span>
          </div>
          <div className="p-4 space-y-2.5 max-h-[46vh] overflow-y-auto thin-scrollbar">
            {open.messages.map(m => (
              <div key={m.id} className={`flex ${m.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] ${m.sender === 'ADMIN' ? 'bg-[#FFB800]/15 text-white' : 'bg-white/[0.05] text-slate-200'}`}>
                  {m.body}
                  <div className="mt-1 text-[9.5px] text-slate-500">{timeAgo(m.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 hairline-t flex gap-2">
            <Input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Reply to customer…" className="h-10 bg-white/[0.04] border-white/10" />
            <Button onClick={send} disabled={busy || !reply.trim()} className="h-10 px-4 bg-[#FFB800] text-[#1c1200] font-semibold">{busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <h1 className="font-display text-xl font-bold text-white">Customer Messages</h1>
      <div className="mt-3 space-y-2">
        {threads.length === 0 && <div className="glass rounded-2xl p-10 text-center text-slate-500 text-[13px]">No conversations yet.</div>}
        {threads.map(t => (
          <button key={t.id} onClick={() => openThread(t)} className="w-full glass rounded-2xl p-4 text-left hover:border-[#FFB800]/25 transition-colors flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] grid place-items-center text-[12px] font-bold text-[#00A3FF]">{t.user.name.slice(0, 1)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold text-white">{t.user.name}</span>
                <span className="text-[10.5px] text-slate-500">{t.user.uid}</span>
                {t.unreadForAdmin && <span className="w-2 h-2 rounded-full bg-[#FF4D4D] pulse-dot" />}
              </div>
              <div className="text-[12px] text-slate-400 truncate">{t.messages[0]?.sender === 'ADMIN' ? 'You: ' : ''}{t.messages[0]?.body ?? 'No messages'}</div>
            </div>
            <span className="text-[10.5px] text-slate-500 shrink-0">{timeAgo(t.lastMessageAt)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- Reports ------------------------------- */

interface ReportData {
  revenueSeries: { day: string; value: number }[];
  volumeSeries: { day: string; value: number }[];
  userSeries: { day: string; value: number }[];
  paymentSeries: { day: string; deposits: number; withdrawals: number }[];
  coinStats: { symbol: string; volume: number; trades: number }[];
}

function exportCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => r[h]).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast.success(`${name}.csv exported`);
}

export function ReportsModule() {
  const [data, setData] = useState<ReportData | null>(null);
  React.useEffect(() => { api<ReportData>('/api/admin/reports').then(setData).catch(() => {}); }, []);
  if (!data) return <CenteredLoader />;

  const totalRev = data.revenueSeries.reduce((s, r) => s + r.value, 0);
  const totalVol = data.volumeSeries.reduce((s, r) => s + r.value, 0);
  const newUsers = data.userSeries.reduce((s, r) => s + r.value, 0);
  const totalDep = data.paymentSeries.reduce((s, r) => s + r.deposits, 0);
  const totalWd = data.paymentSeries.reduce((s, r) => s + r.withdrawals, 0);

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-white">Reports · 30 days</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => exportCsv('revenue', data.revenueSeries)} className="border-white/15 text-white h-8"><Download size={13} className="mr-1.5" /> Revenue</Button>
          <Button size="sm" variant="outline" onClick={() => exportCsv('payments', data.paymentSeries)} className="border-white/15 text-white h-8"><Download size={13} className="mr-1.5" /> Payments</Button>
          <Button size="sm" variant="outline" onClick={() => exportCsv('coins', data.coinStats)} className="border-white/15 text-white h-8"><Download size={13} className="mr-1.5" /> Volumes</Button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Revenue 30d" value={`$${fmtUsd(totalRev)}`} tone="up" />
        <StatCard label="Trade volume" value={`$${fmtUsd(totalVol)}`} />
        <StatCard label="New users" value={newUsers} />
        <StatCard label="Deposits" value={`$${fmtUsd(totalDep)}`} tone="gold" />
        <StatCard label="Withdrawals" value={`$${fmtUsd(totalWd)}`} tone="down" />
      </div>
      <div className="mt-3 grid lg:grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="text-[13px] font-semibold text-white">Revenue time series</div>
          <div className="mt-3"><AreaChart data={data.revenueSeries.map((r, i) => ({ x: i, y: r.value }))} color="#00FF88" height={150} /></div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-[13px] font-semibold text-white">User growth</div>
          <div className="mt-3"><AreaChart data={data.userSeries.map((r, i) => ({ x: i, y: r.value }))} color="#00A3FF" height={150} /></div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-[13px] font-semibold text-white">Deposits vs withdrawals</div>
          <div className="mt-3"><AreaChart data={data.paymentSeries.map((r, i) => ({ x: i, y: r.deposits - r.withdrawals }))} color="#FFB800" height={150} /></div>
          <div className="mt-1 text-[11px] text-slate-500">Net flow (deposits − withdrawals)</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-[13px] font-semibold text-white">Trade volume</div>
          <div className="mt-3"><AreaChart data={data.volumeSeries.map((r, i) => ({ x: i, y: r.value }))} color="#C084FC" height={150} /></div>
        </div>
      </div>
      <div className="mt-3 glass rounded-2xl p-4">
        <div className="text-[13px] font-semibold text-white">Coin statistics</div>
        <div className="mt-3 grid md:grid-cols-2 gap-x-6 gap-y-1.5">
          {data.coinStats.map(c => (
            <div key={c.symbol} className="flex items-center justify-between text-[12.5px] py-1 hairline-b">
              <span className="text-white font-medium">{c.symbol}</span>
              <span className="text-slate-400">{c.trades} trades</span>
              <span className="text-slate-300 tabular-nums">${fmtUsd(c.volume)}</span>
            </div>
          ))}
          {data.coinStats.length === 0 && <div className="text-[12px] text-slate-500 py-4 text-center">No settled trades in 30d.</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Security ------------------------------- */

export function SecurityModule() {
  const [data, setData] = useState<{ logins: { id: string; ip?: string; userAgent?: string; success: boolean; detail?: string; createdAt: string; user: { uid: string; name: string; role: string } }[]; audits: { id: string; action: string; target?: string; detail?: string; createdAt: string; actor: { uid: string; name: string } }[]; failedCount: number; activeSessions: number } | null>(null);
  const [tab, setTab] = useState<'logins' | 'audits'>('logins');
  React.useEffect(() => { api<typeof data>('/api/admin/security').then(setData).catch(() => {}); }, []);
  if (!data) return <CenteredLoader />;

  return (
    <div className="animate-in">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-bold text-white">Security</h1>
        <div className="flex-1" />
        <div className="flex gap-2">
          <StatCard label="Failed logins 24h" value={data.failedCount} tone={data.failedCount > 0 ? 'down' : 'up'} />
          <StatCard label="Active sessions" value={data.activeSessions} />
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        {(['logins', 'audits'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-1.5 rounded-lg text-[12.5px] capitalize ${tab === t ? 'bg-[#FFB800]/15 text-[#FFB800]' : 'bg-white/[0.04] text-slate-400'}`}>{t === 'logins' ? 'Login history' : 'Audit log'}</button>
        ))}
      </div>
      <div className="mt-3 glass rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="hairline-b"><tr>
            <Th>Actor</Th><Th>{tab === 'logins' ? 'Result' : 'Action'}</Th><Th>Detail</Th><Th className="text-right">When</Th>
          </tr></thead>
          <tbody>
            {tab === 'logins' && data.logins.map(l => (
              <tr key={l.id} className="hairline-b last:border-0">
                <Td><div className="text-white font-medium">{l.user?.name ?? 'Unknown'}</div><div className="text-[10.5px] text-slate-500">{l.user?.uid} · {l.user?.role}</div></Td>
                <Td><span className={l.success ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}>{l.success ? '● success' : '● failed'}</span></Td>
                <Td className="text-slate-400 text-[11.5px]">{l.ip} {l.detail ? `· ${l.detail}` : ''}</Td>
                <Td className="text-right text-slate-500 text-[11.5px]">{timeAgo(l.createdAt)}</Td>
              </tr>
            ))}
            {tab === 'audits' && data.audits.map(a => (
              <tr key={a.id} className="hairline-b last:border-0">
                <Td><div className="text-white font-medium">{a.actor?.name}</div><div className="text-[10.5px] text-slate-500">{a.actor?.uid}</div></Td>
                <Td><span className="text-[#FFB800] font-medium text-[12px]">{a.action}</span></Td>
                <Td className="text-slate-400 text-[11.5px]">{a.target} {a.detail ?? ''}</Td>
                <Td className="text-right text-slate-500 text-[11.5px]">{timeAgo(a.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------- Settings ------------------------------- */

export function SettingsModule() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  React.useEffect(() => { api<{ settings: Record<string, string> }>('/api/admin/settings').then(d => setSettings(d.settings)).catch(() => {}); }, []);
  if (!settings) return <CenteredLoader />;

  const LABELS: Record<string, string> = {
    min_deposit: 'Minimum deposit (USDT)', min_withdraw: 'Minimum withdrawal (USDT)',
    default_payout: 'Default payout rate (0-1)', support_name: 'Support desk name',
    site_title: 'Site title', maintenance_mode: 'Maintenance mode (on/off)',
  };

  return (
    <div className="animate-in max-w-2xl">
      <h1 className="font-display text-xl font-bold text-white">Platform Settings</h1>
      <div className="mt-3 glass rounded-2xl p-5 space-y-3">
        {Object.entries(settings).map(([k, v]) => (
          <div key={k}>
            <Label className="text-[11.5px] text-slate-400">{LABELS[k] ?? k}</Label>
            <Input value={v} onChange={e => setSettings(s => ({ ...(s ?? {}), [k]: e.target.value }))}
              className="mt-1 h-9 bg-white/[0.04] border-white/10" />
          </div>
        ))}
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try { await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(settings) }); toast.success('Settings saved'); }
            catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
          }}
          className="h-9 bg-[#00A3FF] text-[#04101F] font-semibold px-6"
        >{busy ? <Loader2 size={14} className="animate-spin" /> : 'Save settings'}</Button>
      </div>
    </div>
  );
}

/* --------------------------- Forced pwd change --------------------------- */

export function ForcedPasswordChange({ onDone }: { onDone: () => void }) {
  const { refresh } = useSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Change your password" onClose={() => {}}>
      <div className="flex items-start gap-2.5 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 px-3.5 py-3 mb-4">
        <ShieldCheck size={16} className="text-[#FFB800] mt-0.5" />
        <p className="text-[12.5px] text-slate-300">Your staff account uses a temporary password. Set a new password to continue — this is required on first login.</p>
      </div>
      <div className="space-y-3">
        <div><Label className="text-[11.5px] text-slate-400">Temporary password</Label><Input type="password" value={current} onChange={e => setCurrent(e.target.value)} className="mt-1 h-10 bg-white/[0.04] border-white/10" /></div>
        <div><Label className="text-[11.5px] text-slate-400">New password</Label><Input type="password" value={next} onChange={e => setNext(e.target.value)} className="mt-1 h-10 bg-white/[0.04] border-white/10" placeholder="Minimum 8 characters" /></div>
        <Button
          disabled={busy || next.length < 8}
          onClick={async () => {
            setBusy(true);
            try {
              await api('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: current, newPassword: next }) });
              await refresh();
              toast.success('Password updated — welcome!');
              onDone();
            } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
          }}
          className="w-full h-10 bg-[#FFB800] text-[#1c1200] font-semibold"
        >{busy ? <Loader2 size={14} className="animate-spin" /> : 'Set new password'}</Button>
      </div>
    </Modal>
  );
}
