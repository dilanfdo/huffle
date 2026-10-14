import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Confetti } from '../../components/anim/Confetti';
import { useReducedMotion } from '../../components/anim/useReducedMotion';
import { Icon } from '../../components/icons/Icon';
import { PrimaryButton } from '../../components/PrimaryButton';
import { cosmeticLabel, unlockHint } from '../../domain';
import type { MainStackParamList } from '../../root/navigation/types';
import { useClockStore, useCosmetics, useHufflingStore, useWardrobeStore } from '../../store';
import { colors } from '../../theme/colors';
import { radius, space } from '../../theme/layout';
import { type } from '../../theme/typography';
import { BreathingHuffling } from '../progress/BreathingHuffling';

type Props = NativeStackScreenProps<MainStackParamList, 'Gift'>;

export function GiftScreen({ navigation }: Props) {
  const reduce = useReducedMotion();
  const today = useClockStore((s) => s.today);
  const huffling = useHufflingStore((s) => s.huffling);
  const { giftToday } = useCosmetics();
  const openGift = useWardrobeStore((s) => s.openGift);
  const select = useWardrobeStore((s) => s.select);
  const [opened, setOpened] = useState(false);
  // Keep what we revealed even after opening flips giftOpened and clears giftToday-dependent state.
  const revealed = useRef(giftToday);

  const wiggle = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (opened || reduce) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, { toValue: 1, duration: 140, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -1, duration: 280, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 140, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(900),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opened, reduce, wiggle]);

  if (!huffling || !revealed.current) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>No gift right now</Text>
          <Text style={styles.body}>Log a session today and {huffling?.name ?? 'your Huffling'} may find one.</Text>
        </View>
        <View style={styles.footer}>
          <PrimaryButton label="Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const item = revealed.current;

  async function reveal() {
    if (opened) {
      return;
    }
    setOpened(true);
    await openGift(today);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (reduce) {
      pop.setValue(1);
    } else {
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 110, useNativeDriver: true }).start();
    }
  }

  async function wear() {
    await select(item);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        {!opened ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open today's gift"
            onPress={() => void reveal()}
            style={styles.boxWrap}
          >
            <Animated.View
              style={[
                styles.boxBadge,
                { transform: [{ rotate: wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] }) }] },
              ]}
            >
              <Icon name="gift" size={84} color={colors.accentDark} strokeWidth={1.6} />
            </Animated.View>
            <Text style={styles.title}>{huffling.name} found something!</Text>
            <Text style={styles.body}>Tap to open</Text>
          </Pressable>
        ) : (
          <Animated.View
            style={[
              styles.revealed,
              { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] },
            ]}
          >
            <BreathingHuffling
              stage={huffling.evolutionStage}
              mood="energized"
              size={190}
              accessory={item}
            />
            <Text accessibilityRole="header" style={styles.title}>
              A {cosmeticLabel(item).toLowerCase()}!
            </Text>
            <Text style={styles.body}>
              {huffling.name} can wear it all day today. {unlockHint(item) === 'Appears as a daily gift'
                ? 'Come back tomorrow for another surprise.'
                : `Keep it for good: ${unlockHint(item).toLowerCase()}.`}
            </Text>
          </Animated.View>
        )}
      </View>

      {opened ? (
        <View style={styles.footer}>
          <PrimaryButton label="Wear it today" onPress={() => void wear()} />
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.later}>
            <Text style={styles.laterText}>Maybe later</Text>
          </Pressable>
        </View>
      ) : null}

      <Confetti burstKey={opened ? 1 : null} count={48} originY={0.35} spread={180} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  boxWrap: {
    alignItems: 'center',
    gap: space.md,
    padding: space.xl,
    borderRadius: radius.xl,
  },
  boxBadge: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: colors.accentContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealed: {
    alignItems: 'center',
    gap: space.md,
  },
  title: {
    ...type.headlineSmall,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    ...type.bodyLarge,
    color: colors.inkSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  later: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterText: {
    ...type.labelLarge,
    color: colors.accentDark,
  },
});
