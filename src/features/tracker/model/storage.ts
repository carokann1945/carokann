'use client';

import type { AppState } from './types';
export const STORAGE_KEY = 'tabs-todolist:v1';

export function loadState(): AppState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const state = parsed as AppState;
    if (state.version !== 1) return null;
    if (!Array.isArray(state.tabs)) return null;

    return state;
  } catch {
    return null;
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}
