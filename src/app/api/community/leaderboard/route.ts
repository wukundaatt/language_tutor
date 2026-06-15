import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') || 'alltime';

    const db = getDb();

    if (type === 'weekly') {
      const leaderboard = db.prepare(`
        SELECT u.id, u.username, u.level, u.xp, u.avatar_url,
          COALESCE(SUM(up.score), 0) as weekly_xp
        FROM users u
        JOIN user_progress up ON u.id = up.user_id
        WHERE up.completed_at >= datetime('now', '-7 days')
        GROUP BY u.id
        ORDER BY weekly_xp DESC
        LIMIT 20
      `).all();

      const ranked = (leaderboard as Array<Record<string, unknown>>).map((row, index) => ({
        ...row,
        rank: index + 1,
      }));

      return NextResponse.json(ranked);
    } else {
      const leaderboard = db.prepare(`
        SELECT id, username, level, xp, avatar_url
        FROM users
        ORDER BY xp DESC
        LIMIT 20
      `).all();

      const ranked = (leaderboard as Array<Record<string, unknown>>).map((row, index) => ({
        ...row,
        rank: index + 1,
      }));

      return NextResponse.json(ranked);
    }
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}