import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloudBackupSection } from '../../components/backup/CloudBackupSection';
import { syncLocalNotifications } from '../../notifications/schedule';
import { setWeeklyGoalTarget, useHufflingStore, useSyncStore, useUserStore } from '../../store';
import { colors } from '../../theme/colors';

// `__DEV__` is false in release builds, so this require (and the module) is dropped from the bundle.
const DevTestReminder: typeof import('./DevTestReminder').DevTestReminder | null = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./DevTestReminder') as typeof import('./DevTestReminder')).DevTestReminder
  : null;

export function SettingsScreen() {
  const user = useUserStore((s) => s.user);
  const huffling = useHufflingStore((s) => s.huffling);
  const availability = useSyncStore((s) => s.availability);
  const rename = useHufflingStore((s) => s.rename);
  const [name, setName] = useState(huffling?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [androidPickerOpen, setAndroidPickerOpen] = useState(false);

  const reminderDate = reminderAsDate(user?.reminderHour ?? 19, user?.reminderMinute ?? 0);
  const target = user?.weeklyGoal ?? 3;

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    try {
      await rename(trimmed);
      setSaved('Name updated');
    } finally {
      setBusy(false);
    }
  }

  async function onTimeChange(event: DateTimePickerEvent, selected?: Date) {
    setAndroidPickerOpen(false);
    if (event.type === 'dismissed' || !selected || !user) {
      return;
    }
    await useUserStore.getState().patchUser({
      reminderHour: selected.getHours(),
      reminderMinute: selected.getMinutes(),
    });
    await syncLocalNotifications();
    setSaved('Reminder time updated');
  }

  async function bumpGoal(delta: number) {
    const next = Math.min(7, Math.max(1, target + delta));
    await setWeeklyGoalTarget(next);
    setSaved('Weekly goal updated');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Settings</Text>
          {saved ? (
            <Text style={styles.saved} accessibilityLiveRegion="polite">
              {saved}
            </Text>
          ) : null}
          {Platform.OS === 'ios' ? (
            <>
              <Text style={styles.label}>iCloud</Text>
              <Text style={styles.copy}>{icloudCopy(availability)}</Text>
            </>
          ) : (
            <CloudBackupSection />
          )}

          <Text style={styles.label}>Huffling name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            maxLength={24}
            autoCapitalize="words"
          />
          <Pressable onPress={() => void saveName()} style={styles.inlineButton}>
            <Text style={styles.inlineButtonText}>{busy ? 'Saving…' : 'Save name'}</Text>
          </Pressable>

          <Text style={styles.label}>Weekly goal</Text>
          <Text style={styles.copy}>How many sessions feel kind this week — not a quota to shame yourself with.</Text>
          <View style={styles.stepper}>
            <Pressable onPress={() => void bumpGoal(-1)} style={styles.step}>
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text style={styles.stepValue}>{target}</Text>
            <Pressable onPress={() => void bumpGoal(1)} style={styles.step}>
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Daily reminder</Text>
          <Text style={styles.copy}>One nudge a day. You can ignore it with zero consequences.</Text>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              mode="time"
              value={reminderDate}
              display="spinner"
              onChange={onTimeChange}
            />
          ) : (
            <>
              <Pressable onPress={() => setAndroidPickerOpen(true)} style={styles.timeButton}>
                <Text style={styles.timeButtonText}>{formatReminder(reminderDate)}</Text>
              </Pressable>
              {androidPickerOpen ? (
                <DateTimePicker
                  mode="time"
                  value={reminderDate}
                  display="default"
                  onChange={onTimeChange}
                />
              ) : null}
            </>
          )}

          <Text style={styles.copy}>
            Up to two gentle nudges a day: this reminder and, when a streak is at stake, one in the
            evening. They stop on their own if you’re away for a week.
          </Text>
          {DevTestReminder ? <DevTestReminder onResult={setSaved} /> : null}
          <Pressable onPress={() => void Linking.openSettings()} style={styles.inlineButton} accessibilityRole="button">
            <Text style={styles.inlineButtonText}>Notification settings</Text>
          </Pressable>

          <Text style={styles.meta}>
            Streak freeze tokens: {user?.streakFreezeTokens ?? 0} (used automatically if you miss one day)
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function reminderAsDate(hour: number, minute: number): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function formatReminder(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function icloudCopy(availability: ReturnType<typeof useSyncStore.getState>['availability']): string {
  switch (availability) {
    case 'available':
      return 'Private iCloud sync is on. This device stays usable offline; changes catch up when iCloud is there.';
    case 'no-account':
      return 'No iCloud account on this device. Huffle still works fully offline.';
    case 'unavailable-module':
      return 'CloudKit needs a native iOS build (not Expo Go) and the iCloud.app.nexusdigitallabs.huffle container in your Apple Developer account.';
    case 'error':
      return 'iCloud hit a snag. Your local data is fine — try again after a rebuild or sign-in.';
    default:
      return 'Checking iCloud…';
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
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
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: colors.ink,
  },
  inlineButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
  },
  inlineButtonText: {
    color: colors.accentDark,
    fontWeight: '700',
    fontSize: 16,
  },
  timeButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  timeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  step: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 24,
    color: colors.ink,
  },
  stepValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    minWidth: 36,
    textAlign: 'center',
  },
  meta: {
    marginTop: 20,
    fontSize: 14,
    color: colors.inkMuted,
  },
  saved: {
    color: colors.calm,
    fontWeight: '700',
  },
});
