import { db } from '@/lib/db';
import { requireUser, errResponse, HttpError } from '@/lib/auth';
import { candlesFor } from '@/lib/engine';

/** Registered-users-only chart data — guest access blocked (protection layer 1). */
export async function GET(req: Request) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol') ?? 'BTC/USDT';
    const tfMin = parseInt(url.searchParams.get('tf') ?? '1', 10);
    const count = Math.min(parseInt(url.searchParams.get('count') ?? '120', 10), 300);
    const m = await db.market.findUnique({ where: { symbol } });
    if (!m) throw new HttpError(404, 'Unknown market');
    const tfMs = tfMin * 60_000;
    const now = Date.now();
    const candles = candlesFor(symbol, tfMs, count, now, m.basePrice, m.volatility, m.trendBias);
    return Response.json({
      symbol, tf: tfMin,
      candles,
      price: candles[candles.length - 1].close,
      payoutRate: m.payoutRate,
      serverTime: now,
    });
  } catch (e) {
    return errResponse(e);
  }
}
