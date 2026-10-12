import { createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FirstSessionScreen } from '../../screens/onboarding/FirstSessionScreen';
import { NameHufflingScreen } from '../../screens/onboarding/NameHufflingScreen';
import { WelcomeScreen } from '../../screens/onboarding/WelcomeScreen';
import { useUserStore } from '../../store';
import { MainNavigator } from './MainNavigator';
import type { OnboardingStackParamList, RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingInitialRoute = createContext<keyof OnboardingStackParamList>('Welcome');

function OnboardingNavigator() {
  const initialRouteName = useContext(OnboardingInitialRoute);
  return (
    <OnboardingStack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="NameHuffling" component={NameHufflingScreen} />
      <OnboardingStack.Screen name="FirstSession" component={FirstSessionScreen} />
    </OnboardingStack.Navigator>
  );
}

export function RootNavigator({
  resumeOnboardingAt,
}: {
  resumeOnboardingAt: keyof OnboardingStackParamList;
}) {
  const onboardingComplete = useUserStore((s) => s.user?.onboardingComplete ?? false);

  return (
    <OnboardingInitialRoute.Provider value={resumeOnboardingAt}>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {onboardingComplete ? (
            <RootStack.Screen name="Main" component={MainNavigator} />
          ) : (
            <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </OnboardingInitialRoute.Provider>
  );
}
