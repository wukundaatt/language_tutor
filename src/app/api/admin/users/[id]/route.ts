import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
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
    const target = db
      .prepare(
        `SELECT id, username, email, level, xp, streak, target_language, daily_goal_minutes,
           reminder_time, theme, avatar_url, is_admin, created_at
         FROM users WHERE id = ?`
      )
      .get(Number(id));

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: target });
  } catch {
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500 });
  }
}

const updateSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
  level: z.number().int().min(1).optional(),
  xp: z.number().int().min(0).optional(),
  streak: z.number().int().min(0).optional(),
  is_admin: z.boolean().optional(),
  daily_goal_minutes: z.number().int().min(0).optional(),
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
  const targetId = Number(id);

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    const data = parsed.data;
    if (data.username !== undefined) {
      fields.push('username = ?');
      values.push(data.username);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.password !== undefined) {
      fields.push('password_hash = ?');
      values.push(bcrypt.hashSync(data.password, 10));
    }
    if (data.level !== undefined) {
      fields.push('level = ?');
      values.push(data.level);
    }
    if (data.xp !== undefined) {
      fields.push('xp = ?');
      values.push(data.xp);
    }
    if (data.streak !== undefined) {
      fields.push('streak = ?');
      values.push(data.streak);
    }
    if (data.is_admin !== undefined) {
      fields.push('is_admin = ?');
      values.push(data.is_admin ? 1 : 0);
    }
    if (data.daily_goal_minutes !== undefined) {
      fields.push('daily_goal_minutes = ?');
      values.push(data.daily_goal_minutes);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(targetId);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    return NextResponse.json({ user: updated });
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
  const targetId = Number(id);

  // 不允许删除自己
  if (targetId === user.id) {
    return NextResponse.json({ error: '不能删除当前登录的管理员账号' }, { status: 400 });
  }

  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 删除相关数据（使用事务）
    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare('DELETE FROM user_progress WHERE user_id = ?').run(targetId);
      db.prepare('DELETE FROM user_word_progress WHERE user_id = ?').run(targetId);
      db.prepare('DELETE FROM user_badges WHERE user_id = ?').run(targetId);
      db.prepare('DELETE FROM daily_challenges WHERE user_id = ?').run(targetId);
      db.prepare('DELETE FROM post_likes WHERE user_id = ?').run(targetId);
      db.prepare('DELETE FROM post_comments WHERE user_id = ?').run(targetId);
      db.prepare('DELETE FROM community_posts WHERE user_id = ?').run(targetId);
      db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
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
