import { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

const PALETTE = ['#E07A5F', '#F4A261', '#81B29A', '#F2CC8F', '#3D405B', '#FBE5DC'] as const;

type Props = {
  /** A new value fires a burst; null stays quiet. */
  burstKey: string | number | null;
  count?: number;
  /** Vertical origin as a fraction of the container (0 top, 1 bottom). */
  originY?: number;
  spread?: number;
};

type Particle = {
  progress: Animated.Value;
  dx: number;
  peakY: number;
  fallY: number;
  rotate: number;
  width: number;
  height: number;
  color: string;
  duration: number;
  delay: number;
};

function buildParticles(count: number, spread: number): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.PI * (1.05 + Math.random() * 0.9); // upward fan
    const distance = spread * (0.5 + Math.random() * 0.9);
    const peakY = Math.sin(angle) * distance;
    return {
      progress: new Animated.Value(0),
      dx: Math.cos(angle) * distance,
      peakY,
      fallY: peakY + 170 + Math.random() * 130,
      rotate: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360),
      width: 7 + Math.random() * 4,
      height: 10 + Math.random() * 5,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      duration: 1100 + Math.random() * 600,
      delay: Math.random() * 120,
    };
  });
}

/** One-shot confetti burst; non-interactive overlay. Skipped under reduced motion. */
export function Confetti({ burstKey, count = 30, originY = 0.35, spread = 150 }: Props) {
  const reduce = useReducedMotion();
  const particles = useMemo(
    () => (burstKey === null || reduce ? [] : buildParticles(count, spread)),
    [burstKey, count, reduce, spread],
  );

  useEffect(() => {
    if (particles.length === 0) {
      return;
    }
    const animation = Animated.parallel(
      particles.map((p) =>
        Animated.timing(p.progress, {
          toValue: 1,
          duration: p.duration,
          delay: p.delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    );
    animation.start();
    return () => animation.stop();
  }, [particles]);

  if (particles.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              top: `${originY * 100}%`,
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              opacity: p.progress.interpolate({ inputRange: [0, 0.08, 0.75, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
                { translateY: p.progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, p.peakY, p.fallY] }) },
                { rotate: p.progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rotate}deg`] }) },
                { scale: p.progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.4, 1, 1] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    left: '50%',
    borderRadius: 2,
  },
});
