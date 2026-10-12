import { getDb } from '../db';
import { nowIso } from '../ids';
import { mapUser } from '../mappers';
import { enqueueOutbox } from '../outbox';
import type { UserRecord, UserRow } from '../types';
import type { WriteOptions } from '../writeOptions';

export async function getUserById(id: string): Promise<UserRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users WHERE id = ?', id);
  return row ? mapUser(row) : null;
}

export async function getUser(): Promise<UserRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users LIMIT 1');
  return row ? mapUser(row) : null;
}

export async function upsertUser(user: UserRecord, options?: WriteOptions): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO users (
      id, created_at, streak_freeze_tokens, onboarding_complete, weekly_goal,
      reminder_hour, reminder_minute, last_opened_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      created_at = excluded.created_at,
      streak_freeze_tokens = excluded.streak_freeze_tokens,
      onboarding_complete = excluded.onboarding_complete,
      weekly_goal = excluded.weekly_goal,
      reminder_hour = excluded.reminder_hour,
      reminder_minute = excluded.reminder_minute,
      last_opened_at = excluded.last_opened_at,
      updated_at = excluded.updated_at`,
    user.id,
    user.createdAt,
    user.streakFreezeTokens,
    user.onboardingComplete ? 1 : 0,
    user.weeklyGoal,
    user.reminderHour,
    user.reminderMinute,
    user.lastOpenedAt,
    user.updatedAt,
  );
  if (!options?.fromSync) {
    await enqueueOutbox('User', user.id);
  }
}

export async function listUsersUpdatedSince(iso: string): Promise<UserRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<UserRow>(
    'SELECT * FROM users WHERE updated_at > ? ORDER BY updated_at ASC',
    iso,
  );
  return rows.map(mapUser);
}

export async function touchUser(
  patch: Partial<Omit<UserRecord, 'id' | 'createdAt'>> & { id: string },
  at: Date = new Date(),
): Promise<void> {
  const existing = await getUser();
  if (!existing || existing.id !== patch.id) {
    throw new Error('User not found');
  }
  await upsertUser({
    ...existing,
    ...patch,
    createdAt: existing.createdAt,
    updatedAt: nowIso(at),
  });
}
