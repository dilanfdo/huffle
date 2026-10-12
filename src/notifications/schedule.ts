import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useHufflingStore } from '../store/hufflingStore';
import { useUserStore } from '../store/userStore';

const DAILY_ID = 'huffle-daily-reminder';
const COMEBACK_ID = 'huffle-comeback';
const COMEBACK_SECONDS = 24 * 60 * 60;
const ANDROID_CHANNEL_ID = 'huffle-reminders';

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

async function ensurePermission(): Promise<boolean> {
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

/**
 * At most one daily reminder, plus a single 24h "come back" ping that is
 * rescheduled every time the app is opened (so it only fires after a day away).
 */
export async function syncLocalNotifications(): Promise<void> {
  const user = useUserStore.getState().user;
  if (!user?.onboardingComplete) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }

  const allowed = await ensurePermission();
  if (!allowed) {
    return;
  }

  const name = useHufflingStore.getState().huffling?.name ?? 'your Huffling';

  await Notifications.cancelScheduledNotificationAsync(DAILY_ID);
  await Notifications.cancelScheduledNotificationAsync(COMEBACK_ID);

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: `${name} is around`,
      body: 'A little movement is enough — whenever you feel like it.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: user.reminderHour,
      minute: user.reminderMinute,
      channelId: ANDROID_CHANNEL_ID,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: COMEBACK_ID,
    content: {
      title: `${name} missed your face, not your streak`,
      body: 'No lecture. Just a quiet hello if you want to drop in.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: COMEBACK_SECONDS,
      repeats: false,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}
