import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnimatedBar } from '../../components/anim/AnimatedBar';
import { BouncyView } from '../../components/anim/BouncyView';
import { Confetti } from '../../components/anim/Confetti';
import { FloatingXp } from '../../components/anim/FloatingXp';
import { SpeechBubble } from '../../components/anim/SpeechBubble';
import { StreakFlame } from '../../components/anim/StreakFlame';
import { useCountUp } from '../../components/anim/useCountUp';
import { Huffling } from '../../components/huffling/Huffling';
import { Icon } from '../../components/icons/Icon';
import { GlowMeter } from '../../components/home/GlowMeter';
import { WeekDots } from '../../components/home/WeekDots';
import { PrimaryButton } from '../../components/PrimaryButton';
import { hufflingLine, liveStreak, stageProgress, toLocalDateString, weekDays } from '../../domain';
import {
  useClockStore,
  useCosmetics,
  useHufflingStore,
  useSessionStore,
  useStreakStore,
  useUserStore,
} from '../../store';
import { colors } from '../../theme/colors';
import { radius, space } from '../../theme/layout';
import { type } from '../../theme/typography';
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
  const sessions = useSessionStore((s) => s.sessions);
  const today = useClockStore((s) => s.today);
  const reaction = route.params?.reaction;
  const [burst, setBurst] = useState<number | null>(null);
  // Shrink the hero on shorter screens so the cards and links aren't hidden behind the footer.
  const { height: windowHeight } = useWindowDimensions();
  const heroSize = Math.round(Math.min(180, Math.max(116, windowHeight * 0.17)));
  const { worn, giftReady, giftToday, glow } = useCosmetics();

  const streakDays = streak ? liveStreak(streak, freezeTokens, today) : 0;
  const loggedToday = streak?.lastCompletedDate === today;
  const target = week?.targetSessions ?? 3;
  const done = week?.sessionsCompletedThisWeek ?? 0;
  const progress = huffling ? stageProgress(huffling.xp) : null;
  const xpShown = useCountUp(huffling?.xp ?? 0);
  const streakShown = useCountUp(streakDays);

  const days = useMemo(() => {
    const dates = new Set(sessions.map((s) => toLocalDateString(new Date(s.completedAt))));
    return weekDays(today, dates);
  }, [sessions, today]);

  const line = huffling
    ? hufflingLine({
        name: huffling.name,
        mood: huffling.mood,
        loggedToday,
        streak: streakDays,
        hasHistory: sessions.length > 0,
        hour: new Date().getHours(),
        seed: today,
      })
    : null;

  useEffect(() => {
    if (!reaction) {
      return;
    }
    setBurst(Date.now());
    const timer = setTimeout(() => {
      navigation.setParams({ reaction: undefined });
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigation, reaction]);

  const celebrate = Boolean(
    reaction && (reaction.evolved || reaction.streakMilestone || reaction.comebackDays),
  );
  const showAtRisk = !loggedToday && streakDays >= 2 && !reaction;

  const reactionTitle = reaction
    ? reaction.evolved
      ? `${reaction.name} reached ${reaction.stageLabel}`
      : reaction.streakMilestone
        ? `${reaction.streakMilestone}-day streak!`
        : reaction.comebackDays
          ? 'Welcome back!'
          : reaction.xpCapped
            ? `${reaction.name} is fully glowing today`
            : `${reaction.name} perked up`
    : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {huffling ? (
          <View style={styles.hero}>
            {line ? <SpeechBubble text={line} /> : null}
            <View>
              <BouncyView trigger={burst}>
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
                    accessory={worn}
                    size={heroSize}
                  />
                </Pressable>
              </BouncyView>
              {reaction && burst !== null ? (
                <FloatingXp amount={reaction.xpAwarded} animKey={burst} />
              ) : null}
            </View>
          </View>
        ) : null}

        <GlowMeter counted={glow.counted} total={glow.total} full={glow.full} />

        {huffling ? (
          <View style={styles.links}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Progress')}
              style={({ pressed }) => [styles.journeyLink, pressed && styles.journeyLinkPressed]}
            >
              <Text style={styles.journeyLinkText}>{huffling.name}’s journey</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Wardrobe')}
              style={({ pressed }) => [styles.journeyLink, pressed && styles.journeyLinkPressed]}
            >
              <Text style={styles.journeyLinkText}>Wardrobe</Text>
            </Pressable>
          </View>
        ) : null}

        {giftReady && giftToday && !reaction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${huffling?.name ?? 'Your Huffling'} found a gift. Open it.`}
            onPress={() => navigation.navigate('Gift')}
            style={({ pressed }) => [styles.gift, pressed && styles.riskPressed]}
          >
            <View style={styles.giftBadge}>
              <Icon name="gift" size={26} color={colors.onCalmContainer} />
            </View>
            <View style={styles.giftText}>
              <Text style={styles.giftTitle}>{huffling?.name ?? 'Your Huffling'} found a gift</Text>
              <Text style={styles.giftCopy}>Tap to open — it's yours to wear today.</Text>
            </View>
          </Pressable>
        ) : null}

        {reaction ? (
          <View style={styles.reaction} accessibilityLiveRegion="polite">
            <Text style={styles.reactionTitle}>{reactionTitle}</Text>
            <Text style={styles.reactionCopy}>
              {reaction.xpCapped
                ? "Today's glow is full. This still counts — more XP tomorrow."
                : `+${reaction.xpAwarded} XP${
                    reaction.firstSessionOfDay ? ' · streak kept going' : ' · extra session today'
                  }`}
            </Text>
            {reaction.comebackDays ? (
              <Text style={styles.reactionCopy}>
                {reaction.comebackDays === 1
                  ? `${reaction.name} missed you. Every comeback counts.`
                  : `${reaction.comebackDays} days away and you're back. ${reaction.name} is thrilled.`}
              </Text>
            ) : null}
            {reaction.freezeUsed ? (
              <Text style={styles.reactionCopy}>A freeze token covered your missed day.</Text>
            ) : null}
            {reaction.freezeEarned ? (
              <Text style={styles.reactionCopy}>You earned a streak freeze token.</Text>
            ) : null}
          </View>
        ) : null}

        {showAtRisk ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Keep your ${streakDays}-day streak. Log a session.`}
            onPress={() => navigation.navigate('LogSession')}
            style={({ pressed }) => [styles.risk, pressed && styles.riskPressed]}
          >
            <Text style={styles.riskTitle}>Keep your {streakDays}-day streak going</Text>
            <Text style={styles.riskCopy}>
              {freezeTokens > 0
                ? 'A freeze token has your back — but a quick move is even better.'
                : 'A few minutes today is all it takes.'}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.row}>
          <View
            accessible
            accessibilityLabel={`${streakDays} day streak`}
            style={styles.statCard}
          >
            <View style={styles.statTop}>
              <StreakFlame days={streakDays} />
              <Text style={styles.statValue}>{streakShown}</Text>
            </View>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View
            accessible
            accessibilityLabel={`${huffling?.xp ?? 0} XP`}
            style={styles.statCard}
          >
            <Text style={styles.statValue}>{xpShown}</Text>
            <View style={styles.xpBar}>
              <AnimatedBar
                ratio={progress?.ratio ?? 0}
                height={8}
                accessibilityLabel="Progress to next stage"
              />
            </View>
            <Text style={styles.statLabel}>
              {progress?.next ? `${progress.next.minXp - (huffling?.xp ?? 0)} XP to ${progress.next.label}` : 'XP · thriving'}
            </Text>
          </View>
        </View>

        <View style={styles.weekCard}>
          <Text style={styles.weekTitle}>This week</Text>
          <WeekDots days={days} />
          <Text style={styles.weekCopy}>
            {done >= target
              ? `${done} ${done === 1 ? 'session' : 'sessions'} this week — goal reached`
              : `${done} of ${target} sessions — showing up is the whole point`}
          </Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={loggedToday ? 'Log another session' : 'Log a session'}
          onPress={() => navigation.navigate('LogSession')}
        />
        <Text style={styles.hint}>Any movement counts. No sets, reps, or guilt.</Text>
      </View>

      <Confetti burstKey={burst} count={celebrate ? 56 : 26} originY={0.3} spread={celebrate ? 200 : 150} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.lg,
    gap: space.lg,
  },
  hero: {
    alignItems: 'center',
    gap: space.sm,
  },
  reaction: {
    backgroundColor: colors.calmContainer,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.xs,
  },
  reactionTitle: {
    ...type.titleMedium,
    color: colors.onCalmContainer,
    textAlign: 'center',
  },
  reactionCopy: {
    ...type.bodyMedium,
    color: colors.onCalmContainer,
    textAlign: 'center',
  },
  risk: {
    backgroundColor: colors.glowContainer,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.xs,
  },
  riskPressed: {
    opacity: 0.85,
  },
  riskTitle: {
    ...type.titleMedium,
    color: colors.onGlowContainer,
  },
  riskCopy: {
    ...type.bodyMedium,
    color: colors.onGlowContainer,
  },
  giftTitle: {
    ...type.titleMedium,
    color: colors.onCalmContainer,
  },
  giftCopy: {
    ...type.bodyMedium,
    color: colors.onCalmContainer,
  },
  row: {
    flexDirection: 'row',
    gap: space.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    alignItems: 'center',
    gap: space.xs,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  statValue: {
    ...type.displaySmall,
    color: colors.ink,
  },
  statLabel: {
    ...type.labelLarge,
    color: colors.inkSecondary,
    textAlign: 'center',
  },
  xpBar: {
    alignSelf: 'stretch',
    marginVertical: space.xs,
  },
  weekCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  weekTitle: {
    ...type.titleMedium,
    color: colors.ink,
  },
  weekCopy: {
    ...type.bodyMedium,
    color: colors.inkSecondary,
  },
  gift: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.calmContainer,
    borderRadius: radius.md,
    padding: space.lg,
  },
  giftBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C6DDD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftText: {
    flex: 1,
    gap: space.xs,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
  },
  journeyLink: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainer,
  },
  journeyLinkPressed: {
    opacity: 0.8,
  },
  journeyLinkText: {
    ...type.labelLarge,
    color: colors.accentDark,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
    gap: space.sm,
  },
  hint: {
    ...type.bodyMedium,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
