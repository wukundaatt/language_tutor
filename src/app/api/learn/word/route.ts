import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
    }

    const db = getDb();
    const user = await getAuthUser();

    if (user) {
      const words = db.prepare(`
        SELECT w.*, uwp.srs_stage as srsStage, uwp.next_review_at as nextReviewAt
        FROM words w
        LEFT JOIN user_word_progress uwp ON w.id = uwp.word_id AND uwp.user_id = ?
        WHERE w.lesson_id = ?
        ORDER BY w.id ASC
      `).all(user.id, lessonId);
      return NextResponse.json(words);
    } else {
      const words = db.prepare(`
        SELECT * FROM words WHERE lesson_id = ? ORDER BY id ASC
      `).all(lessonId);
      return NextResponse.json(words);
    }
  } catch (error) {
    console.error('Words error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}