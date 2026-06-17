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
    const stats = {
      totalUsers: (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count,
      totalCourses: (db.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number }).count,
      totalLessons: (db.prepare('SELECT COUNT(*) as count FROM lessons').get() as { count: number }).count,
      totalPosts: (db.prepare('SELECT COUNT(*) as count FROM community_posts').get() as { count: number }).count,
      totalBadges: (db.prepare('SELECT COUNT(*) as count FROM badges').get() as { count: number }).count,
      totalLanguages: (db.prepare('SELECT COUNT(*) as count FROM languages').get() as { count: number }).count,
      totalProgress: (db.prepare('SELECT COUNT(*) as count FROM user_progress').get() as { count: number }).count,
      totalComments: (db.prepare('SELECT COUNT(*) as count FROM post_comments').get() as { count: number }).count,
      adminUsers: (db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get() as { count: number }).count,
    };

    // 最近注册用户
    const recentUsers = db
      .prepare(
        'SELECT id, username, email, level, xp, is_admin, created_at FROM users ORDER BY id DESC LIMIT 5'
      )
      .all() as Array<{
      id: number;
      username: string;
      email: string;
      level: number;
      xp: number;
      is_admin: number;
      created_at: string;
    }>;

    // 热门课程
    const popularCourses = db
      .prepare(
        `SELECT c.id, c.title, c.level, l.name as language_name, l.flag_emoji,
          (SELECT COUNT(*) FROM units u WHERE u.course_id = c.id) as unit_count,
          (SELECT COUNT(*) FROM lessons le JOIN units u ON le.unit_id = u.id WHERE u.course_id = c.id) as lesson_count
         FROM courses c JOIN languages l ON l.id = c.language_id
         ORDER BY c.id DESC LIMIT 5`
      )
      .all();

    // 用户排行榜
    const topUsers = db
      .prepare('SELECT id, username, level, xp, streak FROM users ORDER BY xp DESC LIMIT 5')
      .all();

    return NextResponse.json({
      stats,
      recentUsers,
      popularCourses,
      topUsers,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
