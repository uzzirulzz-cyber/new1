import { db } from '@/lib/db';
import { verifyPassword, createSession, errResponse, HttpError, toSafeUser } from '@/lib/auth';
import { headers } from 'next/headers';

/** Separate staff portal login: SUB_AGENT / ADMIN / SUPER_ADMIN only. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const h = await headers();
    const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    const ua = h.get('user-agent') ?? 'unknown';

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      if (user) await db.loginLog.create({ data: { userId: user.id, ip, userAgent: ua, success: false, detail: 'Staff portal — wrong credentials' } });
      throw new HttpError(401, 'Invalid staff credentials');
    }
    if (user.role === 'CUSTOMER') throw new HttpError(403, 'This portal is for staff only.');
    if (user.status === 'FROZEN') {
      await db.loginLog.create({ data: { userId: user.id, ip, userAgent: ua, success: false, detail: 'Staff login — account frozen' } });
      throw new HttpError(403, 'Account frozen. Contact the super admin.');
    }
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await db.loginLog.create({ data: { userId: user.id, ip, userAgent: ua, success: true, detail: `Staff login (${user.role})` } });
    await createSession(user.id);
    return Response.json({ user: toSafeUser(user), mustChangePassword: user.mustChangePassword });
  } catch (e) {
    return errResponse(e);
  }
}
