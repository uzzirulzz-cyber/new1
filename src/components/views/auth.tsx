'use client';

import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, User, ShieldCheck, Eye, EyeOff, BadgeCheck, Fingerprint } from 'lucide-react';
import { useExchange } from '@/lib/store';
import { change24h, fmtPrice, fmtPct } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { HeroChartCanvas, Sparkline } from '@/components/charts';
import { LiveBadge, Tag } from '@/components/shared';

export default function AuthView({ mode }: { mode: 'login' | 'signup' }) {
  const { login, navigate, pairs, stats } = useExchange();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [name, setName] = useState('');
  const [ref, setRef] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const isLogin = mode === 'login';

  const submit = () => {
    if (!email.trim() || !pwd.trim()) { toast.error('Missing credentials', 'Enter email and password to continue.'); return; }
    login(name || 'Muhammad Uzair');
    toast.success(isLogin ? 'Welcome back' : 'Account created', 'Your trading desk is ready.');
  };

  const tickers = pairs.slice(0, 5);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden border-r hairline bg-[#060E1C]">
        <HeroChartCanvas />
        <div className="relative">
          <div className="flex items-center gap-3">
            { }
            <img src="/blockexchange-logo.png" alt="BLOCKEXCHANGE" className="w-12 h-12 rounded-xl object-cover border border-[#FFB800]/40 shadow-[0_0_24px_rgba(255,184,0,0.35)]" />
            <div>
              <p className="font-[family-name:var(--font-display)] font-bold text-lg">BLOCK<span className="text-gradient-gold">EXCHANGE</span></p>
              <p className="text-[9.5px] text-muted-foreground tracking-[0.24em]">TRADE · INVEST · GROW</p>
            </div>
          </div>
        </div>
        <div className="relative max-w-md">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight">
            {isLogin ? 'Welcome back to your desk.' : 'Join 184,000+ professional traders.'}
          </h2>
          <p className="mt-3 text-[13.5px] text-slate-400 leading-relaxed">
            Spot, futures and options on a sub-second engine. AI-powered insights, institutional custody,
            and deep aggregated liquidity — all in one terminal.
          </p>
          <div className="mt-6 space-y-2">
            {tickers.map(p => {
              const ch = change24h(p);
              return (
                <div key={p.id} className="glass rounded-lg px-4 py-2.5 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: `${p.color}22`, color: p.color, border: `1px solid ${p.color}44` }}>{p.base.slice(0, 2)}</span>
                  <span className="text-[12px] font-semibold flex-1">{p.symbol}</span>
                  <span className={cn('text-[12.5px] tabular font-medium', ch >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>${fmtPrice(p.price)}</span>
                  <span className={cn('text-[10.5px] tabular w-14 text-right', ch >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>{fmtPct(ch)}</span>
                  <Sparkline data={Array.from({ length: 12 }, (_, i) => p.price * (1 + Math.sin(i + p.base.length) * 0.004))} w={56} h={18} glow={false} />
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative flex items-center gap-4 text-[10.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><LiveBadge /> Matching engine operational</span>
          <span>24h volume ${(stats.volume24h / 1e9).toFixed(2)}B</span>
          <span>$750M insurance fund</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center px-6 md:px-14 lg:px-20 py-12 relative">
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          { }
          <img src="/blockexchange-logo.png" alt="" className="w-10 h-10 rounded-lg object-cover border border-[#FFB800]/40" />
          <p className="font-[family-name:var(--font-display)] font-bold">BLOCK<span className="text-gradient-gold">EXCHANGE</span></p>
        </div>

        <div className="max-w-sm w-full mx-auto fade-up">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">{isLogin ? 'Sign in' : 'Create your account'}</h1>
          <p className="text-[12.5px] text-muted-foreground mt-1.5">
            {isLogin ? 'Access your portfolio, orders and analytics.' : 'Free forever. Upgrade tiers as you grow.'}
          </p>

          <div className="mt-7 space-y-3.5">
            {!isLogin && (
              <Field icon={<User size={14} />} label="Full name">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="bg-transparent outline-none text-[13px] w-full" />
              </Field>
            )}
            <Field icon={<Mail size={14} />} label="Email">
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@fund.com" className="bg-transparent outline-none text-[13px] w-full" />
            </Field>
            <Field icon={<Lock size={14} />} label="Password" suffix={
              <button type="button" onClick={() => setShowPwd(s => !s)} className="text-muted-foreground hover:text-white">{showPwd ? <EyeOff size={13} /> : <Eye size={13} />}</button>
            }>
              <input value={pwd} onChange={e => setPwd(e.target.value)} type={showPwd ? 'text' : 'password'} placeholder="Minimum 8 characters" className="bg-transparent outline-none text-[13px] w-full" />
            </Field>
            {!isLogin && (
              <Field icon={<BadgeCheck size={14} />} label="Referral code (optional)">
                <input value={ref} onChange={e => setRef(e.target.value)} placeholder="UZAIR-VIP3" className="bg-transparent outline-none text-[13px] w-full" />
              </Field>
            )}
          </div>

          {isLogin && (
            <div className="flex items-center justify-between mt-3 text-[11.5px]">
              <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-[#00A3FF] w-3 h-3" /> Remember me
              </label>
              <button className="text-[#33B5FF] hover:underline">Forgot password?</button>
            </div>
          )}

          <Button onClick={submit}
            className="w-full h-11 mt-6 text-[13.5px] font-bold bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] border-0 shadow-[0_0_28px_rgba(0,163,255,0.35)] hover:brightness-110">
            {isLogin ? 'Sign in securely' : 'Create account'} <ArrowRight size={15} />
          </Button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-[#0B1A30]" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or continue with</span>
            <div className="h-px flex-1 bg-[#0B1A30]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Google', 'Apple', 'Wallet'].map(p => (
              <Button key={p} variant="outline" className="h-10 text-[12px] border-white/10 hover:bg-white/5"
                onClick={() => { login('Muhammad Uzair'); toast.success('Authenticated', `Signed in with ${p}`); }}>
                {p === 'Wallet' ? <Fingerprint size={14} /> : p}
              </Button>
            ))}
          </div>

          <p className="text-center text-[12px] text-muted-foreground mt-6">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button className="text-[#33B5FF] font-medium hover:underline" onClick={() => navigate(isLogin ? 'signup' : 'login')}>
              {isLogin ? 'Create one free' : 'Sign in'}
            </button>
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Tag color="green"><ShieldCheck size={9} /> 2FA secured</Tag>
            <Tag color="blue">SOC 2 Type II</Tag>
            <Tag color="gold">$750M insured</Tag>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children, suffix }: { icon: React.ReactNode; label: string; children: React.ReactNode; suffix?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#0B1A30]/70 border hairline px-3.5 py-2 focus-within:border-[#00A3FF]/50 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">{icon}{label}</p>
        {suffix}
      </div>
      {children}
    </div>
  );
}
