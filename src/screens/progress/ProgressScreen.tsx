import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Page } from '../../components/Page';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MOOD_LABEL } from '../../components/huffling/Huffling';
import {
  daysToNextFreezeToken,
  liveStreak,
  stageProgress,
  type Mood,
} from '../../domain';
import type { MainStackParamList } from '../../root/navigation/types';
import {
  useClockStore,
  useHufflingStore,
  useSessionStore,
  useStreakStore,
  useUserStore,
} from '../../store';
import { Icon } from '../../components/icons/Icon';
import { colors } from '../../theme/colors';
import { radius, space } from '../../theme/layout';
import { type } from '../../theme/typography';
import { useCountUp } from '../../components/anim/useCountUp';
import { useCosmetics } from '../../store';
import { BreathingHuffling } from './BreathingHuffling';
import { StageTimeline } from './StageTimeline';
import { StatTile } from './StatTile';

type Props = NativeStackScreenProps<MainStackParamList, 'Progress'>;

const MOOD_COPY: Record<Mood, (name: string) => string> = {
  winded: (name) => `${name} is catching their breath. One session and they'll perk right up.`,
  neutral: (name) => `${name} is settling in. A little movement keeps the glow going.`,
  energized: (name) => `${name} is feeling fed and steady. Nice showing up.`,
};

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

export function ProgressScreen({ navigation }: Props) {
  const huffling = useHufflingStore((s) => s.huffling);
  const streak = useStreakStore((s) => s.streak);
  const freezeTokens = useUserStore((s) => s.user?.streakFreezeTokens ?? 0);
  const sessionCount = useSessionStore((s) => s.sessions.length);
  const today = useClockStore((s) => s.today);

  const { worn } = useCosmetics();
  const xpShown = useCountUp(huffling?.xp ?? 0, 1000);
  const fill = useRef(new Animated.Value(0)).current;
  const ratio = huffling ? stageProgress(huffling.xp).ratio : 0;

  useEffect(() => {
    const animation = Animated.timing(fill, {
      toValue: ratio,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [fill, ratio]);

  const topBar = (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => navigation.goBack()}
        hitSlop={8}
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
      >
        <Icon name="chevronLeft" size={26} color={colors.ink} />
      </Pressable>
    </View>
  );

  if (!huffling || !streak) {
    return (
      <Page scroll style={styles.safe}>
        {topBar}
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your Huffling isn’t here yet</Text>
          <Text style={styles.emptyCopy}>Finish onboarding and their journey will show up here.</Text>
        </View>
      </Page>
    );
  }

  const progress = stageProgress(huffling.xp);
  const streakNow = liveStreak(streak, freezeTokens, today);
  const daysToToken = daysToNextFreezeToken(streakNow);
  const freezesUsed = streak.freezeUsedDates.length;
  const fillWidth = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const percent = Math.round(progress.ratio * 100);

  return (
    <Page style={styles.safe}>
      {topBar}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>
          {huffling.name}’s journey
        </Text>

        <View
          accessible
          accessibilityLabel={`${huffling.name}, ${progress.current.label}, ${MOOD_LABEL[huffling.mood]}`}
          style={styles.hero}
        >
          <BreathingHuffling stage={huffling.evolutionStage} mood={huffling.mood} accessory={worn} />
          <Text style={styles.stage}>{progress.current.label}</Text>
          <Text style={styles.mood}>{MOOD_LABEL[huffling.mood]}</Text>
          <Text style={styles.heroCopy}>{MOOD_COPY[huffling.mood](huffling.name)}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.xpHeader}>
            <Text style={styles.sectionTitle}>Evolution</Text>
            <Text style={styles.xpValue}>{xpShown} XP</Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={
              progress.next
                ? `Progress toward ${progress.next.label}`
                : 'Progress, fully evolved'
            }
            accessibilityValue={{ min: 0, max: 100, now: percent }}
            style={styles.track}
          >
            <Animated.View style={[styles.fill, { width: fillWidth }]} />
          </View>
          <View style={styles.trackLabels}>
            <Text style={styles.trackLabel}>{progress.current.label}</Text>
            {progress.next ? <Text style={styles.trackLabel}>{progress.next.label}</Text> : null}
          </View>
          <Text style={styles.body}>
            {progress.next
              ? `${progress.next.minXp - huffling.xp} XP to ${progress.next.label}.`
              : `${huffling.name} has reached Thriving — every session keeps them there.`}
          </Text>
        </View>

        <View style={styles.grid}>
          <StatTile label="Current streak" value={streakNow} unit="day" />
          <StatTile label="Longest streak" value={streak.longestStreak} unit="day" />
          <StatTile label="Freeze tokens" value={freezeTokens} unit="token" />
          <StatTile label="Sessions logged" value={sessionCount} unit="session" />
        </View>

        <View style={styles.freeze}>
          <Text style={styles.freezeTitle}>Streak freeze</Text>
          <Text style={styles.freezeBody}>
            A token quietly covers one missed day, so a rough day doesn’t undo your streak. It’s used
            automatically.
          </Text>
          <Text style={styles.freezeBody}>
            {plural(daysToToken, 'more day')} of streak earns the next one.
            {freezesUsed > 0 ? ` Saved your streak ${plural(freezesUsed, 'time')} so far.` : ''}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evolution path</Text>
          <View style={styles.timeline}>
            <StageTimeline currentStageId={huffling.evolutionStage} xp={huffling.xp} />
          </View>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    paddingHorizontal: space.md,
    paddingTop: space.xs,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: colors.surfaceContainer,
  },
  scroll: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxl,
    gap: space.xl,
  },
  title: {
    ...type.headlineSmall,
    color: colors.ink,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.xl,
    gap: space.xs,
  },
  stage: {
    ...type.titleLarge,
    color: colors.ink,
    marginTop: space.lg,
    textAlign: 'center',
  },
  mood: {
    ...type.labelLarge,
    color: colors.onCalmContainer,
    backgroundColor: colors.calmContainer,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginTop: space.xs,
  },
  heroCopy: {
    ...type.bodyLarge,
    color: colors.inkSecondary,
    textAlign: 'center',
    marginTop: space.sm,
  },
  section: {
    gap: space.sm,
  },
  sectionTitle: {
    ...type.titleMedium,
    color: colors.ink,
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  xpValue: {
    ...type.titleLarge,
    color: colors.accentDark,
  },
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackLabel: {
    ...type.labelMedium,
    color: colors.inkMuted,
  },
  body: {
    ...type.bodyLarge,
    color: colors.ink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  freeze: {
    backgroundColor: colors.accentContainer,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.sm,
  },
  freezeTitle: {
    ...type.titleMedium,
    color: colors.onAccentContainer,
  },
  freezeBody: {
    ...type.bodyMedium,
    color: colors.onAccentContainer,
  },
  timeline: {
    marginTop: space.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.sm,
  },
  emptyTitle: {
    ...type.titleLarge,
    color: colors.ink,
    textAlign: 'center',
  },
  emptyCopy: {
    ...type.bodyLarge,
    color: colors.inkSecondary,
    textAlign: 'center',
  },
});
