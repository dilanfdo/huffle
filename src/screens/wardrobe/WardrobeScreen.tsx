import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HufflingCharacter } from '../../components/huffling/HufflingCharacter';
import { COSMETICS, cosmeticLabel, unlockHint, type CosmeticId } from '../../domain';
import type { MainStackParamList } from '../../root/navigation/types';
import { useCosmetics, useHufflingStore, useWardrobeStore } from '../../store';
import { colors } from '../../theme/colors';
import { radius, space } from '../../theme/layout';
import { type } from '../../theme/typography';
import { BreathingHuffling } from '../progress/BreathingHuffling';

type Props = NativeStackScreenProps<MainStackParamList, 'Wardrobe'>;

export function WardrobeScreen({ navigation }: Props) {
  const huffling = useHufflingStore((s) => s.huffling);
  const select = useWardrobeStore((s) => s.select);
  const setSupporter = useWardrobeStore((s) => s.setSupporter);
  const { worn, can, earned, giftToday, giftOpened, giftReady, supporter } = useCosmetics();
  const [message, setMessage] = useState<string | null>(null);

  if (!huffling) {
    return null;
  }

  function onPick(id: CosmeticId) {
    if (can(id)) {
      setMessage(null);
      void select(worn === id ? null : id);
      return;
    }
    if (giftReady && giftToday === id) {
      setMessage("This is today's gift. Open it from Home to wear it.");
      return;
    }
    setMessage(
      unlockHint(id) === 'Appears as a daily gift'
        ? 'Appears as a daily gift, or comes with Supporter.'
        : `${unlockHint(id)} to unlock.`,
    );
  }

  function statusFor(id: CosmeticId): string {
    if (worn === id) {
      return 'Wearing';
    }
    if (supporter || earned.includes(id)) {
      return 'Owned';
    }
    if (giftToday === id) {
      return giftOpened ? "Today's gift" : giftReady ? 'Gift waiting' : 'Locked';
    }
    return 'Locked';
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          <Text style={styles.backGlyph}>←</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>
          Wardrobe
        </Text>

        <View style={styles.preview}>
          <BreathingHuffling
            stage={huffling.evolutionStage}
            mood={huffling.mood}
            size={170}
            accessory={worn}
          />
          <Text style={styles.previewName}>
            {huffling.name}
            {worn ? ` · ${cosmeticLabel(worn)}` : ''}
          </Text>
          <Text style={styles.note} accessibilityLiveRegion="polite">
            {message ??
              (supporter
                ? 'Everything is unlocked. Thank you for supporting Huffle.'
                : 'Earn items by showing up. A new gift can appear each day you log.')}
          </Text>
        </View>

        <View style={styles.grid}>
          {COSMETICS.map((item) => {
            const owned = can(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.label}, ${statusFor(item.id)}`}
                onPress={() => onPick(item.id)}
                style={({ pressed }) => [
                  styles.tile,
                  worn === item.id && styles.tileWorn,
                  pressed && styles.tilePressed,
                ]}
              >
                <View style={owned ? undefined : styles.dim}>
                  <HufflingCharacter
                    stage={huffling.evolutionStage}
                    mood="neutral"
                    size={88}
                    accessory={item.id}
                  />
                </View>
                <Text style={styles.tileLabel}>{item.label}</Text>
                <Text style={[styles.tileStatus, worn === item.id && styles.tileStatusWorn]}>
                  {statusFor(item.id)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {worn ? (
          <Pressable accessibilityRole="button" onPress={() => void select(null)} style={styles.clear}>
            <Text style={styles.clearText}>Take it off</Text>
          </Pressable>
        ) : null}

        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void setSupporter(!supporter)}
            style={styles.dev}
          >
            <Text style={styles.devText}>Dev: toggle Supporter ({supporter ? 'on' : 'off'})</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
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
  backGlyph: {
    fontSize: 26,
    color: colors.ink,
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
  preview: {
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    padding: space.xl,
  },
  previewName: {
    ...type.titleMedium,
    color: colors.ink,
  },
  note: {
    ...type.bodyMedium,
    color: colors.inkSecondary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
  },
  tileWorn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentContainer,
  },
  tilePressed: {
    opacity: 0.85,
  },
  dim: {
    opacity: 0.65,
  },
  tileLabel: {
    ...type.titleMedium,
    color: colors.ink,
    textAlign: 'center',
  },
  tileStatus: {
    ...type.labelMedium,
    color: colors.inkSecondary,
  },
  tileStatusWorn: {
    color: colors.onAccentContainer,
  },
  clear: {
    alignSelf: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  clearText: {
    ...type.labelLarge,
    color: colors.accentDark,
  },
  dev: {
    alignSelf: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  devText: {
    ...type.labelMedium,
    color: colors.inkMuted,
  },
});
