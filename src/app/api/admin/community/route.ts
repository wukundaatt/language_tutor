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
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '20')));

    const db = getDb();
    let posts: unknown[];
    let total: number;

    if (search) {
      const like = `%${search}%`;
      total = (
        db
          .prepare(
            `SELECT COUNT(*) as total
             FROM community_posts cp
             JOIN users u ON u.id = cp.user_id
             WHERE cp.content LIKE ? OR u.username LIKE ?`
          )
          .get(like, like) as { total: number }
      ).total;

      posts = db
        .prepare(
          `SELECT cp.*, u.username,
             (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = cp.id) as comment_count
           FROM community_posts cp
           JOIN users u ON u.id = cp.user_id
           WHERE cp.content LIKE ? OR u.username LIKE ?
           ORDER BY cp.id DESC LIMIT ? OFFSET ?`
        )
        .all(like, like, pageSize, (page - 1) * pageSize);
    } else {
      total = (db.prepare('SELECT COUNT(*) as total FROM community_posts').get() as { total: number }).total;

      posts = db
        .prepare(
          `SELECT cp.*, u.username,
             (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = cp.id) as comment_count
           FROM community_posts cp
           JOIN users u ON u.id = cp.user_id
           ORDER BY cp.id DESC LIMIT ? OFFSET ?`
        )
        .all(pageSize, (page - 1) * pageSize);
    }

    return NextResponse.json({ posts, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}
