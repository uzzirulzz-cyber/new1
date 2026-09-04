'use client';

import React, { useState } from 'react';
import { Copy, BadgeCheck, Users, Trophy, Flame, Target, X } from 'lucide-react';
import { useExchange } from '@/lib/store';
import { COPY_TRADERS, fmtUsd, fmtNum } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { GlassCard, StatCard, Tag, Sparkline as _S } from '@/components/shared';
import { Sparkline } from '@/components/charts';

export default function CopyTradingView() {
  const { copies, toggleCopy } = useExchange();
  const [active, setActive] = useState<string | null>(null);
  const [alloc, setAlloc] = useState('500');
  const [filter, setFilter] = useState<'all' | 'Low' | 'Medium' | 'High'>('all');

  const trader = COPY_TRADERS.find(t => t.id === active);
  const list = COPY_TRADERS.filter(t => filter === 'all' || t.risk === filter);
  const copied = COPY_TRADERS.filter(t => copies[t.id]);

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Copy Trading</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Mirror verified lead traders with automated risk controls</p>
        </div>
        <Tag color="gold"><Flame size={10} /> Profit share from 10% · cancel anytime</Tag>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard label="Your Copy Allocation" value={fmtUsd(copied.reduce((s, t) => s + (copies[t.id] ?? 0), 0))} icon={<Copy size={15} />} accent="blue" sub={`${copied.length} active leaders`} />
        <StatCard label="Copy PnL (30d)" value="+$412.60" delta={8.6} icon={<Trophy size={15} />} accent="green" sub="auto-settled daily" />
        <StatCard label="Top Leader ROI" value="+61.4%" icon={<Flame size={15} />} accent="gold" sub="@bullmomentum 30d" />
        <StatCard label="Total Copiers" value="32.3K" icon={<Users size={15} />} accent="violet" sub="on platform" />
      </div>

      {/* Active copies */}
      {copied.length > 0 && (
        <GlassCard>
          <p className="text-[13px] font-semibold font-[family-name:var(--font-display)] mb-2.5 flex items-center gap-2"><BadgeCheck size={14} className="text-[#00FF88]" /> Your Active Copies</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {copied.map(t => (
              <div key={t.id} className="rounded-lg border border-[#00FF88]/25 bg-[#00FF88]/[0.04] p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}55` }}>{t.initials}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold truncate">{t.name}</p>
                  <p className="text-[10.5px] text-muted-foreground">Allocated ${fmtNum(copies[t.id])} · ROI +{t.roi30d}%</p>
                </div>
                <button onClick={() => { toggleCopy(t.id, 0); toast('Copy stopped', `${t.name} is no longer being copied.`); }}
                  className="text-[10px] text-[#FF6B6B] border border-[#FF4D4D]/30 rounded-md px-2 py-1 hover:bg-[#FF4D4D]/10 transition-colors">Stop</button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Risk filter */}
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] text-muted-foreground">Risk profile:</span>
        {(['all', 'Low', 'Medium', 'High'] as const).map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={cn('rounded-md px-3 py-1.5 text-[11.5px] border transition-colors',
              filter === r ? 'bg-[#00A3FF]/15 text-[#33B5FF] border-[#00A3FF]/40' : 'text-slate-400 hairline hover:text-white')}>{r === 'all' ? 'All' : r}</button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {list.sort((a, b) => b.roi30d - a.roi30d).map((t, i) => (
          <GlassCard key={t.id} hover className="relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-28 h-28 blur-3xl rounded-full opacity-25" style={{ background: t.color }} />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold"
                    style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}55`, boxShadow: `0 0 16px ${t.color}33` }}>
                    {t.initials}
                  </div>
                  {i < 3 && <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-[#FFD35C] to-[#FFB800] text-[9px] font-bold text-[#181200] flex items-center justify-center">#{i + 1}</span>}
                </div>
                <div>
                  <p className="text-[13px] font-semibold flex items-center gap-1.5">{t.name} {t.verified && <BadgeCheck size={13} className="text-[#33B5FF]" />}</p>
                  <p className="text-[10.5px] text-muted-foreground">{t.handle} · {t.specialty}</p>
                </div>
              </div>
              <Tag color={t.risk === 'Low' ? 'green' : t.risk === 'Medium' ? 'gold' : 'red'}>{t.risk} risk</Tag>
            </div>
            <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-[#0B1A30]/60 border hairline py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">30d ROI</p>
                <p className="text-[13.5px] font-bold text-[#00FF88] tabular">+{t.roi30d}%</p>
              </div>
              <div className="rounded-lg bg-[#0B1A30]/60 border hairline py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Win rate</p>
                <p className="text-[13.5px] font-bold tabular">{t.winRate}%</p>
              </div>
              <div className="rounded-lg bg-[#0B1A30]/60 border hairline py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Copiers</p>
                <p className="text-[13.5px] font-bold tabular">{fmtNum(t.copiers)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9.5px] text-muted-foreground uppercase tracking-wider">AUM · {t.aum ? fmtUsd(t.aum) : ''}</p>
                <p className="text-[10.5px] text-muted-foreground">Profit share {t.profitShare}%</p>
              </div>
              <Sparkline data={t.chart} w={110} h={34} />
            </div>
            <Button onClick={() => { setActive(t.id); setAlloc('500'); }}
              className={cn('w-full mt-3.5 h-9 text-[12px] font-bold border-0',
                copies[t.id] ? 'bg-[#0B1A30] border border-[#FF4D4D]/40 text-[#FF6B6B]' : 'bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] shadow-[0_0_18px_rgba(0,163,255,0.3)]')}>
              {copies[t.id] ? 'Stop Copying' : 'Copy Trader'}
            </Button>
          </GlassCard>
        ))}
      </div>

      {/* Copy dialog */}
      <Dialog open={!!trader} onOpenChange={o => !o && setActive(null)}>
        <DialogContent className="glass max-w-sm border-[#00A3FF]/30">
          {trader && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[15px]">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: `${trader.color}22`, color: trader.color, border: `1px solid ${trader.color}55` }}>{trader.initials}</span>
                  Copy {trader.name}
                </DialogTitle>
                <DialogDescription className="text-[11.5px]">
                  {trader.handle} · {trader.specialty} · 30d ROI +{trader.roi30d}% · win rate {trader.winRate}%
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-muted-foreground">Allocation (USDT)</span>
                    <span className="tabular font-semibold">${alloc}</span>
                  </div>
                  <input value={alloc} onChange={e => setAlloc(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric"
                    className="w-full rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5 text-[13px] tabular outline-none focus:border-[#00A3FF]/50" />
                  <div className="flex gap-1.5 mt-2">
                    {[100, 500, 1000, 2500].map(v => (
                      <button key={v} onClick={() => setAlloc(String(v))} className="flex-1 text-[10.5px] rounded-md border hairline py-1.5 text-muted-foreground hover:text-[#33B5FF] hover:border-[#00A3FF]/40 transition-colors">${v}</button>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border hairline bg-[#0B1A30]/60 p-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Profit share</span><span className="tabular">{trader.profitShare}% of profits</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Max position</span><span className="tabular">20% of allocation</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Stop-loss safety</span><span className="text-[#00FF88]">Enabled</span></div>
                </div>
                <Button className="w-full h-10 bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-bold border-0"
                  onClick={() => { toggleCopy(trader.id, parseInt(alloc) || 500); setActive(null); toast.success('Copy started', `Now mirroring ${trader.name} with $${alloc} allocation`); }}>
                  <Copy size={14} /> Start Copying — ${alloc}
                </Button>
                <p className="text-[10px] text-muted-foreground leading-relaxed"><Target size={9} className="inline mr-1" />Past performance does not guarantee future results. Your capital is at risk.</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
