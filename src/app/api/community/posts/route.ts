import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const db = getDb();
    const user = await getAuthUser();

    const posts = db.prepare(`
      SELECT cp.*, u.username
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.id
      ORDER BY cp.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as Array<Record<string, unknown>>;

    const totalRow = db.prepare(
      'SELECT COUNT(*) as count FROM community_posts'
    ).get() as { count: number };

    const postsWithLiked = posts.map((post) => {
      let isLiked = false;
      if (user) {
        const like = db.prepare(
          'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?'
        ).get(post.id, user.id);
        isLiked = !!like;
      }
      return { ...post, isLiked };
    });

    return NextResponse.json({
      posts: postsWithLiked,
      total: totalRow.count,
      page,
      totalPages: Math.ceil(totalRow.count / limit),
    });
  } catch (error) {
    console.error('Community posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createPostSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { content } = parsed.data;
    const db = getDb();

    const result = db.prepare(
      'INSERT INTO community_posts (user_id, content) VALUES (?, ?)'
    ).run(user.id, content);

    const post = db.prepare(`
      SELECT cp.*, u.username
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}