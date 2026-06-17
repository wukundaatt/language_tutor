import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.join(process.cwd(), 'lingualearn.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb(): void {
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      target_language TEXT DEFAULT 'english',
      daily_goal_minutes INTEGER DEFAULT 30,
      reminder_time TEXT,
      theme TEXT DEFAULT 'dark',
      avatar_url TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 对旧数据库迁移添加 is_admin 字段
    PRAGMA table_info(users);
  `);

  // 迁移: 如果 users 表没有 is_admin 列则添加
  try {
    const cols = database.prepare('PRAGMA table_info(users)').all() as { name: string }[];
    if (!cols.find((c) => c.name === 'is_admin')) {
      database.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
    }
  } catch {
    // 忽略迁移错误
  }

  database.exec(`

    CREATE TABLE IF NOT EXISTS languages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      flag_emoji TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language_id INTEGER NOT NULL REFERENCES languages(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      level TEXT NOT NULL,
      cover_color TEXT NOT NULL DEFAULT '#1e3a5f',
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id),
      title TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL REFERENCES units(id),
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('word','grammar','listening','speaking')),
      duration_minutes INTEGER DEFAULT 10,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id),
      word TEXT NOT NULL,
      phonetic TEXT,
      translation TEXT NOT NULL,
      part_of_speech TEXT,
      example_sentence TEXT,
      example_translation TEXT
    );

    CREATE TABLE IF NOT EXISTS grammar_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id),
      type TEXT NOT NULL CHECK(type IN ('choice','fill','order')),
      question TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT
    );

    CREATE TABLE IF NOT EXISTS listening_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id),
      audio_url TEXT NOT NULL,
      transcript TEXT,
      type TEXT NOT NULL CHECK(type IN ('choice','fill','dictation')),
      question TEXT NOT NULL,
      options_json TEXT,
      correct_answer TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS speaking_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id),
      text TEXT NOT NULL,
      translation TEXT NOT NULL,
      phonetic TEXT,
      audio_url TEXT NOT NULL,
      difficulty INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      lesson_id INTEGER NOT NULL REFERENCES lessons(id),
      lesson_type TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      completed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_word_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      word_id INTEGER NOT NULL REFERENCES words(id),
      srs_stage INTEGER DEFAULT 0,
      next_review_at TEXT,
      review_count INTEGER DEFAULT 0,
      UNIQUE(user_id, word_id)
    );

    CREATE TABLE IF NOT EXISTS daily_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS daily_challenge_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id INTEGER NOT NULL REFERENCES daily_challenges(id),
      type TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      completed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      condition TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      badge_id INTEGER NOT NULL REFERENCES badges(id),
      unlocked_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES community_posts(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      UNIQUE(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES community_posts(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}