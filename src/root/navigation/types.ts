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
  freezeUsed: boolean;
  freezeEarned: boolean;
  streakDays: number;
  streakMilestone: number | null;
};

export type EvolutionParams = {
  name: string;
  fromStage: import('../../domain').EvolutionStageId;
  toStage: import('../../domain').EvolutionStageId;
  reaction: SessionReaction;
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
  Evolution: EvolutionParams;
};
