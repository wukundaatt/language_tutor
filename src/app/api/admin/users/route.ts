import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const limit = Number(searchParams.get('limit') || '100');

    const db = getDb();
    let users;

    if (search) {
      const like = `%${search}%`;
      users = db
        .prepare(
          `SELECT id, username, email, level, xp, streak, target_language, daily_goal_minutes,
             is_admin, theme, avatar_url, created_at
           FROM users
           WHERE username LIKE ? OR email LIKE ?
           ORDER BY id DESC LIMIT ?`
        )
        .all(like, like, limit) as Array<{
        id: number;
        username: string;
        email: string;
        level: number;
        xp: number;
        streak: number;
        target_language: string;
        daily_goal_minutes: number;
        is_admin: number;
        theme: string;
        avatar_url: string | null;
        created_at: string;
      }>;
    } else {
      users = db
        .prepare(
          `SELECT id, username, email, level, xp, streak, target_language, daily_goal_minutes,
             is_admin, theme, avatar_url, created_at
           FROM users ORDER BY id DESC LIMIT ?`
        )
        .all(limit) as Array<{
        id: number;
        username: string;
        email: string;
        level: number;
        xp: number;
        streak: number;
        target_language: string;
        daily_goal_minutes: number;
        is_admin: number;
        theme: string;
        avatar_url: string | null;
        created_at: string;
      }>;
    }

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

const createSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  is_admin: z.boolean().optional().default(false),
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
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { username, email, password, is_admin } = parsed.data;
    const db = getDb();

    // 检查用户名/邮箱是否已存在
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return NextResponse.json({ error: '用户名或邮箱已存在' }, { status: 400 });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db
      .prepare(
        'INSERT INTO users (username, email, password_hash, is_admin, level, xp, streak, target_language, daily_goal_minutes, theme) VALUES (?, ?, ?, ?, 1, 0, 0, ?, 30, ?)'
      )
      .run(username, email, password_hash, is_admin ? 1 : 0, 'english', 'dark');

    const newUser = db
      .prepare(
        'SELECT id, username, email, level, xp, streak, is_admin, created_at FROM users WHERE id = ?'
      )
      .get(Number(result.lastInsertRowid));

    return NextResponse.json({ user: newUser });
  } catch {
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 });
  }
}
