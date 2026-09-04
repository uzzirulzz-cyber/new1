import { db } from '@/lib/db';
import { requireStaff, errResponse, HttpError, audit, notify } from '@/lib/auth';

/** Review queue: deposits + withdrawals with review actions. */
export async function GET() {
  try {
    await requireStaff();
    const [deposits, withdrawals] = await Promise.all([
      db.deposit.findMany({ orderBy: { createdAt: 'desc' }, take: 80, include: { user: { select: { uid: true, name: true, email: true } } } }),
      db.withdrawal.findMany({ orderBy: { createdAt: 'desc' }, take: 80, include: { user: { select: { uid: true, name: true, email: true } } } }),
    ]);
    return Response.json({ deposits, withdrawals });
  } catch (e) { return errResponse(e); }
}

export async function POST(req: Request) {
  try {
    const admin = await requireStaff();
    const { kind, id, action } = await req.json();

    if (kind === 'deposit') {
      const d = await db.deposit.findUnique({ where: { id: String(id) }, include: { user: true } });
      if (!d) throw new HttpError(404, 'Deposit not found');
      if (d.status !== 'PENDING') throw new HttpError(400, 'Deposit already reviewed');
      if (action === 'APPROVE') {
        await db.$transaction(async (tx) => {
          await tx.deposit.update({ where: { id: d.id }, data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: admin.uid } });
          await tx.wallet.upsert({ where: { userId: d.userId }, update: { balance: { increment: d.amount } }, create: { userId: d.userId, balance: d.amount } });
          await tx.transaction.create({ data: { userId: d.userId, type: 'DEPOSIT', amount: d.amount, status: 'COMPLETED', reference: d.id, detail: `${d.method} deposit approved` } });
        });
        await notify(d.userId, 'Deposit approved', `+${d.amount.toFixed(2)} USDT via ${d.method} has been credited to your wallet.`, 'SUCCESS');
      } else if (action === 'REJECT') {
        await db.deposit.update({ where: { id: d.id }, data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: admin.uid } });
        await db.transaction.create({ data: { userId: d.userId, type: 'DEPOSIT', amount: d.amount, status: 'REJECTED', reference: d.id, detail: `${d.method} deposit rejected` } });
        await notify(d.userId, 'Deposit rejected', `Your ${d.amount.toFixed(2)} USDT deposit via ${d.method} was rejected. Contact support if you believe this is an error.`, 'ERROR');
      } else throw new HttpError(400, 'Unknown action');
      await audit(admin.id, `DEPOSIT_${action}`, d.user.uid, `$${d.amount.toFixed(2)} ${d.method}`);
      return Response.json({ ok: true });
    }

    if (kind === 'withdrawal') {
      const w = await db.withdrawal.findUnique({ where: { id: String(id) }, include: { user: true } });
      if (!w) throw new HttpError(404, 'Withdrawal not found');
      if (w.status !== 'PENDING' && w.status !== 'ON_HOLD') throw new HttpError(400, 'Withdrawal already reviewed');
      if (action === 'APPROVE') {
        await db.$transaction(async (tx) => {
          await tx.withdrawal.update({ where: { id: w.id }, data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: admin.uid } });
          const wallet = await tx.wallet.findUnique({ where: { userId: w.userId } });
          await tx.wallet.update({ where: { userId: w.userId }, data: { frozen: Math.max(0, (wallet?.frozen ?? 0)) - w.amount } });
          await tx.transaction.create({ data: { userId: w.userId, type: 'WITHDRAWAL', amount: -w.amount, status: 'COMPLETED', reference: w.id, detail: `${w.method} → ${w.address.slice(0, 12)}…` } });
        });
        await notify(w.userId, 'Withdrawal approved', `${w.amount.toFixed(2)} USDT sent via ${w.method}. It should arrive shortly.`, 'SUCCESS');
      } else if (action === 'REJECT') {
        await db.$transaction(async (tx) => {
          await tx.withdrawal.update({ where: { id: w.id }, data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: admin.uid } });
          const wallet = await tx.wallet.findUnique({ where: { userId: w.userId } });
          await tx.wallet.update({ where: { userId: w.userId }, data: { frozen: Math.max(0, (wallet?.frozen ?? 0)) - w.amount, balance: { increment: w.amount } } });
          await tx.transaction.create({ data: { userId: w.userId, type: 'WITHDRAWAL', amount: w.amount, status: 'REJECTED', reference: w.id, detail: `${w.method} withdrawal rejected — funds returned` } });
        });
        await notify(w.userId, 'Withdrawal rejected', `Your ${w.amount.toFixed(2)} USDT withdrawal was rejected and the funds returned to your balance.`, 'ERROR');
      } else if (action === 'HOLD') {
        await db.withdrawal.update({ where: { id: w.id }, data: { status: 'ON_HOLD', reviewedAt: new Date(), reviewedBy: admin.uid } });
        await notify(w.userId, 'Withdrawal on hold', `Your ${w.amount.toFixed(2)} USDT withdrawal is under additional review. Funds remain reserved.`, 'WARNING');
      } else throw new HttpError(400, 'Unknown action');
      await audit(admin.id, `WITHDRAWAL_${action}`, w.user.uid, `$${w.amount.toFixed(2)} ${w.method}`);
      return Response.json({ ok: true });
    }

    throw new HttpError(400, 'Unknown kind');
  } catch (e) { return errResponse(e); }
}
