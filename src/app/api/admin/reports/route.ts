import { db } from '@/lib/db';
import { requireStaff, errResponse } from '@/lib/auth';
import { settleExpiredTrades } from '@/lib/settle';

/** Reports module: revenue, growth, payment & volume series + CSV export data. */
export async function GET() {
  try {
    await requireStaff();
    await settleExpiredTrades();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d30 = new Date(todayStart.getTime() - 29 * 86400e3);

    const [trades, deposits, withdrawals, users] = await Promise.all([
      db.trade.findMany({ where: { settledAt: { gte: d30 }, result: { in: ['WON', 'LOST'] } }, select: { settledAt: true, amount: true, profit: true, result: true, symbol: true } }),
      db.deposit.findMany({ where: { reviewedAt: { gte: d30 }, status: 'APPROVED' }, select: { reviewedAt: true, amount: true } }),
      db.withdrawal.findMany({ where: { reviewedAt: { gte: d30 }, status: 'APPROVED' }, select: { reviewedAt: true, amount: true } }),
      db.user.findMany({ where: { role: 'CUSTOMER', createdAt: { gte: d30 } }, select: { createdAt: true } }),
    ]);

    const days: string[] = [];
    for (let i = 0; i < 30; i++) days.push(new Date(todayStart.getTime() - (29 - i) * 86400e3).toISOString().slice(0, 10));
    const key = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

    const revenueSeries = days.map(k => {
      const day = trades.filter(t => key(t.settledAt) === k);
      const lost = day.filter(t => t.result === 'LOST').reduce((s, t) => s + t.amount, 0);
      const won = day.filter(t => t.result === 'WON').reduce((s, t) => s + t.amount - t.profit, 0);
      return { day: k, value: Math.round((lost + won) * 100) / 100 };
    });
    const volumeSeries = days.map(k => ({ day: k, value: trades.filter(t => key(t.settledAt) === k).reduce((s, t) => s + t.amount, 0) }));
    const userSeries = days.map(k => ({ day: k, value: users.filter(u => key(u.createdAt) === k).length }));
    const paymentSeries = days.map(k => ({
      day: k,
      deposits: deposits.filter(d => key(d.reviewedAt) === k).reduce((s, d) => s + d.amount, 0),
      withdrawals: withdrawals.filter(w => key(w.reviewedAt) === k).reduce((s, w) => s + w.amount, 0),
    }));

    const bySymbol = new Map<string, { volume: number; trades: number }>();
    for (const t of trades) {
      const e = bySymbol.get(t.symbol) ?? { volume: 0, trades: 0 };
      e.volume += t.amount; e.trades += 1;
      bySymbol.set(t.symbol, e);
    }
    const coinStats = [...bySymbol.entries()].map(([symbol, v]) => ({ symbol, ...v })).sort((a, b) => b.volume - a.volume);

    return Response.json({ revenueSeries, volumeSeries, userSeries, paymentSeries, coinStats });
  } catch (e) { return errResponse(e); }
}
