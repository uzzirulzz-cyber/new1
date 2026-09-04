import { db } from '@/lib/db';
import { requireStaff, errResponse, HttpError, audit } from '@/lib/auth';

export async function GET() {
  try {
    await requireStaff();
    const markets = await db.market.findMany({ orderBy: { sortOrder: 'asc' } });
    return Response.json({ markets });
  } catch (e) { return errResponse(e); }
}

/** Tune a market: basePrice, volatility, payoutRate, active, sortOrder. */
export async function PUT(req: Request) {
  try {
    const admin = await requireStaff();
    const { id, ...updates } = await req.json();
    const data: Record<string, unknown> = {};
    for (const k of ['basePrice', 'volatility', 'payoutRate', 'trendBias', 'sortOrder']) {
      if (updates[k] !== undefined && Number.isFinite(Number(updates[k]))) data[k] = Number(updates[k]);
    }
    if (updates.active !== undefined) data.active = Boolean(updates.active);
    if (updates.name !== undefined) data.name = String(updates.name).slice(0, 60);
    if (updates.category !== undefined) data.category = String(updates.category).slice(0, 30);
    if (!Object.keys(data).length) throw new HttpError(400, 'Nothing to update');
    const market = await db.market.update({ where: { id: String(id) }, data });
    await audit(admin.id, 'MARKET_UPDATE', market.symbol, JSON.stringify(data));
    return Response.json({ market });
  } catch (e) { return errResponse(e); }
}
