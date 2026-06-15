import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import CommunityClient from './community-client';

interface PostRow {
  id: number;
  user_id: number;
  content: string;
  likes: number;
  created_at: string;
  username: string;
  user_avatar: string | null;
  user_level: number;
  comment_count: number;
}

interface LeaderboardRow {
  id: number;
  username: string;
  level: number;
  xp: number;
  streak: number;
}

export default async function CommunityPage() {
  const user = await getAuthUser();
  const db = getDb();

  let posts: PostRow[] = [];
  let leaderboard: LeaderboardRow[] = [];
  let userLikedPosts: number[] = [];

  try {
    posts = db.prepare(`
      SELECT cp.*, u.username, u.avatar_url as user_avatar, u.level as user_level,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = cp.id) as comment_count
      FROM community_posts cp
      JOIN users u ON u.id = cp.user_id
      ORDER BY cp.created_at DESC
      LIMIT 50
    `).all() as PostRow[];

    leaderboard = db.prepare(`
      SELECT id, username, level, xp, streak
      FROM users
      ORDER BY xp DESC
      LIMIT 20
    `).all() as LeaderboardRow[];

    if (user) {
      userLikedPosts = (db.prepare(`
        SELECT post_id FROM post_likes WHERE user_id = ?
      `).all(user.id) as Record<string, unknown>[]).map((r) => r.post_id as number);
    }
  } catch {
    // ignore
  }

  return (
    <CommunityClient
      isAuthenticated={!!user}
      currentUserId={user?.id ?? null}
      posts={posts}
      leaderboard={leaderboard}
      userLikedPosts={userLikedPosts}
    />
  );
}