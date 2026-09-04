import { db } from '@/lib/db';
import { requireStaff, errResponse, HttpError, audit, notify } from '@/lib/auth';

/**
 * Wallet controls:
 * CREDIT · DEBIT · FREEZE_FUNDS · UNFREEZE_FUNDS ·
 * LOCK_WALLET · UNLOCK_WALLET · FREEZE_ACCOUNT · UNFREEZE_ACCOUNT
 */
export async function POST(req: Request) {
  try {
    const admin = await requireStaff();
    const { userId, action, amount, note } = await req.json();
    const amt = Number(amount);
    const user = await db.user.findUnique({ where: { id: String(userId) }, include: { wallet: true } });
    if (!user) throw new HttpError(404, 'User not found');
    if (user.role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') throw new HttpError(403, 'Not permitted');

    const moneyOps = ['CREDIT', 'DEBIT', 'FREEZE_FUNDS', 'UNFREEZE_FUNDS'];
    if (moneyOps.includes(action) && (!Number.isFinite(amt) || amt <= 0)) throw new HttpError(400, 'Enter a valid amount');

    let detail = '';
    await db.$transaction(async (tx) => {
      switch (action) {
        case 'CREDIT': {
          await tx.wallet.upsert({ where: { userId: user.id }, update: { balance: { increment: amt } }, create: { userId: user.id, balance: amt } });
          await tx.transaction.create({ data: { userId: user.id, type: 'ADMIN_CREDIT', amount: amt, detail: note || `Credited by ${admin.name}` } });
          detail = `Credited $${amt.toFixed(2)}`;
          break;
        }
        case 'DEBIT': {
          const w = (await tx.wallet.findUnique({ where: { userId: user.id } }))!;
          if (w.balance - w.frozen < amt) throw new HttpError(400, 'Amount exceeds available balance');
          await tx.wallet.update({ where: { userId: user.id }, data: { balance: { decrement: amt } } });
          await tx.transaction.create({ data: { userId: user.id, type: 'ADMIN_DEBIT', amount: -amt, detail: note || `Debited by ${admin.name}` } });
          detail = `Debited $${amt.toFixed(2)}`;
          break;
        }
        case 'FREEZE_FUNDS': {
          const w = (await tx.wallet.findUnique({ where: { userId: user.id } }))!;
          if (w.balance - w.frozen < amt) throw new HttpError(400, 'Amount exceeds available balance');
          await tx.wallet.update({ where: { userId: user.id }, data: { frozen: { increment: amt } } });
          await tx.transaction.create({ data: { userId: user.id, type: 'FREEZE', amount: amt, detail: note || `Funds frozen by ${admin.name}` } });
          detail = `Froze $${amt.toFixed(2)}`;
          break;
        }
        case 'UNFREEZE_FUNDS': {
          const w = (await tx.wallet.findUnique({ where: { userId: user.id } }))!;
          if (w.frozen < amt) throw new HttpError(400, 'Amount exceeds frozen funds');
          await tx.wallet.update({ where: { userId: user.id }, data: { frozen: { decrement: amt }, balance: { decrement: amt } } });
          await tx.transaction.create({ data: { userId: user.id, type: 'UNFREEZE', amount: amt, detail: note || `Funds unfrozen (removed) by ${admin.name}` } });
          detail = `Unfroze $${amt.toFixed(2)}`;
          break;
        }
        case 'LOCK_WALLET':
          await tx.user.update({ where: { id: user.id }, data: { walletLocked: true } });
          detail = 'Wallet locked';
          break;
        case 'UNLOCK_WALLET':
          await tx.user.update({ where: { id: user.id }, data: { walletLocked: false } });
          detail = 'Wallet unlocked';
          break;
        case 'FREEZE_ACCOUNT':
          await tx.user.update({ where: { id: user.id }, data: { status: 'FROZEN' } });
          await tx.session.deleteMany({ where: { userId: user.id } });
          detail = 'Account frozen';
          break;
        case 'UNFREEZE_ACCOUNT':
          await tx.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } });
          detail = 'Account unfrozen';
          break;
        default:
          throw new HttpError(400, 'Unknown wallet action');
      }
    });

    if (['CREDIT', 'UNFREEZE_FUNDS', 'UNLOCK_WALLET', 'UNFREEZE_ACCOUNT'].includes(action)) {
      await notify(user.id, 'Wallet update', `${detail}. ${note || ''}`.trim(), 'SUCCESS');
    } else if (['DEBIT', 'FREEZE_FUNDS', 'LOCK_WALLET', 'FREEZE_ACCOUNT'].includes(action)) {
      await notify(user.id, 'Wallet update', `${detail}. ${note || ''}`.trim(), 'WARNING');
    }
    await audit(admin.id, action, user.uid, `${detail} ${note ?? ''}`.trim());
    return Response.json({ ok: true, detail });
  } catch (e) { return errResponse(e); }
}
