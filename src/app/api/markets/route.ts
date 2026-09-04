import { db } from '@/lib/db';
import { errResponse } from '@/lib/auth';
import { priceAt, change24h, sparkFor } from '@/lib/engine';

/** Public market list with live prices, 24h change and sparklines. */
export async function GET() {
  try {
    const markets = await db.market.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
    const now = Date.now();
    const data = markets.map(m => {
      const price = priceAt(m.symbol, now, m.basePrice, m.volatility, m.trendBias);
      return {
        symbol: m.symbol, name: m.name, category: m.category,
        price, change24h: change24h(m.symbol, now, m.basePrice, m.volatility, m.trendBias),
        spark: sparkFor(m.symbol, now, m.basePrice, m.volatility, m.trendBias, 36, 60_000),
        payoutRate: m.payoutRate,
      };
    });
    return Response.json({ markets: data, serverTime: now });
  } catch (e) {
    return errResponse(e);
  }
}
