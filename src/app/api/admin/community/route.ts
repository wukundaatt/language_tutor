import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';

    const db = getDb();
    let posts;

    if (search) {
      const like = `%${search}%`;
      posts = db
        .prepare(
          `SELECT cp.*, u.username,
             (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = cp.id) as comment_count
           FROM community_posts cp
           JOIN users u ON u.id = cp.user_id
           WHERE cp.content LIKE ? OR u.username LIKE ?
           ORDER BY cp.id DESC LIMIT 100`
        )
        .all(like, like);
    } else {
      posts = db
        .prepare(
          `SELECT cp.*, u.username,
             (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = cp.id) as comment_count
           FROM community_posts cp
           JOIN users u ON u.id = cp.user_id
           ORDER BY cp.id DESC LIMIT 100`
        )
        .all();
    }

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}
