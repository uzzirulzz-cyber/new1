'use client';

import React, { useState } from 'react';
import {
  ShieldCheck, IdCard, Upload, CheckCircle2, Clock3, XCircle, Users, Gift, Copy,
  LifeBuoy, MessageSquare, Send, Settings2, KeyRound, Smartphone, Monitor, Globe,
  Bell, Palette, ChevronRight, Lock, Award, Mail,
} from 'lucide-react';
import { useExchange } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { GlassCard, StatCard, Tag, SectionTitle } from '@/components/shared';

/* ---------------------------------- KYC ---------------------------------- */
export function KycView() {
  const { user } = useExchange();
  const [tier, setTier] = useState<'unverified' | 'pending' | 'verified' | 'institutional'>('pending');
  const [step, setStep] = useState(0);

  const TIERS = [
    { id: 'basic', name: 'Tier 1 — Basic', limit: '2,000 USDT daily · spot only', reqs: ['Email + phone verified', 'Country of residence'], time: 'Instant', color: '#00FF88' },
    { id: 'advanced', name: 'Tier 2 — Advanced', limit: '500,000 USDT daily · spot + futures', reqs: ['Government ID document', 'Facial liveness check', 'Proof of address'], time: '~15 min', color: '#00A3FF' },
    { id: 'institutional', name: 'Tier 3 — Institutional', limit: 'Unlimited · OTC desk access', reqs: ['Business registration docs', 'Source of funds declaration', 'Compliance interview'], time: '1–3 days', color: '#FFB800' },
  ];

  const upload = (label: string) => toast.success('Document uploaded', `${label} queued for review (demo)`);

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1200px] mx-auto">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">KYC Verification</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">Unlock higher limits and full platform access · KYC is mandatory for withdrawals</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-2.5">
        <StatCard label="Current Tier" value={user.kyc === 'verified' ? 'Tier 2' : 'Pending'} icon={<ShieldCheck size={15} />} accent="blue" sub="Advanced verified" />
        <StatCard label="Daily Limit" value="500K USDT" icon={<IdCard size={15} />} accent="gold" sub="withdraw + transfer" />
        <StatCard label="Review Status" value={tier === 'pending' ? 'In Review' : 'Verified'} icon={<Clock3 size={15} />} accent={tier === 'pending' ? 'gold' : 'green'} sub="est. 15 min remaining" />
      </div>

      {/* Progress steps */}
      <GlassCard>
        <SectionTitle title="Verification Flow" sub="Tier 2 — Advanced" icon={<ShieldCheck size={15} />} right={<Tag color="gold">2 of 3 steps</Tag>} />
        <div className="flex items-center gap-1.5">
          {['Identity document', 'Facial liveness', 'Proof of address'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 flex-1 min-w-0',
                i <= step ? 'border-[#00A3FF]/45 bg-[#00A3FF]/8' : 'hairline')}>
                <span className={cn('w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                  i < step ? 'bg-[#00FF88] text-[#03150b]' : i === step ? 'bg-[#00A3FF] text-white' : 'bg-[#0B1A30] text-muted-foreground')}>
                  {i < step ? '✓' : i + 1}
                </span>
                <span className={cn('text-[11.5px] truncate', i === step ? 'text-white font-medium' : 'text-muted-foreground')}>{s}</span>
              </div>
              {i < 2 && <div className={cn('h-[2px] w-4 shrink-0 rounded', i < step ? 'bg-[#00A3FF]' : 'bg-[#0B1A30]')} />}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-2.5">
          {['Passport / ID card', 'Selfie with code', 'Utility bill < 3 months'].map((label, i) => (
            <button key={label} onClick={() => { upload(label); if (i === step && step < 2) setStep(step + 1); }}
              className={cn('rounded-xl border border-dashed px-4 py-6 flex flex-col items-center gap-2 transition-colors',
                i === step ? 'border-[#00A3FF]/50 bg-[#00A3FF]/5 hover:bg-[#00A3FF]/10' : 'hairline hover:border-[#00A3FF]/30')}>
              <Upload size={18} className={i <= step ? 'text-[#33B5FF]' : 'text-muted-foreground'} />
              <p className="text-[11.5px] font-medium">{label}</p>
              <p className="text-[9.5px] text-muted-foreground">JPG, PNG or PDF · max 8MB</p>
              {i < step && <Tag color="green"><CheckCircle2 size={9} /> Uploaded</Tag>}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Tier cards */}
      <div className="grid md:grid-cols-3 gap-3">
        {TIERS.map((t, i) => (
          <GlassCard key={t.id} gold={i === 2} hover className="relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 blur-3xl rounded-full opacity-25" style={{ background: t.color }} />
            <div className="flex items-center justify-between">
              <p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">{t.name}</p>
              {i === 1 && <Tag color="green">Your tier</Tag>}
            </div>
            <p className="text-[11.5px] text-[#FFD35C] mt-1 tabular">{t.limit}</p>
            <ul className="mt-3 space-y-1.5">
              {t.reqs.map(r => (
                <li key={r} className="flex items-start gap-2 text-[11.5px] text-slate-300"><CheckCircle2 size={12} className="text-[#00FF88] shrink-0 mt-0.5" />{r}</li>
              ))}
            </ul>
            <div className="mt-3.5 flex items-center justify-between">
              <span className="text-[10.5px] text-muted-foreground">Review time: <span className="text-white">{t.time}</span></span>
              <Button size="sm" variant={i === 2 ? 'default' : 'outline'} className={cn('h-7.5 h-8 text-[11px]', i === 2 ? 'bg-gradient-to-r from-[#FFD35C] to-[#FFB800] text-[#181200] border-0 font-bold' : 'border-[#00A3FF]/40 text-[#33B5FF]')}>
                {i < 2 ? 'Verified' : 'Apply'}
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Affiliate ------------------------------- */
export function AffiliateView() {
  const [copied, setCopied] = useState(false);
  const link = 'https://blockexchange.io/r/uzair-vip3';
  const code = 'UZAIR-VIP3';
  const referrals = [
    { name: 'cryptoNinja_88', joined: '12 Aug 2026', volume: 482300, commission: 1204.42, status: 'active' },
    { name: 'sats4life', joined: '02 Aug 2026', volume: 201450, commission: 503.10, status: 'active' },
    { name: 'defi_wanderer', joined: '28 Jul 2026', volume: 96400, commission: 241.20, status: 'active' },
    { name: 'moonwhale', joined: '19 Jul 2026', volume: 8920, commission: 22.30, status: 'inactive' },
    { name: 'algo_queen', joined: '11 Jul 2026', volume: 154800, commission: 387.00, status: 'active' },
  ];
  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1300px] mx-auto">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Affiliate Program</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">Earn up to 45% commission from your referrals' trading fees — for life</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard label="Total Commission" value="$2,358.02" icon={<Gift size={15} />} accent="gold" delta={18.2} sub="paid in USDT" />
        <StatCard label="Referrals" value={referrals.length} icon={<Users size={15} />} accent="blue" sub="4 active traders" />
        <StatCard label="Commission Rate" value="38%" icon={<Award size={15} />} accent="green" sub="VIP3 boosted rate" />
        <StatCard label="Pending Payout" value="$142.20" icon={<Clock3 size={15} />} accent="violet" sub="settles daily 00:00 UTC" />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-3">
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b hairline"><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Your Referrals</p></div>
          <div className="overflow-x-auto">
            <table className="bx-table">
              <thead><tr><th>User</th><th>Joined</th><th>Trading Volume</th><th>Your Commission</th><th>Status</th></tr></thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.name}>
                    <td className="font-medium text-[12px]">{r.name}</td>
                    <td className="text-slate-400 text-[11.5px]">{r.joined}</td>
                    <td className="tabular">${r.volume.toLocaleString()}</td>
                    <td className="tabular text-[#00FF88] font-medium">+${r.commission.toFixed(2)}</td>
                    <td><Tag color={r.status === 'active' ? 'green' : 'gray'}>{r.status}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
        <div className="space-y-3">
          <GlassCard className="space-y-3">
            <p className="text-[12.5px] font-semibold flex items-center gap-1.5"><Copy size={13} className="text-[#33B5FF]" /> Share & earn</p>
            <div className="rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5">
              <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground mb-1">Referral link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10.5px] break-all text-slate-300">{link}</code>
                <Button size="icon" variant="outline" className="h-7 w-7 border-[#00A3FF]/35 text-[#33B5FF]"
                  onClick={() => { navigator.clipboard?.writeText(link).catch(() => {}); setCopied(true); toast.success('Link copied'); setTimeout(() => setCopied(false), 1500); }}>
                  {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5">
              <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground mb-1">Referral code</p>
              <p className="text-[14px] font-bold tracking-[0.15em] text-[#FFD35C]">{code}</p>
            </div>
            <div className="rounded-lg border hairline bg-[#0B1A30]/60 p-3 text-[11px] space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Tier 1 (direct)</span><span className="text-[#00FF88] font-semibold">38% of fees</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tier 2 (indirect)</span><span className="tabular">7% of fees</span></div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Support -------------------------------- */
export function SupportView() {
  const [tickets, setTickets] = useState([
    { id: '#TK-8812', subject: 'Withdrawal stuck in review', status: 'In Progress', updated: '12 min ago', priority: 'High' },
    { id: '#TK-8754', subject: 'Enable withdrawal whitelist', status: 'Resolved', updated: '2 days ago', priority: 'Medium' },
  ]);
  const [subject, setSubject] = useState('');
  const [msg, setMsg] = useState('');
  const [category, setCategory] = useState('Trading');

  const submit = () => {
    if (!subject.trim() || !msg.trim()) { toast.error('Missing fields', 'Subject and message are required.'); return; }
    setTickets(t => [{ id: `#TK-${8813 + t.length}`, subject, status: 'Open', updated: 'just now', priority: 'Medium' }, ...t]);
    toast.success('Ticket submitted', 'Our desk responds within 2 hours (24/7).');
    setSubject(''); setMsg('');
  };

  const FAQS = [
    { q: 'What are the trading fees?', a: 'Spot maker/taker fees start at 0.10%/0.10% and scale down with 30-day volume. VIP tiers enjoy maker rebates down to 0.00%. Futures fees start at 0.02%/0.05%.' },
    { q: 'How fast are withdrawals processed?', a: 'Automated risk checks complete in under 10 minutes for whitelisted addresses. Large withdrawals above 50K USDT route to manual compliance review (1–3 hours).' },
    { q: 'Is my custody insured?', a: 'Yes — custodial assets are covered by a $750M insurance fund with monthly proof-of-reserves published on-chain.' },
    { q: 'Do you support institutional OTC?', a: 'Tier 3 verified clients get dedicated OTC desk access with block liquidity above 250K USDT and zero slippage quotes.' },
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1300px] mx-auto">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Support Center</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">24/7 human support · average first response under 2 hours</p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-3">
        {/* New ticket */}
        <GlassCard className="space-y-3 h-fit">
          <p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)] flex items-center gap-2"><MessageSquare size={14} className="text-[#33B5FF]" /> Open a ticket</p>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Category</p>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5 text-[12.5px] outline-none">
              {['Trading', 'Deposits & Withdrawals', 'Account Security', 'KYC & Compliance', 'Bug Report', 'General'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Subject</p>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary"
              className="w-full rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5 text-[12.5px] outline-none focus:border-[#00A3FF]/50" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Message</p>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5} placeholder="Describe your issue in detail…"
              className="w-full rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5 text-[12.5px] outline-none resize-none focus:border-[#00A3FF]/50" />
          </div>
          <Button onClick={submit} className="w-full h-10 text-[12.5px] font-bold bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] border-0">
            <Send size={13} /> Submit Ticket
          </Button>
          <div className="rounded-lg border hairline bg-[#0B1A30]/60 p-3 space-y-2">
            {[['Live chat', 'Avg wait 40s'], ['Priority line (VIP)', 'Instant'], ['compliance@blockexchange.io', 'Replies < 24h']].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5"><LifeBuoy size={11} className="text-[#00FF88]" />{k}</span>
                <span className="text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-3">
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b hairline"><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">My Tickets</p></div>
            <div className="divide-y hairline/60">
              {tickets.map(t => (
                <div key={t.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#00A3FF]/4 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium truncate">{t.subject}</p>
                    <p className="text-[10.5px] text-muted-foreground">{t.id} · updated {t.updated}</p>
                  </div>
                  <Tag color={t.priority === 'High' ? 'red' : 'gold'}>{t.priority}</Tag>
                  <Tag color={t.status === 'Resolved' ? 'green' : t.status === 'Open' ? 'blue' : 'gold'}>{t.status}</Tag>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b hairline"><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Frequently Asked</p></div>
            <div className="divide-y hairline/60">
              {FAQS.map((f, i) => (
                <div key={i}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#00A3FF]/4">
                    <span className="text-[12.5px] font-medium">{f.q}</span>
                    <ChevronRight size={14} className={cn('text-muted-foreground transition-transform shrink-0', openFaq === i && 'rotate-90')} />
                  </button>
                  {openFaq === i && <p className="px-4 pb-3.5 text-[12px] text-muted-foreground leading-relaxed -mt-1">{f.a}</p>}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Settings -------------------------------- */
export function SettingsView() {
  const { user } = useExchange();
  const [twoFA, setTwoFA] = useState(true);
  const [antiPhish, setAntiPhish] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1200px] mx-auto">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Settings</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">Account, security and platform preferences</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <GlassCard className="space-y-3.5">
          <SectionTitle title="Profile" sub="Account identity" icon={<IdCard size={15} />} />
          {[['Full name', user.name], ['Email', user.email], ['Account tier', `${user.tier} · member since ${new Date(user.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-lg bg-[#0B1A30]/60 border hairline px-3.5 py-2.5">
              <span className="text-[11.5px] text-muted-foreground">{k}</span>
              <span className="text-[12px] font-medium">{v}</span>
            </div>
          ))}
          <Button variant="outline" size="sm" className="h-8 text-[11.5px] border-[#00A3FF]/40 text-[#33B5FF]">Edit profile</Button>
        </GlassCard>

        <GlassCard className="space-y-3.5">
          <SectionTitle title="Security" sub="Protect your account" icon={<Lock size={15} />} />
          {[
            { icon: <KeyRound size={14} />, label: 'Two-Factor Authentication', desc: 'Google Authenticator', value: twoFA, set: setTwoFA },
            { icon: <ShieldCheck size={14} />, label: 'Anti-Phishing Code', desc: 'Shows in all official emails', value: antiPhish, set: setAntiPhish },
            { icon: <Mail size={14} />, label: 'Login & trade alerts', desc: 'Email on new login/order', value: emailAlerts, set: setEmailAlerts },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between rounded-lg bg-[#0B1A30]/60 border hairline px-3.5 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[#33B5FF]">{row.icon}</span>
                <div className="min-w-0"><p className="text-[12px] font-medium">{row.label}</p><p className="text-[10px] text-muted-foreground truncate">{row.desc}</p></div>
              </div>
              <Switch checked={row.value} onCheckedChange={v => { row.set(v); toast.success(`${row.label} ${v ? 'enabled' : 'disabled'}`); }} />
            </div>
          ))}
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b hairline flex items-center gap-2"><Monitor size={14} className="text-[#33B5FF]" /><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Active Sessions</p></div>
          <div className="divide-y hairline/60">
            {[
              { icon: <Monitor size={13} />, device: 'Chrome · macOS', loc: 'Karachi, PK · 103.22.x.x', time: 'Current session', current: true },
              { icon: <Smartphone size={13} />, device: 'BLOCKEXCHANGE App · iOS', loc: 'Dubai, AE · 94.20.x.x', time: '2h ago', current: false },
              { icon: <Globe size={13} />, device: 'Safari · iPad', loc: 'London, UK · 51.10.x.x', time: '3 days ago', current: false },
            ].map(s => (
              <div key={s.device} className="px-4 py-3 flex items-center gap-3">
                <span className="text-[#33B5FF]">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium">{s.device} {s.current && <Tag color="green" className="ml-1">Active</Tag>}</p>
                  <p className="text-[10.5px] text-muted-foreground">{s.loc} · {s.time}</p>
                </div>
                {!s.current && <button className="text-[10.5px] text-[#FF6B6B] hover:underline" onClick={() => toast.success('Session revoked')}>Revoke</button>}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="space-y-3.5">
          <SectionTitle title="API Management" sub="Programmatic trading access" icon={<Settings2 size={15} />} />
          <div className="rounded-lg bg-[#0B1A30]/60 border hairline px-3.5 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">API Key</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] text-slate-300 truncate">{apiKeyVisible ? 'bx_live_8f42a1c9d7e3b6042f18' : 'bx_live_••••••••••••••••••••'}</code>
              <button className="text-[10.5px] text-[#33B5FF] hover:underline" onClick={() => setApiKeyVisible(v => !v)}>{apiKeyVisible ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border hairline px-3 py-2"><p className="text-muted-foreground text-[9.5px] uppercase">Permissions</p><p className="mt-0.5">Read · Spot · Futures</p></div>
            <div className="rounded-lg border hairline px-3 py-2"><p className="text-muted-foreground text-[9.5px] uppercase">IP whitelist</p><p className="mt-0.5">3 addresses</p></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-[11px] border-[#00A3FF]/40 text-[#33B5FF]" onClick={() => toast.success('New API key generated')}>Create key</Button>
            <Button size="sm" variant="outline" className="h-8 text-[11px] border-[#FF4D4D]/40 text-[#FF6B6B]" onClick={() => toast.success('API key revoked')}>Revoke all</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#0B1A30]/60 border hairline px-3.5 py-2.5">
            <div className="flex items-center gap-2.5"><Bell size={14} className="text-[#FFD35C]" /><p className="text-[12px] font-medium">Price & fill push alerts</p></div>
            <Switch checked={pushAlerts} onCheckedChange={setPushAlerts} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
