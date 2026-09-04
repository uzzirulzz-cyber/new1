import { db } from '@/lib/db';
import { requireStaff, errResponse } from '@/lib/auth';
import { settleExpiredTrades } from '@/lib/settle';

/** All customer trades (settlement sweep runs first). */
export async function GET(req: Request) {
  try {
    await requireStaff();
    await settleExpiredTrades();
    const result = new URL(req.url).searchParams.get('result');
    const trades = await db.trade.findMany({
      where: result && ['PENDING', 'WON', 'LOST', 'REFUND'].includes(result) ? { result: result as never } : {},
      orderBy: { openedAt: 'desc' },
      take: 120,
      include: { user: { select: { uid: true, name: true, email: true } } },
    });
    return Response.json({ trades });
  } catch (e) { return errResponse(e); }
}
