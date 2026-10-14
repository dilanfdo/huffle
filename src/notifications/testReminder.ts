import * as Notifications from 'expo-notifications';
import { useHufflingStore } from '../store/hufflingStore';
import { useUserStore } from '../store/userStore';
import { ANDROID_CHANNEL_ID, ensurePermission, TEST_ID } from './schedule';
import { testReminderCopy } from './testReminderCopy';

/**
 * Development-only. Settings loads this behind `__DEV__`, so production
 * bundles never include it.
 */
const TEST_DELAY_SECONDS = 10;

export type TestReminderResult = { status: 'scheduled'; inSeconds: number } | { status: 'denied' };

/** Fires one real reminder a few seconds from now through the same channel and permission path. */
export async function sendTestReminder(): Promise<TestReminderResult> {
  if (!(await ensurePermission())) {
    return { status: 'denied' };
  }
  const user = useUserStore.getState().user;
  const name = useHufflingStore.getState().huffling?.name ?? 'Your Huffling';
  const when = new Date();
  when.setHours(user?.reminderHour ?? 19, user?.reminderMinute ?? 0, 0, 0);
  const copy = testReminderCopy({
    name,
    reminderTime: when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
  });
  await Notifications.cancelScheduledNotificationAsync(TEST_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: TEST_ID,
    content: { title: copy.title, body: copy.body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TEST_DELAY_SECONDS,
      repeats: false,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
  return { status: 'scheduled', inSeconds: TEST_DELAY_SECONDS };
}
