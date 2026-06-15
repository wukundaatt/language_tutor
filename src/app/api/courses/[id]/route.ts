import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const user = await getAuthUser();

    const course = db.prepare(`
      SELECT c.*, l.name as language_name, l.flag_emoji
      FROM courses c
      JOIN languages l ON c.language_id = l.id
      WHERE c.id = ?
    `).get(id);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const units = db.prepare(`
      SELECT * FROM units WHERE course_id = ? ORDER BY sort_order ASC
    `).all(id) as Array<Record<string, unknown>>;

    const unitsWithLessons = units.map((unit) => {
      const lessons = db.prepare(`
        SELECT * FROM lessons WHERE unit_id = ? ORDER BY sort_order ASC
      `).all(unit.id as number);
      return { ...unit, lessons };
    });

    let userProgressPercentage = 0;
    if (user) {
      const totalLessons = db.prepare(`
        SELECT COUNT(*) as count FROM lessons ls
        JOIN units u ON ls.unit_id = u.id
        WHERE u.course_id = ?
      `).get(id) as { count: number };

      const completedLessons = db.prepare(`
        SELECT COUNT(*) as count FROM user_progress up
        JOIN lessons ls ON up.lesson_id = ls.id
        JOIN units u ON ls.unit_id = u.id
        WHERE u.course_id = ? AND up.user_id = ?
      `).get(id, user.id) as { count: number };

      if (totalLessons.count > 0) {
        userProgressPercentage = Math.round((completedLessons.count / totalLessons.count) * 100);
      }
    }

    return NextResponse.json({
      ...course,
      units: unitsWithLessons,
      userProgressPercentage,
    });
  } catch (error) {
    console.error('Course detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}