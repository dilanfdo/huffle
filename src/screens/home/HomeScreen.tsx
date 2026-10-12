import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Huffling } from '../../components/huffling/Huffling';
import { PrimaryButton } from '../../components/PrimaryButton';
import { liveStreak, xpToNextStage } from '../../domain';
import { useClockStore, useHufflingStore, useStreakStore, useUserStore } from '../../store';
import { colors } from '../../theme/colors';
import type { MainStackParamList, MainTabParamList } from '../../root/navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<MainStackParamList>
>;

export function HomeScreen({ navigation, route }: Props) {
  const huffling = useHufflingStore((s) => s.huffling);
  const streak = useStreakStore((s) => s.streak);
  const week = useUserStore((s) => s.currentWeek);
  const freezeTokens = useUserStore((s) => s.user?.streakFreezeTokens ?? 0);
  const today = useClockStore((s) => s.today);
  const reaction = route.params?.reaction;
  const toNext = huffling ? xpToNextStage(huffling.xp) : null;
  const target = week?.targetSessions ?? 3;
  const done = week?.sessionsCompletedThisWeek ?? 0;
  const weekRatio = Math.min(1, done / Math.max(1, target));
  const streakDays = streak ? liveStreak(streak, freezeTokens, today) : 0;

  useEffect(() => {
    if (!reaction) {
      return;
    }
    const timer = setTimeout(() => {
      navigation.setParams({ reaction: undefined });
    }, 4500);
    return () => clearTimeout(timer);
  }, [navigation, reaction]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        {huffling ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${huffling.name}'s journey`}
            accessibilityHint="Shows evolution progress, streaks and freeze tokens"
            onPress={() => navigation.navigate('Progress')}
          >
            <Huffling
              name={huffling.name}
              stage={huffling.evolutionStage}
              mood={huffling.mood}
            />
          </Pressable>
        ) : null}

        {reaction ? (
          <View style={styles.reaction} accessibilityLiveRegion="polite">
            <Text style={styles.reactionTitle}>
              {reaction.evolved
                ? `${reaction.name} reached ${reaction.stageLabel}`
                : `${reaction.name} perked up`}
            </Text>
            <Text style={styles.reactionCopy}>
              +{reaction.xpAwarded} XP
              {reaction.firstSessionOfDay ? ' · streak kept going' : ' · extra session today'}
            </Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{huffling?.xp ?? 0}</Text>
            <Text style={styles.statLabel}>
              {toNext === null ? 'XP · thriving' : `${toNext} XP to next`}
            </Text>
          </View>
        </View>

        <View style={styles.weekCard}>
          <Text style={styles.weekTitle}>This week</Text>
          <Text style={styles.weekCopy}>
            {done} of {target} sessions — showing up is the whole point
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${weekRatio * 100}%` }]} />
          </View>
        </View>

        {huffling ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Progress')}
            style={({ pressed }) => [styles.journeyLink, pressed && styles.journeyLinkPressed]}
          >
            <Text style={styles.journeyLinkText}>See {huffling.name}’s journey</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Log a session" onPress={() => navigation.navigate('LogSession')} />
        <Text style={styles.hint}>Any movement counts. No sets, reps, or guilt.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  journeyLink: {
    alignSelf: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  journeyLinkPressed: {
    backgroundColor: colors.surfaceContainer,
  },
  journeyLinkText: {
    color: colors.accentDark,
    fontSize: 15,
    fontWeight: '700',
  },
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 16,
  },
  reaction: {
    backgroundColor: '#FDEEE8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  reactionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  reactionCopy: {
    marginTop: 4,
    fontSize: 15,
    color: colors.accentDark,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: colors.inkMuted,
  },
  weekCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 8,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  weekCopy: {
    fontSize: 14,
    color: colors.inkMuted,
  },
  track: {
    height: 10,
    borderRadius: 8,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.calm,
    borderRadius: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 10,
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.inkMuted,
  },
});
