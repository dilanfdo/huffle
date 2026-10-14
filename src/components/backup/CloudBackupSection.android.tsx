import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { connectDrive, disconnectDrive, syncNow } from '../../sync/drive/engine';
import { PrivacyPolicyLink } from '../PrivacyPolicyLink';
import { useDriveStore } from '../../sync/drive/store';
import type { ProfileSummary } from '../../sync/drive/snapshot';
import { colors } from '../../theme/colors';

function describe(profile: ProfileSummary): string {
  const name = profile.name ?? 'Huffling';
  return `${name}, ${profile.xp} XP, ${profile.sessions} ${profile.sessions === 1 ? 'session' : 'sessions'}`;
}

function relative(iso: string | null): string {
  if (!iso) {
    return 'not yet';
  }
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) {
    return 'just now';
  }
  return minutes < 60 ? `${minutes} min ago` : `${Math.round(minutes / 60)} h ago`;
}

/** Google Drive backup & sync, shown only when this build has a Google client id. */
export function CloudBackupSection() {
  const { status, email, lastSyncedAt, error, conflict } = useDriveStore();
  const [busy, setBusy] = useState(false);

  if (status === 'not-configured') {
    return null;
  }

  async function connect() {
    setBusy(true);
    try {
      const result = await connectDrive();
      if (result.status === 'error') {
        Alert.alert('Could not connect', 'Check your connection and try again. Nothing was changed.');
      }
    } finally {
      setBusy(false);
    }
  }

  function confirmDisconnect() {
    Alert.alert(
      'Disconnect Google Drive?',
      'Your data stays on this device. The backup stays in your Drive until you remove it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => void disconnectDrive() },
      ],
    );
  }

  const syncing = busy || status === 'syncing';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Backup & sync</Text>

      {status === 'signed-out' ? (
        <>
          <Text style={styles.copy}>
            Keep your Huffling safe in your own Google Drive and move to a new phone without losing
            progress. Huffle only touches its own hidden folder.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={syncing}
            onPress={() => void connect()}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{syncing ? 'Connecting…' : 'Connect Google Drive'}</Text>
          </Pressable>
          <PrivacyPolicyLink label="How backup handles your data" />
        </>
      ) : null}

      {status === 'conflict' && conflict ? (
        <>
          <Text style={styles.copy}>
            This device and your Drive backup have different Hufflings. Pick the one to keep.
          </Text>
          <Pressable accessibilityRole="button" style={styles.button} onPress={() => void syncNow('cloud')}>
            <Text style={styles.buttonText}>Use Drive: {describe(conflict.remote)}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.buttonAlt} onPress={() => void syncNow('device')}>
            <Text style={styles.buttonAltText}>Keep this device: {describe(conflict.local)}</Text>
          </Pressable>
        </>
      ) : null}

      {status === 'idle' || status === 'syncing' || status === 'error' ? (
        <>
          <Text style={styles.copy}>
            {email ? `Connected as ${email}. ` : ''}
            {status === 'error' && error ? error : `Last synced ${relative(lastSyncedAt)}.`}
          </Text>
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              disabled={syncing}
              onPress={() => void syncNow()}
              style={styles.inline}
            >
              <Text style={styles.inlineText}>{syncing ? 'Syncing…' : 'Sync now'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={confirmDisconnect} style={styles.inline}>
              <Text style={styles.inlineText}>Disconnect</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  copy: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonAlt: {
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  buttonAltText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  inline: {
    minHeight: 48,
    justifyContent: 'center',
    paddingRight: 16,
  },
  inlineText: {
    color: colors.accentDark,
    fontSize: 16,
    fontWeight: '700',
  },
});
