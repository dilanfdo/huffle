type ExpoCloudKit = typeof import('expo-cloudkit');

/** Native CloudKit is absent in Expo Go; loading must not crash the JS bundle. */
export function loadCloudKit(): ExpoCloudKit | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-cloudkit') as ExpoCloudKit;
    return mod.isNativeModuleAvailable() ? mod : null;
  } catch {
    return null;
  }
}
