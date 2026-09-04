import { db } from '@/lib/db';
import { requireStaff, errResponse, HttpError, audit, notify } from '@/lib/auth';

/** Search users by UID / name / email + role stats. */
export async function GET(req: Request) {
  try {
    await requireStaff();
    const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
    const role = new URL(req.url).searchParams.get('role') ?? 'ALL';
    const where = {
      AND: [
        role === 'ALL' ? {} : { role: role as never },
        q ? {
          OR: [
            { uid: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        } : {},
      ],
    };
    const [users, total, active, frozen, admins] = await Promise.all([
      db.user.findMany({
        where, orderBy: { createdAt: 'desc' }, take: 60,
        include: { wallet: true, _count: { select: { trades: true } } },
      }),
      db.user.count({ where }),
      db.user.count({ where: { ...where, status: 'ACTIVE' } }),
      db.user.count({ where: { status: 'FROZEN' } }),
      db.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'SUB_AGENT'] } } }),
    ]);
    return Response.json({
      users: users.map(u => ({
        id: u.id, uid: u.uid, name: u.name, email: u.email, phone: u.phone, country: u.country,
        role: u.role, vipLevel: u.vipLevel, kycStatus: u.kycStatus, status: u.status,
        walletLocked: u.walletLocked, createdAt: u.createdAt,
        balance: u.wallet?.balance ?? 0, frozen: u.wallet?.frozen ?? 0, trades: u._count.trades,
      })),
      stats: { total, active, frozen, admins },
    });
  } catch (e) { return errResponse(e); }
}

/** Account-level actions: freeze/unfreeze account, send notification. */
export async function POST(req: Request) {
  try {
    const admin = await requireStaff();
    const { userId, action, title, body } = await req.json();
    const user = await db.user.findUnique({ where: { id: String(userId) } });
    if (!user) throw new HttpError(404, 'User not found');
    if (user.role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') throw new HttpError(403, 'Cannot modify a super admin');

    switch (action) {
      case 'FREEZE_ACCOUNT':
        await db.user.update({ where: { id: user.id }, data: { status: 'FROZEN' } });
        await db.session.deleteMany({ where: { userId: user.id } });
        await notify(user.id, 'Account frozen', 'Your account has been frozen by the risk team. Contact support for details.', 'ERROR');
        break;
      case 'UNFREEZE_ACCOUNT':
        await db.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } });
        await notify(user.id, 'Account restored', 'Your account has been unfrozen. Welcome back.', 'SUCCESS');
        break;
      case 'SEND_NOTIFICATION':
        if (!title && !body) throw new HttpError(400, 'Notification needs a title or body');
        await notify(user.id, String(title || 'Message from BLOCKEXCHANGE'), String(body || ''), 'INFO');
        break;
      default:
        throw new HttpError(400, 'Unknown action');
    }
    await audit(admin.id, action, user.uid, action === 'SEND_NOTIFICATION' ? String(title) : undefined);
    return Response.json({ ok: true });
  } catch (e) { return errResponse(e); }
}
