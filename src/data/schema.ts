export const SCHEMA_VERSION = 3;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  streak_freeze_tokens INTEGER NOT NULL DEFAULT 0,
  onboarding_complete INTEGER NOT NULL DEFAULT 0,
  weekly_goal INTEGER NOT NULL DEFAULT 3,
  reminder_hour INTEGER NOT NULL DEFAULT 19,
  reminder_minute INTEGER NOT NULL DEFAULT 0,
  last_opened_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hufflings (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  evolution_stage TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  mood TEXT NOT NULL,
  last_fed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_types (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_logs (
  id TEXT PRIMARY KEY NOT NULL,
  habit_type_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  duration_minutes INTEGER,
  xp_awarded INTEGER NOT NULL,
  note TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (habit_type_id) REFERENCES habit_types (id)
);

CREATE TABLE IF NOT EXISTS streaks (
  id TEXT PRIMARY KEY NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date TEXT,
  freeze_used_dates TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_goals (
  id TEXT PRIMARY KEY NOT NULL,
  target_sessions INTEGER NOT NULL,
  week_start_date TEXT NOT NULL,
  sessions_completed_this_week INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_logs_completed_at ON session_logs (completed_at);
CREATE INDEX IF NOT EXISTS idx_session_logs_updated_at ON session_logs (updated_at);
CREATE INDEX IF NOT EXISTS idx_habit_types_category ON habit_types (category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_goals_week_start ON weekly_goals (week_start_date);
`;

export const CREATE_SYNC_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS sync_outbox (
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  queued_at TEXT NOT NULL,
  PRIMARY KEY (record_type, record_id)
);

CREATE TABLE IF NOT EXISTS sync_change_tags (
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  change_tag TEXT NOT NULL,
  PRIMARY KEY (record_type, record_id)
);
`;

/** Device-local preferences (selected cosmetic, gift state). Not synced. */
export const CREATE_SETTINGS_SQL = `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;
