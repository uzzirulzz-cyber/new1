'use client';

import React, { useMemo, useState } from 'react';
import {
  Landmark, Users, ShieldCheck, Wallet2, Cpu, ListPlus, Droplets, BarChart3, Gift,
  ShieldAlert, ScrollText, LifeBuoy, FileText, Search, CheckCircle2, XCircle, Clock3,
  Activity, AlertTriangle, Server, Database, Globe2, Lock, Eye, Ban, DollarSign, Percent,
} from 'lucide-react';
import { useExchange } from '@/lib/store';
import { change24h, fmtPrice, fmtUsd, fmtNum } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { GlassCard, StatCard, Tag, PctBadge, LiveBadge, SectionTitle } from '@/components/shared';
import { AreaChart, Sparkline } from '@/components/charts';

type Module =
  | 'overview' | 'users' | 'kyc' | 'wallets' | 'engine' | 'listings' | 'liquidity'
  | 'revenue' | 'affiliates' | 'security' | 'audit' | 'support' | 'cms';

const MODULES: { id: Module; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Executive', icon: <Landmark size={14} /> },
  { id: 'users', label: 'Users', icon: <Users size={14} /> },
  { id: 'kyc', label: 'KYC Review', icon: <ShieldCheck size={14} /> },
  { id: 'wallets', label: 'Wallet Ops', icon: <Wallet2 size={14} /> },
  { id: 'engine', label: 'Trading Engine', icon: <Cpu size={14} /> },
  { id: 'listings', label: 'Listings', icon: <ListPlus size={14} /> },
  { id: 'liquidity', label: 'Liquidity', icon: <Droplets size={14} /> },
  { id: 'revenue', label: 'Revenue', icon: <BarChart3 size={14} /> },
  { id: 'affiliates', label: 'Affiliates', icon: <Gift size={14} /> },
  { id: 'security', label: 'Security', icon: <ShieldAlert size={14} /> },
  { id: 'audit', label: 'Audit Logs', icon: <ScrollText size={14} /> },
  { id: 'support', label: 'Support', icon: <LifeBuoy size={14} /> },
  { id: 'cms', label: 'CMS', icon: <FileText size={14} /> },
];

const USERS = [
  { id: 'U-10241', name: 'cryptoNinja_88', email: 'ninja@proton.io', country: '🇦🇪 AE', kyc: 'Tier 2', volume: 482300, status: 'Active', risk: 'low', joined: '2026-08-12' },
  { id: 'U-10198', name: 'sats4life', email: 'sats@gmail.com', country: '🇬🇧 UK', kyc: 'Tier 2', volume: 201450, status: 'Active', risk: 'low', joined: '2026-08-02' },
  { id: 'U-10144', name: 'moonwhale', email: 'whale@outlook.com', country: '🇸🇬 SG', kyc: 'Tier 3', volume: 8920000, status: 'Active', risk: 'medium', joined: '2026-07-19' },
  { id: 'U-10098', name: 'algo_queen', email: 'queen@fund.io', country: '🇺🇸 US', kyc: 'Tier 3', volume: 1548000, status: 'Frozen', risk: 'high', joined: '2026-07-11' },
  { id: 'U-10067', name: 'defi_wanderer', email: 'wander@proton.io', country: '🇩🇪 DE', kyc: 'Tier 1', volume: 96400, status: 'Active', risk: 'low', joined: '2026-07-28' },
  { id: 'U-10012', name: 'rugpuller_x', email: 'x@anon.mail', country: '🇳🇱 NL', kyc: 'Unverified', volume: 12400, status: 'Suspended', risk: 'high', joined: '2026-06-30' },
];

const KYC_QUEUE = [
  { id: 'K-2201', user: 'ether_maxi', tier: 'Tier 2', doc: 'Passport · FR', submitted: '18 min ago', status: 'Pending' },
  { id: 'K-2200', user: 'quant_desh', tier: 'Tier 3', doc: 'Business reg · IN', submitted: '1h ago', status: 'Pending' },
  { id: 'K-2199', user: 'solana_sam', tier: 'Tier 2', doc: 'ID card · BR', submitted: '2h ago', status: 'Under Review' },
  { id: 'K-2198', user: 'nft_farmer', tier: 'Tier 1', doc: 'Auto-approved', submitted: '3h ago', status: 'Approved' },
];

const WITHDRAWALS_QUEUE = [
  { id: 'W-9902', user: 'moonwhale', asset: 'USDT', amount: 120000, network: 'TRC-20', status: 'Pending', risk: 'Large amount' },
  { id: 'W-9901', user: 'sats4life', asset: 'ETH', amount: 4.2, network: 'ERC-20', status: 'Pending', risk: 'New address' },
  { id: 'W-9899', user: 'cryptoNinja_88', asset: 'USDT', amount: 8200, network: 'BEP-20', status: 'Approved', risk: 'Whitelisted' },
];

const TICKETS_ADMIN = [
  { id: 'TK-8812', user: 'sats4life', subject: 'Withdrawal stuck in review', priority: 'High', status: 'In Progress', agent: 'Elena K.' },
  { id: 'TK-8811', user: 'defi_wanderer', subject: 'API rate limits for market data', priority: 'Medium', status: 'Open', agent: 'Unassigned' },
  { id: 'TK-8810', user: 'moonwhale', subject: 'OTC block quote request', priority: 'Urgent', status: 'In Progress', agent: 'Marcus C.' },
  { id: 'TK-8809', user: 'algo_queen', subject: 'Frozen account appeal', priority: 'High', status: 'Escalated', agent: 'Compliance' },
];

const AUDIT_LOGS = [
  { id: 1, admin: 'M. Uzair', role: 'Super Admin', action: 'Approved withdrawal W-9899', target: 'cryptoNinja_88', ip: '103.22.x.x', time: '09:42:17' },
  { id: 2, admin: 'Elena K.', role: 'Support Admin', action: 'Updated ticket TK-8812', target: 'sats4life', ip: '85.19.x.x', time: '09:38:04' },
  { id: 3, admin: 'Compliance Bot', role: 'System', action: 'Froze account U-10098', target: 'algo_queen', ip: 'internal', time: '09:31:52' },
  { id: 4, admin: 'M. Uzair', role: 'Super Admin', action: 'Listed RNDR/USDT futures', target: 'Market', ip: '103.22.x.x', time: '08:58:31' },
  { id: 5, admin: 'D. Osei', role: 'Finance Admin', action: 'Adjusted fee tier for VIP4', target: 'Fee schedule', ip: '41.90.x.x', time: '08:12:09' },
];

export default function AdminView() {
  const { pairs, stats, navigate } = useExchange();
  const [mod, setMod] = useState<Module>('overview');
  const [userQuery, setUserQuery] = useState('');
  const [cmsFlags, setCmsFlags] = useState({ maintenance: false, newRegs: true, referrals: true, otc: true });

  const totalRevenue = 184923.44;
  const revSeries = useMemo(() => [128, 142, 156, 149, 168, 181, 174, 192, 205, 198, 214, 228, 221, 246, 259, 252, 274, 288, 281, 302, 318, 309, 334, 351, 342, 368, 389, 381, 402, 428].map(x => x * 320), []);
  const filteredUsers = USERS.filter(u => !userQuery || u.name.toLowerCase().includes(userQuery.toLowerCase()) || u.email.includes(userQuery.toLowerCase()));
  const engineHealth = [
    { name: 'Matching Engine', status: 'Operational', latency: '0.42ms', icon: <Cpu size={14} /> },
    { name: 'Market Data Feed', status: 'Operational', latency: '12ms', icon: <Activity size={14} /> },
    { name: 'Wallet Service', status: 'Operational', latency: '38ms', icon: <Wallet2 size={14} /> },
    { name: 'KYC Provider', status: 'Degraded', latency: '1.2s', icon: <ShieldCheck size={14} /> },
    { name: 'Risk Engine', status: 'Operational', latency: '3ms', icon: <ShieldAlert size={14} /> },
  ];
  const riskAlerts = [
    { level: 'High', text: 'Account U-10098 (algo_queen) — 3 consecutive liquidation warnings', time: '12m' },
    { level: 'Medium', text: 'BTC funding rate divergence vs index > 0.08% for 40 min', time: '48m' },
    { level: 'Low', text: 'KYC provider latency elevated (1.2s p99)', time: '1h' },
  ];

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold flex items-center gap-2">
            <Landmark size={20} className="text-[#FFD35C]" /> Admin Control Center
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Super Administrator · full platform authority</p>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge label="ENGINE LIVE" />
          <Tag color="gold">Revenue today: ${fmtNum(totalRevenue)}</Tag>
        </div>
      </div>

      {/* Module nav */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setMod(m.id)}
            className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[11.5px] font-medium border transition-all',
              mod === m.id ? 'bg-[#00A3FF]/15 text-[#33B5FF] border-[#00A3FF]/40 shadow-[0_0_14px_rgba(0,163,255,0.1)]' : 'text-slate-400 hairline hover:text-white hover:border-[#00A3FF]/25')}>
            {m.icon}{m.label}
          </button>
        ))}
      </div>

      {/* ------------------------------ OVERVIEW ------------------------------ */}
      {mod === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
            <StatCard label="Exchange Revenue" value={`$${fmtNum(totalRevenue)}`} delta={14.2} icon={<DollarSign size={15} />} accent="gold" sub="today, all products" />
            <StatCard label="Trading Volume" value={fmtUsd(stats.volume24h)} delta={8.6} icon={<BarChart3 size={15} />} accent="blue" sub="24h rolling" />
            <StatCard label="Active Traders" value={fmtNum(stats.traders)} delta={2.1} icon={<Users size={15} />} accent="green" sub="sessions in 24h" />
            <StatCard label="Pending Withdrawals" value="2" icon={<Clock3 size={15} />} accent="violet" sub="$124.2K awaiting review" />
            <StatCard label="Pending KYC" value={KYC_QUEUE.filter(k => k.status === 'Pending').length} icon={<ShieldCheck size={15} />} accent="gold" sub="avg review 14 min" />
            <StatCard label="Risk Alerts" value={riskAlerts.length} icon={<AlertTriangle size={15} />} accent="red" sub="1 high severity" />
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <GlassCard className="lg:col-span-2">
              <SectionTitle title="Revenue Analytics" sub="Gross platform revenue · 30 days" right={<Tag color="green">+231% MoM</Tag>} icon={<BarChart3 size={15} />} />
              <AreaChart data={revSeries} height={180} color="#FFB800" />
            </GlassCard>
            <GlassCard>
              <SectionTitle title="Risk Alerts" sub="Real-time risk engine" icon={<AlertTriangle size={15} className="text-[#FF4D4D]" />} />
              <div className="space-y-2.5">
                {riskAlerts.map((a, i) => (
                  <div key={i} className={cn('rounded-lg border p-2.5',
                    a.level === 'High' ? 'border-[#FF4D4D]/30 bg-[#FF4D4D]/6' : a.level === 'Medium' ? 'border-[#FFB800]/30 bg-[#FFB800]/6' : 'hairline bg-[#0B1A30]/50')}>
                    <div className="flex items-center justify-between mb-1">
                      <Tag color={a.level === 'High' ? 'red' : a.level === 'Medium' ? 'gold' : 'gray'}>{a.level}</Tag>
                      <span className="text-[9.5px] text-muted-foreground">{a.time} ago</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{a.text}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <GlassCard className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b hairline"><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Liquidity Monitoring</p></div>
              <div className="overflow-x-auto">
                <table className="bx-table">
                  <thead><tr><th>Pair</th><th>Depth ±2%</th><th>Spread</th><th>MM Coverage</th><th>Status</th></tr></thead>
                  <tbody>
                    {pairs.slice(0, 6).map(p => (
                      <tr key={p.id}>
                        <td className="font-semibold text-[11.5px]">{p.symbol}</td>
                        <td className="tabular">{fmtUsd(p.volQuote * 0.18, true)}</td>
                        <td className="tabular text-[#00FF88]">{(0.012 + Math.random() * 0.02).toFixed(3)}%</td>
                        <td>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="h-1.5 rounded-full bg-[#0B1A30] flex-1"><div className="h-full rounded-full bg-[#00A3FF]" style={{ width: `${72 + (p.id.length * 7) % 24}%` }} /></div>
                            <span className="text-[10px] tabular text-muted-foreground">{72 + (p.id.length * 7) % 24}%</span>
                          </div>
                        </td>
                        <td><Tag color="green">Healthy</Tag></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
            <GlassCard className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b hairline"><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">System Health</p></div>
              <div className="divide-y hairline/60">
                {engineHealth.map(s => (
                  <div key={s.name} className="px-4 py-2.5 flex items-center gap-3">
                    <span className={s.status === 'Operational' ? 'text-[#00FF88]' : 'text-[#FFB800]'}>{s.icon}</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-medium">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">p99 latency {s.latency}</p>
                    </div>
                    <Tag color={s.status === 'Operational' ? 'green' : 'gold'}>{s.status}</Tag>
                  </div>
                ))}
                <div className="px-4 py-3 flex items-center gap-4 text-[10.5px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Server size={11} /> 24 nodes</span>
                  <span className="flex items-center gap-1.5"><Database size={11} /> replicas in sync</span>
                  <span className="flex items-center gap-1.5"><Globe2 size={11} /> 4 regions</span>
                  <span className="flex items-center gap-1.5"><Lock size={11} /> HSM active</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ------------------------------- USERS -------------------------------- */}
      {mod === 'users' && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b hairline">
            <p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">User Management <span className="text-muted-foreground text-[11px] font-normal">· 184,732 total</span></p>
            <div className="flex items-center gap-1.5 rounded-lg border hairline bg-[#081221] px-2.5 h-8 w-56">
              <Search size={12} className="text-muted-foreground" />
              <input value={userQuery} onChange={e => setUserQuery(e.target.value)} placeholder="Search users…" className="bg-transparent outline-none text-[11.5px] w-full" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="bx-table">
              <thead><tr><th>ID</th><th>User</th><th>Country</th><th>KYC</th><th>30d Volume</th><th>Risk</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td className="text-slate-400 text-[11px]">{u.id}</td>
                    <td><p className="font-medium text-[12px]">{u.name}</p><p className="text-[10px] text-muted-foreground">{u.email}</p></td>
                    <td>{u.country}</td>
                    <td><Tag color={u.kyc === 'Unverified' ? 'gray' : u.kyc === 'Tier 3' ? 'gold' : 'blue'}>{u.kyc}</Tag></td>
                    <td className="tabular">${fmtNum(u.volume)}</td>
                    <td><Tag color={u.risk === 'high' ? 'red' : u.risk === 'medium' ? 'gold' : 'green'}>{u.risk}</Tag></td>
                    <td><Tag color={u.status === 'Active' ? 'green' : u.status === 'Frozen' ? 'gold' : 'red'}>{u.status}</Tag></td>
                    <td>
                      <div className="flex gap-1.5">
                        <button className="text-[10.5px] text-[#33B5FF] hover:underline" onClick={() => toast.success('Viewing user', u.name)}>View</button>
                        <button className="text-[10.5px] text-[#FF6B6B] hover:underline" onClick={() => toast.success('Action applied', `${u.name} suspended`)}>Suspend</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* -------------------------------- KYC --------------------------------- */}
      {mod === 'kyc' && (
        <div className="grid lg:grid-cols-2 gap-3">
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b hairline flex justify-between items-center">
              <p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">KYC Verification Queue</p>
              <Tag color="gold">{KYC_QUEUE.filter(k => k.status === 'Pending').length} pending</Tag>
            </div>
            <div className="divide-y hairline/60">
              {KYC_QUEUE.map(k => (
                <div key={k.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium">{k.user} <span className="text-[10px] text-muted-foreground">· {k.id}</span></p>
                    <p className="text-[10.5px] text-muted-foreground">{k.doc} · submitted {k.submitted}</p>
                  </div>
                  <Tag color={k.tier === 'Tier 3' ? 'gold' : 'blue'}>{k.tier}</Tag>
                  {k.status === 'Pending' ? (
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-7 text-[10.5px] bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/35 hover:bg-[#00FF88]/25"
                        onClick={() => toast.success('KYC approved', `${k.user} → ${k.tier}`)}><CheckCircle2 size={11} /></Button>
                      <Button size="sm" className="h-7 text-[10.5px] bg-[#FF4D4D]/12 text-[#FF6B6B] border border-[#FF4D4D]/35 hover:bg-[#FF4D4D]/25"
                        onClick={() => toast.success('KYC rejected', `${k.user} notified`)}><XCircle size={11} /></Button>
                    </div>
                  ) : <Tag color={k.status === 'Approved' ? 'green' : 'gold'}>{k.status}</Tag>}
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b hairline flex justify-between items-center">
              <p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Withdrawal Approvals</p>
              <Tag color="red">{WITHDRAWALS_QUEUE.filter(w => w.status === 'Pending').length} awaiting</Tag>
            </div>
            <div className="divide-y hairline/60">
              {WITHDRAWALS_QUEUE.map(w => (
                <div key={w.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium">{w.user} <span className="tabular text-[#FFD35C]">{w.amount} {w.asset}</span></p>
                    <p className="text-[10.5px] text-muted-foreground">{w.network} · {w.id} · risk: {w.risk}</p>
                  </div>
                  {w.status === 'Pending' ? (
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-7 text-[10px] bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/35" onClick={() => toast.success('Withdrawal approved', w.id)}>Approve</Button>
                      <Button size="sm" className="h-7 text-[10px] bg-[#FF4D4D]/12 text-[#FF6B6B] border border-[#FF4D4D]/35" onClick={() => toast.success('Withdrawal rejected', w.id)}>Reject</Button>
                    </div>
                  ) : <Tag color="green">{w.status}</Tag>}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ------------------------------ WALLETS ------------------------------- */}
      {mod === 'wallets' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatCard label="Hot Wallet" value="$41.2M" icon={<Wallet2 size={15} />} accent="gold" sub="4.1% of total assets" />
            <StatCard label="Cold Storage" value="$962.8M" icon={<Lock size={15} />} accent="blue" sub="MPC sharded · 3 regions" />
            <StatCard label="Proof of Reserves" value="102.4%" icon={<ShieldCheck size={15} />} accent="green" sub="last attestation: today" />
            <StatCard label="Daily Flows" value="+$8.4M net" icon={<Activity size={15} />} accent="violet" sub="in $31.2M · out $22.8M" />
          </div>
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b hairline"><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Asset Custody Breakdown</p></div>
            <div className="overflow-x-auto">
              <table className="bx-table">
                <thead><tr><th>Asset</th><th>Total Held</th><th>Hot</th><th>Cold</th><th>Coverage</th><th>Chain</th></tr></thead>
                <tbody>
                  {[
                    ['BTC', '14,284.22', '284.2', '14,000.02'], ['ETH', '188,421.9', '4,921.9', '183,500'], ['USDT', '412.8M', '31.2M', '381.6M'],
                    ['SOL', '1.24M', '62K', '1.18M'], ['BNB', '412.8K', '12.8K', '400K'],
                  ].map(([a, t, h, c]) => (
                    <tr key={a}>
                      <td className="font-semibold">{a}</td>
                      <td className="tabular">{t}</td>
                      <td className="tabular text-[#FFD35C]">{h}</td>
                      <td className="tabular text-slate-300">{c}</td>
                      <td><Tag color="green">102%+</Tag></td>
                      <td><Tag color="blue">Multi-chain</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ------------------------------- ENGINE ------------------------------- */}
      {mod === 'engine' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatCard label="Orders / sec" value="48,214" icon={<Cpu size={15} />} accent="blue" sub="peak capacity 2.4M" />
            <StatCard label="Match Latency" value="0.42ms" icon={<Activity size={15} />} accent="green" sub="p99 · colo cluster" />
            <StatCard label="Open Orders" value="1.24M" icon={<ListPlus size={15} />} accent="gold" sub="across all books" />
            <StatCard label="Cancellations" value="82.4%" icon={<Percent size={15} />} accent="violet" sub="HFT typical ratio" />
          </div>
          <GlassCard>
            <SectionTitle title="Engine Controls" sub="Super admin overrides" icon={<Cpu size={15} />} />
            <div className="grid sm:grid-cols-2 gap-2.5">
              {[
                ['Matching engine', true], ['New user registrations', cmsFlags.newRegs], ['Futures trading', true], ['Options trading', true],
              ].map(([label, on], i) => (
                <div key={label as string} className="flex items-center justify-between rounded-lg bg-[#0B1A30]/60 border hairline px-3.5 py-3">
                  <div>
                    <p className="text-[12.5px] font-medium">{label as string}</p>
                    <p className="text-[10px] text-muted-foreground">{i === 0 ? 'Core order matching service' : i === 1 ? 'Public signups' : 'Derivatives modules'}</p>
                  </div>
                  <Switch checked={on as boolean} onCheckedChange={v => toast.success(`${label} ${v ? 'enabled' : 'disabled'}`)} />
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b hairline"><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Market Feed Health</p></div>
            <div className="overflow-x-auto">
              <table className="bx-table">
                <thead><tr><th>Symbol</th><th>Last Price</th><th>24h</th><th>Feed Lag</th><th>Book Integrity</th></tr></thead>
                <tbody>
                  {pairs.slice(0, 8).map(p => (
                    <tr key={p.id}>
                      <td className="font-semibold text-[11.5px]">{p.symbol}</td>
                      <td className="tabular">${fmtPrice(p.price)}</td>
                      <td><PctBadge value={change24h(p)} size="sm" /></td>
                      <td className="tabular text-[#00FF88]">{(2 + (p.id.length % 4) * 3).toFixed(0)}ms</td>
                      <td><Tag color="green"><CheckCircle2 size={9} /> Consistent</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ------------------------- LISTINGS / LIQUIDITY ------------------------ */}
      {mod === 'listings' && (
        <div className="grid lg:grid-cols-2 gap-3">
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b hairline"><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Listing Applications</p></div>
            <div className="divide-y hairline/60">
              {[
                { proj: 'HyperScale DAO', ticker: 'HSD', stage: 'Due diligence', score: 86 },
                { proj: 'PayFi Grid', ticker: 'PFG', stage: 'Tech review', score: 74 },
                { proj: 'GreenHash', ticker: 'GRH', stage: 'Legal review', score: 68 },
                { proj: 'MetaMint Labs', ticker: 'MML', stage: 'Submitted', score: 41 },
              ].map(l => (
                <div key={l.ticker} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00A3FF]/10 border border-[#00A3FF]/25 text-[#33B5FF] text-[10px] font-bold flex items-center justify-center">{l.ticker}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium">{l.proj}</p>
                    <p className="text-[10.5px] text-muted-foreground">{l.stage}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-[12px] font-semibold tabular', l.score > 75 ? 'text-[#00FF88]' : l.score > 55 ? 'text-[#FFD35C]' : 'text-[#FF6B6B]')}>{l.score}/100</p>
                    <p className="text-[9.5px] text-muted-foreground">listing score</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] border-[#00A3FF]/40 text-[#33B5FF]" onClick={() => toast.success('Review advanced', l.proj)}>Review</Button>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b hairline flex items-center justify-between">
              <p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Active Markets</p>
              <Tag color="blue">{pairs.length} pairs</Tag>
            </div>
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto scroll-thin">
              <table className="bx-table">
                <thead><tr><th>Market</th><th>Volume 24h</th><th>Trend</th><th>Status</th></tr></thead>
                <tbody>
                  {pairs.map(p => (
                    <tr key={p.id}>
                      <td className="font-semibold text-[11.5px]">{p.symbol}</td>
                      <td className="tabular">{fmtUsd(p.volQuote, true)}</td>
                      <td><Sparkline data={Array.from({ length: 12 }, (_, i) => p.price * (1 + Math.sin(i + p.base.length) * 0.005))} w={70} h={20} /></td>
                      <td><Tag color="green">Listed</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {mod === 'liquidity' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatCard label="Aggregate Liquidity" value={fmtUsd(stats.liquidity)} icon={<Droplets size={15} />} accent="blue" sub="±2% order book depth" />
            <StatCard label="Avg Spread" value="0.018%" icon={<Percent size={15} />} accent="green" sub="top 20 pairs" />
            <StatCard label="MM Programs" value="12 active" icon={<Activity size={15} />} accent="gold" sub="3 pending onboarding" />
            <StatCard label="Slippage (10K)" value="0.008%" icon={<BarChart3 size={15} />} accent="violet" sub="BTC/USDT median" />
          </div>
          <GlassCard>
            <SectionTitle title="Market Maker Programs" sub="Rebate tiers & obligations" icon={<Droplets size={15} />} />
            <div className="overflow-x-auto">
              <table className="bx-table">
                <thead><tr><th>Program</th><th>Pair</th><th>Volume 30d</th><th>Maker Rebate</th><th>Uptime Obligation</th><th>Compliance</th></tr></thead>
                <tbody>
                  {[
                    ['Wintermute', 'BTC/USDT', '$412M', '-0.005%', '95%', 98], ['Jump Crypto', 'ETH/USDT', '$388M', '-0.005%', '95%', 97],
                    ['Flow Traders', 'SOL/USDT', '$142M', '-0.003%', '92%', 94], ['GSR', 'Alt books', '$96M', '-0.002%', '90%', 91],
                    ['B2C2', 'Cross', '$74M', '-0.002%', '88%', 87],
                  ].map(([m, pair, vol, reb, ob, comp]) => (
                    <tr key={m as string}>
                      <td className="font-semibold text-[12px]">{m as string}</td>
                      <td className="text-slate-300">{pair as string}</td>
                      <td className="tabular">{vol as string}</td>
                      <td className="tabular text-[#00FF88]">{reb as string}</td>
                      <td className="tabular">{ob as string}</td>
                      <td>
                        <div className="flex items-center gap-2 min-w-[110px]">
                          <div className="h-1.5 rounded-full bg-[#0B1A30] flex-1"><div className={cn('h-full rounded-full', (comp as number) > 95 ? 'bg-[#00FF88]' : 'bg-[#FFB800]')} style={{ width: `${comp}%` }} /></div>
                          <span className="text-[10px] tabular text-muted-foreground">{comp as number}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ------------------------------ REVENUE ------------------------------- */}
      {mod === 'revenue' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
            <StatCard label="Trading Fees" value="$142.8K" delta={12.1} icon={<BarChart3 size={15} />} accent="blue" sub="today" />
            <StatCard label="Funding Fees" value="$18.4K" delta={6.8} icon={<Activity size={15} />} accent="green" sub="futures" />
            <StatCard label="Launchpad" value="$12.2K" delta={31.4} icon={<ListPlus size={15} />} accent="gold" sub="listing + commit fees" />
            <StatCard label="Earn Spread" value="$8.1K" delta={4.2} icon={<Droplets size={15} />} accent="violet" sub="yield margin" />
            <StatCard label="OTC Desk" value="$3.9K" delta={-2.1} icon={<Landmark size={15} />} accent="red" sub="block fees" />
          </div>
          <GlassCard>
            <SectionTitle title="Revenue Trend" sub="Daily gross revenue · 30 days" right={<Tag color="green">+$428K today</Tag>} />
            <AreaChart data={revSeries} height={200} color="#00FF88" />
          </GlassCard>
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b hairline"><p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Fee Tiers</p></div>
            <div className="overflow-x-auto">
              <table className="bx-table">
                <thead><tr><th>Tier</th><th>30d Volume</th><th>Maker</th><th>Taker</th><th>Members</th></tr></thead>
                <tbody>
                  {[['VIP 0', '< $50K', '0.10%', '0.10%', '148.2K'], ['VIP 1', '$50K–$500K', '0.07%', '0.09%', '28.4K'], ['VIP 2', '$500K–$2M', '0.05%', '0.08%', '6.1K'], ['VIP 3', '$2M–$10M', '0.03%', '0.06%', '1.8K'], ['VIP 4', '> $10M', '0.00%', '0.045%', '228']].map(r => (
                    <tr key={r[0]}><td className="font-semibold">{r[0]}</td><td className="text-slate-300">{r[1]}</td><td className="tabular text-[#00FF88]">{r[2]}</td><td className="tabular">{r[3]}</td><td className="tabular">{r[4]}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ----------------------------- AFFILIATES ------------------------------ */}
      {mod === 'affiliates' && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Affiliate Payouts</p>
            <Tag color="gold">Monthly accrual: $86.4K</Tag>
          </div>
          <div className="overflow-x-auto">
            <table className="bx-table">
              <thead><tr><th>Affiliate</th><th>Referrals</th><th>Referred Volume 30d</th><th>Commission Rate</th><th>Accrued</th><th>Status</th></tr></thead>
              <tbody>
                {[
                  ['uzair-vip3', 5, '$942K', '38%', '$2,358'], ['kaiwen_alpha', 42, '$4.1M', '45%', '$12,884'], ['tradingnomad', 18, '$1.2M', '41%', '$3,412'],
                  ['cryptomom', 64, '$820K', '38%', '$2,140'], ['defiprincess', 9, '$310K', '36%', '$842'],
                ].map(r => (
                  <tr key={r[0] as string}>
                    <td className="font-medium text-[12px]">{r[0] as string}</td>
                    <td className="tabular">{r[1] as number}</td>
                    <td className="tabular">{r[2] as string}</td>
                    <td className="tabular text-[#00FF88]">{r[3] as string}</td>
                    <td className="tabular text-[#FFD35C] font-medium">{r[4] as string}</td>
                    <td><Tag color="green">Auto-paid</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* ------------------------------ SECURITY ------------------------------- */}
      {mod === 'security' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatCard label="Blocked Attacks" value="1,284" icon={<ShieldAlert size={15} />} accent="red" sub="24h · DDoS + bots" />
            <StatCard label="Suspicious Logins" value="37" icon={<Eye size={15} />} accent="gold" sub="step-up auth triggered" />
            <StatCard label="Frozen Accounts" value="2" icon={<Ban size={15} />} accent="violet" sub="pending compliance" />
            <StatCard label="WAF Rules" value="412" icon={<Lock size={15} />} accent="blue" sub="all active" />
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <GlassCard>
              <SectionTitle title="Security Event Feed" sub="Real-time SIEM stream" icon={<ShieldAlert size={15} className="text-[#FF4D4D]" />} />
              <div className="space-y-2">
                {[
                  ['CRITICAL', 'Credential stuffing wave from AS-9009 · 412 IPs auto-banned', '2m', 'red'],
                  ['HIGH', 'Impossible travel: U-10412 London → Lagos · step-up sent', '18m', 'gold'],
                  ['MEDIUM', 'API key rate limit breach · algo_queen (throttled)', '34m', 'gold'],
                  ['LOW', 'New withdrawal address added · email confirmed', '1h', 'green'],
                ].map(([lvl, msg, t, c]) => (
                  <div key={msg as string} className="flex items-start gap-2.5 rounded-lg border hairline bg-[#0B1A30]/50 p-2.5">
                    <Tag color={c as 'red' | 'gold' | 'green'}>{lvl as string}</Tag>
                    <p className="text-[11px] text-slate-300 flex-1 leading-relaxed">{msg as string}</p>
                    <span className="text-[9.5px] text-muted-foreground shrink-0">{t as string}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard>
              <SectionTitle title="Infrastructure Protections" sub="Defense-in-depth status" icon={<Lock size={15} />} />
              <div className="grid grid-cols-2 gap-2.5">
                {[['WAF + DDoS shield', true], ['HSM key custody', true], ['2FA enforcement', true], ['Withdrawal whitelist', true], ['Dark web monitoring', true], ['Bug bounty program', true]].map(([label, on]) => (
                  <div key={label as string} className="flex items-center justify-between rounded-lg bg-[#0B1A30]/60 border hairline px-3 py-2.5">
                    <p className="text-[11.5px] font-medium">{label as string}</p>
                    <Switch checked={on as boolean} onCheckedChange={() => toast.success('Protection updated')} />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">Penetration tested quarterly by Trail of Bits. Bug bounty up to $250K via Immunefi.</p>
            </GlassCard>
          </div>
        </div>
      )}

      {/* -------------------------------- AUDIT -------------------------------- */}
      {mod === 'audit' && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Admin Audit Trail</p>
            <Tag color="blue">Immutable · hash-chained</Tag>
          </div>
          <div className="overflow-x-auto">
            <table className="bx-table">
              <thead><tr><th>Time</th><th>Admin</th><th>Role</th><th>Action</th><th>Target</th><th>IP</th><th>Hash</th></tr></thead>
              <tbody>
                {AUDIT_LOGS.map(l => (
                  <tr key={l.id}>
                    <td className="tabular text-slate-400 text-[11px]">{l.time}</td>
                    <td className="font-medium text-[12px]">{l.admin}</td>
                    <td><Tag color={l.role === 'Super Admin' ? 'gold' : l.role === 'System' ? 'violet' : 'blue'}>{l.role}</Tag></td>
                    <td className="text-slate-300 text-[11.5px]">{l.action}</td>
                    <td className="text-slate-400 text-[11px]">{l.target}</td>
                    <td className="tabular text-slate-500 text-[10.5px]">{l.ip}</td>
                    <td className="tabular text-[10px] text-slate-600">0x{(l.id * 987654321).toString(16)}…{(l.id * 1234567).toString(16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* ------------------------------- SUPPORT ------------------------------- */}
      {mod === 'support' && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <p className="text-[13.5px] font-semibold font-[family-name:var(--font-display)]">Support Center Queue</p>
            <div className="flex gap-2 text-[10.5px] text-muted-foreground">
              <span>Open: <span className="text-[#FFD35C]">14</span></span>
              <span>Escalated: <span className="text-[#FF6B6B]">2</span></span>
              <span>Avg first response: <span className="text-[#00FF88]">1h 42m</span></span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="bx-table">
              <thead><tr><th>Ticket</th><th>User</th><th>Subject</th><th>Priority</th><th>Status</th><th>Agent</th><th></th></tr></thead>
              <tbody>
                {TICKETS_ADMIN.map(t => (
                  <tr key={t.id}>
                    <td className="text-slate-400 text-[11px]">{t.id}</td>
                    <td className="font-medium text-[12px]">{t.user}</td>
                    <td className="text-slate-300 text-[11.5px] max-w-[260px] truncate">{t.subject}</td>
                    <td><Tag color={t.priority === 'Urgent' ? 'red' : t.priority === 'High' ? 'gold' : 'blue'}>{t.priority}</Tag></td>
                    <td><Tag color={t.status === 'In Progress' ? 'gold' : t.status === 'Escalated' ? 'red' : 'gray'}>{t.status}</Tag></td>
                    <td className="text-slate-400 text-[11px]">{t.agent}</td>
                    <td><button className="text-[10.5px] text-[#33B5FF] hover:underline" onClick={() => toast.success('Ticket opened', t.id)}>Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* --------------------------------- CMS --------------------------------- */}
      {mod === 'cms' && (
        <div className="grid lg:grid-cols-2 gap-3">
          <GlassCard>
            <SectionTitle title="Platform Switches" sub="Public-facing availability" icon={<FileText size={15} />} />
            <div className="space-y-2.5">
              {[
                ['Maintenance mode', cmsFlags.maintenance, 'Show maintenance banner globally'],
                ['New registrations', cmsFlags.newRegs, 'Allow public signups'],
                ['Referral program', cmsFlags.referrals, 'Affiliate signups & payouts'],
                ['OTC desk requests', cmsFlags.otc, 'Institutional block trading'],
              ].map(([label, val, desc]) => (
                <div key={label as string} className="flex items-center justify-between rounded-lg bg-[#0B1A30]/60 border hairline px-3.5 py-3">
                  <div><p className="text-[12.5px] font-medium">{label as string}</p><p className="text-[10px] text-muted-foreground">{desc as string}</p></div>
                  <Switch checked={val as boolean} onCheckedChange={v => { setCmsFlags(f => ({ ...f, [label === 'Maintenance mode' ? 'maintenance' : label === 'New registrations' ? 'newRegs' : label === 'Referral program' ? 'referrals' : 'otc']: v })); toast.success(`${label} ${v ? 'enabled' : 'disabled'}`); }} />
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard>
            <SectionTitle title="Announcement Banner" sub="Shown on all trading pages" icon={<FileText size={15} />} />
            <div className="rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Message</p>
              <input defaultValue="🎉 ZERO-FEE SPOT WEEKEND — All spot pairs trade at 0% maker & taker fees until Sunday 23:59 UTC."
                className="w-full bg-transparent outline-none text-[12px]" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              <div className="rounded-lg border hairline px-3 py-2"><p className="text-[9.5px] uppercase text-muted-foreground">Type</p><p className="text-[12px] mt-0.5">Promotion · Gold</p></div>
              <div className="rounded-lg border hairline px-3 py-2"><p className="text-[9.5px] uppercase text-muted-foreground">Schedule</p><p className="text-[12px] mt-0.5">Now → Sunday 23:59 UTC</p></div>
            </div>
            <Button className="w-full h-9 mt-3 text-[12px] font-bold bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] border-0"
              onClick={() => toast.success('Banner published', 'Live on all trading pages')}>Publish Banner</Button>
            <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">CMS changes are audit-logged and take effect within 30 seconds via edge cache invalidation.</p>
          </GlassCard>
        </div>
      )}

      <div className="flex items-center justify-between text-[10.5px] text-muted-foreground">
        <span>Admin session · MFA verified · all actions are audit-logged</span>
        <button className="hover:text-[#33B5FF]" onClick={() => navigate('dashboard')}>Return to trading dashboard →</button>
      </div>
    </div>
  );
}
