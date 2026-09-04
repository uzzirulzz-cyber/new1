import { db } from '@/lib/db';
import { requireStaff, errResponse, audit } from '@/lib/auth';

export async function GET() {
  try {
    await requireStaff();
    const settings = await db.setting.findMany();
    return Response.json({ settings: Object.fromEntries(settings.map(s => [s.key, s.value])) });
  } catch (e) { return errResponse(e); }
}

export async function PUT(req: Request) {
  try {
    const admin = await requireStaff();
    const updates = await req.json();
    for (const [key, value] of Object.entries(updates)) {
      await db.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } });
    }
    await audit(admin.id, 'SETTINGS_UPDATE', undefined, Object.keys(updates).join(', '));
    const settings = await db.setting.findMany();
    return Response.json({ settings: Object.fromEntries(settings.map(s => [s.key, s.value])) });
  } catch (e) { return errResponse(e); }
}
