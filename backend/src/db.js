import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'pomodoro.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

export const db = new DatabaseSync(DB_PATH)

db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA foreign_keys = ON;')

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#ff7a66',
    work_minutes INTEGER NOT NULL DEFAULT 25,
    short_break_minutes INTEGER NOT NULL DEFAULT 5,
    long_break_minutes INTEGER NOT NULL DEFAULT 15,
    long_break_interval INTEGER NOT NULL DEFAULT 4,
    auto_start_breaks INTEGER NOT NULL DEFAULT 1,
    auto_start_focus INTEGER NOT NULL DEFAULT 0,
    sound_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    work_minutes INTEGER NOT NULL,
    short_break_minutes INTEGER NOT NULL,
    long_break_minutes INTEGER NOT NULL,
    long_break_interval INTEGER NOT NULL DEFAULT 4,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    preset_id INTEGER REFERENCES presets(id) ON DELETE SET NULL,
    label TEXT NOT NULL DEFAULT '',
    mode TEXT NOT NULL CHECK (mode IN ('focus', 'short', 'long')),
    planned_seconds INTEGER NOT NULL DEFAULT 0,
    actual_seconds INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('completed', 'cancelled')),
    started_at TEXT NOT NULL,
    ended_at TEXT NOT NULL,
    day TEXT NOT NULL,
    hour INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_profile_day
    ON sessions (profile_id, day);

  CREATE INDEX IF NOT EXISTS idx_sessions_profile_started
    ON sessions (profile_id, started_at);
`)

const profileCount = db.prepare('SELECT COUNT(*) AS total FROM profiles').get().total

if (profileCount === 0) {
  const insertProfile = db.prepare(`
    INSERT INTO profiles
      (name, color, work_minutes, short_break_minutes, long_break_minutes,
       long_break_interval, auto_start_breaks, auto_start_focus, sound_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const profileId = Number(
    insertProfile.run('Personal', '#ff7a66', 25, 5, 15, 4, 1, 0, 1).lastInsertRowid
  )

  const insertPreset = db.prepare(`
    INSERT INTO presets
      (profile_id, name, work_minutes, short_break_minutes, long_break_minutes, long_break_interval)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  insertPreset.run(profileId, 'Clásico', 25, 5, 15, 4)
  insertPreset.run(profileId, 'Enfoque profundo', 50, 10, 25, 3)
  insertPreset.run(profileId, 'Sprint', 15, 3, 10, 4)
}

export function closeDatabase() {
  try {
    db.close()
  } catch {
    // La base de datos ya estaba cerrada.
  }
}
