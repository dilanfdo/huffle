import type {
  HabitTypeRecord,
  HufflingRecord,
  SessionLogRecord,
  StreakRecord,
  UserRecord,
  WeeklyGoalRecord,
} from '../../data/types';
import type { DomainRecord } from '../records';

export const SNAPSHOT_VERSION = 1;

export type SnapshotRecords = {
  User: UserRecord[];
  Huffling: HufflingRecord[];
  HabitType: HabitTypeRecord[];
  SessionLog: SessionLogRecord[];
  Streak: StreakRecord[];
  WeeklyGoal: WeeklyGoalRecord[];
};

export type Snapshot = {
  version: typeof SNAPSHOT_VERSION;
  savedAt: string;
  records: SnapshotRecords;
};

export type ProfileSummary = {
  name: string | null;
  xp: number;
  sessions: number;
};

export type MergeResult = {
  merged: Snapshot;
  /** Records where the remote copy is new or newer than local. */
  incoming: DomainRecord[];
  /** True when the remote file lacks or is behind something local. */
  remoteStale: boolean;
};

const TYPES = ['User', 'Huffling', 'HabitType', 'SessionLog', 'Streak', 'WeeklyGoal'] as const;

export function emptyRecords(): SnapshotRecords {
  return { User: [], Huffling: [], HabitType: [], SessionLog: [], Streak: [], WeeklyGoal: [] };
}

export function parseSnapshot(raw: unknown): Snapshot | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const value = raw as Partial<Snapshot>;
  if (value.version !== SNAPSHOT_VERSION || !value.records || typeof value.records !== 'object') {
    return null;
  }
  const records = emptyRecords();
  for (const type of TYPES) {
    const list = (value.records as Partial<SnapshotRecords>)[type];
    if (Array.isArray(list)) {
      (records[type] as unknown[]) = list.filter(
        (item) => item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string',
      );
    }
  }
  return { version: SNAPSHOT_VERSION, savedAt: String(value.savedAt ?? ''), records };
}

type Winner<T> = { record: T; from: 'local' | 'remote' };

function mergeList<T extends { updatedAt: string }>(
  local: T[],
  remote: T[],
  key: (item: T) => string,
): { merged: T[]; incoming: T[]; stale: boolean } {
  const winners = new Map<string, Winner<T>>();
  for (const record of local) {
    winners.set(key(record), { record, from: 'local' });
  }
  const remoteByKey = new Map<string, T>();
  for (const record of remote) {
    const k = key(record);
    remoteByKey.set(k, record);
    const current = winners.get(k);
    if (!current || record.updatedAt > current.record.updatedAt) {
      winners.set(k, { record, from: 'remote' });
    }
  }

  const merged: T[] = [];
  const incoming: T[] = [];
  let stale = false;
  for (const [k, winner] of winners) {
    merged.push(winner.record);
    if (winner.from === 'remote') {
      incoming.push(winner.record);
    } else {
      const remoteCopy = remoteByKey.get(k);
      if (!remoteCopy || remoteCopy.updatedAt < winner.record.updatedAt) {
        stale = true;
      }
    }
  }
  return { merged, incoming, stale };
}

/**
 * Union by id (week start for weekly goals), newest updatedAt wins. Sessions are
 * never deleted, so this converges: any record a device is missing gets pushed
 * back by whichever device still has it.
 */
export function mergeSnapshots(local: Snapshot, remote: Snapshot | null, savedAt: string): MergeResult {
  const empty = emptyRecords();
  const remoteRecords = remote?.records ?? empty;
  const records = emptyRecords();
  const incoming: DomainRecord[] = [];
  let remoteStale = remote === null;

  const run = <K extends keyof SnapshotRecords>(
    type: K,
    key: (item: SnapshotRecords[K][number]) => string,
  ) => {
    const result = mergeList(
      local.records[type] as Array<SnapshotRecords[K][number]>,
      remoteRecords[type] as Array<SnapshotRecords[K][number]>,
      key,
    );
    (records[type] as unknown[]) = result.merged;
    for (const record of result.incoming) {
      incoming.push({ type, record } as unknown as DomainRecord);
    }
    remoteStale = remoteStale || result.stale;
  };

  run('User', (r) => r.id);
  run('Huffling', (r) => r.id);
  run('HabitType', (r) => r.id);
  run('SessionLog', (r) => r.id);
  run('Streak', (r) => r.id);
  run('WeeklyGoal', (r) => (r as WeeklyGoalRecord).weekStartDate);

  return { merged: { version: SNAPSHOT_VERSION, savedAt, records }, incoming, remoteStale };
}

export function summarize(snapshot: Snapshot): ProfileSummary {
  const huffling = snapshot.records.Huffling[0];
  return {
    name: huffling?.name ?? null,
    xp: huffling?.xp ?? 0,
    sessions: snapshot.records.SessionLog.length,
  };
}

export function hasProfile(snapshot: Snapshot | null): boolean {
  return Boolean(snapshot && snapshot.records.User.length > 0 && snapshot.records.Huffling.length > 0);
}

/**
 * Two different profiles (a fresh install onboarded before the user connected).
 * Merging them would leave two users, so the user must pick one.
 */
export function profilesConflict(local: Snapshot, remote: Snapshot | null): boolean {
  if (!remote || !hasProfile(local) || !hasProfile(remote)) {
    return false;
  }
  return local.records.User[0].id !== remote.records.User[0].id;
}

export function toDomainRecords(snapshot: Snapshot): DomainRecord[] {
  const items: DomainRecord[] = [];
  for (const type of TYPES) {
    for (const record of snapshot.records[type]) {
      items.push({ type, record } as unknown as DomainRecord);
    }
  }
  return items;
}
