import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const progressSchema = z.object({
  wordId: z.number(),
  remembered: z.boolean(),
});

const SRS_INTERVALS: Record<number, number> = {
  0: 0,         // now
  1: 1,         // +1 day
  2: 3,         // +3 days
  3: 7,         // +7 days
  4: 30,        // +30 days
};

function getNextReviewAt(stage: number): string {
  const days = SRS_INTERVALS[stage] ?? 0;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { wordId, remembered } = parsed.data;
    const db = getDb();

    const existing = db.prepare(
      'SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?'
    ).get(user.id, wordId) as Record<string, unknown> | undefined;

    let newStage: number;
    if (remembered) {
      if (existing) {
        newStage = Math.min((existing.srs_stage as number) + 1, 4);
      } else {
        newStage = 1;
      }
    } else {
      newStage = 0;
    }

    const nextReviewAt = getNextReviewAt(newStage);

    if (existing) {
      db.prepare(`
        UPDATE user_word_progress
        SET srs_stage = ?, next_review_at = ?, review_count = review_count + 1
        WHERE user_id = ? AND word_id = ?
      `).run(newStage, nextReviewAt, user.id, wordId);
    } else {
      db.prepare(`
        INSERT INTO user_word_progress (user_id, word_id, srs_stage, next_review_at, review_count)
        VALUES (?, ?, ?, ?, 1)
      `).run(user.id, wordId, newStage, nextReviewAt);
    }

    const progress = db.prepare(
      'SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?'
    ).get(user.id, wordId);

    return NextResponse.json({ srsStage: newStage, nextReviewAt, progress });
  } catch (error) {
    console.error('Word progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}