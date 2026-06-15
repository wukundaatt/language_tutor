import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import ProgressClient from './progress-client';

export default async function ProgressPage() {
  const user = await getAuthUser();
  const isAuthenticated = !!user;

  let progressData: Record<string, unknown> | null = null;
  let badges: Record<string, unknown>[] = [];

  if (isAuthenticated) {
    const db = getDb();
    const userId = user!.id;

    // Basic stats
    const statsRow = db.prepare(`
      SELECT
        COALESCE((SELECT SUM(time_spent) FROM user_progress WHERE user_id = ?), 0) as total_minutes,
        COALESCE((SELECT COUNT(*) FROM user_progress WHERE user_id = ?), 0) as completed_lessons,
        COALESCE((SELECT COUNT(*) FROM user_word_progress WHERE user_id = ? AND srs_stage >= 4), 0) as mastered_words,
        COALESCE((SELECT SUM(time_spent) FROM user_progress WHERE user_id = ? AND date(completed_at) = date('now')), 0) as today_minutes
    `).get(userId, userId, userId, userId) as Record<string, unknown>;

    // Weekly data for chart
    const weeklyData = db.prepare(`
      SELECT date(completed_at) as date, SUM(time_spent) as minutes
      FROM user_progress
      WHERE user_id = ? AND completed_at >= date('now', '-7 days')
      GROUP BY date(completed_at)
      ORDER BY date(completed_at)
    `).all(userId) as Record<string, unknown>[];

    // Language distribution
    const langData = db.prepare(`
      SELECT l.name as name, COUNT(up.id) as count
      FROM user_progress up
      JOIN lessons le ON le.id = up.lesson_id
      JOIN units u ON u.id = le.unit_id
      JOIN courses c ON c.id = u.course_id
      JOIN languages l ON l.id = c.language_id
      WHERE up.user_id = ?
      GROUP BY l.id
    `).all(userId) as Record<string, unknown>[];

    // XP history
    const xpData = db.prepare(`
      SELECT date(completed_at) as date, SUM(score) as xp
      FROM user_progress
      WHERE user_id = ? AND completed_at >= date('now', '-30 days')
      GROUP BY date(completed_at)
      ORDER BY date(completed_at)
    `).all(userId) as Record<string, unknown>[];

    // Review heatmap (last 3 months)
    const heatmapData = db.prepare(`
      SELECT date(completed_at) as date, COUNT(*) as count
      FROM user_progress
      WHERE user_id = ? AND completed_at >= date('now', '-90 days')
      GROUP BY date(completed_at)
    `).all(userId) as Record<string, unknown>[];

    // Badges
    const userBadges = db.prepare(`
      SELECT b.*, ub.unlocked_at IS NOT NULL as unlocked, ub.unlocked_at
      FROM badges b
      LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?
      ORDER BY b.id
    `).all(userId) as Record<string, unknown>[];

    progressData = {
      totalMinutes: statsRow?.total_minutes || 0,
      completedLessons: statsRow?.completed_lessons || 0,
      masteredWords: statsRow?.mastered_words || 0,
      todayMinutes: statsRow?.today_minutes || 0,
      weeklyData,
      langData,
      xpData,
      heatmapData,
    };
    badges = userBadges;
  }

  return (
    <ProgressClient
      isAuthenticated={isAuthenticated}
      progressData={progressData}
      badges={badges}
      streak={user?.streak ?? 0}
      totalXp={user?.xp ?? 0}
    />
  );
}