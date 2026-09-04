import { db } from '@/lib/db';
import { priceAt } from '@/lib/engine';

/**
 * Settle every expired pending trade.
 * Deterministic engine guarantees the exit price equals price(symbol, expiresAt)
 * regardless of when settlement runs.
 */
export async function settleExpiredTrades(userId?: string) {
  const due = await db.trade.findMany({
    where: { result: 'PENDING', expiresAt: { lte: new Date() }, ...(userId ? { userId } : {}) },
    include: { user: { include: { wallet: true } } },
    take: 200,
  });
  for (const t of due) {
    const market = await db.market.findUnique({ where: { symbol: t.symbol } });
    const base = market?.basePrice ?? t.entryPrice;
    const exit = priceAt(t.symbol, t.expiresAt.getTime(), base, market?.volatility ?? 1, market?.trendBias ?? 0);
    let result: 'WON' | 'LOST' | 'REFUND';
    let profit = 0;
    if (Math.abs(exit - t.entryPrice) < 1e-12) result = 'REFUND';
    else if ((t.direction === 'UP' && exit > t.entryPrice) || (t.direction === 'DOWN' && exit < t.entryPrice)) {
      result = 'WON';
      profit = t.amount * t.payoutRate;
    } else result = 'LOST';

    await db.$transaction(async (tx) => {
      const still = await tx.trade.findUnique({ where: { id: t.id } });
      if (!still || still.result !== 'PENDING') return;
      await tx.trade.update({
        where: { id: t.id },
        data: { result, profit, exitPrice: exit, settledAt: new Date() },
      });
      const credit = result === 'WON' ? t.amount + profit : result === 'REFUND' ? t.amount : 0;
      if (credit > 0) {
        await tx.wallet.update({
          where: { userId: t.userId },
          data: { balance: { increment: credit } },
        });
        await tx.transaction.create({
          data: {
            userId: t.userId,
            type: 'TRADE_PAYOUT',
            amount: credit,
            status: 'COMPLETED',
            reference: t.id,
            detail: result === 'WON' ? `Won ${t.symbol} ${t.direction} · +${(profit * 100).toFixed(1)}%` : 'Draw — stake refunded',
          },
        });
      }
      await tx.notification.create({
        data: {
          userId: t.userId,
          title: result === 'WON' ? `Trade won · ${t.symbol}` : result === 'LOST' ? `Trade lost · ${t.symbol}` : `Trade refunded · ${t.symbol}`,
          body:
            result === 'WON'
              ? `${t.direction} ${t.duration}s $${t.amount.toFixed(2)} — exit ${exit.toFixed(4)} vs entry ${t.entryPrice.toFixed(4)}. Profit +$${profit.toFixed(2)}.`
              : result === 'LOST'
                ? `${t.direction} ${t.duration}s $${t.amount.toFixed(2)} — exit ${exit.toFixed(4)} vs entry ${t.entryPrice.toFixed(4)}.`
                : `${t.symbol} closed at entry price — your stake was refunded.`,
          type: result === 'WON' ? 'SUCCESS' : result === 'LOST' ? 'ERROR' : 'INFO',
        },
      });
    });
  }
  return due.length;
}
