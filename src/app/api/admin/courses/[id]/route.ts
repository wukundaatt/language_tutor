import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  try {
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(Number(id));
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const units = db
      .prepare('SELECT * FROM units WHERE course_id = ? ORDER BY sort_order, id')
      .all(Number(id));

    return NextResponse.json({ course, units });
  } catch {
    return NextResponse.json({ error: 'Failed to load course' }, { status: 500 });
  }
}

const updateSchema = z.object({
  language_id: z.number().int().positive().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  level: z.string().min(1).max(50).optional(),
  cover_color: z.string().optional(),
  sort_order: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const courseId = Number(id);

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    const data = parsed.data;
    if (data.language_id !== undefined) {
      fields.push('language_id = ?');
      values.push(data.language_id);
    }
    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.level !== undefined) {
      fields.push('level = ?');
      values.push(data.level);
    }
    if (data.cover_color !== undefined) {
      fields.push('cover_color = ?');
      values.push(data.cover_color);
    }
    if (data.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(data.sort_order);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(courseId);
    db.prepare(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    return NextResponse.json({ course: updated });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const courseId = Number(id);

  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    db.exec('BEGIN TRANSACTION');
    try {
      // 获取所有 unit IDs
      const units = db.prepare('SELECT id FROM units WHERE course_id = ?').all(courseId) as Array<{
        id: number;
      }>;
      for (const unit of units) {
        // 删除 lessons 及相关数据
        const lessons = db.prepare('SELECT id FROM lessons WHERE unit_id = ?').all(unit.id) as Array<{
          id: number;
        }>;
        for (const lesson of lessons) {
          db.prepare('DELETE FROM words WHERE lesson_id = ?').run(lesson.id);
          db.prepare('DELETE FROM grammar_questions WHERE lesson_id = ?').run(lesson.id);
          db.prepare('DELETE FROM listening_questions WHERE lesson_id = ?').run(lesson.id);
          db.prepare('DELETE FROM speaking_prompts WHERE lesson_id = ?').run(lesson.id);
          db.prepare('DELETE FROM user_progress WHERE lesson_id = ?').run(lesson.id);
        }
        db.prepare('DELETE FROM lessons WHERE unit_id = ?').run(unit.id);
      }
      db.prepare('DELETE FROM units WHERE course_id = ?').run(courseId);
      db.prepare('DELETE FROM courses WHERE id = ?').run(courseId);
      db.exec('COMMIT');
    } catch {
      db.exec('ROLLBACK');
      throw new Error('Delete failed');
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
