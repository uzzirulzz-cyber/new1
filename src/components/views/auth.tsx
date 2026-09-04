'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, useSession } from '@/lib/session';
import { navigate } from '@/components/shell';
import { HeroChartCanvas } from '@/components/charts';
import { ShieldCheck, ArrowLeft, Phone, Ticket, Loader2, KeyRound, Lock, Mail, User as UserIcon } from 'lucide-react';

const COUNTRIES: [string, string][] = [
  ['+92', 'PK'], ['+971', 'AE'], ['+91', 'IN'], ['+1', 'US'], ['+44', 'GB'],
  ['+60', 'MY'], ['+65', 'SG'], ['+62', 'ID'], ['+63', 'PH'], ['+66', 'TH'],
  ['+90', 'TR'], ['+7', 'RU'], ['+49', 'DE'], ['+33', 'FR'], ['+39', 'IT'],
  ['+34', 'ES'], ['+61', 'AU'], ['+55', 'BR'], ['+234', 'NG'], ['+27', 'ZA'],
  ['+20', 'EG'], ['+966', 'SA'], ['+880', 'BD'], ['+94', 'LK'], ['+84', 'VN'],
];

function AuthSplit({ children, title, sub }: { children: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="min-h-screen flex bg-[#050B18] text-slate-100">
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-end p-10">
        <div className="absolute inset-0"><HeroChartCanvas /></div>
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-bold text-white leading-tight">Trade direction.<br /><span className="text-[#00A3FF]">Win in seconds.</span></h2>
          <p className="mt-4 text-slate-300 text-[15px] leading-relaxed">Binary options on 18 live crypto markets. BUY UP or BUY DOWN with 30s, 60s or 120s expiries and up to 92% payout.</p>
          <div className="mt-8 flex items-center gap-6 text-[12px] text-slate-400">
            <span>· Bank-grade security</span><span>· Instant settlement</span><span>· 24/7 support</span>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-[520px] flex flex-col hairline-l">
        <div className="p-5">
          <button onClick={() => navigate('home')} className="flex items-center gap-2 text-[12px] text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to BlockExchange
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-center px-6 pb-16 lg:px-14">
          <h1 className="font-display text-3xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-[13px] text-slate-400">{sub}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Cross-portal handoff: when an account knocks on the wrong door, carry its
// email over and land it on the correct portal automatically.
let prefillStaffEmail = '';
let prefillCustomerEmail = '';

export function LoginView() {
  const { refresh } = useSession();
  const [email, setEmail] = useState(prefillCustomerEmail);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await refresh();
      navigate('markets');
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('Staff Portal')) {
        // Admin/staff/sub-agent tried the customer door — take them to the right one.
        prefillStaffEmail = email;
        setError('');
        navigate('staff-login');
      } else {
        setError(msg);
      }
    } finally { setBusy(false); }
  };

  return (
    <AuthSplit title="Welcome back" sub="Sign in to trade live binary markets.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label className="text-slate-300">Email</Label>
          <div className="relative mt-1.5">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@fund.com" className="pl-9 bg-white/[0.04] border-white/10" required />
          </div>
        </div>
        <div>
          <Label className="text-slate-300">Password</Label>
          <div className="relative mt-1.5">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className="pl-9 bg-white/[0.04] border-white/10" required />
          </div>
        </div>
        {error && <div className="text-[12.5px] text-[#FF4D4D] bg-[#FF4D4D]/8 border border-[#FF4D4D]/25 rounded-lg px-3 py-2">{error}</div>}
        <Button type="submit" disabled={busy} className="w-full h-11 bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-semibold hover:brightness-110">
          {busy ? <Loader2 className="animate-spin" size={16} /> : 'Sign In'}
        </Button>
      </form>
      <div className="mt-6 flex items-center justify-between text-[12.5px]">
        <span className="text-slate-400">No account? <button onClick={() => navigate('signup')} className="text-[#00A3FF] hover:underline">Open one with an invitation code</button></span>
        <button onClick={() => navigate('staff-login')} className="flex items-center gap-1.5 text-slate-500 hover:text-[#FFB800]"><ShieldCheck size={13} /> Staff</button>
      </div>
    </AuthSplit>
  );
}

export function SignupView() {
  const { refresh } = useSession();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', invitationCode: '' });
  const [cc, setCc] = useState('+92');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...form, phone: form.phone ? `${cc} ${form.phone}` : '' }),
      });
      await refresh();
      navigate('markets');
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(false); }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <AuthSplit title="Open your account" sub="Registration requires a valid invitation code from a BlockExchange partner or sub-agent.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label className="text-slate-300">Full name</Label>
          <div className="relative mt-1.5">
            <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={form.name} onChange={set('name')} placeholder="Your name" className="pl-9 bg-white/[0.04] border-white/10" required />
          </div>
        </div>
        <div>
          <Label className="text-slate-300">Email</Label>
          <div className="relative mt-1.5">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={form.email} onChange={set('email')} type="email" placeholder="you@fund.com" className="pl-9 bg-white/[0.04] border-white/10" required />
          </div>
        </div>
        <div>
          <Label className="text-slate-300">Phone</Label>
          <div className="flex gap-2 mt-1.5">
            <select value={cc} onChange={e => setCc(e.target.value)} className="w-24 h-10 rounded-lg bg-white/[0.04] border border-white/10 px-2 text-[13px] text-slate-200 outline-none focus:border-[#00A3FF]/50">
              {COUNTRIES.map(([code, c]) => <option key={code} value={code} className="bg-[#081221]">{c} {code}</option>)}
            </select>
            <div className="relative flex-1">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input value={form.phone} onChange={set('phone')} placeholder="300 1234567" className="pl-9 bg-white/[0.04] border-white/10" />
            </div>
          </div>
        </div>
        <div>
          <Label className="text-slate-300">Password</Label>
          <div className="relative mt-1.5">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={form.password} onChange={set('password')} type="password" placeholder="Minimum 8 characters" className="pl-9 bg-white/[0.04] border-white/10" required minLength={8} />
          </div>
        </div>
        <div>
          <Label className="text-slate-300">Invitation code</Label>
          <div className="relative mt-1.5">
            <Ticket size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={form.invitationCode} onChange={e => setForm(f => ({ ...f, invitationCode: e.target.value.toUpperCase() }))} placeholder="AGT-XXXXXX" className="pl-9 bg-white/[0.04] border-white/10 tracking-wider" required />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">Customers join through a sub-agent invitation code (e.g. AGT-MAYA24).</p>
        </div>
        {error && <div className="text-[12.5px] text-[#FF4D4D] bg-[#FF4D4D]/8 border border-[#FF4D4D]/25 rounded-lg px-3 py-2">{error}</div>}
        <Button type="submit" disabled={busy} className="w-full h-11 bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-semibold hover:brightness-110">
          {busy ? <Loader2 className="animate-spin" size={16} /> : 'Create Account'}
        </Button>
      </form>
      <div className="mt-6 text-[12.5px] text-slate-400">
        Already registered? <button onClick={() => navigate('login')} className="text-[#00A3FF] hover:underline">Sign in</button>
      </div>
    </AuthSplit>
  );
}

export function StaffLoginView() {
  const { refresh } = useSession();
  const [email, setEmail] = useState(prefillStaffEmail);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const d = await api<{ user: { role: string }; mustChangePassword: boolean }>('/api/staff/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      });
      await refresh();
      prefillStaffEmail = '';
      navigate(d.user.role === 'SUB_AGENT' ? 'agent' : 'admin');
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('staff only')) {
        // Customer tried the staff door — send them to the customer sign-in.
        prefillCustomerEmail = email;
        setError('');
        navigate('login');
      } else {
        setError(msg);
      }
    } finally { setBusy(false); }
  };

  return (
    <AuthSplit title="Staff Portal" sub="Restricted access for admins and sub-agents. All logins are audited.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label className="text-slate-300">Staff email</Label>
          <div className="relative mt-1.5">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@blockexchange.io" className="pl-9 bg-white/[0.04] border-white/10" required />
          </div>
        </div>
        <div>
          <Label className="text-slate-300">Password</Label>
          <div className="relative mt-1.5">
            <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className="pl-9 bg-white/[0.04] border-white/10" required />
          </div>
        </div>
        {error && <div className="text-[12.5px] text-[#FF4D4D] bg-[#FF4D4D]/8 border border-[#FF4D4D]/25 rounded-lg px-3 py-2">{error}</div>}
        <Button type="submit" disabled={busy} className="w-full h-11 bg-gradient-to-r from-[#FFB800] to-[#d99a00] text-[#1c1200] font-semibold hover:brightness-110">
          {busy ? <Loader2 className="animate-spin" size={16} /> : 'Enter Console'}
        </Button>
      </form>
      <div className="mt-6 text-[12px] text-slate-500">Customers: <button onClick={() => navigate('login')} className="text-[#00A3FF] hover:underline">use the customer sign-in</button></div>
    </AuthSplit>
  );
}
