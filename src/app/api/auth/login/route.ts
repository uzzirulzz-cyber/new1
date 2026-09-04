import { db } from '@/lib/db';
import { verifyPassword, createSession, errResponse, HttpError, toSafeUser } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const h = await headers();
    const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    const ua = h.get('user-agent') ?? 'unknown';

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }
    if (user.status === 'FROZEN') {
      await db.loginLog.create({ data: { userId: user.id, ip, userAgent: ua, success: false, detail: 'Blocked — account frozen' } });
      throw new HttpError(403, 'Your account is frozen. Contact support.');
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      await db.loginLog.create({ data: { userId: user.id, ip, userAgent: ua, success: false, detail: 'Wrong password' } });
      throw new HttpError(401, 'Invalid email or password');
    }
    if (user.role !== 'CUSTOMER') {
      await db.loginLog.create({ data: { userId: user.id, ip, userAgent: ua, success: false, detail: 'Staff tried customer portal' } });
      throw new HttpError(403, 'Staff accounts must use the Staff Portal.');
    }
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await db.loginLog.create({ data: { userId: user.id, ip, userAgent: ua, success: true, detail: 'Customer login' } });
    await createSession(user.id);
    return Response.json({ user: toSafeUser(user) });
  } catch (e) {
    return errResponse(e);
  }
}
