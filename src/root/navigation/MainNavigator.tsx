import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogSessionScreen } from '../../screens/logSession/LogSessionScreen';
import { EvolutionScreen } from '../../screens/evolution/EvolutionScreen';
import { GiftScreen } from '../../screens/gift/GiftScreen';
import { WardrobeScreen } from '../../screens/wardrobe/WardrobeScreen';
import { ProgressScreen } from '../../screens/progress/ProgressScreen';
import { MainTabs } from './MainTabs';
import type { MainStackParamList } from './types';

const MainStack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs" component={MainTabs} />
      <MainStack.Screen
        name="LogSession"
        component={LogSessionScreen}
        options={{ presentation: 'modal' }}
      />
      <MainStack.Screen name="Progress" component={ProgressScreen} />
      <MainStack.Screen name="Wardrobe" component={WardrobeScreen} />
      <MainStack.Screen
        name="Gift"
        component={GiftScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <MainStack.Screen
        name="Evolution"
        component={EvolutionScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
      />
    </MainStack.Navigator>
  );
}
