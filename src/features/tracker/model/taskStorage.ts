import type { TaskState } from './types';

export const STORAGE_KEY = 'reset-tracker-tasks:v1';

export function loadTaskState(): TaskState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed as TaskState;
  } catch {
    return null;
  }
}

export function saveTaskState(state: TaskState) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}
