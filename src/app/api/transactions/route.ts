import { db } from '@/lib/db';
import { requireUser, errResponse } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const u = await requireUser();
    const type = new URL(req.url).searchParams.get('type');
    const txs = await db.transaction.findMany({
      where: { userId: u.id, ...(type && ['DEPOSIT', 'WITHDRAWAL', 'TRADE_STAKE', 'TRADE_PAYOUT', 'ADMIN_CREDIT', 'ADMIN_DEBIT', 'FREEZE', 'UNFREEZE'].includes(type) ? { type: type as never } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 120,
    });
    return Response.json({ transactions: txs });
  } catch (e) { return errResponse(e); }
}
