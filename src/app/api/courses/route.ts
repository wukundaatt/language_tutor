import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const language = searchParams.get('language');
    const level = searchParams.get('level');

    const db = getDb();

    let query = `
      SELECT c.*, l.name as language_name, l.flag_emoji,
        (SELECT COUNT(*) FROM units u JOIN lessons ls ON ls.unit_id = u.id WHERE u.course_id = c.id) as lesson_count
      FROM courses c
      JOIN languages l ON c.language_id = l.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (language) {
      query += ' AND l.code = ?';
      params.push(language);
    }
    if (level) {
      query += ' AND c.level = ?';
      params.push(level);
    }

    query += ' ORDER BY c.sort_order ASC';

    const courses = db.prepare(query).all(...params);
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Courses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}