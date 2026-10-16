import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDriveApi, DriveError, SNAPSHOT_FILE_NAME } from './driveApi';
import {
  hasProfile,
  mergePreferences,
  mergeSnapshots,
  parseSnapshot,
  profilesConflict,
  SNAPSHOT_VERSION,
  summarize,
  toDomainRecords,
  type Snapshot,
} from './snapshot';

const at = (n: number) => `2026-09-${String(n).padStart(2, '0')}T10:00:00.000Z`;

function snap(partial: Partial<Snapshot['records']> = {}): Snapshot {
  return {
    version: SNAPSHOT_VERSION,
    savedAt: at(1),
    records: { User: [], Huffling: [], HabitType: [], SessionLog: [], Streak: [], WeeklyGoal: [], ...partial },
  };
}

const user = (id: string, updatedAt = at(1)) => ({
  id, createdAt: at(1), streakFreezeTokens: 0, onboardingComplete: true, weeklyGoal: 3,
  reminderHour: 19, reminderMinute: 0, lastOpenedAt: null, updatedAt,
});
const huffling = (id: string, xp: number, updatedAt = at(1)) => ({
  id, name: 'Pip', evolutionStage: 'winded' as const, xp, mood: 'neutral' as const, lastFedAt: null, updatedAt,
});
const session = (id: string, updatedAt = at(1)) => ({
  id, habitTypeId: 'h', completedAt: updatedAt, durationMinutes: null, xpAwarded: 11, note: null, updatedAt,
});
const week = (id: string, weekStartDate: string, done: number, updatedAt = at(1)) => ({
  id, targetSessions: 3, weekStartDate, sessionsCompletedThisWeek: done, updatedAt,
});

describe('mergeSnapshots', () => {
  it('unions sessions from both sides and flags the remote as stale', () => {
    const local = snap({ SessionLog: [session('a'), session('b')] });
    const remote = snap({ SessionLog: [session('b'), session('c')] });
    const result = mergeSnapshots(local, remote, at(9));
    expect(result.merged.records.SessionLog.map((s) => s.id).sort()).toEqual(['a', 'b', 'c']);
    expect(result.incoming.map((r) => r.record.id)).toEqual(['c']);
    expect(result.remoteStale).toBe(true);
  });

  it('takes the newer copy of a record', () => {
    const local = snap({ Huffling: [huffling('x', 10, at(2))] });
    const remote = snap({ Huffling: [huffling('x', 40, at(5))] });
    const result = mergeSnapshots(local, remote, at(9));
    expect(result.merged.records.Huffling[0].xp).toBe(40);
    expect(result.incoming).toHaveLength(1);
    expect(result.remoteStale).toBe(false);
  });

  it('keeps the local copy when it is newer and marks remote stale', () => {
    const local = snap({ Huffling: [huffling('x', 60, at(6))] });
    const remote = snap({ Huffling: [huffling('x', 40, at(5))] });
    const result = mergeSnapshots(local, remote, at(9));
    expect(result.merged.records.Huffling[0].xp).toBe(60);
    expect(result.incoming).toHaveLength(0);
    expect(result.remoteStale).toBe(true);
  });

  it('is a no-op when both sides already agree', () => {
    const both = snap({ User: [user('u')], SessionLog: [session('a')] });
    const result = mergeSnapshots(both, both, at(9));
    expect(result.incoming).toHaveLength(0);
    expect(result.remoteStale).toBe(false);
  });

  it('uploads when there is no remote file yet', () => {
    const result = mergeSnapshots(snap({ User: [user('u')] }), null, at(9));
    expect(result.remoteStale).toBe(true);
    expect(result.incoming).toHaveLength(0);
  });

  it('merges weekly goals by week start, not by id', () => {
    const local = snap({ WeeklyGoal: [week('w1', '2026-09-07', 1, at(2))] });
    const remote = snap({ WeeklyGoal: [week('w2', '2026-09-07', 2, at(4))] });
    const result = mergeSnapshots(local, remote, at(9));
    expect(result.merged.records.WeeklyGoal).toHaveLength(1);
    expect(result.merged.records.WeeklyGoal[0].sessionsCompletedThisWeek).toBe(2);
  });

  it('converges: merging the merged result with either side changes nothing', () => {
    const local = snap({ SessionLog: [session('a')], Huffling: [huffling('x', 10, at(2))] });
    const remote = snap({ SessionLog: [session('b')], Huffling: [huffling('x', 30, at(3))] });
    const first = mergeSnapshots(local, remote, at(9)).merged;
    const again = mergeSnapshots(first, remote, at(9));
    expect(again.incoming).toHaveLength(0);
    expect(mergeSnapshots(local, first, at(9)).merged.records.SessionLog).toHaveLength(2);
  });
});

describe('profiles', () => {
  it('detects two different onboarded profiles', () => {
    const a = snap({ User: [user('u1')], Huffling: [huffling('h1', 5)] });
    const b = snap({ User: [user('u2')], Huffling: [huffling('h2', 90)] });
    expect(profilesConflict(a, b)).toBe(true);
    expect(profilesConflict(a, a)).toBe(false);
    expect(profilesConflict(a, null)).toBe(false);
    expect(profilesConflict(snap(), b)).toBe(false);
  });

  it('summarises and recognises a profile', () => {
    const s = snap({ User: [user('u')], Huffling: [huffling('h', 42)], SessionLog: [session('a'), session('b')] });
    expect(hasProfile(s)).toBe(true);
    expect(summarize(s)).toEqual({ name: 'Pip', xp: 42, sessions: 2 });
    expect(toDomainRecords(s)).toHaveLength(4);
  });
});

describe('parseSnapshot', () => {
  it('rejects unknown versions and junk, and drops malformed records', () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot({ version: 99, records: {} })).toBeNull();
    const ok = parseSnapshot({ version: 1, savedAt: 'x', records: { SessionLog: [{ id: 'a' }, { nope: 1 }, null] } });
    expect(ok?.records.SessionLog).toEqual([{ id: 'a' }]);
    expect(ok?.records.User).toEqual([]);
  });
});

describe('createDriveApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('returns nothing when no snapshot file exists', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ files: [] })));
    const api = createDriveApi(async () => 'tok');
    expect(await api.load()).toEqual({ id: null, snapshot: null });
  });

  it('searches only the app data folder and sends the bearer token', async () => {
    const fetchMock = vi.fn(async () => json({ files: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await createDriveApi(async () => 'tok').load();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('spaces=appDataFolder');
    expect(decodeURIComponent(url)).toContain(SNAPSHOT_FILE_NAME);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('downloads and parses an existing snapshot', async () => {
    const stored = snap({ SessionLog: [session('a')] });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ files: [{ id: 'f1' }] }))
      .mockResolvedValueOnce(json(stored));
    vi.stubGlobal('fetch', fetchMock);
    const result = await createDriveApi(async () => 'tok').load();
    expect(result.id).toBe('f1');
    expect(result.snapshot?.records.SessionLog).toHaveLength(1);
  });

  it('creates with a multipart upload into appDataFolder, or patches an existing file', async () => {
    const fetchMock = vi.fn(async () => json({}));
    vi.stubGlobal('fetch', fetchMock);
    const api = createDriveApi(async () => 'tok');
    await api.save(null, snap());
    await api.save('f1', snap());
    const [createUrl, createInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(createUrl).toContain('uploadType=multipart');
    expect(String(createInit.body)).toContain('"parents":["appDataFolder"]');
    const [updateUrl, updateInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(updateUrl).toContain('/f1?uploadType=media');
    expect(updateInit.method).toBe('PATCH');
  });

  it('refreshes the token once on 401 and retries', async () => {
    const getToken = vi.fn(async (force?: boolean) => (force ? 'fresh' : 'stale'));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ files: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await createDriveApi(getToken).load();
    expect(getToken).toHaveBeenCalledWith(true);
    const retried = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect((retried[1].headers as Record<string, string>).Authorization).toBe('Bearer fresh');
  });

  it('throws a DriveError on other failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({}, 403)));
    await expect(createDriveApi(async () => 'tok').load()).rejects.toBeInstanceOf(DriveError);
  });
});

describe('preferences', () => {
  const prefs = (selectedCosmetic: string | null, giftOpenedDate: string | null, updatedAt: string, supporter = false) => ({
    selectedCosmetic, giftOpenedDate, supporter, updatedAt,
  });

  it('takes the newest selection but never moves the gift date backwards', () => {
    const merged = mergePreferences(prefs('crown', '2026-09-03', at(2)), prefs('scarf', '2026-09-05', at(4)));
    expect(merged).toEqual(prefs('scarf', '2026-09-05', at(4)));
    const keepsLocal = mergePreferences(prefs('crown', '2026-09-08', at(6)), prefs('scarf', '2026-09-05', at(4)));
    expect(keepsLocal).toEqual(prefs('crown', '2026-09-08', at(6)));
  });

  it('keeps the supporter flag once either side has it, and an explicit "none" selection', () => {
    const merged = mergePreferences(prefs(null, null, at(5)), prefs('scarf', null, at(3), true));
    expect(merged?.supporter).toBe(true);
    expect(merged?.selectedCosmetic).toBeNull();
  });

  it('returns whichever side exists', () => {
    expect(mergePreferences(null, null)).toBeNull();
    expect(mergePreferences(prefs('a', null, at(1)), null)?.selectedCosmetic).toBe('a');
    expect(mergePreferences(null, prefs('b', null, at(1)))?.selectedCosmetic).toBe('b');
  });

  it('flows through the snapshot merge: incoming for this device, stale for the cloud', () => {
    const remoteOnly = mergeSnapshots(snap(), { ...snap(), preferences: prefs('scarf', null, at(4)) }, at(9));
    expect(remoteOnly.incomingPreferences?.selectedCosmetic).toBe('scarf');
    expect(remoteOnly.remoteStale).toBe(false);

    const localOnly = mergeSnapshots({ ...snap(), preferences: prefs('crown', null, at(4)) }, snap(), at(9));
    expect(localOnly.incomingPreferences).toBeNull();
    expect(localOnly.remoteStale).toBe(true);

    const same = { ...snap(), preferences: prefs('crown', null, at(4)) };
    const settled = mergeSnapshots(same, same, at(9));
    expect(settled.incomingPreferences).toBeNull();
    expect(settled.remoteStale).toBe(false);
  });

  it('parses preferences from a stored backup and tolerates old backups without them', () => {
    const parsed = parseSnapshot({ version: 1, savedAt: 'x', records: {}, preferences: { selectedCosmetic: 'crown', supporter: true, updatedAt: at(1) } });
    expect(parsed?.preferences).toEqual(prefs('crown', null, at(1), true));
    expect(parseSnapshot({ version: 1, savedAt: 'x', records: {} })?.preferences).toBeNull();
  });
});

describe('newer backups', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('refuses to read, and so never overwrites, a backup from a newer app version', async () => {
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json({ files: [{ id: 'f1' }] })).mockResolvedValueOnce(json({ version: 2, records: {} })));
    await expect(createDriveApi(async () => 'tok').load()).rejects.toBeInstanceOf(DriveError);
  });
});
