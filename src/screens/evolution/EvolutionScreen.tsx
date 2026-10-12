import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Confetti } from '../../components/anim/Confetti';
import { HufflingCharacter } from '../../components/huffling/HufflingCharacter';
import { PrimaryButton } from '../../components/PrimaryButton';
import { stageLabel } from '../../domain';
import type { MainStackParamList } from '../../root/navigation/types';
import { colors } from '../../theme/colors';
import { radius, space } from '../../theme/layout';
import { type } from '../../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'Evolution'>;

const SWAP_DELAY_MS = 650;

export function EvolutionScreen({ navigation, route }: Props) {
  const { name, fromStage, toStage, reaction } = route.params;
  const [shownStage, setShownStage] = useState(fromStage);
  const [done, setDone] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (cancelled) {
        return;
      }
      setShownStage(toStage);
      setDone(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.timing(reveal, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) {
        return;
      }
      if (reduceMotion) {
        finish();
        reveal.setValue(1);
        return;
      }
      timer = setTimeout(() => {
        Animated.timing(scale, {
          toValue: 1.25,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          finish();
          Animated.spring(scale, { toValue: 1, friction: 3, tension: 90, useNativeDriver: true }).start();
        });
      }, SWAP_DELAY_MS);
    });

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [reveal, scale, toStage]);

  function onContinue() {
    navigation.navigate('Tabs', { screen: 'Home', params: { reaction } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.stage}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                opacity: reveal.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.7, 0] }),
                transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.2] }) }],
              },
            ]}
          />
          <Animated.View style={{ transform: [{ scale }] }}>
            <HufflingCharacter stage={shownStage} mood="energized" size={220} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.copy, { opacity: reveal }]} accessibilityLiveRegion="polite">
          <Text accessibilityRole="header" style={styles.title}>
            {name} evolved!
          </Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {stageLabel(fromStage)} → {stageLabel(toStage)}
            </Text>
          </View>
          <Text style={styles.body}>
            That’s what showing up does. {name} is a little steadier — and so are you.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Keep going" onPress={onContinue} disabled={!done} />
      </View>
      <Confetti burstKey={done ? 1 : null} count={64} originY={0.38} spread={190} />
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
    gap: space.xl,
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: colors.accent,
  },
  copy: {
    alignItems: 'center',
    gap: space.md,
  },
  title: {
    ...type.headlineSmall,
    color: colors.ink,
    textAlign: 'center',
  },
  chip: {
    backgroundColor: colors.accentContainer,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  chipText: {
    ...type.titleMedium,
    color: colors.onAccentContainer,
  },
  body: {
    ...type.bodyLarge,
    color: colors.inkSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
  },
});
