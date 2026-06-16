import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const db = getDb();
    const today = new Date().toISOString().substring(0, 10);

    let challenge = db.prepare(
      'SELECT * FROM daily_challenges WHERE user_id = ? AND date = ?'
    ).get(user.id, today) as Record<string, unknown> | undefined;

    if (!challenge) {
      // Create a new challenge by selecting random tasks
      const wordQuestions = db.prepare(
        'SELECT id FROM grammar_questions ORDER BY RANDOM() LIMIT 2'
      ).all() as Array<{ id: number }>;

      const grammarQuestions = db.prepare(
        'SELECT id FROM grammar_questions ORDER BY RANDOM() LIMIT 2'
      ).all() as Array<{ id: number }>;

      const listeningQuestions = db.prepare(
        'SELECT id FROM listening_questions ORDER BY RANDOM() LIMIT 1'
      ).all() as Array<{ id: number }>;

      const result = db.prepare(
        'INSERT INTO daily_challenges (user_id, date) VALUES (?, ?)'
      ).run(user.id, today);

      const challengeId = result.lastInsertRowid as number;

      const insertTask = db.prepare(
        'INSERT INTO daily_challenge_tasks (challenge_id, type, question_id) VALUES (?, ?, ?)'
      );

      for (const q of wordQuestions) {
        insertTask.run(challengeId, 'grammar', q.id);
      }
      for (const q of grammarQuestions) {
        insertTask.run(challengeId, 'grammar', q.id);
      }
      for (const q of listeningQuestions) {
        insertTask.run(challengeId, 'listening', q.id);
      }

      challenge = db.prepare(
        'SELECT * FROM daily_challenges WHERE id = ?'
      ).get(challengeId) as Record<string, unknown> | undefined;
    }

    const tasks = db.prepare(
      'SELECT * FROM daily_challenge_tasks WHERE challenge_id = ?'
    ).all(challenge?.id as number) as Array<Record<string, unknown>>;

    // Fetch question details for each task
    const tasksWithDetails = tasks.map((task) => {
      let question: unknown = null;
      const type = task.type as string;
      const questionId = task.question_id as number;

      if (type === 'grammar') {
        question = db.prepare('SELECT * FROM grammar_questions WHERE id = ?').get(questionId);
      } else if (type === 'listening') {
        question = db.prepare('SELECT * FROM listening_questions WHERE id = ?').get(questionId);
      }

      return { ...task, question };
    });

    return NextResponse.json({ ...challenge, tasks: tasksWithDetails });
  } catch (error) {
    console.error('Daily challenge error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const db = getDb();
    const today = new Date().toISOString().substring(0, 10);

    const challenge = db.prepare(
      'SELECT * FROM daily_challenges WHERE user_id = ? AND date = ?'
    ).get(user.id, today) as Record<string, unknown> | undefined;

    if (!challenge) {
      return NextResponse.json({ error: 'No challenge found for today' }, { status: 404 });
    }

    db.prepare('UPDATE daily_challenges SET completed = 1 WHERE id = ?').run(challenge.id);

    const xpReward = 50;
    db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xpReward, user.id);

    return NextResponse.json({ completed: true, xpEarned: xpReward });
  } catch (error) {
    console.error('Daily challenge complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}