import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { SessionLogForm } from '../../components/SessionLogForm';
import { stageLabel } from '../../domain';
import { logSession, useHufflingStore } from '../../store';
import type { MainStackParamList } from '../../root/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'LogSession'>;

export function LogSessionScreen({ navigation }: Props) {
  const name = useHufflingStore((s) => s.huffling?.name ?? 'your Huffling');

  return (
    <SessionLogForm
      title="I moved today"
      copy={`One tap plus a type is enough. ${name} will feel it right away.`}
      submitLabel="Feed them"
      onCancel={() => navigation.goBack()}
      onSubmit={async (input) => {
        const result = await logSession(input);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const reaction = {
          xpAwarded: result.xpAwarded,
          evolved: result.evolved,
          stageLabel: stageLabel(result.newStage),
          name,
          firstSessionOfDay: result.firstSessionOfDay,
          freezeUsed: result.freezeUsed,
          freezeEarned: result.freezeEarned,
          streakDays: result.streakDays,
          streakMilestone: result.streakMilestone,
          comebackDays: result.comebackDaysMissed,
          xpCapped: result.xpCapped,
        };
        if (result.evolved) {
          navigation.replace('Evolution', {
            name,
            fromStage: result.previousStage,
            toStage: result.newStage,
            reaction,
          });
          return;
        }
        navigation.navigate('Tabs', { screen: 'Home', params: { reaction } });
      }}
    />
  );
}
