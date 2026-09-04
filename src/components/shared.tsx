'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { fmtPct } from '@/lib/market';

export function GlassCard({ className, children, gold, hover, ...rest }: React.HTMLAttributes<HTMLDivElement> & { gold?: boolean; hover?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl p-4',
        gold ? 'glass-gold' : 'glass',
        hover && 'transition-all duration-300 hover:border-[rgba(0,163,255,0.35)] hover:shadow-[0_0_30px_rgba(0,163,255,0.12)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ title, sub, right, icon }: { title: string; sub?: string; right?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <div className="text-neon">{icon}</div>}
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-display)] font-semibold text-[15px] tracking-wide truncate">{title}</h3>
          {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function PctBadge({ value, className, size = 'md' }: { value: number; className?: string; size?: 'sm' | 'md' }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium tabular',
        size === 'sm' ? 'text-[10.5px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
        up ? 'bg-[#00FF88]/10 text-[#00FF88]' : 'bg-[#FF4D4D]/10 text-[#FF4D4D]',
        className,
      )}
    >
      {up ? '▲' : '▼'} {fmtPct(Math.abs(value)).replace('+', '').replace('-', '')}
    </span>
  );
}

export function CoinIcon({ symbol, color, size = 32, className }: { symbol: string; color: string; size?: number; className?: string }) {
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold shrink-0', className)}
      style={{
        width: size, height: size, fontSize: size * 0.38,
        background: `radial-gradient(circle at 30% 30%, ${color}33, ${color}14)`,
        border: `1px solid ${color}55`,
        color, boxShadow: `0 0 12px ${color}22`,
      }}
    >
      {symbol.slice(0, symbol.length > 3 ? 2 : 1)}
    </div>
  );
}

export function StatCard({ label, value, delta, icon, accent = 'blue', sub, className }: {
  label: string; value: React.ReactNode; delta?: number; icon?: React.ReactNode;
  accent?: 'blue' | 'gold' | 'green' | 'red' | 'violet'; sub?: string; className?: string;
}) {
  const accents: Record<string, { text: string; ring: string; glow: string }> = {
    blue: { text: 'text-[#00A3FF]', ring: 'border-[#00A3FF]/25', glow: 'bg-[#00A3FF]/10' },
    gold: { text: 'text-[#FFB800]', ring: 'border-[#FFB800]/30', glow: 'bg-[#FFB800]/10' },
    green: { text: 'text-[#00FF88]', ring: 'border-[#00FF88]/25', glow: 'bg-[#00FF88]/10' },
    red: { text: 'text-[#FF4D4D]', ring: 'border-[#FF4D4D]/25', glow: 'bg-[#FF4D4D]/10' },
    violet: { text: 'text-[#9D7BFF]', ring: 'border-[#9D7BFF]/25', glow: 'bg-[#9D7BFF]/10' },
  };
  const a = accents[accent];
  return (
    <GlassCard hover className={cn('relative overflow-hidden group', className)}>
      <div className={cn('absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-25 group-hover:opacity-45 transition-opacity', a.glow)} />
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          <div className={cn('mt-1.5 font-[family-name:var(--font-display)] font-semibold text-xl md:text-[22px] tabular', a.text)}>{value}</div>
          <div className="mt-1 flex items-center gap-2">
            {delta !== undefined && (
              <span className={cn('text-[11px] font-medium tabular', delta >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>
                {delta >= 0 ? '+' : ''}{delta.toFixed(2)}%
              </span>
            )}
            {sub && <span className="text-[11px] text-muted-foreground truncate">{sub}</span>}
          </div>
        </div>
        {icon && (
          <div className={cn('shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center', a.ring, a.glow, a.text)}>
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function LiveBadge({ label = 'LIVE' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-[#00FF88]">
      <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#00FF88]" />
      {label}
    </span>
  );
}

export function Tag({ children, color = 'blue', className }: { children: React.ReactNode; color?: 'blue' | 'gold' | 'green' | 'red' | 'violet' | 'gray'; className?: string }) {
  const map = {
    blue: 'bg-[#00A3FF]/12 text-[#33B5FF] border-[#00A3FF]/30',
    gold: 'bg-[#FFB800]/12 text-[#FFD35C] border-[#FFB800]/35',
    green: 'bg-[#00FF88]/12 text-[#00FF88] border-[#00FF88]/30',
    red: 'bg-[#FF4D4D]/12 text-[#FF6B6B] border-[#FF4D4D]/30',
    violet: 'bg-[#9D7BFF]/12 text-[#B7A0FF] border-[#9D7BFF]/30',
    gray: 'bg-white/5 text-slate-300 border-white/10',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium', map[color], className)}>
      {children}
    </span>
  );
}

export function TickerTape({ pairs, change24h, fmtPrice, navigate }: {
  pairs: { id: string; symbol: string; price: number; color: string; dir?: 1 | -1 | 0 }[];
  change24h: (id: string) => number;
  fmtPrice: (n: number) => string;
  navigate: (r: unknown) => void;
}) {
  const row = (key: string) => (
    <div key={key} className="flex items-center gap-8 pr-8 shrink-0">
      {pairs.map(p => {
        const ch = change24h(p.id);
        const dir = p.dir ?? (ch >= 0 ? 1 : -1);
        return (
          <button key={p.id + key} className="flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={() => navigate('trade-spot')}>
            <span className="text-[11px] font-semibold text-slate-300">{p.symbol.replace('/USDT', '')}</span>
            <span className={cn('text-[11px] tabular font-medium', dir >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>${fmtPrice(p.price)}</span>
            <span className={cn('text-[10px] tabular', ch >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>{fmtPct(ch)}</span>
          </button>
        );
      })}
    </div>
  );
  return (
    <div className="relative overflow-hidden border-b hairline bg-[#060E1C]/80 backdrop-blur">
      <div className="flex w-max animate-ticker py-1.5">
        {row('a')}{row('b')}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#00A3FF]/8 border border-[#00A3FF]/20 flex items-center justify-center text-[#33B5FF] mb-3">
        {icon}
      </div>
      <p className="font-medium text-sm">{title}</p>
      {body && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
