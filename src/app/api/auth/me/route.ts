import { db } from '@/lib/db';
import { currentUser, errResponse, toSafeUser } from '@/lib/auth';

/** Current session user + wallet + unread counts. */
export async function GET() {
  try {
    const u = await currentUser();
    if (!u) return Response.json({ user: null }, { status: 200 });
    const [wallet, unreadNotifs, unreadSupport] = await Promise.all([
      db.wallet.findUnique({ where: { userId: u.id } }),
      db.notification.count({ where: { userId: u.id, read: false } }),
      db.supportThread.findUnique({ where: { userId: u.id } }).then(t => t?.unreadForUser ?? false),
    ]);
    return Response.json({ user: toSafeUser(u), wallet, unreadNotifs, unreadSupport });
  } catch (e) {
    return errResponse(e);
  }
}
