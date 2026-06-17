import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAdminAction } from '@/lib/db';
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

    // 分页参数
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '20')));

    // 排序参数（白名单校验，防止 SQL 注入）
    const allowedSortColumns = ['id', 'username', 'email', 'level', 'xp', 'streak', 'created_at'];
    const sortBy = allowedSortColumns.includes(searchParams.get('sortBy') || '')
      ? searchParams.get('sortBy')!
      : 'id';
    const order = searchParams.get('order') === 'asc' ? 'ASC' : 'DESC';

    const db = getDb();

    // 构建 WHERE 子句
    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = ' WHERE username LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    // 总数查询
    const countSql = `SELECT COUNT(*) as total FROM users${whereClause}`;
    const { total } = db.prepare(countSql).get(...params) as { total: number };

    // 数据查询
    const dataSql = `SELECT id, username, email, level, xp, streak, target_language, daily_goal_minutes,
             is_admin, theme, avatar_url, created_at
           FROM users${whereClause} ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
    const users = db.prepare(dataSql).all(...params, pageSize, (page - 1) * pageSize) as Array<{
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

    return NextResponse.json({ users, total, page, pageSize });
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

    logAdminAction(user.id, user.username, 'create', 'user', Number(result.lastInsertRowid), `Created user: ${username}`);

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
