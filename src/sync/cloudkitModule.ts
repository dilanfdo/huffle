type ExpoCloudKit = typeof import('expo-cloudkit');

/**
 * Non-iOS fallback. The iOS build resolves cloudkitModule.ios.ts instead, so
 * Metro never bundles expo-cloudkit (and its web-only dependency) on Android.
 */
export function loadCloudKit(): ExpoCloudKit | null {
  return null;
}
