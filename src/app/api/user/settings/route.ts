import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const settingsSchema = z.object({
  targetLanguage: z.string().optional(),
  dailyGoal: z.number().optional(),
  reminderTime: z.string().nullable().optional(),
  theme: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { targetLanguage, dailyGoal, reminderTime, theme } = parsed.data;
    const db = getDb();

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (targetLanguage !== undefined) {
      updates.push('target_language = ?');
      params.push(targetLanguage);
    }
    if (dailyGoal !== undefined) {
      updates.push('daily_goal_minutes = ?');
      params.push(dailyGoal);
    }
    if (reminderTime !== undefined) {
      updates.push('reminder_time = ?');
      params.push(reminderTime);
    }
    if (theme !== undefined) {
      updates.push('theme = ?');
      params.push(theme);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updatedUser = db.prepare(
      'SELECT id, username, email, level, xp, streak, target_language, daily_goal_minutes, reminder_time, theme, avatar_url, created_at FROM users WHERE id = ?'
    ).get(user.id);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}