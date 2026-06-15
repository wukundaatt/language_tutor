import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import ProfileClient from './profile-client';

export default async function ProfilePage() {
  const user = await getAuthUser();

  if (!user) {
    return <ProfileClient isAuthenticated={false} />;
  }

  const db = getDb();
  const stats = db.prepare(`
    SELECT
      COALESCE((SELECT SUM(time_spent) FROM user_progress WHERE user_id = ?), 0) as total_minutes,
      COALESCE((SELECT COUNT(*) FROM user_progress WHERE user_id = ?), 0) as completed_lessons,
      COALESCE((SELECT COUNT(*) FROM user_word_progress WHERE user_id = ? AND srs_stage >= 4), 0) as mastered_words
  `).get(user.id, user.id, user.id) as { total_minutes: number; completed_lessons: number; mastered_words: number };

  return (
    <ProfileClient
      isAuthenticated={true}
      userRow={user}
      totalMinutes={stats.total_minutes}
      completedLessons={stats.completed_lessons}
      masteredWords={stats.mastered_words}
    />
  );
}