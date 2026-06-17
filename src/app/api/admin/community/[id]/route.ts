import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAdminAction } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const postId = Number(id);

  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM community_posts WHERE id = ?').get(postId);
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM post_likes WHERE post_id = ?').run(postId);
    db.prepare('DELETE FROM post_comments WHERE post_id = ?').run(postId);
    db.prepare('DELETE FROM community_posts WHERE id = ?').run(postId);

    logAdminAction(user.id, user.username, 'delete', 'post', postId, 'Deleted post');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

