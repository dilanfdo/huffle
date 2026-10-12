import type { EvolutionStageId } from '../domain/evolution';
import { EVOLUTION_STAGE_IDS } from '../domain/evolution';
import type { Mood } from '../domain/mood';
import { MOOD_IDS } from '../domain/mood';
import { parseJsonArray } from './ids';
import type {
  HabitTypeRecord,
  HabitTypeRow,
  HufflingRecord,
  HufflingRow,
  SessionLogRecord,
  SessionLogRow,
  StreakRecord,
  StreakRow,
  UserRecord,
  UserRow,
  WeeklyGoalRecord,
  WeeklyGoalRow,
} from './types';

function asEvolutionStage(value: string): EvolutionStageId {
  if ((EVOLUTION_STAGE_IDS as readonly string[]).includes(value)) {
    return value as EvolutionStageId;
  }
  return 'winded';
}

function asMood(value: string): Mood {
  if ((MOOD_IDS as readonly string[]).includes(value)) {
    return value as Mood;
  }
  return 'winded';
}

export function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    streakFreezeTokens: row.streak_freeze_tokens,
    onboardingComplete: row.onboarding_complete === 1,
    weeklyGoal: row.weekly_goal,
    reminderHour: row.reminder_hour,
    reminderMinute: row.reminder_minute,
    lastOpenedAt: row.last_opened_at,
    updatedAt: row.updated_at,
  };
}

export function mapHuffling(row: HufflingRow): HufflingRecord {
  return {
    id: row.id,
    name: row.name,
    evolutionStage: asEvolutionStage(row.evolution_stage),
    xp: row.xp,
    mood: asMood(row.mood),
    lastFedAt: row.last_fed_at,
    updatedAt: row.updated_at,
  };
}

export function mapHabitType(row: HabitTypeRow): HabitTypeRecord {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon,
    category: row.category,
    updatedAt: row.updated_at,
  };
}

export function mapSessionLog(row: SessionLogRow): SessionLogRecord {
  return {
    id: row.id,
    habitTypeId: row.habit_type_id,
    completedAt: row.completed_at,
    durationMinutes: row.duration_minutes,
    xpAwarded: row.xp_awarded,
    note: row.note,
    updatedAt: row.updated_at,
  };
}

export function mapStreak(row: StreakRow): StreakRecord {
  return {
    id: row.id,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastCompletedDate: row.last_completed_date,
    freezeUsedDates: parseJsonArray(row.freeze_used_dates),
    updatedAt: row.updated_at,
  };
}

export function mapWeeklyGoal(row: WeeklyGoalRow): WeeklyGoalRecord {
  return {
    id: row.id,
    targetSessions: row.target_sessions,
    weekStartDate: row.week_start_date,
    sessionsCompletedThisWeek: row.sessions_completed_this_week,
    updatedAt: row.updated_at,
  };
}
