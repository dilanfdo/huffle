import { getDb } from './db';

/**
 * Removes the user's own data (profile, Huffling, sessions, streak, weekly goals)
 * and sync bookkeeping. Seeded habit types are kept. Used when adopting a cloud
 * copy wholesale.
 */
export async function clearUserData(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const table of ['session_logs', 'weekly_goals', 'streaks', 'hufflings', 'users']) {
      await db.runAsync(`DELETE FROM ${table}`);
    }
    await db.runAsync('DELETE FROM sync_outbox');
    await db.runAsync('DELETE FROM sync_change_tags');
  });
}
