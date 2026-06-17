import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAdminAction } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '20')));

    const db = getDb();
    const total = (db.prepare('SELECT COUNT(*) as total FROM badges').get() as { total: number }).total;

    const badges = db
      .prepare(
        `SELECT b.*,
           (SELECT COUNT(*) FROM user_badges ub WHERE ub.badge_id = b.id) as user_count
         FROM badges b ORDER BY b.id LIMIT ? OFFSET ?`
      )
      .all(pageSize, (page - 1) * pageSize);
    return NextResponse.json({ badges, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: 'Failed to load badges' }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().min(1).max(100),
  description: z.string().min(1),
  condition: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const db = getDb();
    const result = db
      .prepare('INSERT INTO badges (name, icon, description, condition) VALUES (?, ?, ?, ?)')
      .run(parsed.data.name, parsed.data.icon, parsed.data.description, parsed.data.condition);

    logAdminAction(user.id, user.username, 'create', 'badge', Number(result.lastInsertRowid), `Created badge: ${parsed.data.name}`);

    const newBadge = db.prepare('SELECT * FROM badges WHERE id = ?').get(Number(result.lastInsertRowid));
    return NextResponse.json({ badge: newBadge });
  } catch {
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
