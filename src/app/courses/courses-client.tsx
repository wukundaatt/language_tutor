'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Filter, Grid3X3 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LevelBadge from '@/components/ui/LevelBadge';
import EmptyState from '@/components/ui/EmptyState';
import ProgressBar from '@/components/ui/ProgressBar';

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

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function CoursesClient({
  courses,
  languages,
}: {
  courses: CourseRow[];
  languages: LanguageRow[];
}) {
  const { isAuthenticated } = useAuthStore();
  const [activeLang, setActiveLang] = useState('all');
  const [activeLevel, setActiveLevel] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (activeLang !== 'all' && c.language_code !== activeLang) return false;
      if (activeLevel !== 'All' && c.level !== activeLevel) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [courses, activeLang, activeLevel, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 page-enter">
      {/* Header */}
      <div className="space-y-2 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
          课程列表
        </h1>
        <p className="text-[var(--muted)]">选择适合你的课程，开始学习之旅</p>
      </div>

      {/* Filters */}
      <div className="space-y-5 animate-fade-in-up">
        {/* Language tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveLang('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${activeLang === 'all'
                ? 'bg-gradient-to-r from-[var(--accent)] to-[#c49a3c] text-[#0b1121] shadow-[0_4px_16px_rgba(212,168,83,0.25)]'
                : 'glass text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
              }`}
          >
            🌐 全部
          </button>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveLang(lang.code)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${activeLang === lang.code
                  ? 'bg-gradient-to-r from-[var(--accent)] to-[#c49a3c] text-[#0b1121] shadow-[0_4px_16px_rgba(212,168,83,0.25)]'
                  : 'glass text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
                }`}
            >
              {lang.name}
            </button>
          ))}
        </div>

        {/* Level filter + search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2.5">
            <Filter className="w-4 h-4 text-[var(--muted)] shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setActiveLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200
                    ${activeLevel === lvl
                      ? 'bg-[var(--accent)] text-[#0b1121] shadow-[0_2px_8px_rgba(212,168,83,0.2)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-muted)]'
                    }`}
                >
                  {lvl === 'All' ? '全部' : lvl}
                </button>
              ))}
            </div>
          </div>
          <div className="relative sm:ml-auto w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索课程..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass text-sm
                         text-[var(--foreground)] placeholder:text-[var(--muted)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Course grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {filtered.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card variant="glass" hover padding="none" className="overflow-hidden h-full">
                {/* Cover color strip */}
                <div className="h-1.5 w-full" style={{ backgroundColor: course.cover_color }} />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{course.language_flag}</span>
                    <LevelBadge level={course.level} />
                    <span className="text-xs text-[var(--muted)] ml-auto flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {course.lesson_count}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] line-clamp-1 font-[var(--font-heading)]">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                  {isAuthenticated && (
                    <ProgressBar value={0} max={course.lesson_count} className="pt-1" />
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Grid3X3 className="w-12 h-12" />}
          title="没找到匹配的课程"
          description="尝试调整筛选条件或搜索关键词"
          action={
            <Button variant="ghost" onClick={() => { setActiveLang('all'); setActiveLevel('All'); setSearch(''); }}>
              清除筛选
            </Button>
          }
        />
      )}
    </div>
  );
}