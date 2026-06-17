import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import { z } from 'zod';

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const courses = db
      .prepare(
        `SELECT c.*, l.name as language_name, l.code as language_code, l.flag_emoji,
           (SELECT COUNT(*) FROM units u WHERE u.course_id = c.id) as unit_count,
           (SELECT COUNT(*) FROM lessons le JOIN units u ON le.unit_id = u.id WHERE u.course_id = c.id) as lesson_count
         FROM courses c JOIN languages l ON l.id = c.language_id
         ORDER BY c.id DESC`
      )
      .all();

    return NextResponse.json({ courses });
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

    const newCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(Number(result.lastInsertRowid));
    return NextResponse.json({ course: newCourse });
  } catch {
    return NextResponse.json({ error: '创建课程失败' }, { status: 500 });
  }
}
