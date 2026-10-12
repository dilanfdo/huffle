import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Huffling } from '../../components/huffling/Huffling';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import type { OnboardingStackParamList } from '../../root/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Huffling stage="winded" mood="winded" />
        <Text style={styles.title}>Meet your Huffling</Text>
        <Text style={styles.copy}>
          Huffle is not a workout log. When you move — a walk, a stretch, anything — your
          Huffling gets a little stronger. Miss a day and they look tired, never punished.
        </Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Get started" onPress={() => navigation.navigate('NameHuffling')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  copy: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
