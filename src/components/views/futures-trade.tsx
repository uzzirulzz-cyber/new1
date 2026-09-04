'use client';

import React, { useMemo, useState } from 'react';
import { Gauge, Calculator, Flame, ShieldAlert } from 'lucide-react';
import { useExchange } from '@/lib/store';
import { change24h, fmtPrice, fmtAmt, fmtUsd, fmtMoney } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { PairListPanel, OrderBookPanel, ChartPanel, PairHeader } from './trade-shared';
import { GlassCard, Tag, StatCard } from '@/components/shared';

const LEVERAGES = [2, 5, 10, 20, 25, 50, 75, 125];

export default function FuturesTradeView() {
  const { pairMap, positions, openPosition, closePosition, balances, pairQuotes, books, setSeedPair } = useExchange();
  const [pairId, setPairId] = useState('btc');
  const [side, setSide] = useState<'Long' | 'Short'>('Long');
  const [leverage, setLeverage] = useState(10);
  const [marginMode, setMarginMode] = useState<'Cross' | 'Isolated'>('Cross');
  const [notional, setNotional] = useState('1000');
  const [liqCalc, setLiqCalc] = useState({ entry: '65000', lev: '10', side: 'Long' as 'Long' | 'Short' });

  const pair = pairMap[pairId];
  const price = pair?.price ?? 0;
  const ch = pair ? change24h(pair) : 0;
  const dir = pairQuotes[pairId]?.dir ?? 0;

  const funding = useMemo(() => {
    const base = (ch >= 0 ? 1 : -1) * (0.0042 + Math.abs(Math.sin(Date.now() / 1e7)) * 0.008);
    return base;
  }, [ch]);
  const nextFundingIn = useMemo(() => {
    const h = 8 - (new Date().getUTCHours() % 8);
    const m = 60 - new Date().getUTCMinutes();
    return `${h - (m === 60 ? 0 : 1)}h ${m === 60 ? 0 : m}m`;
  }, []);

  const notionalVal = parseFloat(notional) || 0;
  const margin = notionalVal / leverage;
  const liqPrice = side === 'Long'
    ? price * (1 - 1 / leverage * (marginMode === 'Cross' ? 0.92 : 1))
    : price * (1 + 1 / leverage * (marginMode === 'Cross' ? 0.92 : 1));
  const avail = balances.USDT?.free ?? 0;

  // open positions metrics
  const posMetrics = useMemo(() => {
    let upnl = 0, marginUsed = 0, notionalOpen = 0;
    for (const p of positions) {
      const cur = pairMap[p.pairId]?.price ?? p.entry;
      const pnl = (p.side === 'Long' ? cur - p.entry : p.entry - cur) * p.amount;
      upnl += pnl; marginUsed += p.margin; notionalOpen += p.amount * p.entry;
    }
    const acctEquity = avail + marginUsed + upnl;
    const marginRatio = acctEquity > 0 ? (marginUsed / acctEquity) * 100 : 0;
    return { upnl, marginUsed, notionalOpen, marginRatio, acctEquity };
  }, [positions, pairMap, avail]);

  const submitPosition = () => {
    if (notionalVal < 10) { toast.error('Min order size', 'Minimum notional is 10 USDT.'); return; }
    if (margin > avail) { toast.error('Insufficient margin', 'Reduce notional or leverage.'); return; }
    openPosition({
      pairId, symbol: pair.symbol, side, leverage, marginMode,
      entry: price, amount: notionalVal / price, margin, liq: liqPrice,
    });
    toast.success(`${side} opened`, `${pair.symbol} ${leverage}x · ${fmtAmt(notionalVal / price)} ${pair.base} @ ${fmtPrice(price)}`);
  };

  // liquidation calculator
  const lcEntry = parseFloat(liqCalc.entry) || 0;
  const lcLev = parseFloat(liqCalc.lev) || 1;
  const lcLiq = liqCalc.side === 'Long' ? lcEntry * (1 - 1 / lcLev) : lcEntry * (1 + 1 / lcLev);
  const lcRoiAtLiq = -100 * (0.9 + 0.1 / lcLev);

  const selectPair = (id: string) => { setPairId(id); setSeedPair(id); };

  return (
    <div className="p-2 md:p-3 space-y-2.5">
      {/* Risk stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard label="Account Equity" value={`$${fmtAmt(posMetrics.acctEquity)}`} icon={<Gauge size={15} />} accent="blue" sub="incl. unrealized PnL" />
        <StatCard label="Unrealized PnL" value={`${posMetrics.upnl >= 0 ? '+' : '-'}$${fmtMoney(Math.abs(posMetrics.upnl))}`} icon={<Flame size={15} />} accent={posMetrics.upnl >= 0 ? 'green' : 'red'} sub="across all positions" />
        <StatCard label="Margin Ratio" value={`${posMetrics.marginRatio.toFixed(1)}%`} icon={<ShieldAlert size={15} />} accent={posMetrics.marginRatio > 60 ? 'red' : 'gold'} sub={posMetrics.marginRatio > 60 ? 'High risk — reduce exposure' : 'Healthy buffer'} />
        <StatCard label="Open Notional" value={fmtUsd(posMetrics.notionalOpen)} icon={<Calculator size={15} />} accent="violet" sub={`${positions.length} positions`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_290px] gap-2.5">
        <div className="glass rounded-xl overflow-hidden h-[420px] lg:h-[540px] order-2 lg:order-1 lg:sticky lg:top-[104px]">
          <PairListPanel selected={pairId} onSelect={selectPair} />
        </div>

        <div className="glass rounded-xl overflow-hidden order-1 lg:order-2 flex flex-col">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 border-b hairline">
            <PairHeader pairId={pairId} />
            <div className="flex items-center gap-2 lg:hidden" />
          </div>
          {/* futures meta strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-2 border-b hairline bg-[#060E1C]/60 text-[11px]">
            <span className="text-muted-foreground">Funding / 8h: <span className={cn('tabular font-medium', funding >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>{(funding * 100).toFixed(4)}%</span></span>
            <span className="text-muted-foreground">Countdown: <span className="text-slate-200 tabular">{nextFundingIn}</span></span>
            <span className="text-muted-foreground">Max Lev: <span className="text-[#FFD35C] font-medium">{pair?.leverageMax}×</span></span>
            <span className="text-muted-foreground">Open Interest: <span className="text-slate-200 tabular">{fmtUsd(pair ? pair.volQuote * 0.42 : 0)}</span></span>
          </div>
          <ChartPanel pairId={pairId} height={430} showRSIToggle />
        </div>

        {/* Futures order panel */}
        <div className="glass rounded-xl overflow-hidden order-3 flex flex-col max-h-[640px]">
          <div className="grid grid-cols-2 p-2.5 gap-2 shrink-0">
            {(['Long', 'Short'] as const).map(s => (
              <button key={s} onClick={() => setSide(s)}
                className={cn('rounded-lg py-2 text-[13px] font-bold transition-all border',
                  side === s
                    ? s === 'Long' ? 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40 shadow-[0_0_18px_rgba(0,255,136,0.15)]' : 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/40 shadow-[0_0_18px_rgba(255,77,77,0.15)]'
                    : 'text-muted-foreground border-transparent hover:text-white')}>
                {s}
              </button>
            ))}
          </div>
          <div className="px-3 pb-2 flex gap-2 shrink-0">
            <div className="flex-1 rounded-lg border hairline overflow-hidden grid grid-cols-2 text-[11px]">
              {(['Cross', 'Isolated'] as const).map(m => (
                <button key={m} onClick={() => setMarginMode(m)}
                  className={cn('py-1.5 font-medium transition-colors', marginMode === m ? 'bg-[#00A3FF]/15 text-[#33B5FF]' : 'text-muted-foreground hover:text-white')}>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex-1 rounded-lg border border-[#FFB800]/35 bg-[#FFB800]/8 px-2 flex items-center justify-center gap-1.5">
              <span className="text-[11px] text-[#FFD35C] font-semibold tabular">{leverage}x</span>
              <span className="text-[9.5px] text-muted-foreground">leverage</span>
            </div>
          </div>
          <div className="px-3 pb-2 shrink-0">
            <Slider value={[LEVERAGES.indexOf(leverage)]} onValueChange={([i]) => setLeverage(LEVERAGES[Math.min(i, LEVERAGES.length - 1)])}
              max={LEVERAGES.length - 1} step={1} />
            <div className="flex justify-between mt-1.5">
              {LEVERAGES.map(l => (
                <button key={l} onClick={() => setLeverage(l)}
                  className={cn('text-[9.5px] tabular rounded px-1', leverage === l ? 'text-[#FFD35C] font-bold' : 'text-muted-foreground hover:text-white')}>{l}x</button>
              ))}
            </div>
          </div>
          <div className="px-3 pb-3 space-y-2.5 flex-1 overflow-y-auto scroll-thin">
            <div className="rounded-lg bg-[#0B1A30]/80 border hairline px-3 py-1.5">
              <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Market Price</p>
              <p className={cn('text-[12.5px] tabular font-medium', dir >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>{fmtPrice(price)}</p>
            </div>
            <div className="rounded-lg bg-[#0B1A30]/80 border hairline px-3 py-1.5 focus-within:border-[#00A3FF]/50">
              <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Notional (USDT)</p>
              <input value={notional} onChange={e => setNotional(e.target.value)} inputMode="decimal"
                className="w-full bg-transparent outline-none text-[12.5px] tabular" />
            </div>
            <div className="flex gap-1.5">
              {[100, 500, 1000, 5000].map(v => (
                <button key={v} onClick={() => setNotional(String(v))}
                  className="flex-1 text-[10px] rounded-md border hairline py-1 text-muted-foreground hover:text-[#33B5FF] hover:border-[#00A3FF]/40 transition-colors tabular">{v}</button>
              ))}
            </div>
            <div className="rounded-lg bg-[#0B1A30]/60 border hairline px-3 py-2 space-y-1 text-[11px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Required Margin</span><span className="tabular">${fmtAmt(margin)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span className="tabular">{fmtAmt(notionalVal / price)} {pair?.base}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Est. Liq. Price</span><span className={cn('tabular font-medium', side === 'Long' ? 'text-[#FF4D4D]' : 'text-[#FF4D4D]')}>{fmtPrice(liqPrice)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Funding Fee / 8h</span><span className="tabular">{(notionalVal * funding).toFixed(2)} USDT</span></div>
            </div>
            <Button onClick={submitPosition}
              className={cn('w-full h-10 text-[13px] font-bold tracking-wide border-0',
                side === 'Long' ? 'bg-gradient-to-r from-[#00E57F] to-[#00b35f] text-[#03150b] shadow-[0_0_22px_rgba(0,255,136,0.28)]' : 'bg-gradient-to-r from-[#FF6666] to-[#e03030] text-white shadow-[0_0_22px_rgba(255,77,77,0.28)]')}>
              {side} {pair?.base} {leverage}x
            </Button>
          </div>
        </div>
      </div>

      {/* Positions + book */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-2.5">
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b hairline">
            <p className="text-[13px] font-semibold font-[family-name:var(--font-display)]">Open Positions</p>
            <Tag color="gold">TP/SL managed by engine</Tag>
          </div>
          <div className="overflow-x-auto max-h-[260px]">
            {positions.length === 0 ? (
              <p className="text-center text-[12px] text-muted-foreground py-10">No open positions — open your first leveraged trade above.</p>
            ) : (
              <table className="bx-table">
                <thead><tr><th>Market</th><th>Side</th><th>Size</th><th>Entry</th><th>Mark</th><th>Liq.</th><th>Margin</th><th>uPnL (ROI)</th><th></th></tr></thead>
                <tbody>
                  {positions.map(p => {
                    const cur = pairMap[p.pairId]?.price ?? p.entry;
                    const pnl = (p.side === 'Long' ? cur - p.entry : p.entry - cur) * p.amount;
                    const roi = (pnl / p.margin) * 100;
                    return (
                      <tr key={p.id}>
                        <td className="font-semibold text-[11.5px]">
                          {p.symbol} <Tag color={p.marginMode === 'Cross' ? 'blue' : 'violet'} className="ml-1">{p.leverage}× {p.marginMode}</Tag>
                        </td>
                        <td className={p.side === 'Long' ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}>{p.side}</td>
                        <td className="tabular">{fmtAmt(p.amount)} {pairMap[p.pairId]?.base}</td>
                        <td className="tabular">{fmtPrice(p.entry)}</td>
                        <td className="tabular">{fmtPrice(cur)}</td>
                        <td className="tabular text-[#FF6B6B]">{fmtPrice(p.liq)}</td>
                        <td className="tabular">${fmtAmt(p.margin)}</td>
                        <td className={cn('tabular font-medium', pnl >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>
                          {pnl >= 0 ? '+' : '-'}${fmtMoney(Math.abs(pnl))} <span className="text-[10px] opacity-75">({roi >= 0 ? '+' : ''}{roi.toFixed(1)}%)</span>
                        </td>
                        <td><button onClick={() => { closePosition(p.id); toast.success('Position closed', `${p.symbol} settled at market`); }} className="text-[10.5px] text-[#FF6B6B] hover:underline">Close</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Liquidation calculator */}
        <GlassCard className="space-y-3">
          <div className="flex items-center gap-2">
            <Calculator size={14} className="text-[#FFD35C]" />
            <p className="text-[13px] font-semibold font-[family-name:var(--font-display)]">Liquidation Calculator</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[#0B1A30]/80 border hairline px-2.5 py-1.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Entry</p>
              <input value={liqCalc.entry} onChange={e => setLiqCalc(c => ({ ...c, entry: e.target.value }))} inputMode="decimal" className="w-full bg-transparent outline-none text-[12px] tabular" />
            </div>
            <div className="rounded-lg bg-[#0B1A30]/80 border hairline px-2.5 py-1.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Leverage</p>
              <input value={liqCalc.lev} onChange={e => setLiqCalc(c => ({ ...c, lev: e.target.value }))} inputMode="decimal" className="w-full bg-transparent outline-none text-[12px] tabular" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            {(['Long', 'Short'] as const).map(s => (
              <button key={s} onClick={() => setLiqCalc(c => ({ ...c, side: s }))}
                className={cn('rounded-md py-1.5 border transition-colors', liqCalc.side === s ? (s === 'Long' ? 'bg-[#00FF88]/12 text-[#00FF88] border-[#00FF88]/35' : 'bg-[#FF4D4D]/12 text-[#FF4D4D] border-[#FF4D4D]/35') : 'text-muted-foreground hairline hover:text-white')}>
                {s}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-[#FF4D4D]/30 bg-[#FF4D4D]/6 px-3 py-2.5 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Liquidation Price</p>
            <p className="text-xl font-semibold text-[#FF4D4D] tabular">{fmtPrice(lcLiq)}</p>
            <p className="text-[10.5px] text-muted-foreground">At liquidation your position ROI is {lcRoiAtLiq.toFixed(1)}% · maintenance margin 0.5%</p>
          </div>
          <div className="text-[10.5px] text-muted-foreground leading-relaxed">
            Risk metrics refresh in real time. Cross margin shares collateral across all positions; isolated caps loss at position margin.
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
