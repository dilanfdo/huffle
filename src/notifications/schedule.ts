import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useHufflingStore } from '../store/hufflingStore';
import { useStreakStore } from '../store/streakStore';
import { useUserStore } from '../store/userStore';
import { planNotifications } from './plan';

export const ANDROID_CHANNEL_ID = 'huffle-reminders';
/** Id of the dev-only test reminder; a resync must not cancel it mid-flight. */
export const TEST_ID = 'huffle-test-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  // The channel must exist before the Android 13+ permission prompt can appear.
  await ensureAndroidChannel();
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status === 'granted';
}

let queue: Promise<void> = Promise.resolve();

async function runSync(now: Date): Promise<void> {
  const user = useUserStore.getState().user;
  if (!user?.onboardingComplete) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  if (!(await ensurePermission())) {
    return;
  }

  const streak = useStreakStore.getState().streak;
  const plan = planNotifications({
    now,
    name: useHufflingStore.getState().huffling?.name ?? 'your Huffling',
    reminderHour: user.reminderHour,
    reminderMinute: user.reminderMinute,
    lastCompletedDate: streak?.lastCompletedDate ?? null,
    currentStreak: streak?.currentStreak ?? 0,
    freezeTokens: user.streakFreezeTokens,
  });

  // Replace the planned reminders but leave an in-flight test reminder alone.
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter((n) => n.identifier !== TEST_ID)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  for (const item of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: item.id,
      content: { title: item.title, body: item.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.at,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  }
}

/**
 * Rebuilds the next week of reminders from current state. Run on app open,
 * resume, after logging a session, and when settings change. Serialised so
 * overlapping calls can't interleave a cancel with another run's schedules.
 */
export function syncLocalNotifications(now: Date = new Date()): Promise<void> {
  queue = queue.then(() => runSync(now)).catch(() => undefined);
  return queue;
}
