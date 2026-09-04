import { db } from '@/lib/db';
import { requireUser, errResponse } from '@/lib/auth';

export async function GET() {
  try {
    const u = await requireUser();
    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 80 }),
      db.notification.count({ where: { userId: u.id, read: false } }),
    ]);
    return Response.json({ notifications, unreadCount });
  } catch (e) { return errResponse(e); }
}

/** Mark all (or one) notification as read. */
export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const { id } = await req.json().catch(() => ({ id: undefined }));
    await db.notification.updateMany({
      where: { userId: u.id, ...(id ? { id: String(id) } : {}) },
      data: { read: true },
    });
    return Response.json({ ok: true });
  } catch (e) { return errResponse(e); }
}
