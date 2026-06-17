import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const db = getDb();

    // 检查是否为管理员（用户名或邮箱匹配）
    const user = db
      .prepare(
        'SELECT * FROM users WHERE email = ? OR username = ?'
      )
      .get(email, email) as { id: number; password_hash: string; is_admin: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }

    if (!user.is_admin) {
      return NextResponse.json({ error: '该账号没有管理员权限' }, { status: 403 });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, username: email });

    const response = NextResponse.json({ success: true });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
