'use client';

import React, { useMemo, useState } from 'react';
import { Zap, Layers, Percent } from 'lucide-react';
import { useExchange } from '@/lib/store';
import { fmtPrice, fmtAmt, fmtMoney } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { PairListPanel, OrderBookPanel, RecentTradesPanel, ChartPanel, OrdersTables, PairHeader } from './trade-shared';
import { DepthChart } from '@/components/charts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type OrderType = 'Market' | 'Limit' | 'Stop' | 'OCO';
type Side = 'Buy' | 'Sell';

function OrderForm({ pairId }: { pairId: string }) {
  const { pairMap, balances, placeOrder, books } = useExchange();
  const pair = pairMap[pairId];
  const [side, setSide] = useState<Side>('Buy');
  const [type, setType] = useState<OrderType>('Limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');
  const [pct, setPct] = useState(0);

  const last = books[pairId]?.bids[0]?.price ?? pair?.price ?? 0;
  const effPrice = type === 'Market' ? last : parseFloat(price) || last;

  const quoteAsset = 'USDT';
  const baseAsset = pair?.base ?? '';
  const availBase = balances[baseAsset]?.free ?? 0;
  const availQuote = balances[quoteAsset]?.free ?? 0;

  const total = (parseFloat(amount) || 0) * effPrice;
  const maxAmt = side === 'Buy' ? (effPrice > 0 ? availQuote / effPrice : 0) : availBase;

  const setPctAmount = (p: number) => {
    setPct(p);
    const amt = (maxAmt * p) / 100;
    setAmount(amt > 0 ? amt.toFixed(amt < 1 ? 6 : 4) : '');
  };

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Invalid amount', 'Enter an amount to place the order.'); return; }
    placeOrder({
      pairId, symbol: pair.symbol, type, side,
      price: effPrice, amount: amt, total: amt * effPrice,
      stopPrice: type === 'Stop' ? parseFloat(stopPrice) || undefined : undefined,
      tp: type === 'OCO' ? parseFloat(tp) || undefined : undefined,
      sl: type === 'OCO' ? parseFloat(sl) || undefined : undefined,
    });
    toast.success(`${side} order placed`, `${type} ${amt.toFixed(4)} ${baseAsset} @ ${fmtPrice(effPrice)} USDT`);
    setAmount(''); setPct(0);
  };

  if (!pair) return null;
  const isBuy = side === 'Buy';

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 p-2.5 gap-2 shrink-0">
        {(['Buy', 'Sell'] as Side[]).map(s => (
          <button key={s} onClick={() => { setSide(s); setPct(0); }}
            className={cn('rounded-lg py-2 text-[13px] font-bold tracking-wide transition-all border',
              side === s
                ? s === 'Buy' ? 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40 shadow-[0_0_18px_rgba(0,255,136,0.15)]'
                  : 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/40 shadow-[0_0_18px_rgba(255,77,77,0.15)]'
                : 'text-muted-foreground border-transparent hover:text-white')}>
            {s}
          </button>
        ))}
      </div>

      <div className="px-3 pb-2 shrink-0">
        <Tabs value={type} onValueChange={v => setType(v as OrderType)}>
          <TabsList className="w-full grid grid-cols-4 bg-[#0B1A30] h-8">
            {(['Market', 'Limit', 'Stop', 'OCO'] as OrderType[]).map(t => (
              <TabsTrigger key={t} value={t} className="text-[10.5px] px-1 data-[state=active]:bg-[#00A3FF]/20 data-[state=active]:text-[#33B5FF]">{t}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-3 space-y-2.5 pb-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Avail. {isBuy ? quoteAsset : baseAsset}: <span className="text-slate-200 tabular">{fmtAmt(isBuy ? availQuote : availBase)}</span></span>
          {type === 'Market' && <span className="text-[10px] text-[#FFD35C]">Executes at best market price</span>}
        </div>

        {type === 'Stop' && (
          <Field label="Trigger Price (USDT)">
            <input value={stopPrice} onChange={e => setStopPrice(e.target.value)} inputMode="decimal" placeholder={fmtPrice(pair.price * 0.98)}
              className="w-full bg-transparent outline-none text-[12.5px] tabular" />
          </Field>
        )}
        {type === 'OCO' && (
          <>
            <Field label="Trigger (USDT)">
              <input value={stopPrice} onChange={e => setStopPrice(e.target.value)} inputMode="decimal" placeholder={fmtPrice(pair.price * 0.97)}
                className="w-full bg-transparent outline-none text-[12.5px] tabular" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Take Profit">
                <input value={tp} onChange={e => setTp(e.target.value)} inputMode="decimal" placeholder={fmtPrice(pair.price * 1.08)}
                  className="w-full bg-transparent outline-none text-[12.5px] tabular text-[#00FF88]" />
              </Field>
              <Field label="Stop Loss">
                <input value={sl} onChange={e => setSl(e.target.value)} inputMode="decimal" placeholder={fmtPrice(pair.price * 0.94)}
                  className="w-full bg-transparent outline-none text-[12.5px] tabular text-[#FF4D4D]" />
              </Field>
            </div>
          </>
        )}

        {type !== 'Market' && (
          <Field label="Price (USDT)" suffix={<button onClick={() => setPrice(String(pair.price))} className="text-[10px] text-[#33B5FF] hover:underline">Last</button>}>
            <input value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" placeholder={fmtPrice(effPrice)}
              className="w-full bg-transparent outline-none text-[12.5px] tabular" />
          </Field>
        )}

        <Field label={`Amount (${baseAsset})`}>
          <input value={amount} onChange={e => { setAmount(e.target.value); setPct(0); }} inputMode="decimal" placeholder="0.00"
            className="w-full bg-transparent outline-none text-[12.5px] tabular" />
        </Field>

        <div className="pt-1">
          <Slider value={[pct]} onValueChange={([v]) => setPctAmount(v)} max={100} step={25} />
          <div className="flex justify-between mt-1.5">
            {[0, 25, 50, 75, 100].map(v => (
              <button key={v} onClick={() => setPctAmount(v)}
                className={cn('text-[10px] px-1.5 rounded', pct === v ? 'text-[#33B5FF]' : 'text-muted-foreground hover:text-white')}>{v}%</button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-[#0B1A30]/60 border hairline px-3 py-2 space-y-1 text-[11px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Order Value</span><span className="tabular">${fmtMoney(total)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Est. Fee (0.1%)</span><span className="tabular">${(total * 0.001).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{isBuy ? 'You receive' : 'You receive'}</span><span className="tabular text-[#00FF88]">{isBuy ? `${fmtAmt(parseFloat(amount) || 0)} ${baseAsset}` : `$${fmtMoney(total - total * 0.001)}`}</span></div>
        </div>

        <Button onClick={submit}
          className={cn('w-full h-10 text-[13px] font-bold tracking-wide border-0',
            isBuy ? 'bg-gradient-to-r from-[#00E57F] to-[#00b35f] text-[#03150b] shadow-[0_0_22px_rgba(0,255,136,0.28)] hover:brightness-110'
              : 'bg-gradient-to-r from-[#FF6666] to-[#e03030] text-[#fff] shadow-[0_0_22px_rgba(255,77,77,0.28)] hover:brightness-110')}>
          {type === 'Market' ? `Market ${side}` : `${side} ${baseAsset}`}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, suffix }: { label: string; children: React.ReactNode; suffix?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[#0B1A30]/80 border hairline px-3 py-1.5 focus-within:border-[#00A3FF]/50 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground">{label}</p>
        {suffix}
      </div>
      {children}
    </div>
  );
}

export default function SpotTradeView() {
  const { pairQuotes, setSeedPair } = useExchange();
  const [pairId, setPairId] = useState('btc');
  const [bottomTab, setBottomTab] = useState<'book' | 'depth' | 'trades' | 'orders'>('book');
  const pairIdRef = useMemo(() => pairId, [pairId]);

  const selectPair = (id: string) => { setPairId(id); setSeedPair(id); };

  return (
    <div className="p-2 md:p-3 space-y-2.5">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-2.5">
        {/* Left: pairs */}
        <div className="glass rounded-xl overflow-hidden h-[420px] lg:h-[560px] lg:sticky lg:top-[104px] order-2 lg:order-1">
          <PairListPanel selected={pairId} onSelect={selectPair} />
        </div>

        {/* Center: header + chart */}
        <div className="glass rounded-xl overflow-hidden order-1 lg:order-2 flex flex-col">
          <PairHeader pairId={pairId} />
          <div className="border-t hairline">
            <ChartPanel pairId={pairId} height={470} showRSIToggle />
          </div>
        </div>

        {/* Right: order form */}
        <div className="glass rounded-xl overflow-hidden order-3 h-[520px]">
          <OrderForm pairId={pairId} />
        </div>
      </div>

      {/* Bottom: book / depth / trades / orders */}
      <div className="glass rounded-xl overflow-hidden">
        <Tabs value={bottomTab} onValueChange={v => setBottomTab(v as typeof bottomTab)}>
          <div className="flex items-center gap-1 px-3 py-2 border-b hairline overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent h-8 gap-1">
              {([['book', 'Order Book'], ['depth', 'Market Depth'], ['trades', 'Recent Trades'], ['orders', 'Open Orders & History']] as const).map(([v, label]) => (
                <TabsList key={v} className="contents">
                  <TabsTrigger value={v} className="text-[11.5px] px-3 data-[state=active]:bg-[#00A3FF]/15 data-[state=active]:text-[#33B5FF] text-muted-foreground">{label}</TabsTrigger>
                </TabsList>
              ))}
            </TabsList>
          </div>
          <div className={bottomTab === 'book' || bottomTab === 'trades' ? 'h-[340px]' : bottomTab === 'depth' ? 'h-[300px]' : ''}>
            {bottomTab === 'book' && (
              <div className="grid md:grid-cols-2 h-full divide-x hairline">
                <OrderBookPanel pairId={pairId} onSelectPrice={p => {}} />
                <RecentTradesPanel pairId={pairId} />
              </div>
            )}
            {bottomTab === 'depth' && <DepthWrapper pairId={pairId} />}
            {bottomTab === 'trades' && <RecentTradesPanel pairId={pairId} />}
            {bottomTab === 'orders' && <OrdersTables pairId={pairId} />}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function DepthWrapper({ pairId }: { pairId: string }) {
  const { books, pairMap } = useExchange();
  const book = books[pairId];
  const pair = pairMap[pairId];
  if (!book || !pair) return null;
  const midBuy = book.bids.reduce((s, l) => s + l.amount * l.price, 0);
  const midSell = book.asks.reduce((s, l) => s + l.amount * l.price, 0);
  const buyPct = (midBuy / (midBuy + midSell)) * 100;
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-[#00FF88] font-medium">Bids {buyPct.toFixed(1)}%</span>
        <span className="text-muted-foreground">Cumulative market depth · {pair.symbol}</span>
        <span className="text-[#FF4D4D] font-medium">Asks {(100 - buyPct).toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden flex">
        <div className="bg-[#00FF88]/70" style={{ width: `${buyPct}%` }} />
        <div className="bg-[#FF4D4D]/70 flex-1" />
      </div>
      <DepthChart asks={book.asks} bids={book.bids} height={190} />
    </div>
  );
}
