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
    const prompts = db.prepare(
      'SELECT * FROM speaking_prompts WHERE lesson_id = ? ORDER BY id ASC'
    ).all(lessonId);

    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Speaking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}