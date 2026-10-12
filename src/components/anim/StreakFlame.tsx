import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

type Props = {
  days: number;
  size?: number;
};

/** Flame that breathes while the streak is alive and pops when it grows. */
export function StreakFlame({ days, size = 30 }: Props) {
  const reduce = useReducedMotion();
  const pulse = useRef(new Animated.Value(1)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const previous = useRef(days);

  useEffect(() => {
    if (reduce || days <= 0) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [days, pulse, reduce]);

  useEffect(() => {
    if (days > previous.current && !reduce) {
      pop.setValue(1.7);
      Animated.spring(pop, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }).start();
    }
    previous.current = days;
  }, [days, pop, reduce]);

  return (
    <Animated.Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        fontSize: size,
        opacity: days > 0 ? 1 : 0.35,
        transform: [{ scale: Animated.multiply(pulse, pop) }],
      }}
    >
      🔥
    </Animated.Text>
  );
}
