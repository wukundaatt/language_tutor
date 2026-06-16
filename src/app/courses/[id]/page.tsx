import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Edit3, Headphones, Mic, Lock, CheckCircle2, Play, ChevronDown } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LevelBadge from '@/components/ui/LevelBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';

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

const TYPE_BADGES: Record<string, 'gold' | 'green' | 'red' | 'blue' | 'muted'> = {
  word: 'gold',
  grammar: 'green',
  listening: 'blue',
  speaking: 'red',
};

function UnitAccordion({
  unit,
  index,
  lessons,
  open,
  completedLessonIds,
}: {
  unit: UnitRow;
  index: number;
  lessons: LessonRow[];
  open: boolean;
  completedLessonIds: Set<number>;
}) {
  return (
    <details className="group" open={open}>
      <summary className="card p-5 cursor-pointer list-none flex items-center gap-4 select-none marker:hidden">
        <div className="w-10 h-10 rounded-xl bg-[rgba(212,168,83,0.15)] flex items-center justify-center text-[var(--accent)] font-bold text-lg font-[var(--font-mono)] shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--foreground)]">{unit.title}</h3>
          {unit.description && (
            <p className="text-sm text-[var(--muted)] line-clamp-1">{unit.description}</p>
          )}
        </div>
        <span className="text-xs text-[var(--muted)] font-medium">{lessons.length} 课</span>
        <ChevronDown className="w-5 h-5 text-[var(--muted)] transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="px-5 pb-4 space-y-1.5">
        {lessons.map((lesson) => {
          const IconComp = TYPE_ICONS[lesson.type] || BookOpen;
          const isLocked = false;
          const isCompleted = completedLessonIds.has(lesson.id);
          const badgeVariant = TYPE_BADGES[lesson.type] || 'muted';

          return (
            <Link
              key={lesson.id}
              href={isLocked ? '#' : `/learn/${lesson.type}/${lesson.id}`}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                ${isLocked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[var(--accent-muted)]'
                }`}
              onClick={(e) => { if (isLocked) e.preventDefault(); }}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                  ${isCompleted
                    ? 'bg-[rgba(77,147,117,0.2)]'
                    : isLocked
                    ? 'bg-[rgba(107,123,141,0.08)]'
                    : 'bg-[var(--accent-muted)]'
                  }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent-secondary)]" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4 text-[var(--muted)]" />
                ) : (
                  <IconComp className="w-4 h-4 text-[var(--accent)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isLocked ? 'text-[var(--muted)]' : 'text-[var(--foreground)]'}`}>
                  {lesson.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={badgeVariant} size="sm">{TYPE_LABELS[lesson.type]}</Badge>
                  <span className="text-xs text-[var(--muted)]">{lesson.duration_minutes} 分钟</span>
                </div>
              </div>
              {isCompleted && (
                <span className="text-xs text-[var(--accent-secondary)] font-semibold shrink-0">已完成</span>
              )}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const user = await getAuthUser();

  const course = db.prepare(`
    SELECT c.*, l.flag_emoji as language_flag, l.name as language_name
    FROM courses c
    JOIN languages l ON l.id = c.language_id
    WHERE c.id = ?
  `).get(parseInt(id)) as CourseRow | undefined;

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={<BookOpen className="w-12 h-12" />}
          title="课程未找到"
          action={
            <Link href="/courses">
              <Button variant="gold">返回课程列表</Button>
            </Link>
          }
        />
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

  const completedLessonIds = new Set<number>();
  let completedCount = 0;
  if (user && totalLessons > 0) {
    const unitIds = units.map((u) => u.id);
    const placeholders = unitIds.map(() => '?').join(',');
    const completed = db.prepare(`
      SELECT DISTINCT lesson_id FROM user_progress up
      JOIN lessons ls ON up.lesson_id = ls.id
      WHERE up.user_id = ? AND ls.unit_id IN (${placeholders})
    `).all(user.id, ...unitIds) as Array<{ lesson_id: number }>;
    for (const c of completed) {
      completedLessonIds.add(c.lesson_id);
    }
    completedCount = completedLessonIds.size;
  }

  const firstLesson = units[0] && lessonMap.get(units[0].id)?.[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 page-enter">
      {/* Back */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回课程列表
      </Link>

      {/* Course header */}
      <div className="animate-fade-in-up space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl">{course.language_flag}</span>
          <LevelBadge level={course.level} />
          <span className="text-sm text-[var(--muted)]">{course.language_name}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
          {course.title}
        </h1>
        <p className="text-[var(--muted)] max-w-2xl leading-relaxed">{course.description}</p>

        {/* Progress bar */}
        <Card variant="glass" padding="md">
          <ProgressBar value={completedCount} max={totalLessons} showLabel variant="default" />
        </Card>

        {/* CTA */}
        <Link
          href={firstLesson ? `/learn/${firstLesson.type}/${firstLesson.id}` : `/learn/word/${1}`}
        >
          <Button variant="primary" size="lg" icon={<Play className="w-5 h-5" />}>
            {totalLessons === 0 ? '即将上线' : completedCount === 0 ? '开始学习' : completedCount >= totalLessons ? '复习已完成' : '继续学习'}
          </Button>
        </Link>
      </div>

      {/* Units accordion */}
      <div className="space-y-3 stagger-children">
        {units.length > 0 ? (
          units.map((unit, ui) => {
            const lessons = lessonMap.get(unit.id) || [];
            return (
              <UnitAccordion
                key={unit.id}
                unit={unit}
                index={ui}
                lessons={lessons}
                open={ui === 0}
                completedLessonIds={completedLessonIds}
              />
            );
          })
        ) : (
          <EmptyState
            icon={<BookOpen className="w-12 h-12" />}
            title="暂无课程内容"
            description="课程内容正在准备中，敬请期待"
          />
        )}
      </div>
    </div>
  );
}