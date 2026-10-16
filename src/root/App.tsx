import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { syncLocalNotifications } from '../notifications/schedule';
import { bootstrapStores, refreshForNow, useUserStore } from '../store';
import { restoreFromCloudIfEmpty, startSync } from '../sync';
import { colors } from '../theme/colors';
import { RootNavigator } from './navigation/RootNavigator';
import type { OnboardingStackParamList } from './navigation/types';

type Boot =
  | { status: 'loading' }
  | { status: 'restoring' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      resumeOnboardingAt: keyof OnboardingStackParamList;
    };

export default function App() {
  const [boot, setBoot] = useState<Boot>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let result = await bootstrapStores();
        if (!result.hasProfile) {
          if (!cancelled) {
            setBoot({ status: 'restoring' });
          }
          const restored = await restoreFromCloudIfEmpty();
          if (restored) {
            result = await bootstrapStores();
          }
        }
        // Backup sync must never hold up the first screen; it reconciles in the background.
        void startSync().catch(() => undefined);
        if (result.onboardingComplete) {
          await syncLocalNotifications();
        }
        if (cancelled) {
          return;
        }
        setBoot({
          status: 'ready',
          resumeOnboardingAt: result.hasProfile ? 'FirstSession' : 'Welcome',
        });
      } catch {
        if (!cancelled) {
          setBoot({
            status: 'error',
            message: 'Could not open local data. Restart the app and try again.',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        return;
      }
      void (async () => {
        await refreshForNow();
        await useUserStore.getState().markOpened();
        await syncLocalNotifications();
        await startSync();
      })();
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {boot.status === 'ready' ? (
        <RootNavigator resumeOnboardingAt={boot.resumeOnboardingAt} />
      ) : (
        <View style={styles.boot}>
          {boot.status === 'loading' || boot.status === 'restoring' ? (
            <ActivityIndicator color={colors.accent} />
          ) : null}
          {boot.status === 'restoring' ? (
            <Text style={styles.restore}>Looking for your backup…</Text>
          ) : null}
          {boot.status === 'error' ? <Text style={styles.error}>{boot.message}</Text> : null}
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  restore: {
    color: colors.inkMuted,
    fontSize: 16,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
  },
});
