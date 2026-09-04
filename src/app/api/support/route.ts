import { db } from '@/lib/db';
import { requireUser, errResponse } from '@/lib/auth';

/** Customer <-> admin support messaging ("BlockExchange Support"). */
export async function GET() {
  try {
    const u = await requireUser();
    const thread = await db.supportThread.upsert({
      where: { userId: u.id },
      update: { unreadForUser: false },
      create: { userId: u.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return Response.json({ thread });
  } catch (e) { return errResponse(e); }
}

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const { body } = await req.json();
    const text = String(body ?? '').trim();
    if (!text) return Response.json({ error: 'Message is empty' }, { status: 400 });
    const thread = await db.supportThread.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id },
    });
    const [msg] = await Promise.all([
      db.supportMessage.create({ data: { threadId: thread.id, sender: 'USER', body: text.slice(0, 2000) } }),
      db.supportThread.update({ where: { id: thread.id }, data: { unreadForAdmin: true, unreadForUser: false, lastMessageAt: new Date() } }),
    ]);
    return Response.json({ message: msg }, { status: 201 });
  } catch (e) { return errResponse(e); }
}
