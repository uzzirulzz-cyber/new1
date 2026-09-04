import { db } from '@/lib/db';
import { hashPassword, makeUid, errResponse, HttpError, createSession, notify, toSafeUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const name = String(body.name ?? '').trim();
    const password = String(body.password ?? '');
    const phone = String(body.phone ?? '').trim() || null;
    const country = String(body.country ?? '').trim() || null;
    const inviteCode = String(body.invitationCode ?? '').trim().toUpperCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address');
    if (!name || name.length < 2) throw new HttpError(400, 'Name must be at least 2 characters');
    if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
    if (!inviteCode) throw new HttpError(400, 'A valid invitation code is required');

    const code = await db.invitationCode.findUnique({ where: { code: inviteCode }, include: { owner: true } });
    if (!code || !code.active) throw new HttpError(400, 'Invalid or expired invitation code');
    if (code.owner.status === 'FROZEN') throw new HttpError(400, 'This invitation code is currently suspended');

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) throw new HttpError(409, 'An account with this email already exists');

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        uid: makeUid(), email, name, phone, country, passwordHash,
        role: 'CUSTOMER', invitedById: code.ownerId,
      },
    });
    await db.wallet.create({ data: { userId: user.id } });
    await db.invitationCode.update({ where: { code: inviteCode }, data: { usesCount: { increment: 1 } } });
    await db.supportThread.create({ data: { userId: user.id } });
    await notify(user.id, 'Welcome to BLOCKEXCHANGE', `Account created via invitation ${inviteCode}. Deposit funds and explore live binary markets.`, 'SUCCESS');
    await db.loginLog.create({ data: { userId: user.id, success: true, detail: 'Account registered' } });
    await createSession(user.id);

    const fresh = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    return Response.json({ user: toSafeUser(fresh) }, { status: 201 });
  } catch (e) {
    return errResponse(e);
  }
}
