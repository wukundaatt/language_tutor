import { getDb } from '@/lib/db';
import HomeClient from './home-client';

interface Language {
  code: string;
  name: string;
  flag_emoji: string;
  course_count: number;
}

interface Course {
  id: number;
  language_id: number;
  title: string;
  description: string;
  level: string;
  cover_color: string;
  language_code: string;
  language_flag: string;
  language_name: string;
  lesson_count: number;
}

async function getLanguages(): Promise<Language[]> {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT l.code, l.name, l.flag_emoji, COUNT(c.id) as course_count
      FROM languages l
      LEFT JOIN courses c ON c.language_id = l.id
      GROUP BY l.id
    `).all() as Language[];
    return rows;
  } catch {
    return [];
  }
}

async function getCourses(): Promise<Course[]> {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT c.*, l.code as language_code, l.flag_emoji as language_flag, l.name as language_name,
        (SELECT COUNT(*) FROM units u JOIN lessons le ON le.unit_id = u.id WHERE u.course_id = c.id) as lesson_count
      FROM courses c
      JOIN languages l ON l.id = c.language_id
      ORDER BY c.sort_order
    `).all() as Course[];
    return rows;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const languages = await getLanguages();
  const courses = await getCourses();

  return <HomeClient languages={languages} courses={courses} />;
}