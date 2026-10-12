import * as Haptics from 'expo-haptics';
import { Huffling } from '../../components/huffling/Huffling';
import { SessionLogForm } from '../../components/SessionLogForm';
import { logSession, markOnboardingComplete, useHufflingStore } from '../../store';

export function FirstSessionScreen() {
  const huffling = useHufflingStore((s) => s.huffling);

  return (
    <SessionLogForm
      header={
        huffling ? (
          <Huffling
            name={huffling.name}
            stage={huffling.evolutionStage}
            mood={huffling.mood}
            size={120}
          />
        ) : null
      }
      title={`Feed ${huffling?.name ?? 'them'} once`}
      copy="Any movement counts. Pick what you did — duration and a note are optional. This first feed is how they start growing."
      submitLabel="I moved today"
      onSubmit={async (input) => {
        await logSession(input);
        await markOnboardingComplete();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }}
    />
  );
}
