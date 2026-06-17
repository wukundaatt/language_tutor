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
    const total = (db.prepare('SELECT COUNT(*) as total FROM courses').get() as { total: number }).total;

    const courses = db
      .prepare(
        `SELECT c.*, l.name as language_name, l.code as language_code, l.flag_emoji,
           (SELECT COUNT(*) FROM units u WHERE u.course_id = c.id) as unit_count,
           (SELECT COUNT(*) FROM lessons le JOIN units u ON le.unit_id = u.id WHERE u.course_id = c.id) as lesson_count
         FROM courses c JOIN languages l ON l.id = c.language_id
         ORDER BY c.id DESC LIMIT ? OFFSET ?`
      )
      .all(pageSize, (page - 1) * pageSize);

    return NextResponse.json({ courses, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 });
  }
}

const createSchema = z.object({
  language_id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  level: z.string().min(1).max(50),
  cover_color: z.string().optional().default('#1e3a5f'),
  sort_order: z.number().int().optional().default(0),
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

    const { language_id, title, description, level, cover_color, sort_order } = parsed.data;
    const db = getDb();

    const result = db
      .prepare(
        'INSERT INTO courses (language_id, title, description, level, cover_color, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(language_id, title, description, level, cover_color, sort_order);

    logAdminAction(user.id, user.username, 'create', 'course', Number(result.lastInsertRowid), `Created course: ${title}`);

    const newCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(Number(result.lastInsertRowid));
    return NextResponse.json({ course: newCourse });
  } catch {
    return NextResponse.json({ error: '创建课程失败' }, { status: 500 });
  }
}
