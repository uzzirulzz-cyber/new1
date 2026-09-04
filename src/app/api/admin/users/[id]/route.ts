import { db } from '@/lib/db';
import { requireStaff, errResponse, HttpError } from '@/lib/auth';

/** Full user profile: wallet, trades, deposits/withdrawals, login history. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const user = await db.user.findUnique({
      where: { id },
      include: { wallet: true, invitedBy: { select: { name: true, invitationCode: true } } },
    });
    if (!user) throw new HttpError(404, 'User not found');
    const [trades, deposits, withdrawals, loginLogs, txs, agg] = await Promise.all([
      db.trade.findMany({ where: { userId: id }, orderBy: { openedAt: 'desc' }, take: 30 }),
      db.deposit.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 15 }),
      db.withdrawal.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 15 }),
      db.loginLog.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      db.transaction.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 25 }),
      db.trade.groupBy({ by: ['result'], where: { userId: id }, _count: true, _sum: { amount: true, profit: true } }),
    ]);
    const { passwordHash: _ph, ...safe } = user;
    return Response.json({ user: safe, trades, deposits, withdrawals, loginLogs, transactions: txs, tradeStats: agg });
  } catch (e) { return errResponse(e); }
}
