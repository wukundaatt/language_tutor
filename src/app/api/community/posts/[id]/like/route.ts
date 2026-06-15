import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const postId = parseInt(id, 10);
    const db = getDb();

    const existingLike = db.prepare(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?'
    ).get(postId, user.id);

    if (existingLike) {
      // Unlike: remove like
      db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(postId, user.id);
      db.prepare('UPDATE community_posts SET likes = MAX(0, likes - 1) WHERE id = ?').run(postId);
      return NextResponse.json({ liked: false });
    } else {
      // Like: insert like
      db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(postId, user.id);
      db.prepare('UPDATE community_posts SET likes = likes + 1 WHERE id = ?').run(postId);
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Like toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const postId = parseInt(id, 10);
    const db = getDb();

    const existingLike = db.prepare(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?'
    ).get(postId, user.id);

    if (!existingLike) {
      return NextResponse.json({ error: 'Like not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(postId, user.id);
    db.prepare('UPDATE community_posts SET likes = MAX(0, likes - 1) WHERE id = ?').run(postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unlike error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}