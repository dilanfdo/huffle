import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import { HufflingCharacter } from '../../components/huffling/HufflingCharacter';
import type { EvolutionStageId, Mood } from '../../domain';

/** Winded breathes quick and shallow; energized slow and full — the app's core metaphor. */
const BREATH: Record<Mood, { period: number; amplitude: number }> = {
  winded: { period: 1400, amplitude: 0.035 },
  neutral: { period: 2600, amplitude: 0.045 },
  energized: { period: 3800, amplitude: 0.06 },
};

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) {
        setReduce(enabled);
      }
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

type Props = {
  stage: EvolutionStageId;
  mood: Mood;
  size?: number;
};

export function BreathingHuffling({ stage, mood, size = 168 }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    scale.setValue(1);
    if (reduceMotion) {
      return;
    }
    const { period, amplitude } = BREATH[mood];
    const step = { duration: period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1 + amplitude, ...step }),
        Animated.timing(scale, { toValue: 1, ...step }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [mood, reduceMotion, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <HufflingCharacter stage={stage} mood={mood} size={size} />
    </Animated.View>
  );
}
