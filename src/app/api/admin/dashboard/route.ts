import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  try {
    // Single query for all stats using subqueries
    const statsRow = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM courses) as totalCourses,
        (SELECT COUNT(*) FROM lessons) as totalLessons,
        (SELECT COUNT(*) FROM community_posts) as totalPosts,
        (SELECT COUNT(*) FROM badges) as totalBadges,
        (SELECT COUNT(*) FROM languages) as totalLanguages,
        (SELECT COUNT(*) FROM user_progress) as totalProgress,
        (SELECT COUNT(*) FROM post_comments) as totalComments,
        (SELECT COUNT(*) FROM users WHERE is_admin = 1) as adminUsers
    `).get() as {
      totalUsers: number; totalCourses: number; totalLessons: number;
      totalPosts: number; totalBadges: number; totalLanguages: number;
      totalProgress: number; totalComments: number; adminUsers: number;
    };

    const recentUsers = db.prepare(
      'SELECT id, username, email, level, xp, is_admin, created_at FROM users ORDER BY id DESC LIMIT 5'
    ).all();

    const popularCourses = db.prepare(
      `SELECT c.id, c.title, c.level, l.name as language_name, l.flag_emoji,
        (SELECT COUNT(*) FROM units u WHERE u.course_id = c.id) as unit_count,
        (SELECT COUNT(*) FROM lessons le JOIN units u ON le.unit_id = u.id WHERE u.course_id = c.id) as lesson_count
       FROM courses c JOIN languages l ON l.id = c.language_id
       ORDER BY c.id DESC LIMIT 5`
    ).all();

    const topUsers = db.prepare(
      'SELECT id, username, level, xp, streak FROM users ORDER BY xp DESC LIMIT 5'
    ).all();

    return NextResponse.json({
      stats: statsRow,
      recentUsers,
      popularCourses,
      topUsers,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}