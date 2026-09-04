'use client';

import React, { useMemo, useState } from 'react';
import { Star, Search } from 'lucide-react';
import { useExchange } from '@/lib/store';
import { change24h, fmtPrice, fmtAmt, fmtTime, fmtUsd, fmtPct, fmtMoney, Candle, TIMEFRAMES, genCandles } from '@/lib/market';
import { cn } from '@/lib/utils';
import { CoinIcon, PctBadge, EmptyState, Tag } from '@/components/shared';
import { CandleChart, DepthChart } from '@/components/charts';

/* ------------------------------- Pair list ------------------------------- */
export function PairListPanel({ selected, onSelect, compact = false }: {
  selected: string; onSelect: (id: string) => void; compact?: boolean;
}) {
  const { pairs, watchlist, toggleWatch } = useExchange();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'all' | 'fav' | 'gainers'>('all');

  const list = useMemo(() => {
    let l = pairs;
    if (tab === 'fav') l = l.filter(p => watchlist.has(p.id));
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter(p => p.symbol.toLowerCase().includes(s) || p.name.toLowerCase().includes(s));
    }
    if (tab === 'gainers') l = [...l].sort((a, b) => change24h(b) - change24h(a));
    return l;
  }, [pairs, q, tab, watchlist]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-2.5 border-b hairline space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 rounded-md bg-[#0B1A30]/80 border hairline px-2 h-8">
          <Search size={12} className="text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search pair"
            className="bg-transparent outline-none text-[12px] w-full placeholder:text-muted-foreground/70" />
        </div>
        <div className="grid grid-cols-3 gap-1 text-[11px]">
          {(['all', 'fav', 'gainers'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('rounded-md py-1 capitalize transition-colors', tab === t ? 'bg-[#00A3FF]/15 text-[#33B5FF] border border-[#00A3FF]/30' : 'text-muted-foreground hover:text-white border border-transparent')}>
              {t === 'fav' ? '★ Favorites' : t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin min-h-0">
        {list.map(p => {
          const ch = change24h(p);
          const active = selected === p.id;
          return (
            <div key={p.id} onClick={() => onSelect(p.id)}
              className={cn('group flex items-center gap-2 px-2.5 py-2 cursor-pointer border-l-2 transition-all',
                active ? 'bg-[#00A3FF]/10 border-[#00A3FF]' : 'border-transparent hover:bg-white/[0.03]')}>
              <Star size={11} onClick={e => { e.stopPropagation(); toggleWatch(p.id); }}
                className={cn('shrink-0 transition-colors', watchlist.has(p.id) ? 'text-[#FFB800] fill-[#FFB800]' : 'text-slate-600 hover:text-[#FFB800]')} />
              <div className="min-w-0 flex-1">
                <p className={cn('text-[12px] font-semibold truncate', active && 'text-[#33B5FF]')}>{p.symbol}</p>
                <p className="text-[10px] text-muted-foreground tabular">Vol {fmtUsd(p.volQuote, true)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11.5px] tabular font-medium">${fmtPrice(p.price)}</p>
                <p className={cn('text-[10px] tabular', ch >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>{fmtPct(ch)}</p>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-8">No pairs found</p>}
      </div>
      {!compact && (
        <div className="p-2.5 border-t hairline text-[10px] text-muted-foreground shrink-0">
          {pairs.length} markets · fees from 0.01%
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Order book ------------------------------- */
export function OrderBookPanel({ pairId, onSelectPrice }: { pairId: string; onSelectPrice?: (p: number) => void }) {
  const { books, pairMap, pairQuotes } = useExchange();
  const pair = pairMap[pairId];
  const book = books[pairId];
  if (!pair || !book) return null;
  const maxTotal = Math.max(book.asks[book.asks.length - 1]?.total ?? 1, book.bids[book.bids.length - 1]?.total ?? 1);
  const spread = book.asks[book.asks.length - 1].price - book.bids[0].price;
  const dir = pairQuotes[pairId]?.dir ?? 0;

  const Row = ({ level, side }: { level: { price: number; amount: number; total: number }; side: 'ask' | 'bid' }) => (
    <button onClick={() => onSelectPrice?.(level.price)}
      className="w-full grid grid-cols-[1.1fr_1fr_1fr] items-center px-2.5 py-[3.5px] text-[10.8px] tabular hover:bg-white/[0.04] relative">
      <div className={cn('absolute right-0 top-0 bottom-0', side === 'ask' ? 'bg-[#FF4D4D]/[0.09]' : 'bg-[#00FF88]/[0.09]')}
        style={{ width: `${(level.total / maxTotal) * 100}%` }} />
      <span className={cn('relative text-left', side === 'ask' ? 'text-[#FF4D4D]' : 'text-[#00FF88]')}>{fmtPrice(level.price)}</span>
      <span className="relative text-right text-slate-300">{fmtAmt(level.amount)}</span>
      <span className="relative text-right text-slate-500">{fmtAmt(level.total)}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="grid grid-cols-[1.1fr_1fr_1fr] px-2.5 py-1.5 text-[9.5px] uppercase tracking-wider text-muted-foreground border-b hairline shrink-0">
        <span>Price (USDT)</span><span className="text-right">Amount</span><span className="text-right">Total</span>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col justify-end min-h-0">
        {book.asks.slice(0, 11).map((l, i) => <Row key={`a${i}`} level={l} side="ask" />)}
      </div>
      <div className={cn('flex items-center justify-between px-2.5 py-1.5 border-y hairline transition-colors duration-300', dir > 0 ? 'flash-up' : dir < 0 ? 'flash-down' : '')}>
        <span className={cn('text-[15px] font-semibold tabular', dir >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>${fmtPrice(pair.price)}</span>
        <span className="text-[10px] text-muted-foreground">spread ${spread < 0.01 ? spread.toFixed(6) : spread.toFixed(2)}</span>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        {book.bids.slice(0, 11).map((l, i) => <Row key={`b${i}`} level={l} side="bid" />)}
      </div>
    </div>
  );
}

/* ----------------------------- Recent trades ----------------------------- */
export function RecentTradesPanel({ pairId }: { pairId: string }) {
  const { trades, pairMap } = useExchange();
  const pair = pairMap[pairId];
  const list = trades[pairId] ?? [];
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="grid grid-cols-3 px-2.5 py-1.5 text-[9.5px] uppercase tracking-wider text-muted-foreground border-b hairline shrink-0">
        <span>Price</span><span className="text-right">Amount</span><span className="text-right">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin min-h-0">
        {list.map(t => (
          <div key={t.id} className="grid grid-cols-3 px-2.5 py-[3.5px] text-[10.8px] tabular hover:bg-white/[0.03]">
            <span className={t.side === 'buy' ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}>{fmtPrice(t.price)}</span>
            <span className="text-right text-slate-300">{fmtAmt(t.amount)}</span>
            <span className="text-right text-slate-500">{fmtTime(t.time)}</span>
          </div>
        ))}
        {!pair && <EmptyState icon={null} title="Select a market" />}
      </div>
    </div>
  );
}

/* ------------------------------ Chart panel ------------------------------ */
export function ChartPanel({ pairId, height = 400, showRSIToggle = false }: { pairId: string; height?: number; showRSIToggle?: boolean }) {
  const { pairMap, candles } = useExchange();
  const pair = pairMap[pairId];
  const [tf, setTf] = useState(TIMEFRAMES[3]);
  const [showVolume, setShowVolume] = useState(true);
  const [showMA, setShowMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);

  const data: Candle[] = useMemo(() => {
    if (!pair) return [];
    if (tf.id === '1H') return candles[pairId] ?? [];
    return genCandles(pair, 110, tf.ms, pair.price);
  }, [pair, pairId, tf, candles]);

  if (!pair) return null;
  const ch = change24h(pair);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b hairline overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map(t => (
            <button key={t.id} onClick={() => setTf(t)}
              className={cn('px-2 py-1 rounded-md text-[11px] font-medium tabular transition-colors',
                tf.id === t.id ? 'bg-[#00A3FF]/15 text-[#33B5FF] border border-[#00A3FF]/30' : 'text-muted-foreground hover:text-white border border-transparent')}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {([['MA', showMA, setShowMA], ['VOL', showVolume, setShowVolume], ...(showRSIToggle ? [['RSI', showRSI, setShowRSI] as [string, boolean, (v: boolean) => void]] : [])] as [string, boolean, (v: boolean) => void][]).map(([label, val, set]) => (
            <button key={label} onClick={() => set(!val)}
              className={cn('px-2 py-1 rounded-md text-[10.5px] font-medium transition-colors', val ? 'text-[#FFD35C] bg-[#FFB800]/10 border border-[#FFB800]/25' : 'text-muted-foreground hover:text-white border border-transparent')}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <CandleChart candles={data} livePrice={pair.price} height={height - 42} pairName={pair.symbol} timeframeLabel={tf.label} showVolume={showVolume} showMA={showMA} showRSI={showRSI} />
    </div>
  );
}

/* --------------------------- Orders / history ---------------------------- */
export function OrdersTables({ pairId, showAllMarkets = false }: { pairId?: string; showAllMarkets?: boolean }) {
  const { openOrders, orderHistory, cancelOrder, pairMap } = useExchange();
  const [tab, setTab] = useState<'open' | 'history'>('open');
  const orders = tab === 'open' ? openOrders : orderHistory;
  const filtered = showAllMarkets || !pairId ? orders : orders.filter(o => o.pairId === pairId);

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-1 px-3 py-2 border-b hairline shrink-0">
        {(['open', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-3 py-1.5 rounded-md text-[11.5px] font-medium capitalize transition-colors', tab === t ? 'bg-[#00A3FF]/15 text-[#33B5FF] border border-[#00A3FF]/30' : 'text-muted-foreground hover:text-white border border-transparent')}>
            {t === 'open' ? `Open Orders (${showAllMarkets || !pairId ? openOrders.length : openOrders.filter(o => o.pairId === pairId).length})` : 'Order History'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto scroll-thin min-h-0 max-h-[240px]">
        {filtered.length === 0 ? (
          <EmptyState icon={<span className="text-lg">📋</span>} title={`No ${tab} orders`} body="Orders you place will appear here." />
        ) : (
          <table className="bx-table">
            <thead>
              <tr><th>Time</th><th>Market</th><th>Type</th><th>Side</th><th>Price</th><th>Amount</th><th>Total</th><th>Status</th>{tab === 'open' && <th></th>}</tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td className="text-slate-400 text-[11px]">{fmtTime(o.time)}</td>
                  <td className="font-semibold text-[11.5px]">{o.symbol}</td>
                  <td><Tag color={o.type === 'Limit' ? 'blue' : o.type === 'Market' ? 'green' : 'violet'}>{o.type}{o.stopPrice ? ` ${fmtPrice(o.stopPrice)}` : ''}</Tag></td>
                  <td className={o.side === 'Buy' ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}>{o.side}</td>
                  <td className="tabular">{fmtPrice(o.price)}</td>
                  <td className="tabular">{fmtAmt(o.amount)}</td>
                  <td className="tabular text-slate-300">${fmtMoney(o.total)}</td>
                  <td>
                    <Tag color={o.status === 'Filled' ? 'green' : o.status === 'Cancelled' ? 'gray' : 'gold'}>{o.status}</Tag>
                  </td>
                  {tab === 'open' && (
                    <td>
                      <button onClick={() => cancelOrder(o.id)} className="text-[10.5px] text-[#FF6B6B] hover:underline">Cancel</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Pair header block --------------------------- */
export function PairHeader({ pairId }: { pairId: string }) {
  const { pairMap, pairQuotes, watchlist, toggleWatch, navigate } = useExchange();
  const pair = pairMap[pairId];
  if (!pair) return null;
  const ch = change24h(pair);
  const dir = pairQuotes[pairId]?.dir ?? 0;
  const volPct = ((pair.price - pair.low24h) / (pair.high24h - pair.low24h)) * 100;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <CoinIcon symbol={pair.base} color={pair.color} size={34} />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-[family-name:var(--font-display)] font-bold text-[15px]">{pair.symbol}</p>
            <Star size={13} onClick={() => toggleWatch(pair.id)}
              className={cn('cursor-pointer', watchlist.has(pair.id) ? 'text-[#FFB800] fill-[#FFB800]' : 'text-slate-600 hover:text-[#FFB800]')} />
          </div>
          <p className="text-[10.5px] text-muted-foreground">{pair.name} · Spot</p>
        </div>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Price</p>
        <p className={cn('text-lg font-semibold tabular transition-colors', dir >= 0 ? 'text-[#00FF88]' : 'text-[#FF4D4D]')}>${fmtPrice(pair.price)}</p>
      </div>
      <PctBadge value={ch} />
      <div className="hidden md:block">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">24h High</p>
        <p className="text-[12.5px] tabular">${fmtPrice(pair.high24h)}</p>
      </div>
      <div className="hidden md:block">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">24h Low</p>
        <p className="text-[12.5px] tabular">${fmtPrice(pair.low24h)}</p>
      </div>
      <div className="hidden lg:block min-w-[140px]">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">24h Volume</p>
        <p className="text-[12.5px] tabular">{fmtUsd(pair.volQuote)}</p>
      </div>
      <div className="hidden xl:block min-w-[120px]">
        <div className="flex justify-between text-[9.5px] text-muted-foreground mb-1"><span>L {fmtPrice(pair.low24h)}</span><span>H {fmtPrice(pair.high24h)}</span></div>
        <div className="h-1 rounded-full bg-[#0B1A30] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#00A3FF] to-[#FFB800]" style={{ width: `${Math.min(96, Math.max(4, volPct))}%` }} />
        </div>
      </div>
      <button onClick={() => navigate('trade-futures')} className="ml-auto text-[11px] font-medium text-[#FFD35C] border border-[#FFB800]/35 rounded-md px-2.5 py-1.5 bg-[#FFB800]/8 hover:bg-[#FFB800]/16 transition-colors">
        Trade Futures ↗
      </button>
    </div>
  );
}
