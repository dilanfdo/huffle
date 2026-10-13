import { GoogleSignin } from '@react-native-google-signin/google-signin';

const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/** Drive backup is offered only in builds that were given a Google OAuth web client id. */
export function isDriveConfigured(): boolean {
  return Boolean(WEB_CLIENT_ID);
}

let configured = false;

function ensureConfigured(): void {
  if (configured) {
    return;
  }
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, scopes: [DRIVE_APPDATA_SCOPE] });
  configured = true;
}

/** Interactive sign-in plus consent for the hidden app-data folder. Null if cancelled. */
export async function signInInteractive(): Promise<string | null> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (response.type !== 'success') {
    return null;
  }
  await GoogleSignin.addScopes({ scopes: [DRIVE_APPDATA_SCOPE] });
  return response.data.user.email;
}

export async function signInSilent(): Promise<string | null> {
  ensureConfigured();
  try {
    const response = await GoogleSignin.signInSilently();
    return response.type === 'success' ? response.data.user.email : null;
  } catch {
    return null;
  }
}

export function currentEmail(): string | null {
  ensureConfigured();
  return GoogleSignin.getCurrentUser()?.user.email ?? null;
}

export async function signOut(): Promise<void> {
  ensureConfigured();
  await GoogleSignin.signOut();
}

/** A valid access token; `forceRefresh` drops the cached one first (after a 401). */
export async function getAccessToken(forceRefresh = false): Promise<string> {
  ensureConfigured();
  let { accessToken } = await GoogleSignin.getTokens();
  if (forceRefresh) {
    await GoogleSignin.clearCachedAccessToken(accessToken);
    ({ accessToken } = await GoogleSignin.getTokens());
  }
  return accessToken;
}
