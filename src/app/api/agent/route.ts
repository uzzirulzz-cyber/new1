import { db } from '@/lib/db';
import { requireAgent, errResponse, HttpError } from '@/lib/auth';

/**
 * Sub-Agent dashboard — strictly isolated: the agent only ever sees
 * customers whose invitedById == agent.id.
 */
export async function GET(req: Request) {
  try {
    const agent = await requireAgent();
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customerId');

    if (customerId) {
      const c = await db.user.findFirst({
        where: { id: String(customerId), invitedById: agent.id, role: 'CUSTOMER' },
        include: { wallet: true },
      });
      if (!c) throw new HttpError(404, 'Customer not found in your network');
      const trades = await db.trade.findMany({ where: { userId: c.id }, orderBy: { openedAt: 'desc' }, take: 30 });
      return Response.json({ customer: { id: c.id, uid: c.uid, name: c.name, email: c.email, status: c.status, vipLevel: c.vipLevel, createdAt: c.createdAt, balance: c.wallet?.balance ?? 0, frozen: c.wallet?.frozen ?? 0 }, trades });
    }

    const customers = await db.user.findMany({
      where: { invitedById: agent.id, role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      include: { wallet: true, _count: { select: { trades: true } } },
    });
    const totalBalance = customers.reduce((s, c) => s + (c.wallet?.balance ?? 0), 0);
    const totalTrades = customers.reduce((s, c) => s + c._count.trades, 0);
    const tradeAgg = await db.trade.groupBy({
      by: ['result'],
      where: { user: { invitedById: agent.id } },
      _count: true,
      _sum: { amount: true, profit: true },
    });
    const won = tradeAgg.find(g => g.result === 'WON');
    const lost = tradeAgg.find(g => g.result === 'LOST');
    return Response.json({
      agent: { uid: agent.uid, name: agent.name, invitationCode: agent.invitationCode, createdAt: agent.createdAt },
      customers: customers.map(c => ({
        id: c.id, uid: c.uid, name: c.name, email: c.email, status: c.status,
        vipLevel: c.vipLevel, kycStatus: c.kycStatus, createdAt: c.createdAt,
        balance: c.wallet?.balance ?? 0, frozen: c.wallet?.frozen ?? 0, trades: c._count.trades,
      })),
      stats: {
        customers: customers.length,
        active: customers.filter(c => c.status === 'ACTIVE').length,
        frozen: customers.filter(c => c.status === 'FROZEN').length,
        totalBalance, totalTrades,
        customerVolume: (won?._sum.amount ?? 0) + (lost?._sum.amount ?? 0),
      },
    });
  } catch (e) { return errResponse(e); }
}
