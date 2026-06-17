import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAdminAction } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const ids: number[] = body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    const db = getDb();
    const placeholders = ids.map(() => '?').join(',');

    // Delete likes and comments first
    db.prepare(`DELETE FROM post_likes WHERE post_id IN (${placeholders})`).run(...ids);
    db.prepare(`DELETE FROM post_comments WHERE post_id IN (${placeholders})`).run(...ids);
    const deletedCount = db.prepare(
      `DELETE FROM community_posts WHERE id IN (${placeholders})`
    ).run(...ids).changes;

    logAdminAction(user.id, user.username, 'batch_delete', 'post', undefined, `Deleted ${deletedCount} posts`);

    return NextResponse.json({ deleted: deletedCount });
  } catch {
    return NextResponse.json({ error: 'Batch delete failed' }, { status: 500 });
  }
}