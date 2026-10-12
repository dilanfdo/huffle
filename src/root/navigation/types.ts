import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  NameHuffling: undefined;
  FirstSession: undefined;
};

export type SessionReaction = {
  xpAwarded: number;
  evolved: boolean;
  stageLabel: string;
  name: string;
  firstSessionOfDay: boolean;
};

export type MainTabParamList = {
  Home: { reaction?: SessionReaction } | undefined;
  History: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  LogSession: undefined;
  Progress: undefined;
};
