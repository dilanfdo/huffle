import type { SyncRecordType } from '../data/outbox';
import type {
  HabitTypeRecord,
  HufflingRecord,
  SessionLogRecord,
  StreakRecord,
  UserRecord,
  WeeklyGoalRecord,
} from '../data/types';
import {
  CLOUDKIT_ZONE,
  fieldNumber,
  fieldString,
  numberField,
  optionalString,
  readFields,
  stringField,
  type CloudKitRecordLike,
} from './fields';

export type DomainRecord =
  | { type: 'User'; record: UserRecord }
  | { type: 'Huffling'; record: HufflingRecord }
  | { type: 'HabitType'; record: HabitTypeRecord }
  | { type: 'SessionLog'; record: SessionLogRecord }
  | { type: 'Streak'; record: StreakRecord }
  | { type: 'WeeklyGoal'; record: WeeklyGoalRecord };

export function toCloudKitRecord(
  item: DomainRecord,
  changeTag: string | null,
): CloudKitRecordLike {
  const base = {
    recordType: item.type,
    recordName: item.record.id,
    zoneName: CLOUDKIT_ZONE,
    ...(changeTag ? { changeTag } : {}),
  };

  switch (item.type) {
    case 'User':
      return {
        ...base,
        fields: {
          createdAt: stringField(item.record.createdAt),
          streakFreezeTokens: numberField(item.record.streakFreezeTokens),
          onboardingComplete: numberField(item.record.onboardingComplete ? 1 : 0),
          weeklyGoal: numberField(item.record.weeklyGoal),
          reminderHour: numberField(item.record.reminderHour),
          reminderMinute: numberField(item.record.reminderMinute),
          lastOpenedAt: stringField(item.record.lastOpenedAt),
          updatedAt: stringField(item.record.updatedAt),
        },
      };
    case 'Huffling':
      return {
        ...base,
        fields: {
          name: stringField(item.record.name),
          evolutionStage: stringField(item.record.evolutionStage),
          xp: numberField(item.record.xp),
          mood: stringField(item.record.mood),
          lastFedAt: stringField(item.record.lastFedAt),
          updatedAt: stringField(item.record.updatedAt),
        },
      };
    case 'HabitType':
      return {
        ...base,
        fields: {
          label: stringField(item.record.label),
          icon: stringField(item.record.icon),
          category: stringField(item.record.category),
          updatedAt: stringField(item.record.updatedAt),
        },
      };
    case 'SessionLog':
      return {
        ...base,
        fields: {
          habitTypeId: stringField(item.record.habitTypeId),
          completedAt: stringField(item.record.completedAt),
          durationMinutes: numberField(item.record.durationMinutes ?? -1),
          xpAwarded: numberField(item.record.xpAwarded),
          note: stringField(item.record.note),
          updatedAt: stringField(item.record.updatedAt),
        },
      };
    case 'Streak':
      return {
        ...base,
        fields: {
          currentStreak: numberField(item.record.currentStreak),
          longestStreak: numberField(item.record.longestStreak),
          lastCompletedDate: stringField(item.record.lastCompletedDate),
          freezeUsedDates: stringField(JSON.stringify(item.record.freezeUsedDates)),
          updatedAt: stringField(item.record.updatedAt),
        },
      };
    case 'WeeklyGoal':
      return {
        ...base,
        fields: {
          targetSessions: numberField(item.record.targetSessions),
          weekStartDate: stringField(item.record.weekStartDate),
          sessionsCompletedThisWeek: numberField(item.record.sessionsCompletedThisWeek),
          updatedAt: stringField(item.record.updatedAt),
        },
      };
  }
}

export function fromCloudKitRecord(record: CloudKitRecordLike): DomainRecord | null {
  const fields = readFields(record);
  const id = record.recordName;
  const type = record.recordType as SyncRecordType;
  const updatedAt = fieldString(fields, 'updatedAt');

  switch (type) {
    case 'User':
      return {
        type,
        record: {
          id,
          createdAt: fieldString(fields, 'createdAt') || updatedAt,
          streakFreezeTokens: fieldNumber(fields, 'streakFreezeTokens'),
          onboardingComplete: fieldNumber(fields, 'onboardingComplete') === 1,
          weeklyGoal: fieldNumber(fields, 'weeklyGoal') || 3,
          reminderHour: fieldNumber(fields, 'reminderHour'),
          reminderMinute: fieldNumber(fields, 'reminderMinute'),
          lastOpenedAt: optionalString(fieldString(fields, 'lastOpenedAt')),
          updatedAt,
        },
      };
    case 'Huffling':
      return {
        type,
        record: {
          id,
          name: fieldString(fields, 'name') || 'Huffling',
          evolutionStage: (fieldString(fields, 'evolutionStage') || 'winded') as HufflingRecord['evolutionStage'],
          xp: fieldNumber(fields, 'xp'),
          mood: (fieldString(fields, 'mood') || 'winded') as HufflingRecord['mood'],
          lastFedAt: optionalString(fieldString(fields, 'lastFedAt')),
          updatedAt,
        },
      };
    case 'HabitType':
      return {
        type,
        record: {
          id,
          label: fieldString(fields, 'label'),
          icon: fieldString(fields, 'icon'),
          category: fieldString(fields, 'category') || 'fitness',
          updatedAt,
        },
      };
    case 'SessionLog': {
      const duration = fieldNumber(fields, 'durationMinutes');
      return {
        type,
        record: {
          id,
          habitTypeId: fieldString(fields, 'habitTypeId'),
          completedAt: fieldString(fields, 'completedAt'),
          durationMinutes: duration < 0 ? null : duration,
          xpAwarded: fieldNumber(fields, 'xpAwarded'),
          note: optionalString(fieldString(fields, 'note')),
          updatedAt,
        },
      };
    }
    case 'Streak': {
      let freezeUsedDates: string[] = [];
      try {
        const parsed: unknown = JSON.parse(fieldString(fields, 'freezeUsedDates') || '[]');
        if (Array.isArray(parsed)) {
          freezeUsedDates = parsed.filter((item): item is string => typeof item === 'string');
        }
      } catch {
        freezeUsedDates = [];
      }
      return {
        type,
        record: {
          id,
          currentStreak: fieldNumber(fields, 'currentStreak'),
          longestStreak: fieldNumber(fields, 'longestStreak'),
          lastCompletedDate: optionalString(fieldString(fields, 'lastCompletedDate')),
          freezeUsedDates,
          updatedAt,
        },
      };
    }
    case 'WeeklyGoal':
      return {
        type,
        record: {
          id,
          targetSessions: fieldNumber(fields, 'targetSessions'),
          weekStartDate: fieldString(fields, 'weekStartDate'),
          sessionsCompletedThisWeek: fieldNumber(fields, 'sessionsCompletedThisWeek'),
          updatedAt,
        },
      };
    default:
      return null;
  }
}

export function newerUpdatedAt(a: string, b: string): boolean {
  return a >= b;
}
