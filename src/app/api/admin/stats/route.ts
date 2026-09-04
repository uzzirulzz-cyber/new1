import { db } from '@/lib/db';
import { requireStaff, errResponse } from '@/lib/auth';
import { settleExpiredTrades } from '@/lib/settle';

/** Executive dashboard stats + chart series. */
export async function GET() {
  try {
    await requireStaff();
    await settleExpiredTrades();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d14 = new Date(todayStart.getTime() - 13 * 86400e3);

    const [totalUsers, activeUsers, frozenUsers, adminCount, agentCount, totalTrades, activeTrades, wonTrades, lostTrades, depAgg, wdAgg, todayDep, todayWd, pendingDep, pendingWd] = await Promise.all([
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.user.count({ where: { role: 'CUSTOMER', status: 'ACTIVE' } }),
      db.user.count({ where: { status: 'FROZEN' } }),
      db.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
      db.user.count({ where: { role: 'SUB_AGENT' } }),
      db.trade.count(),
      db.trade.count({ where: { result: 'PENDING' } }),
      db.trade.findMany({ where: { result: 'WON' }, select: { amount: true, profit: true } }),
      db.trade.aggregate({ where: { result: 'LOST' }, _sum: { amount: true } }),
      db.deposit.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
      db.withdrawal.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
      db.deposit.aggregate({ where: { createdAt: { gte: todayStart } }, _sum: { amount: true }, _count: true }),
      db.withdrawal.aggregate({ where: { createdAt: { gte: todayStart } }, _sum: { amount: true }, _count: true }),
      db.deposit.count({ where: { status: 'PENDING' } }),
      db.withdrawal.count({ where: { status: { in: ['PENDING', 'ON_HOLD'] } } }),
    ]);

    const payouts = wonTrades.reduce((s, t) => s + t.amount + t.profit, 0);
    const stakedWon = wonTrades.reduce((s, t) => s + t.amount, 0);
    const revenue = (lostTrades._sum.amount ?? 0) + stakedWon - payouts; // house edge

    // series builders
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const days: string[] = [];
    for (let i = 0; i < 14; i++) days.push(dayKey(new Date(todayStart.getTime() - (13 - i) * 86400e3)));

    const [settled14, users14, depApproved, wdApproved] = await Promise.all([
      db.trade.findMany({ where: { settledAt: { gte: d14 }, result: { in: ['WON', 'LOST'] } }, select: { settledAt: true, amount: true, profit: true, result: true, symbol: true } }),
      db.user.findMany({ where: { role: 'CUSTOMER', createdAt: { gte: d14 } }, select: { createdAt: true } }),
      db.deposit.findMany({ where: { status: 'APPROVED', reviewedAt: { gte: d14 } }, select: { reviewedAt: true, amount: true } }),
      db.withdrawal.findMany({ where: { status: 'APPROVED', reviewedAt: { gte: d14 } }, select: { reviewedAt: true, amount: true } }),
    ]);

    const revenueSeries = days.map(k => {
      const day = settled14.filter(t => dayKey(t.settledAt!) === k);
      const lost = day.filter(t => t.result === 'LOST').reduce((s, t) => s + t.amount, 0);
      const won = day.filter(t => t.result === 'WON').reduce((s, t) => s + t.amount - t.profit, 0);
      return { day: k, value: Math.round((lost + won) * 100) / 100 };
    });
    const userGrowth = days.map(k => ({ day: k, value: users14.filter(u => dayKey(u.createdAt) === k).length }));
    const depSeries = days.map(k => ({ day: k, deposits: depApproved.filter(d => dayKey(d.reviewedAt!) === k).reduce((s, d) => s + d.amount, 0), withdrawals: wdApproved.filter(w => dayKey(w.reviewedAt!) === k).reduce((s, w) => s + w.amount, 0) }));

    const bySymbol = new Map<string, number>();
    for (const t of settled14) bySymbol.set(t.symbol, (bySymbol.get(t.symbol) ?? 0) + t.amount);
    const coinVolume = [...bySymbol.entries()].map(([symbol, volume]) => ({ symbol, volume })).sort((a, b) => b.volume - a.volume).slice(0, 8);

    return Response.json({
      stats: {
        totalUsers, activeUsers, frozenUsers, adminCount, agentCount,
        totalTrades, activeTrades,
        revenue: Math.round(revenue * 100) / 100,
        totalDeposits: depAgg._sum.amount ?? 0,
        totalWithdrawals: wdAgg._sum.amount ?? 0,
        todayDeposits: { count: todayDep._count, total: todayDep._sum.amount ?? 0 },
        todayWithdrawals: { count: todayWd._count, total: todayWd._sum.amount ?? 0 },
        pendingDeposits: pendingDep,
        pendingWithdrawals: pendingWd,
      },
      revenueSeries, userGrowth, depSeries, coinVolume,
    });
  } catch (e) { return errResponse(e); }
}
