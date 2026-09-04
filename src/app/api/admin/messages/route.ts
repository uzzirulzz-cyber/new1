import { db } from '@/lib/db';
import { requireStaff, errResponse, HttpError } from '@/lib/auth';

/** Admin inbox: customer support threads + replies. */
export async function GET(req: Request) {
  try {
    await requireStaff();
    const threadId = new URL(req.url).searchParams.get('threadId');
    if (threadId) {
      const thread = await db.supportThread.findUnique({
        where: { id: String(threadId) },
        include: { messages: { orderBy: { createdAt: 'asc' } }, user: { select: { uid: true, name: true, email: true } } },
      });
      if (!thread) throw new HttpError(404, 'Thread not found');
      if (thread.unreadForAdmin) await db.supportThread.update({ where: { id: thread.id }, data: { unreadForAdmin: false } });
      return Response.json({ thread });
    }
    const threads = await db.supportThread.findMany({
      orderBy: { lastMessageAt: 'desc' },
      take: 60,
      include: {
        user: { select: { uid: true, name: true, email: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return Response.json({ threads });
  } catch (e) { return errResponse(e); }
}

export async function POST(req: Request) {
  try {
    await requireStaff();
    const { threadId, body } = await req.json();
    const text = String(body ?? '').trim();
    if (!text) throw new HttpError(400, 'Message is empty');
    const thread = await db.supportThread.findUnique({ where: { id: String(threadId) } });
    if (!thread) throw new HttpError(404, 'Thread not found');
    const msg = await db.supportMessage.create({ data: { threadId: thread.id, sender: 'ADMIN', body: text.slice(0, 2000) } });
    await db.supportThread.update({ where: { id: thread.id }, data: { unreadForUser: true, unreadForAdmin: false, lastMessageAt: new Date() } });
    return Response.json({ message: msg }, { status: 201 });
  } catch (e) { return errResponse(e); }
}
