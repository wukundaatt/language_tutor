import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const words = db.prepare(`
      SELECT w.*, uwp.srs_stage as srsStage, uwp.next_review_at as nextReviewAt, uwp.review_count as reviewCount
      FROM user_word_progress uwp
      JOIN words w ON uwp.word_id = w.id
      WHERE uwp.user_id = ? AND uwp.next_review_at <= ?
      ORDER BY uwp.srs_stage ASC
    `).all(user.id, now);

    return NextResponse.json(words);
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}