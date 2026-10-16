import { parseSnapshot, SNAPSHOT_VERSION, type Snapshot } from './snapshot';

export const SNAPSHOT_FILE_NAME = 'huffle-sync.json';

const FILES = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

export class DriveError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'DriveError';
  }
}

export type TokenProvider = (forceRefresh?: boolean) => Promise<string>;

/** Minimal Drive v3 client for one JSON file in the app's hidden appDataFolder. */
export function createDriveApi(getToken: TokenProvider) {
  async function request(
    url: string,
    init: RequestInit = {},
    retryAuth = true,
    knownToken?: string,
  ): Promise<Response> {
    const token = knownToken ?? (await getToken());
    const response = await fetch(url, {
      ...init,
      headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` },
    });
    if (response.status === 401 && retryAuth) {
      return request(url, init, false, await getToken(true));
    }
    if (!response.ok) {
      throw new DriveError(response.status, `Drive request failed (${response.status})`);
    }
    return response;
  }

  async function findId(): Promise<string | null> {
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      q: `name='${SNAPSHOT_FILE_NAME}' and trashed=false`,
      fields: 'files(id)',
      orderBy: 'modifiedTime desc',
      pageSize: '1',
    });
    const response = await request(`${FILES}?${params.toString()}`);
    const body = (await response.json()) as { files?: Array<{ id: string }> };
    return body.files?.[0]?.id ?? null;
  }

  async function download(id: string): Promise<Snapshot | null> {
    const response = await request(`${FILES}/${id}?alt=media`);
    const body: unknown = await response.json();
    // A backup from a newer app version must never be overwritten by an older one.
    const version = (body as { version?: unknown } | null)?.version;
    if (typeof version === 'number' && version > SNAPSHOT_VERSION) {
      throw new DriveError(409, 'Backup was made by a newer version of Huffle');
    }
    return parseSnapshot(body);
  }

  async function create(content: string): Promise<void> {
    const boundary = 'huffle-boundary-7f3a';
    const metadata = JSON.stringify({ name: SNAPSHOT_FILE_NAME, parents: ['appDataFolder'] });
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;
    await request(`${UPLOAD}?uploadType=multipart`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
  }

  async function update(id: string, content: string): Promise<void> {
    await request(`${UPLOAD}/${id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: content,
    });
  }

  return {
    /** The stored snapshot, or null when none exists yet (or it is unreadable). */
    async load(): Promise<{ id: string | null; snapshot: Snapshot | null }> {
      const id = await findId();
      if (!id) {
        return { id: null, snapshot: null };
      }
      return { id, snapshot: await download(id) };
    },
    async save(id: string | null, snapshot: Snapshot): Promise<void> {
      const content = JSON.stringify(snapshot);
      if (id) {
        await update(id, content);
      } else {
        await create(content);
      }
    },
  };
}
