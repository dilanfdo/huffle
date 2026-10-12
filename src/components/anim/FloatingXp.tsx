import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { useReducedMotion } from './useReducedMotion';

type Props = {
  amount: number;
  /** Changing this replays the float. */
  animKey: string | number;
};

/** "+11 XP" that pops, drifts upward and fades. */
export function FloatingXp({ amount, animKey }: Props) {
  const reduce = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [animKey, progress, reduce]);

  if (reduce) {
    return null;
  }

  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.text,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, -80] }) },
            { scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.2, 1] }) },
          ],
        },
      ]}
    >
      +{amount} XP
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    alignSelf: 'center',
    top: 40,
    fontSize: 26,
    fontWeight: '800',
    color: colors.accentDark,
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowRadius: 6,
  },
});
