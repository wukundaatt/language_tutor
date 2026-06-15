import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
    }

    const db = getDb();
    const questions = db.prepare(
      'SELECT * FROM listening_questions WHERE lesson_id = ? ORDER BY id ASC'
    ).all(lessonId) as Array<Record<string, unknown>>;

    const parsed = questions.map((q) => ({
      ...q,
      options_json: q.options_json ? JSON.parse(q.options_json as string) : null,
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Listening error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}