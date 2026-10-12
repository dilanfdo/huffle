import type { SQLiteDatabase } from 'expo-sqlite';
import { nowIso } from './ids';
import type { HabitTypeRecord } from './types';

/**
 * Stable UUIDs so seed rows stay the same across installs and are CloudKit-mergeable.
 * category is "fitness" only in v1; extra categories are seed data later, not a schema change.
 */
export const SEEDED_HABIT_TYPES: readonly Omit<HabitTypeRecord, 'updatedAt'>[] = [
  { id: 'a1e0f5c0-0c1a-4b1a-9f01-000000000001', label: 'Walk', icon: '🚶', category: 'fitness' },
  { id: 'a1e0f5c0-0c1a-4b1a-9f01-000000000002', label: 'Home workout', icon: '🏠', category: 'fitness' },
  { id: 'a1e0f5c0-0c1a-4b1a-9f01-000000000003', label: 'Gym', icon: '🏋️', category: 'fitness' },
  { id: 'a1e0f5c0-0c1a-4b1a-9f01-000000000004', label: 'Run', icon: '🏃', category: 'fitness' },
  { id: 'a1e0f5c0-0c1a-4b1a-9f01-000000000005', label: 'Sport', icon: '⚽', category: 'fitness' },
  { id: 'a1e0f5c0-0c1a-4b1a-9f01-000000000006', label: 'Other', icon: '✨', category: 'fitness' },
];

export async function seedHabitTypes(db: SQLiteDatabase, at: Date = new Date()): Promise<void> {
  const updatedAt = nowIso(at);
  for (const habit of SEEDED_HABIT_TYPES) {
    await db.runAsync(
      `INSERT INTO habit_types (id, label, icon, category, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO NOTHING`,
      habit.id,
      habit.label,
      habit.icon,
      habit.category,
      updatedAt,
    );
  }
}
