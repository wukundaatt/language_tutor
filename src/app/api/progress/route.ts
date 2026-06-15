import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const progressUpdateSchema = z.object({
  lessonId: z.number(),
  type: z.string(),
  score: z.number(),
  timeSpent: z.number(),
  xpEarned: z.number(),
});

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDb();

    // Total minutes
    const totalMinutesRow = db.prepare(
      'SELECT COALESCE(SUM(time_spent), 0) as total FROM user_progress WHERE user_id = ?'
    ).get(user.id) as { total: number };
    const totalMinutes = Math.round(totalMinutesRow.total / 60);

    // Streak
    const userRow = db.prepare('SELECT streak FROM users WHERE id = ?').get(user.id) as { streak: number };

    // Completed lessons count
    const completedLessonsRow = db.prepare(
      'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?'
    ).get(user.id) as { count: number };

    // Mastered words (srs_stage = 4)
    const masteredWordsRow = db.prepare(
      'SELECT COUNT(*) as count FROM user_word_progress WHERE user_id = ? AND srs_stage = 4'
    ).get(user.id) as { count: number };

    // Weekly stats (last 7 days)
    const weeklyStats = db.prepare(`
      SELECT date(completed_at) as date,
        COUNT(*) as lessonsCompleted,
        COALESCE(SUM(time_spent), 0) as totalTimeSpent,
        COALESCE(SUM(score), 0) as totalScore
      FROM user_progress
      WHERE user_id = ? AND completed_at >= datetime('now', '-7 days')
      GROUP BY date(completed_at)
      ORDER BY date ASC
    `).all(user.id);

    // Language stats (by language via JOIN)
    const languageStats = db.prepare(`
      SELECT l.name as language, l.code,
        COUNT(DISTINCT up.lesson_id) as lessonsCompleted,
        COUNT(DISTINCT uwp.word_id) as wordsLearned
      FROM user_progress up
      JOIN lessons ls ON up.lesson_id = ls.id
      JOIN units u ON ls.unit_id = u.id
      JOIN courses c ON u.course_id = c.id
      JOIN languages l ON c.language_id = l.id
      LEFT JOIN user_word_progress uwp ON uwp.user_id = up.user_id
      WHERE up.user_id = ?
      GROUP BY l.id
    `).all(user.id);

    // All badges with unlock status
    const badges = db.prepare(`
      SELECT b.*, ub.unlocked_at as unlockedAt
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
      ORDER BY b.id ASC
    `).all(user.id);

    // XP history (last 30 days)
    const xpHistory = db.prepare(`
      SELECT date(completed_at) as date,
        SUM(score) as xpGained
      FROM user_progress
      WHERE user_id = ? AND completed_at >= datetime('now', '-30 days')
      GROUP BY date(completed_at)
      ORDER BY date ASC
    `).all(user.id);

    return NextResponse.json({
      totalMinutes,
      streak: userRow.streak,
      completedLessons: completedLessonsRow.count,
      masteredWords: masteredWordsRow.count,
      weeklyStats,
      languageStats,
      badges,
      xpHistory,
    });
  } catch (error) {
    console.error('Progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = progressUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { lessonId, type, score, timeSpent, xpEarned } = parsed.data;
    const db = getDb();

    // Insert progress record
    db.prepare(`
      INSERT INTO user_progress (user_id, lesson_id, lesson_type, score, time_spent)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, lessonId, type, score, timeSpent);

    // Update user XP
    db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xpEarned, user.id);

    // Check for badge unlocks
    const currentUser = db.prepare(
      'SELECT xp, level FROM users WHERE id = ?'
    ).get(user.id) as { xp: number; level: number };

    // Check badge conditions
    const badges = db.prepare('SELECT * FROM badges').all() as Array<Record<string, unknown>>;
    const unlockedBadges: Array<Record<string, unknown>> = [];

    for (const badge of badges) {
      const condition = badge.condition as string;
      let shouldUnlock = false;

      if (condition === 'xp_100') {
        shouldUnlock = currentUser.xp >= 100;
      } else if (condition === 'xp_500') {
        shouldUnlock = currentUser.xp >= 500;
      } else if (condition === 'xp_1000') {
        shouldUnlock = currentUser.xp >= 1000;
      } else if (condition === 'level_5') {
        shouldUnlock = currentUser.level >= 5;
      } else if (condition === 'level_10') {
        shouldUnlock = currentUser.level >= 10;
      } else if (condition === 'streak_7') {
        const streakRow = db.prepare('SELECT streak FROM users WHERE id = ?').get(user.id) as { streak: number };
        shouldUnlock = streakRow.streak >= 7;
      } else if (condition === 'streak_30') {
        const streakRow = db.prepare('SELECT streak FROM users WHERE id = ?').get(user.id) as { streak: number };
        shouldUnlock = streakRow.streak >= 30;
      } else if (condition === 'words_50') {
        const wordsRow = db.prepare(
          'SELECT COUNT(*) as count FROM user_word_progress WHERE user_id = ?'
        ).get(user.id) as { count: number };
        shouldUnlock = wordsRow.count >= 50;
      } else if (condition === 'words_100') {
        const wordsRow = db.prepare(
          'SELECT COUNT(*) as count FROM user_word_progress WHERE user_id = ?'
        ).get(user.id) as { count: number };
        shouldUnlock = wordsRow.count >= 100;
      } else if (condition === 'lessons_10') {
        const lessonsRow = db.prepare(
          'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?'
        ).get(user.id) as { count: number };
        shouldUnlock = lessonsRow.count >= 10;
      } else if (condition === 'lessons_50') {
        const lessonsRow = db.prepare(
          'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?'
        ).get(user.id) as { count: number };
        shouldUnlock = lessonsRow.count >= 50;
      }

      if (shouldUnlock) {
        const alreadyUnlocked = db.prepare(
          'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?'
        ).get(user.id, badge.id) as Record<string, unknown> | undefined;

        if (!alreadyUnlocked) {
          db.prepare(
            'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)'
          ).run(user.id, badge.id);
          unlockedBadges.push(badge);
        }
      }
    }

    return NextResponse.json({
      success: true,
      xpEarned,
      newBadges: unlockedBadges,
    });
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}