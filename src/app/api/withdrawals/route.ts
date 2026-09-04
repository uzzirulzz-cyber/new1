import { db } from '@/lib/db';
import { requireUser, errResponse, HttpError, notify } from '@/lib/auth';

const METHODS = ['USDT TRC-20', 'USDT ERC-20', 'Bitcoin BTC', 'Bank Transfer'];

export async function GET() {
  try {
    const u = await requireUser();
    const withdrawals = await db.withdrawal.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 60 });
    const wallet = await db.wallet.findUnique({ where: { userId: u.id } });
    return Response.json({
      withdrawals,
      methods: METHODS,
      available: wallet ? Math.max(0, wallet.balance - wallet.frozen) : 0,
    });
  } catch (e) { return errResponse(e); }
}

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    if (u.walletLocked) throw new HttpError(403, 'Your wallet is locked. Contact support.');
    const { method, address, amount } = await req.json();
    const amt = Number(amount);
    const min = 20;
    if (!METHODS.includes(String(method))) throw new HttpError(400, 'Choose a valid withdrawal method');
    if (!address || String(address).trim().length < 8) throw new HttpError(400, 'Enter a valid destination wallet address');
    if (!Number.isFinite(amt) || amt < min) throw new HttpError(400, `Minimum withdrawal is ${min} USDT`);

    // Reserve funds: balance -> frozen until an admin approves.
    const w = await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: u.id } });
      const available = wallet ? wallet.balance - wallet.frozen : 0;
      if (!wallet || available < amt) throw new HttpError(400, 'Insufficient available balance');
      await tx.wallet.update({ where: { userId: u.id }, data: { frozen: { increment: amt } } });
      return tx.withdrawal.create({ data: { userId: u.id, method: String(method), address: String(address).trim(), amount: amt } });
    });
    await notify(u.id, 'Withdrawal requested', `${amt.toFixed(2)} USDT to ${address.slice(0, 10)}… via ${method}. Funds are reserved pending review.`, 'WARNING');
    return Response.json({ withdrawal: w }, { status: 201 });
  } catch (e) { return errResponse(e); }
}
