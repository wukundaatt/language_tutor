import { getDb } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Edit3, Headphones, Mic, Lock, CheckCircle2, Play } from 'lucide-react';

interface CourseRow {
  id: number;
  language_id: number;
  title: string;
  description: string;
  level: string;
  cover_color: string;
  language_flag: string;
  language_name: string;
}

interface UnitRow {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  sort_order: number;
}

interface LessonRow {
  id: number;
  unit_id: number;
  title: string;
  type: string;
  duration_minutes: number;
  sort_order: number;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  word: BookOpen,
  grammar: Edit3,
  listening: Headphones,
  speaking: Mic,
};

const TYPE_LABELS: Record<string, string> = {
  word: '单词记忆',
  grammar: '语法练习',
  listening: '听力训练',
  speaking: '口语练习',
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();

  const course = db.prepare(`
    SELECT c.*, l.flag_emoji as language_flag, l.name as language_name
    FROM courses c
    JOIN languages l ON l.id = c.language_id
    WHERE c.id = ?
  `).get(parseInt(id)) as CourseRow | undefined;

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[var(--muted)]">
        <p className="text-lg">课程未找到</p>
        <Link href="/courses" className="text-[var(--accent)] hover:underline mt-2 inline-block">
          返回课程列表
        </Link>
      </div>
    );
  }

  const units = db.prepare(`
    SELECT * FROM units WHERE course_id = ? ORDER BY sort_order
  `).all(parseInt(id)) as UnitRow[];

  const lessonMap = new Map<number, LessonRow[]>();
  if (units.length > 0) {
    const unitIds = units.map((u) => u.id);
    const placeholders = unitIds.map(() => '?').join(',');
    const lessons = db.prepare(`
      SELECT * FROM lessons WHERE unit_id IN (${placeholders}) ORDER BY unit_id, sort_order
    `).all(...unitIds) as LessonRow[];

    for (const l of lessons) {
      const list = lessonMap.get(l.unit_id) || [];
      list.push(l);
      lessonMap.set(l.unit_id, list);
    }
  }

  const totalLessons = Array.from(lessonMap.values()).reduce((sum, l) => sum + l.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回课程列表
      </Link>

      {/* Course header */}
      <div className="animate-fade-in-up space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl">{course.language_flag}</span>
          <span className="text-xs px-2.5 py-1 rounded-full glass font-medium">{course.level}</span>
          <span className="text-sm text-[var(--muted)]">{course.language_name}</span>
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {course.title}
        </h1>
        <p className="text-[var(--muted)] max-w-2xl">{course.description}</p>

        {/* Progress bar (overall) */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--muted)]">课程进度</span>
            <span className="font-medium">0 / {totalLessons} 课</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--card-border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ backgroundColor: 'var(--accent)', width: '0%' }}
            />
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/learn/word/${units[0] && lessonMap.get(units[0].id)?.[0]?.id || 1}`}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white
                     bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                     hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <Play className="w-5 h-5" />
          {totalLessons > 0 ? '开始学习' : '即将上线'}
        </Link>
      </div>

      {/* Units accordion */}
      <div className="space-y-4 stagger-children">
        {units.map((unit, ui) => {
          const lessons = lessonMap.get(unit.id) || [];
          return (
            <details
              key={unit.id}
              className="glass rounded-2xl group"
              open={ui === 0}
            >
              <summary className="px-6 py-4 cursor-pointer list-none flex items-center gap-4 select-none">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {ui + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{unit.title}</h3>
                  {unit.description && (
                    <p className="text-sm text-[var(--muted)] line-clamp-1">{unit.description}</p>
                  )}
                </div>
                <span className="text-sm text-[var(--muted)]">{lessons.length} 课</span>
                <span className="text-[var(--muted)] group-open:rotate-180 transition-transform ml-1">
                  ▼
                </span>
              </summary>

              <div className="px-6 pb-4 space-y-2">
                {lessons.map((lesson, li) => {
                  const IconComp = TYPE_ICONS[lesson.type] || BookOpen;
                  const isLocked = li > 0; // First lesson unlocked
                  const isCompleted = false;
                  return (
                    <Link
                      key={lesson.id}
                      href={isLocked ? '#' : `/learn/${lesson.type}/${lesson.id}`}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all
                        ${isLocked
                          ? 'opacity-50 cursor-not-allowed'
                          : isCompleted
                          ? 'hover:bg-emerald-500/10'
                          : 'hover:bg-[var(--card-bg)] hover:-translate-x-0.5'
                        }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center
                          ${isCompleted
                            ? 'bg-emerald-500/20'
                            : isLocked
                            ? 'bg-gray-500/10'
                            : ''
                          }`}
                        style={!isCompleted && !isLocked ? { backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' } : {}}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4 text-[var(--muted)]" />
                        ) : (
                          <IconComp className="w-4 h-4 text-[var(--accent)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isLocked ? 'text-[var(--muted)]' : ''}`}>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {TYPE_LABELS[lesson.type]} · {lesson.duration_minutes} 分钟
                        </p>
                      </div>
                      {isCompleted && (
                        <span className="text-xs text-emerald-400 font-medium">已完成</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </details>
          );
        })}

        {units.length === 0 && (
          <div className="text-center py-12 text-[var(--muted)]">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>暂无课程内容</p>
          </div>
        )}
      </div>
    </div>
  );
}