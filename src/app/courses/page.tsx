import { getDb } from '@/lib/db';
import CoursesClient from './courses-client';

interface CourseRow {
  id: number;
  language_id: number;
  title: string;
  description: string;
  level: string;
  cover_color: string;
  language_code: string;
  language_name: string;
  language_flag: string;
  lesson_count: number;
}

interface LanguageRow {
  code: string;
  name: string;
}

async function getCourses(): Promise<CourseRow[]> {
  try {
    const db = getDb();
    return db.prepare(`
      SELECT c.*, l.code as language_code, l.name as language_name, l.flag_emoji as language_flag,
        (SELECT COUNT(*) FROM units u JOIN lessons le ON le.unit_id = u.id WHERE u.course_id = c.id) as lesson_count
      FROM courses c
      JOIN languages l ON l.id = c.language_id
      ORDER BY c.sort_order
    `).all() as CourseRow[];
  } catch {
    return [];
  }
}

async function getLanguages(): Promise<LanguageRow[]> {
  try {
    const db = getDb();
    return db.prepare('SELECT code, name FROM languages ORDER BY id').all() as LanguageRow[];
  } catch {
    return [];
  }
}

export default async function CoursesPage() {
  const courses = await getCourses();
  const languages = await getLanguages();

  return <CoursesClient courses={courses} languages={languages} />;
}