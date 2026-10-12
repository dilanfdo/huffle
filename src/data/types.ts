import type { EvolutionStageId } from '../domain/evolution';
import type { Mood } from '../domain/mood';

export type UserRecord = {
  id: string;
  createdAt: string;
  streakFreezeTokens: number;
  onboardingComplete: boolean;
  weeklyGoal: number;
  reminderHour: number;
  reminderMinute: number;
  lastOpenedAt: string | null;
  updatedAt: string;
};

export type HufflingRecord = {
  id: string;
  name: string;
  evolutionStage: EvolutionStageId;
  xp: number;
  mood: Mood;
  lastFedAt: string | null;
  updatedAt: string;
};

export type HabitTypeRecord = {
  id: string;
  label: string;
  icon: string;
  category: string;
  updatedAt: string;
};

export type SessionLogRecord = {
  id: string;
  habitTypeId: string;
  completedAt: string;
  durationMinutes: number | null;
  xpAwarded: number;
  note: string | null;
  updatedAt: string;
};

export type StreakRecord = {
  id: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  freezeUsedDates: string[];
  updatedAt: string;
};

export type WeeklyGoalRecord = {
  id: string;
  targetSessions: number;
  weekStartDate: string;
  sessionsCompletedThisWeek: number;
  updatedAt: string;
};

export type UserRow = {
  id: string;
  created_at: string;
  streak_freeze_tokens: number;
  onboarding_complete: number;
  weekly_goal: number;
  reminder_hour: number;
  reminder_minute: number;
  last_opened_at: string | null;
  updated_at: string;
};

export type HufflingRow = {
  id: string;
  name: string;
  evolution_stage: string;
  xp: number;
  mood: string;
  last_fed_at: string | null;
  updated_at: string;
};

export type HabitTypeRow = {
  id: string;
  label: string;
  icon: string;
  category: string;
  updated_at: string;
};

export type SessionLogRow = {
  id: string;
  habit_type_id: string;
  completed_at: string;
  duration_minutes: number | null;
  xp_awarded: number;
  note: string | null;
  updated_at: string;
};

export type StreakRow = {
  id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  freeze_used_dates: string;
  updated_at: string;
};

export type WeeklyGoalRow = {
  id: string;
  target_sessions: number;
  week_start_date: string;
  sessions_completed_this_week: number;
  updated_at: string;
};
