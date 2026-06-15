import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);
    const db = getDb();

    const comments = db.prepare(`
      SELECT pc.*, u.username
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = ?
      ORDER BY pc.created_at ASC
    `).all(postId);

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

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

    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { content } = parsed.data;
    const db = getDb();

    const result = db.prepare(
      'INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)'
    ).run(postId, user.id, content);

    const comment = db.prepare(`
      SELECT pc.*, u.username
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}