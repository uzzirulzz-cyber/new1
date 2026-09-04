'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Wallet2, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Copy, CheckCircle2,
  ShieldAlert, QrCode, Info, ChevronRight, Search, Landmark,
} from 'lucide-react';
import { useExchange } from '@/lib/store';
import { fmtPrice, fmtAmt, fmtUsd, fmtDate } from '@/lib/market';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GlassCard, StatCard, Tag, CoinIcon, EmptyState } from '@/components/shared';

const COIN_COLORS: Record<string, string> = { USDT: '#26A17B', BTC: '#F7931A', ETH: '#627EEA', SOL: '#14F195', BNB: '#F3BA2F', XRP: '#00A3FF', LINK: '#2A5ADA' };
const PRICES: Record<string, number> = { USDT: 1, BTC: 67284.59, ETH: 3598.20, SOL: 157.29, BNB: 595.68, XRP: 0.6221, LINK: 17.42 };

const NETWORKS: Record<string, { name: string; fee: string; time: string }[]> = {
  USDT: [{ name: 'TRC-20 (Tron)', fee: '1.0 USDT', time: '~2 min' }, { name: 'ERC-20 (Ethereum)', fee: '4.2 USDT', time: '~5 min' }, { name: 'BEP-20 (BNB Chain)', fee: '0.3 USDT', time: '~1 min' }],
  BTC: [{ name: 'Bitcoin', fee: '0.00012 BTC', time: '~20 min' }, { name: 'Lightning', fee: '0.000004 BTC', time: 'instant' }],
  ETH: [{ name: 'ERC-20 (Ethereum)', fee: '0.0018 ETH', time: '~5 min' }, { name: 'Arbitrum One', fee: '0.0003 ETH', time: '~2 min' }],
};

/* --------------------------- Pseudo QR generator -------------------------- */
function PseudoQR({ value, size = 148 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    cvs.width = size * dpr; cvs.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
    const cells = 25, cs = size / cells;
    // deterministic hash
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
    ctx.fillStyle = '#0a0f1c';
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const inFinder = (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
        if (inFinder) continue;
        if (rnd() > 0.52) ctx.fillRect(x * cs, y * cs, cs - 0.5, cs - 0.5);
      }
    }
    // finder patterns
    const finder = (fx: number, fy: number) => {
      ctx.fillStyle = '#0a0f1c';
      ctx.fillRect(fx * cs, fy * cs, 7 * cs, 7 * cs);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((fx + 1) * cs, (fy + 1) * cs, 5 * cs, 5 * cs);
      ctx.fillStyle = '#0a0f1c';
      ctx.fillRect((fx + 2) * cs, (fy + 2) * cs, 3 * cs, 3 * cs);
    };
    finder(0, 0); finder(cells - 7, 0); finder(0, cells - 7);
    // center logo
    const mid = size / 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mid - 16, mid - 16, 32, 32);
    ctx.fillStyle = '#0a0f1c';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('B', mid, mid + 1);
  }, [value, size]);
  return <canvas ref={ref} style={{ width: size, height: size }} className="rounded-lg" />;
}

/* -------------------------------- Wallet --------------------------------- */
export function WalletView() {
  const { balances, navigate, pairs } = useExchange();
  const [tab, setTab] = useState('spot');
  const [transferOpen, setTransferOpen] = useState(false);
  const [tf, setTf] = useState({ from: 'Spot', to: 'Funding', asset: 'USDT', amount: '100' });

  const priceOf = (asset: string) => asset === 'USDT' ? 1 : (pairs.find(p => p.base === asset)?.price ?? PRICES[asset] ?? 0);
  const rows = Object.entries(balances).map(([asset, b]) => ({ asset, ...b, price: priceOf(asset), usd: (b.free + b.locked) * priceOf(asset) })).filter(r => r.usd > 0.01).sort((a, b) => b.usd - a.usd);
  const totalUsd = rows.reduce((s, r) => s + r.usd, 0);
  const spotUsd = rows.filter(r => ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'LINK'].includes(r.asset)).reduce((s, r) => s + r.usd, 0);
  const futuresUsd = 9284.53; // margin allocations demo
  const fundingUsd = 3120.00;
  const earnUsd = rows.filter(r => r.asset === 'USDT' || r.asset === 'ETH').reduce((s, r) => s + r.locked * r.price, 0);

  const tabUsd = tab === 'spot' ? spotUsd : tab === 'futures' ? futuresUsd : tab === 'funding' ? fundingUsd : earnUsd;

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Wallet</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Unified multi-wallet architecture with segregated balances</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="h-9 text-[12px] bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-semibold" onClick={() => navigate('deposit')}><ArrowDownToLine size={13} /> Deposit</Button>
          <Button size="sm" variant="outline" className="h-9 text-[12px] border-[#FFB800]/40 text-[#FFD35C]" onClick={() => navigate('withdraw')}><ArrowUpFromLine size={13} /> Withdraw</Button>
          <Button size="sm" variant="outline" className="h-9 text-[12px] border-white/15 text-slate-200" onClick={() => setTransferOpen(true)}><ArrowLeftRight size={13} /> Transfer</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard label="Spot Wallet" value={fmtUsd(spotUsd)} icon={<Wallet2 size={15} />} accent="blue" sub="trading balances" />
        <StatCard label="Futures Wallet" value={fmtUsd(futuresUsd)} icon={<Landmark size={15} />} accent="gold" sub="margin + uPnL" />
        <StatCard label="Funding Wallet" value={fmtUsd(fundingUsd)} icon={<ArrowLeftRight size={15} />} accent="violet" sub="deposits & withdrawals" />
        <StatCard label="Earn Wallet" value={fmtUsd(earnUsd)} icon={<Coins2 size={15} />} accent="green" sub="locked in yield pools" />
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 border-b hairline">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-[#0B1A30] h-9">
              {(['spot', 'futures', 'funding', 'earn'] as const).map(t => (
                <TabsTrigger key={t} value={t} className="text-[12px] capitalize px-4 data-[state=active]:bg-[#00A3FF]/20 data-[state=active]:text-[#33B5FF]">{t}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="text-[12px] text-muted-foreground">{tab.charAt(0).toUpperCase() + tab.slice(1)} balance: <span className="text-[#FFD35C] font-semibold tabular">{fmtUsd(tabUsd)}</span></p>
        </div>
        <div className="overflow-x-auto">
          <table className="bx-table">
            <thead><tr><th>Asset</th><th>Total Balance</th><th>Available</th><th>In Orders / Locked</th><th>Value</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.asset}>
                  <td><div className="flex items-center gap-2.5"><CoinIcon symbol={r.asset} color={COIN_COLORS[r.asset] ?? '#00A3FF'} size={28} />
                    <div><p className="font-semibold text-[12.5px]">{r.asset}</p><p className="text-[10px] text-muted-foreground">{r.asset === 'USDT' ? 'TetherUS' : r.asset}</p></div></div></td>
                  <td className="tabular font-semibold">{fmtAmt(r.free + r.locked)}</td>
                  <td className="tabular text-slate-300">{fmtAmt(r.free)}</td>
                  <td className="tabular text-slate-400">{fmtAmt(r.locked)}</td>
                  <td className="tabular text-[#FFD35C] font-medium">{fmtUsd(r.usd)}</td>
                  <td>
                    <div className="flex gap-1.5">
                      <button onClick={() => navigate('trade-spot')} className="text-[10.5px] text-[#33B5FF] hover:underline">Trade</button>
                      <span className="text-slate-700">·</span>
                      <button onClick={() => navigate('deposit')} className="text-[10.5px] text-[#00FF88] hover:underline">Deposit</button>
                      <span className="text-slate-700">·</span>
                      <button onClick={() => navigate('withdraw')} className="text-[10.5px] text-[#FF6B6B] hover:underline">Withdraw</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="glass max-w-sm border-[#00A3FF]/30">
          <DialogHeader><DialogTitle className="text-[15px]">Internal Transfer</DialogTitle>
            <DialogDescription className="text-[11.5px]">Move funds between wallets instantly — zero fees.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">From</p>
                <select value={tf.from} onChange={e => setTf(c => ({ ...c, from: e.target.value }))}
                  className="w-full rounded-lg bg-[#0B1A30] border hairline px-3 py-2 text-[12.5px] outline-none">
                  {['Spot', 'Futures', 'Funding', 'Earn'].map(w => <option key={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">To</p>
                <select value={tf.to} onChange={e => setTf(c => ({ ...c, to: e.target.value }))}
                  className="w-full rounded-lg bg-[#0B1A30] border hairline px-3 py-2 text-[12.5px] outline-none">
                  {['Spot', 'Futures', 'Funding', 'Earn'].map(w => <option key={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <div className="rounded-lg bg-[#0B1A30] border hairline px-3 py-2">
              <p className="text-[10px] text-muted-foreground mb-1">Amount (USDT)</p>
              <input value={tf.amount} onChange={e => setTf(c => ({ ...c, amount: e.target.value.replace(/[^0-9.]/g, '') }))}
                className="w-full bg-transparent outline-none text-[14px] tabular" />
            </div>
            <Button className="w-full h-10 bg-gradient-to-r from-[#00A3FF] to-[#0077d4] text-[#04101F] font-bold border-0"
              onClick={() => { toast.success('Transfer complete', `${tf.amount} USDT: ${tf.from} → ${tf.to}`); setTransferOpen(false); }}>
              Confirm Transfer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Coins2(props: React.ComponentProps<typeof Wallet2>) { return <Wallet2 {...props} />; }

/* -------------------------------- Deposit -------------------------------- */
export function DepositView() {
  const { deposit } = useExchange();
  const [asset, setAsset] = useState('USDT');
  const [network, setNetwork] = useState(0);
  const [copied, setCopied] = useState(false);
  const [simAmt, setSimAmt] = useState('500');

  const addr = useMemo(() => {
    const seeds: Record<string, string> = {
      USDT: 'TxDx9kQ2mVb7Nf4pLsE8wRuC1hZa6GyJ3t', BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      ETH: '0x91c8a4f3Be07D2e19b6A5Cc77e2A31bD4e2109fa', SOL: '5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCkP2UJnM',
    };
    return seeds[asset] ?? seeds.USDT;
  }, [asset]);
  const nets = NETWORKS[asset] ?? NETWORKS.USDT;

  return (
    <div className="p-3 md:p-5 max-w-[1100px] mx-auto space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Deposit Funds</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">Credit time: instant after network confirmations</p>
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-3">
        <GlassCard className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Select asset</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(NETWORKS).map(a => (
                <button key={a} onClick={() => { setAsset(a); setNetwork(0); }}
                  className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 transition-all',
                    asset === a ? 'border-[#00A3FF]/50 bg-[#00A3FF]/10 shadow-[0_0_14px_rgba(0,163,255,0.12)]' : 'hairline hover:border-[#00A3FF]/30')}>
                  <CoinIcon symbol={a} color={COIN_COLORS[a] ?? '#00A3FF'} size={22} />
                  <span className="text-[12px] font-semibold">{a}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Select network</p>
            <div className="space-y-1.5">
              {nets.map((n, i) => (
                <button key={n.name} onClick={() => setNetwork(i)}
                  className={cn('w-full flex items-center justify-between rounded-lg border px-3.5 py-2.5 transition-all text-left',
                    network === i ? 'border-[#00A3FF]/50 bg-[#00A3FF]/8' : 'hairline hover:border-[#00A3FF]/25')}>
                  <div>
                    <p className="text-[12.5px] font-medium">{n.name}</p>
                    <p className="text-[10px] text-muted-foreground">Arrival {n.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Fee</p>
                    <p className="text-[11.5px] tabular">{n.fee}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#00A3FF]/25 bg-[#00A3FF]/[0.05] p-3.5">
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1.5">{asset} deposit address · {nets[network].name}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11.5px] bg-[#081221] border hairline rounded-md px-3 py-2.5 break-all leading-relaxed">{addr}</code>
              <Button size="icon" variant="outline" className="h-10 w-10 shrink-0 border-[#00A3FF]/35 text-[#33B5FF]"
                onClick={() => { navigator.clipboard?.writeText(addr).catch(() => {}); setCopied(true); toast.success('Address copied'); setTimeout(() => setCopied(false), 1800); }}>
                {copied ? <CheckCircle2 size={15} className="text-[#00FF88]" /> : <Copy size={15} />}
              </Button>
            </div>
            <p className="text-[10.5px] text-[#FF6B6B] mt-2.5 flex gap-1.5"><ShieldAlert size={12} className="shrink-0 mt-0.5" />
              Send only {asset} on {nets[network].name} to this address. Other assets or networks will result in permanent loss.</p>
          </div>
        </GlassCard>

        <div className="space-y-3">
          <GlassCard className="flex flex-col items-center py-6">
            <div className="relative p-2.5 bg-white rounded-xl shadow-[0_0_30px_rgba(0,163,255,0.2)]">
              <PseudoQR value={addr + nets[network].name} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5"><QrCode size={12} /> Scan to deposit {asset}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">Min deposit: {asset === 'BTC' ? '0.0001' : '10'} {asset} · {nets[network].time}</p>
          </GlassCard>
          <GlassCard className="space-y-2.5">
            <p className="text-[12.5px] font-semibold flex items-center gap-1.5"><Info size={13} className="text-[#33B5FF]" /> Simulate incoming transfer</p>
            <div className="rounded-lg bg-[#0B1A30] border hairline px-3 py-2">
              <p className="text-[10px] text-muted-foreground mb-1">Amount ({asset})</p>
              <input value={simAmt} onChange={e => setSimAmt(e.target.value.replace(/[^0-9.]/g, ''))} className="w-full bg-transparent outline-none text-[14px] tabular" />
            </div>
            <Button className="w-full h-9 text-[12px] font-bold bg-gradient-to-r from-[#00E57F] to-[#00b35f] text-[#03150b] border-0"
              onClick={() => { deposit(asset, parseFloat(simAmt) || 0); toast.success('Deposit credited', `${simAmt} ${asset} added to Funding wallet`); }}>
              Simulate Deposit
            </Button>
            <p className="text-[10px] text-muted-foreground">Demo environment — credits instantly, no blockchain interaction.</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Withdraw ------------------------------- */
export function WithdrawView() {
  const { balances } = useExchange();
  const [asset, setAsset] = useState('USDT');
  const [network, setNetwork] = useState(0);
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const nets = NETWORKS[asset] ?? NETWORKS.USDT;
  const avail = balances[asset]?.free ?? 0;
  const fee = parseFloat(nets[network].fee) || 0;
  const amt = parseFloat(amount) || 0;

  return (
    <div className="p-3 md:p-5 max-w-[1100px] mx-auto space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Withdraw Funds</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">Withdrawals are reviewed by the risk engine (typically under 10 minutes)</p>
      </div>
      <div className="grid lg:grid-cols-[1fr_320px] gap-3">
        <GlassCard className="space-y-3.5">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1.5">Asset</p>
              <select value={asset} onChange={e => { setAsset(e.target.value); setNetwork(0); }}
                className="w-full rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5 text-[13px] outline-none">
                {Object.keys(NETWORKS).map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1.5">Network</p>
              <select value={network} onChange={e => setNetwork(Number(e.target.value))}
                className="w-full rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5 text-[13px] outline-none">
                {nets.map((n, i) => <option key={n.name} value={i}>{n.name} — fee {n.fee}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Destination address</p>
              <button onClick={() => setAddress('TxDx9kQ2mVb7Nf4pLsE8wRuC1hZa6GyJ3t')} className="text-[10.5px] text-[#33B5FF] hover:underline">Paste demo address</button>
            </div>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder={`Enter ${asset} ${nets[network].name} address`}
              className="w-full rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5 text-[13px] tabular outline-none focus:border-[#00A3FF]/50" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Amount</p>
              <p className="text-[10.5px] text-muted-foreground">Available: <span className="text-slate-200 tabular">{fmtAmt(avail)} {asset}</span></p>
            </div>
            <div className="rounded-lg bg-[#0B1A30] border hairline px-3 py-2 focus-within:border-[#00A3FF]/50">
              <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00"
                className="w-full bg-transparent outline-none text-[15px] tabular" />
            </div>
            <div className="flex gap-1.5 mt-2">
              {[25, 50, 75, 100].map(p => (
                <button key={p} onClick={() => setAmount(((avail * p) / 100).toFixed(asset === 'USDT' ? 2 : 6))}
                  className="flex-1 text-[10.5px] rounded-md border hairline py-1.5 text-muted-foreground hover:text-[#33B5FF] hover:border-[#00A3FF]/40 transition-colors">{p}%</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1.5">2FA code</p>
            <input value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="6-digit Google Authenticator"
              className="w-full rounded-lg bg-[#0B1A30] border hairline px-3 py-2.5 text-[13px] tabular tracking-[0.3em] outline-none focus:border-[#00A3FF]/50" />
          </div>
          <Button
            onClick={() => {
              if (!address) return toast.error('Missing address', 'Enter a destination address.');
              if (amt <= 0 || amt > avail) return toast.error('Invalid amount');
              if (code.length !== 6) return toast.error('2FA required', 'Enter your 6-digit authenticator code.');
              toast.success('Withdrawal submitted', `${amt} ${asset} → review queue`);
              setAddress(''); setAmount(''); setCode('');
            }}
            className="w-full h-11 text-[13px] font-bold bg-gradient-to-r from-[#FFD35C] to-[#FFB800] text-[#181200] border-0 shadow-[0_0_22px_rgba(255,184,0,0.25)]">
            Submit Withdrawal
          </Button>
        </GlassCard>
        <div className="space-y-3">
          <GlassCard className="space-y-2 text-[11.5px]">
            <p className="text-[12.5px] font-semibold mb-1">Summary</p>
            {[['Network', nets[network].name], ['Withdrawal fee', nets[network].fee], ['You receive', `${Math.max(0, amt - fee).toFixed(6)} ${asset}`], ['Arrival', nets[network].time]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="tabular">{v}</span></div>
            ))}
          </GlassCard>
          <GlassCard className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
            <p className="text-[12.5px] font-semibold text-white">Security policy</p>
            <p className="flex gap-1.5"><ShieldAlert size={12} className="shrink-0 mt-0.5 text-[#FFD35C]" /> First withdrawal to a new address triggers a 24h hold.</p>
            <p className="flex gap-1.5"><ShieldAlert size={12} className="shrink-0 mt-0.5 text-[#FFD35C]" /> Large withdrawals (over 50K USDT) require manual approval.</p>
            <p className="flex gap-1.5"><CheckCircle2 size={12} className="shrink-0 mt-0.5 text-[#00FF88]" /> Whitelisted addresses skip email confirmation.</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Transactions ------------------------------ */
export function TransactionsView() {
  const { txs } = useExchange();
  const [filter, setFilter] = useState<'all' | 'Deposit' | 'Withdraw' | 'Trade' | 'Reward'>('all');
  const [q, setQ] = useState('');
  const list = txs.filter(t => (filter === 'all' || t.type === filter) && (!q || t.detail.toLowerCase().includes(q.toLowerCase()) || t.asset.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="p-3 md:p-5 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold">Transaction History</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Complete ledger across trading, wallets and earn products</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border hairline bg-[#081221]/80 px-3 h-9 w-full sm:w-64">
          <Search size={13} className="text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search detail or asset…" className="bg-transparent outline-none text-[12.5px] w-full" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['all', 'Deposit', 'Withdraw', 'Trade', 'Reward', 'Staking', 'Copy'] as const).map(t => (
          <button key={t} onClick={() => setFilter(t as typeof filter)}
            className={cn('rounded-lg px-3.5 py-1.5 text-[11.5px] font-medium border capitalize transition-colors',
              filter === t ? 'bg-[#00A3FF]/15 text-[#33B5FF] border-[#00A3FF]/40' : 'text-slate-400 hairline hover:text-white')}>{t}</button>
        ))}
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto scroll-thin">
          {list.length === 0 ? <EmptyState icon={<ArrowLeftRight size={20} />} title="No transactions found" /> : (
            <table className="bx-table">
              <thead><tr><th>Date</th><th>Type</th><th>Asset</th><th>Amount</th><th>Value</th><th>Detail</th><th>Status</th></tr></thead>
              <tbody>
                {list.map(t => (
                  <tr key={t.id}>
                    <td className="text-slate-400 text-[11.5px]">{fmtDate(t.time)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center border',
                          t.type === 'Deposit' ? 'bg-[#00FF88]/10 border-[#00FF88]/25 text-[#00FF88]' :
                          t.type === 'Withdraw' ? 'bg-[#FF4D4D]/10 border-[#FF4D4D]/25 text-[#FF6B6B]' :
                          t.type === 'Reward' ? 'bg-[#FFB800]/10 border-[#FFB800]/25 text-[#FFD35C]' :
                          'bg-[#00A3FF]/10 border-[#00A3FF]/25 text-[#33B5FF]')}>
                          {t.type === 'Deposit' ? <ArrowDownToLine size={11} /> : t.type === 'Withdraw' ? <ArrowUpFromLine size={11} /> : <ArrowLeftRight size={11} />}
                        </div>
                        <span className="text-[12px] font-medium">{t.type}</span>
                      </div>
                    </td>
                    <td className="font-medium text-[12px]">{t.asset}</td>
                    <td className={cn('tabular', t.type === 'Withdraw' ? 'text-[#FF6B6B]' : 'text-[#00FF88]')}>{t.type === 'Withdraw' ? '-' : '+'}{fmtAmt(t.amount)}</td>
                    <td className="tabular text-slate-300">${fmtAmt(t.usd)}</td>
                    <td className="text-slate-400 text-[11px] max-w-[240px] truncate">{t.detail}</td>
                    <td><Tag color={t.status === 'Completed' ? 'green' : t.status === 'Pending' ? 'gold' : 'red'}>{t.status}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
