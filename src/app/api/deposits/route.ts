import { db } from '@/lib/db';
import { requireUser, errResponse, HttpError, notify } from '@/lib/auth';

const METHODS = ['USDT TRC-20', 'USDT ERC-20', 'Bitcoin BTC', 'Bank Transfer', 'Card Payment'];

export async function GET() {
  try {
    const u = await requireUser();
    const deposits = await db.deposit.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 60 });
    return Response.json({ deposits, methods: METHODS });
  } catch (e) { return errResponse(e); }
}

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    if (u.walletLocked) throw new HttpError(403, 'Your wallet is locked. Contact support.');
    const { method, amount } = await req.json();
    const amt = Number(amount);
    const min = 10;
    if (!METHODS.includes(String(method))) throw new HttpError(400, 'Choose a valid payment method');
    if (!Number.isFinite(amt) || amt < min) throw new HttpError(400, `Minimum deposit is ${min} USDT`);
    const d = await db.deposit.create({ data: { userId: u.id, method: String(method), amount: amt } });
    await notify(u.id, 'Deposit submitted', `Your ${amt.toFixed(2)} USDT deposit via ${method} is awaiting review. Processing usually completes within minutes.`, 'INFO');
    return Response.json({ deposit: d }, { status: 201 });
  } catch (e) { return errResponse(e); }
}
