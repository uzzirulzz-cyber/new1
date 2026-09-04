import { db } from '@/lib/db';
import { requireUser, errResponse } from '@/lib/auth';

/** Wallet summary: balance, frozen, available, pending activity. */
export async function GET() {
  try {
    const u = await requireUser();
    const [wallet, pendingWd, pendingDp, openTrades] = await Promise.all([
      db.wallet.findUnique({ where: { userId: u.id } }),
      db.withdrawal.aggregate({ where: { userId: u.id, status: { in: ['PENDING', 'ON_HOLD'] } }, _sum: { amount: true }, _count: true }),
      db.deposit.aggregate({ where: { userId: u.id, status: 'PENDING' }, _sum: { amount: true }, _count: true }),
      db.trade.aggregate({ where: { userId: u.id, result: 'PENDING' }, _sum: { amount: true }, _count: true }),
    ]);
    const balance = wallet?.balance ?? 0;
    const frozen = wallet?.frozen ?? 0;
    return Response.json({
      balance, frozen, available: balance,
      walletLocked: u.walletLocked,
      pendingWithdrawals: { count: pendingWd._count, total: pendingWd._sum.amount ?? 0 },
      pendingDeposits: { count: pendingDp._count, total: pendingDp._sum.amount ?? 0 },
      openTrades: { count: openTrades._count, staked: openTrades._sum.amount ?? 0 },
    });
  } catch (e) { return errResponse(e); }
}
