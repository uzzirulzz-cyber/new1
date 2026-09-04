'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, fmtUsd, useSession, timeAgo } from '@/lib/session';
import { navigate } from '@/components/shell';
import { Loader2, Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Send, LifeBuoy, ShieldCheck, KeyRound, LogOut, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';

/* ------------------------------ Profile ------------------------------ */

export function ProfileView() {
  const { user, loading } = useSession();

  if (!loading && !user) return <Gate note="Your UID, VIP level, KYC status and contact details." />;

  const kycColor = user?.kycStatus === 'VERIFIED' ? 'text-[#00FF88]' : user?.kycStatus === 'PENDING' ? 'text-[#FFB800]' : 'text-slate-400';

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in">
      <h1 className="font-display text-2xl font-bold text-white">Profile</h1>
      <div className="mt-5 glass rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00A3FF] to-[#005f9e] grid place-items-center text-2xl font-bold text-[#04101F]">{user?.name.slice(0, 1)}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold text-white">{user?.name}</span>
              {user?.kycStatus === 'VERIFIED' && <BadgeCheck size={17} className="text-[#00FF88]" />}
            </div>
            <div className="text-[12.5px] text-slate-400">{user?.email}</div>
          </div>
          <div className="flex-1" />
          <div className="text-right">
            <div className="text-[10.5px] text-slate-500">VIP level</div>
            <div className="font-display text-lg font-bold text-[#FFB800]">VIP {user?.vipLevel}</div>
          </div>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          {[
            ['UID', user?.uid ?? '—'],
            ['Email', user?.email ?? '—'],
            ['Phone', user?.phone || 'Not set'],
            ['Country', user?.country || 'Not set'],
            ['KYC status', <span key="k" className={`capitalize font-semibold ${kycColor}`}>{user?.kycStatus.toLowerCase()}</span>],
            ['Account status', <span key="s" className={user?.status === 'ACTIVE' ? 'text-[#00FF88] font-semibold' : 'text-[#FF4D4D] font-semibold'}>{user?.status.toLowerCase()}</span>],
            ['Member since', user ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'],
            ['Invited by', user?.invitedById ? 'Sub-agent partner' : 'Direct'],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-xl bg-white/[0.03] px-4 py-3">
              <div className="text-[10.5px] uppercase tracking-wider text-slate-500">{k}</div>
              <div className="mt-0.5 text-[13.5px] text-white">{v}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[11.5px] text-slate-500">To change your name, phone or country, contact BlockExchange Support from the Support page.</p>
    </div>
  );
}

function Gate({ note }: { note: string }) {
  return (
    <div className="max-w-md mx-auto p-10 text-center animate-in">
      <ShieldCheck size={30} className="mx-auto text-slate-600" />
      <h1 className="mt-3 font-display text-xl font-bold text-white">Members only</h1>
      <p className="mt-2 text-[13px] text-slate-400">{note}</p>
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={() => navigate('login')} className="bg-[#00A3FF] text-[#04101F] font-semibold">Sign in</Button>
        <Button variant="outline" onClick={() => navigate('signup')} className="border-white/15 text-white">Open Account</Button>
      </div>
    </div>
  );
}

/* ------------------------------ Notifications ------------------------------ */

interface Notif { id: string; title: string; body: string; type: string; read: boolean; createdAt: string }

const TYPE_ICON: Record<string, React.ReactNode> = {
  INFO: <Info size={15} className="text-[#00A3FF]" />,
  SUCCESS: <CheckCircle2 size={15} className="text-[#00FF88]" />,
  WARNING: <AlertTriangle size={15} className="text-[#FFB800]" />,
  ERROR: <XCircle size={15} className="text-[#FF4D4D]" />,
};

export function NotificationsView() {
  const { user, refresh } = useSession();
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    if (!user) return;
    api<{ notifications: Notif[]; unreadCount: number }>('/api/notifications').then(d => { setItems(d.notifications); setUnread(d.unreadCount); }).catch(() => {});
  }, [user]);
  useEffect(() => { load(); const iv = setInterval(load, 6000); return () => clearInterval(iv); }, [load]);

  if (!user) return <Gate note="Trade settlements, payments and security alerts appear here." />;

  const markAll = async () => {
    await api('/api/notifications', { method: 'POST', body: JSON.stringify({}) });
    load(); refresh();
    toast.success('All notifications marked as read');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2"><Bell size={20} className="text-[#00A3FF]" /> Notifications</h1>
          <p className="text-[12.5px] text-slate-400 mt-0.5">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        </div>
        <Button size="sm" variant="outline" onClick={markAll} disabled={unread === 0} className="border-white/15 text-white"><CheckCheck size={14} className="mr-1.5" /> Mark all read</Button>
      </div>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <div className="glass rounded-2xl p-10 text-center text-slate-500 text-[13px]">No notifications yet.</div>}
        {items.map(n => (
          <div key={n.id} className={`glass rounded-2xl p-4 flex gap-3 ${!n.read ? 'shadow-[inset_0_0_0_1px_rgba(0,163,255,0.28)]' : 'opacity-75'}`}>
            <div className="mt-0.5">{TYPE_ICON[n.type] ?? TYPE_ICON.INFO}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-semibold text-white">{n.title}</span>
                <span className="text-[10.5px] text-slate-500 shrink-0">{timeAgo(n.createdAt)}</span>
              </div>
              <p className="mt-1 text-[12.5px] text-slate-400 leading-relaxed">{n.body}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-[#00A3FF] mt-1.5 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Settings ------------------------------ */

export function SettingsView() {
  const { user, logout, refresh } = useSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Gate note="Security settings and password management." />;

  const changePw = async () => {
    if (next !== confirm) { toast.error('New passwords do not match'); return; }
    setBusy(true);
    try {
      await api('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: current, newPassword: next }) });
      toast.success('Password updated', { description: 'All other sessions were signed out.' });
      setCurrent(''); setNext(''); setConfirm(''); refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in">
      <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
      <div className="mt-5 glass rounded-2xl p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-white"><KeyRound size={15} className="text-[#00A3FF]" /> Change password</div>
        <div className="mt-4 grid gap-3 max-w-md">
          <div><Label className="text-[11.5px] text-slate-400">Current password</Label><Input type="password" value={current} onChange={e => setCurrent(e.target.value)} className="mt-1 h-10 bg-white/[0.04] border-white/10" /></div>
          <div><Label className="text-[11.5px] text-slate-400">New password</Label><Input type="password" value={next} onChange={e => setNext(e.target.value)} className="mt-1 h-10 bg-white/[0.04] border-white/10" placeholder="Minimum 8 characters" /></div>
          <div><Label className="text-[11.5px] text-slate-400">Confirm new password</Label><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1 h-10 bg-white/[0.04] border-white/10" /></div>
          <Button onClick={changePw} disabled={busy || next.length < 8} className="h-10 bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-semibold">{busy ? <Loader2 size={14} className="animate-spin" /> : 'Update password'}</Button>
        </div>
      </div>
      <div className="mt-3 glass rounded-2xl p-5">
        <div className="text-[14px] font-semibold text-white">Preferences</div>
        <div className="mt-3 space-y-2.5 text-[13px]">
          {[['Trade confirmations', true], ['Settlement notifications', true], ['Marketing emails', false]].map(([label, on]) => (
            <div key={label as string} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
              <span className="text-slate-200">{label}</span>
              <span className={`w-10 h-5.5 rounded-full relative ${on ? 'bg-[#00A3FF]/40' : 'bg-white/10'}`}><span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all ${on ? 'right-0.5' : 'left-0.5'}`} style={{ width: 18, height: 18 }} /></span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 glass rounded-2xl p-5 flex items-center justify-between">
        <div>
          <div className="text-[14px] font-semibold text-white">Sign out</div>
          <div className="text-[12px] text-slate-500 mt-0.5">End this session on {user.email}</div>
        </div>
        <Button onClick={logout} variant="outline" className="border-[#FF4D4D]/40 text-[#FF4D4D] hover:bg-[#FF4D4D]/10"><LogOut size={14} className="mr-1.5" /> Sign out</Button>
      </div>
    </div>
  );
}

/* ------------------------------ Support ------------------------------ */

interface SMsg { id: string; sender: 'USER' | 'ADMIN'; body: string; createdAt: string }

export function SupportView() {
  const { user } = useSession();
  const [messages, setMessages] = useState<SMsg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (!user) return;
    api<{ thread: { messages: SMsg[] } }>('/api/support').then(d => setMessages(d.thread.messages)).catch(() => {});
  }, [user]);

  useEffect(() => { load(); const iv = setInterval(load, 4000); return () => clearInterval(iv); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  if (!user) return <Gate note="Chat with the BlockExchange Support desk." />;

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    try {
      await api('/api/support', { method: 'POST', body: JSON.stringify({ body }) });
      setText(''); load();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in flex flex-col" style={{ minHeight: 'calc(100vh - 8rem)' }}>
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00A3FF]/12 grid place-items-center"><LifeBuoy size={18} className="text-[#00A3FF]" /></div>
        <div>
          <div className="text-[14px] font-semibold text-white">BlockExchange Support</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] pulse-dot" /> Typically replies within minutes</div>
        </div>
      </div>
      <div className="mt-3 glass rounded-2xl p-4 flex-1 overflow-y-auto thin-scrollbar max-h-[52vh]">
        {messages.length === 0 && <div className="text-center text-slate-500 text-[13px] py-10">Start a conversation with our support desk.</div>}
        <div className="space-y-2.5">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${m.sender === 'USER' ? 'bg-[#00A3FF]/15 text-white shadow-[inset_0_0_0_1px_rgba(0,163,255,0.25)]' : 'bg-white/[0.05] text-slate-200'}`}>
                {m.body}
                <div className="mt-1 text-[9.5px] text-slate-500">{timeAgo(m.createdAt)}</div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
      <div className="mt-3 glass rounded-2xl p-3 flex gap-2">
        <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Describe your issue…" className="h-11 bg-white/[0.04] border-white/10" disabled={busy} />
        <Button onClick={send} disabled={busy || !text.trim()} size="icon" className="w-11 h-11 bg-[#00A3FF] text-[#04101F] hover:brightness-110 shrink-0">{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</Button>
      </div>
    </div>
  );
}
