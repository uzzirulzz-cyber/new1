import { db } from '@/lib/db';
import { requireUser, hashPassword, verifyPassword, errResponse, HttpError, audit, SESSION_COOKIE } from '@/lib/auth';
import { createHash } from 'crypto';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const { currentPassword, newPassword } = await req.json();
    if (!newPassword || String(newPassword).length < 8) throw new HttpError(400, 'New password must be at least 8 characters');
    const ok = await verifyPassword(String(currentPassword ?? ''), u.passwordHash);
    if (!ok) throw new HttpError(400, 'Current password is incorrect');
    await db.user.update({
      where: { id: u.id },
      data: { passwordHash: await hashPassword(String(newPassword)), mustChangePassword: false },
    });
    await audit(u.id, 'CHANGE_PASSWORD', u.uid);
    // invalidate all OTHER sessions, keep the current one signed in
    const store = await cookies();
    const raw = store.get(SESSION_COOKIE)?.value;
    const currentHash = raw ? createHash('sha256').update(raw).digest('hex') : null;
    await db.session.deleteMany({
      where: { userId: u.id, ...(currentHash ? { token: { not: currentHash } } : {}) },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return errResponse(e);
  }
}
