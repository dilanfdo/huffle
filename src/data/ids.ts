import { randomUUID } from 'expo-crypto';

export function createId(): string {
  return randomUUID();
}

export function nowIso(date: Date = new Date()): string {
  return date.toISOString();
}

export function parseJsonArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}
