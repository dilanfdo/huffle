import * as SQLite from 'expo-sqlite';
import { nowIso } from './ids';
import { CREATE_SETTINGS_SQL, CREATE_SYNC_TABLES_SQL, CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';
import { seedHabitTypes } from './seed';

const DB_NAME = 'huffle.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const EXISTING_TABLES: Array<{ type: string; table: string }> = [
  { type: 'User', table: 'users' },
  { type: 'Huffling', table: 'hufflings' },
  { type: 'HabitType', table: 'habit_types' },
  { type: 'SessionLog', table: 'session_logs' },
  { type: 'Streak', table: 'streaks' },
  { type: 'WeeklyGoal', table: 'weekly_goals' },
];

async function enqueueExisting(db: SQLite.SQLiteDatabase): Promise<void> {
  const queuedAt = nowIso();
  for (const { type, table } of EXISTING_TABLES) {
    const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM ${table}`);
    for (const row of rows) {
      await db.runAsync(
        `INSERT INTO sync_outbox (record_type, record_id, queued_at)
         VALUES (?, ?, ?)
         ON CONFLICT(record_type, record_id) DO UPDATE SET queued_at = excluded.queued_at`,
        type,
        row.id,
        queuedAt,
      );
    }
  }
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  if (current < 1) {
    await db.execAsync(CREATE_TABLES_SQL);
    await seedHabitTypes(db);
  }
  if (current < 2) {
    await db.execAsync(CREATE_SYNC_TABLES_SQL);
    await enqueueExisting(db);
  }
  if (current < 3) {
    await db.execAsync(CREATE_SETTINGS_SQL);
  }
  if (current < SCHEMA_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

export async function runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const db = await getDb();
  let result!: T;
  await db.withTransactionAsync(async () => {
    result = await fn();
  });
  return result;
}

/** For tests / future reset. Next getDb() opens a fresh connection. */
export async function closeDb(): Promise<void> {
  if (!dbPromise) {
    return;
  }
  const db = await dbPromise;
  await db.closeAsync();
  dbPromise = null;
}
