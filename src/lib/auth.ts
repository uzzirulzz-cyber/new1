import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';
import type { Role } from '@prisma/client';

export const SESSION_COOKIE = 'bx_session';
const SESSION_TTL_MS = 7 * 86400e3;

export type SafeUser = {
  id: string; uid: string; email: string; name: string; phone: string | null;
  country: string | null; role: Role; vipLevel: number; kycStatus: string;
  status: 'ACTIVE' | 'FROZEN'; mustChangePassword: boolean; walletLocked: boolean;
  invitedById: string | null; invitationCode: string | null; createdAt: string;
};

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}
export function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export function makeInvitationCode(role: string): string {
  const prefix = role === 'SUB_AGENT' ? 'AGT' : 'BX';
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export function makeUid(): string {
  return `BX${Date.now().toString(36).toUpperCase().slice(-6)}${randomBytes(2).toString('hex').toUpperCase()}`;
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string) {
  const h = await headers();
  const raw = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: {
      token: tokenHash(raw),
      userId,
      ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1',
      userAgent: h.get('user-agent') ?? 'unknown',
      expiresAt,
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, raw, {
    httpOnly: true, sameSite: 'lax', secure: false, path: '/', expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (raw) await db.session.deleteMany({ where: { token: tokenHash(raw) } });
  store.delete(SESSION_COOKIE);
}

/** Resolve the current session user; frozen accounts are rejected. */
export async function currentUser() {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const session = await db.session.findUnique({
    where: { token: tokenHash(raw) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if (session.user.status === 'FROZEN') return null;
  return session.user;
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) throw new HttpError(401, 'Authentication required');
  return u;
}

export async function requireStaff(roles: Role[] = ['ADMIN', 'SUPER_ADMIN']) {
  const u = await currentUser();
  if (!u || !roles.includes(u.role)) throw new HttpError(403, 'Staff access required');
  return u;
}

export async function requireAgent() {
  return requireStaff(['SUB_AGENT']);
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function toSafeUser(u: {
  id: string; uid: string; email: string; name: string; phone: string | null;
  country: string | null; role: Role; vipLevel: number; kycStatus: string;
  status: 'ACTIVE' | 'FROZEN'; mustChangePassword: boolean; walletLocked: boolean;
  invitedById: string | null; invitationCode: string | null; createdAt: Date;
}): SafeUser {
  return {
    id: u.id, uid: u.uid, email: u.email, name: u.name, phone: u.phone,
    country: u.country, role: u.role, vipLevel: u.vipLevel, kycStatus: u.kycStatus,
    status: u.status, mustChangePassword: u.mustChangePassword, walletLocked: u.walletLocked,
    invitedById: u.invitedById, invitationCode: u.invitationCode,
    createdAt: u.createdAt.toISOString(),
  };
}

export async function audit(actorId: string, action: string, target?: string, detail?: string) {
  await db.auditLog.create({ data: { actorId, action, target, detail } });
}

export async function notify(userId: string, title: string, body: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') {
  await db.notification.create({ data: { userId, title, body, type } });
}

/** Standard JSON error wrapper for route handlers. */
export function errResponse(e: unknown) {
  if (e instanceof HttpError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  console.error('[api]', e);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}
