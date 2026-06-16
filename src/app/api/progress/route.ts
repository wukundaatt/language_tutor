import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, type, score, timeSpent, xpEarned } = body;

    if (!lessonId || !type) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const db = getDb();

    // Insert progress record, ignore if duplicate within same lesson
    const existing = db.prepare(
      'SELECT id FROM user_progress WHERE user_id = ? AND lesson_id = ? AND lesson_type = ?'
    ).get(user.id, lessonId, type) as { id: number } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE user_progress
        SET score = ?, time_spent = ?, completed_at = datetime('now')
        WHERE id = ?
      `).run(score || 0, timeSpent || 0, existing.id);
    } else {
      db.prepare(`
        INSERT INTO user_progress (user_id, lesson_id, lesson_type, score, time_spent)
        VALUES (?, ?, ?, ?, ?)
      `).run(user.id, lessonId, type, score || 0, timeSpent || 0);
    }

    // Update user xp if provided
    if (xpEarned && typeof xpEarned === 'number' && xpEarned > 0) {
      db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xpEarned, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, progress: [] });
    }

    const db = getDb();
    const progress = db.prepare(`
      SELECT lesson_id, lesson_type, score, time_spent, completed_at
      FROM user_progress
      WHERE user_id = ?
      ORDER BY completed_at DESC
      LIMIT 100
    `).all(user.id);

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_lessons,
        COALESCE(SUM(score), 0) as total_score,
        COALESCE(SUM(time_spent), 0) as total_time
      FROM user_progress
      WHERE user_id = ?
    `).get(user.id);

    return NextResponse.json({ authenticated: true, progress, stats });
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
