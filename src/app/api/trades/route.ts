import { db } from '@/lib/db';
import { requireUser, errResponse, HttpError, notify } from '@/lib/auth';
import { priceAt } from '@/lib/engine';
import { settleExpiredTrades } from '@/lib/settle';

const DURATIONS = [30, 60, 120];

/** Trade history + summary. Also settles any expired pending trades first. */
export async function GET() {
  try {
    const u = await requireUser();
    await settleExpiredTrades(u.id);
    const trades = await db.trade.findMany({
      where: { userId: u.id },
      orderBy: { openedAt: 'desc' },
      take: 100,
    });
    const won = trades.filter(t => t.result === 'WON');
    const lost = trades.filter(t => t.result === 'LOST');
    const profit = won.reduce((s, t) => s + t.profit, 0) - lost.reduce((s, t) => s + t.amount, 0);
    return Response.json({
      trades,
      summary: {
        total: trades.length,
        open: trades.filter(t => t.result === 'PENDING').length,
        wins: won.length,
        losses: lost.length,
        profit,
        winRate: won.length + lost.length > 0 ? (won.length / (won.length + lost.length)) * 100 : 0,
      },
    });
  } catch (e) { return errResponse(e); }
}

/** Execute a binary trade: BUY UP / BUY DOWN with 30s / 60s / 120s expiry. */
export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const body = await req.json();
    const symbol = String(body.symbol ?? '');
    const direction = body.direction === 'DOWN' ? 'DOWN' : 'UP';
    const amount = Number(body.amount);
    const duration = Number(body.duration);

    if (!DURATIONS.includes(duration)) throw new HttpError(400, 'Duration must be 30s, 60s or 120s');
    if (!Number.isFinite(amount) || amount < 1) throw new HttpError(400, 'Minimum trade amount is 1 USDT');
    if (u.walletLocked) throw new HttpError(403, 'Your wallet is locked. Contact support.');

    const market = await db.market.findUnique({ where: { symbol } });
    if (!market || !market.active) throw new HttpError(404, 'Market unavailable');

    const result = await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: u.id } });
      if (!wallet || wallet.balance < amount) throw new HttpError(400, 'Insufficient balance');
      await tx.wallet.update({ where: { userId: u.id }, data: { balance: { decrement: amount } } });
      const entryPrice = priceAt(symbol, Date.now(), market.basePrice, market.volatility, market.trendBias);
      const trade = await tx.trade.create({
        data: {
          userId: u.id, symbol, direction, amount, duration,
          entryPrice, payoutRate: market.payoutRate,
          expiresAt: new Date(Date.now() + duration * 1000),
        },
      });
      await tx.transaction.create({
        data: {
          userId: u.id, type: 'TRADE_STAKE', amount: -amount,
          status: 'COMPLETED', reference: trade.id,
          detail: `${direction === 'UP' ? 'BUY UP' : 'BUY DOWN'} ${symbol} · ${duration}s`,
        },
      });
      return trade;
    });

    await notify(u.id, 'Trade executed', `${direction === 'UP' ? 'BUY UP' : 'BUY DOWN'} ${symbol} · $${amount.toFixed(2)} · ${duration}s expiry @ ${result.entryPrice.toFixed(4)}`, 'INFO');
    return Response.json({ trade: result }, { status: 201 });
  } catch (e) { return errResponse(e); }
}
