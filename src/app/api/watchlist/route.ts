import { db } from '@/lib/db';
import { requireUser, errResponse } from '@/lib/auth';

export async function GET() {
  try {
    const u = await requireUser();
    const items = await db.watchItem.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' } });
    return Response.json({ watchlist: items.map(i => i.symbol) });
  } catch (e) { return errResponse(e); }
}

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const { symbol } = await req.json();
    const sym = String(symbol ?? '');
    const existing = await db.watchItem.findUnique({ where: { userId_symbol: { userId: u.id, symbol: sym } } });
    if (existing) {
      await db.watchItem.delete({ where: { id: existing.id } });
      return Response.json({ watching: false });
    }
    await db.watchItem.create({ data: { userId: u.id, symbol: sym } });
    return Response.json({ watching: true });
  } catch (e) { return errResponse(e); }
}
