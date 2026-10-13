/** Default (web/other): no cloud sync. iOS uses CloudKit, Android uses Google Drive. */
export async function startSync(): Promise<void> {}

export async function restoreFromCloudIfEmpty(): Promise<boolean> {
  return false;
}
