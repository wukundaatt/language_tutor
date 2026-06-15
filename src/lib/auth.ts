import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'lingualearn-secret-key-change-in-production');

export interface JWTPayload {
  userId: number;
  username: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const db = getDb();
  return db.prepare('SELECT id, username, email, level, xp, streak, target_language, daily_goal_minutes, reminder_time, theme, avatar_url, created_at FROM users WHERE id = ?').get(payload.userId) as UserRow | undefined;
}

export interface UserRow {
  id: number;
  username: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  target_language: string;
  daily_goal_minutes: number;
  reminder_time: string | null;
  theme: string;
  avatar_url: string | null;
  created_at: string;
}