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
    const languages = db
      .prepare(
        `SELECT l.*,
           (SELECT COUNT(*) FROM courses c WHERE c.language_id = l.id) as course_count
         FROM languages l ORDER BY l.id`
      )
      .all();

    return NextResponse.json({ languages });
  } catch {
    return NextResponse.json({ error: 'Failed to load languages' }, { status: 500 });
  }
}

const createSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(1).max(100),
  flag_emoji: z.string().min(1).max(10),
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

    const { code, name, flag_emoji } = parsed.data;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM languages WHERE code = ?').get(code);
    if (existing) {
      return NextResponse.json({ error: '语言代码已存在' }, { status: 400 });
    }

    const result = db
      .prepare('INSERT INTO languages (code, name, flag_emoji) VALUES (?, ?, ?)')
      .run(code, name, flag_emoji);

    const newLang = db.prepare('SELECT * FROM languages WHERE id = ?').get(Number(result.lastInsertRowid));
    return NextResponse.json({ language: newLang });
  } catch {
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const langId = Number(id);

  try {
    const body = await request.json();
    const parsed = createSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM languages WHERE id = ?').get(langId);
    if (!existing) {
      return NextResponse.json({ error: 'Language not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (parsed.data.code !== undefined) {
      fields.push('code = ?');
      values.push(parsed.data.code);
    }
    if (parsed.data.name !== undefined) {
      fields.push('name = ?');
      values.push(parsed.data.name);
    }
    if (parsed.data.flag_emoji !== undefined) {
      fields.push('flag_emoji = ?');
      values.push(parsed.data.flag_emoji);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(langId);
    db.prepare(`UPDATE languages SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM languages WHERE id = ?').get(langId);
    return NextResponse.json({ language: updated });
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
  const langId = Number(id);

  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM languages WHERE id = ?').get(langId);
    if (!existing) {
      return NextResponse.json({ error: 'Language not found' }, { status: 404 });
    }

    // 检查是否有课程使用该语言
    const courseCount = db
      .prepare('SELECT COUNT(*) as count FROM courses WHERE language_id = ?')
      .get(langId) as { count: number };
    if (courseCount.count > 0) {
      return NextResponse.json(
        { error: '该语言下存在课程，请先删除相关课程' },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM languages WHERE id = ?').run(langId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
