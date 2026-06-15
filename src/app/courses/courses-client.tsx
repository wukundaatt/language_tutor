'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Filter } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 animate-fade-in-up">
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          课程列表
        </h1>
        <p className="text-[var(--muted)]">选择适合你的课程，开始学习之旅</p>
      </div>

      {/* Filters */}
      <div className="space-y-4 animate-fade-in-up">
        {/* Language tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveLang('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5
              ${activeLang === 'all'
                ? 'text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] shadow-md'
                : 'glass hover:shadow-sm'
              }`}
          >
            🌐 全部
          </button>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveLang(lang.code)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5
                ${activeLang === lang.code
                  ? 'text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] shadow-md'
                  : 'glass hover:shadow-sm'
                }`}
            >
              {lang.name}
            </button>
          ))}
        </div>

        {/* Level filter + search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--muted)]" />
            <div className="flex gap-1.5 flex-wrap">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setActiveLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${activeLevel === lvl
                      ? 'text-white'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  style={activeLevel === lvl ? { backgroundColor: 'var(--accent)' } : {}}
                >
                  {lvl === 'All' ? '全部等级' : lvl}
                </button>
              ))}
            </div>
          </div>
          <div className="relative sm:ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {filtered.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="glass rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
          >
            <div
              className="h-2"
              style={{ backgroundColor: course.cover_color }}
            />
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{course.language_flag}</span>
                <span className="text-xs px-2 py-0.5 rounded-full glass">{course.level}</span>
                <span className="text-xs text-[var(--muted)] ml-auto flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {course.lesson_count} 课
                </span>
              </div>
              <h3 className="font-semibold group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                {course.title}
              </h3>
              <p className="text-sm text-[var(--muted)] line-clamp-2">{course.description}</p>
              {isAuthenticated && (
                <div className="pt-1">
                  <div className="h-1.5 rounded-full bg-[var(--card-border)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--accent)] w-[0%]" />
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[var(--muted)]">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>没找到匹配的课程</p>
        </div>
      )}
    </div>
  );
}