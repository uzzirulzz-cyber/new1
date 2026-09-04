import { db } from '@/lib/db';
import { requireStaff, errResponse } from '@/lib/auth';

/** Security center: login history + admin audit trail. */
export async function GET() {
  try {
    await requireStaff();
    const [logins, audits, failedCount, activeSessions] = await Promise.all([
      db.loginLog.findMany({ orderBy: { createdAt: 'desc' }, take: 80, include: { user: { select: { uid: true, name: true, email: true, role: true } } } }),
      db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 80, include: { actor: { select: { uid: true, name: true, role: true } } } }),
      db.loginLog.count({ where: { success: false, createdAt: { gte: new Date(Date.now() - 86400e3) } } }),
      db.session.count({ where: { expiresAt: { gte: new Date() } } }),
    ]);
    return Response.json({ logins, audits, failedCount, activeSessions });
  } catch (e) { return errResponse(e); }
}
