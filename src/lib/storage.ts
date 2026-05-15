import type { CheckEntry, Vote } from './types';

const CK_KEY = 'rt:check:v1';
const FB_KEY = 'rt:fb:v1';
const DAY_KEY = 'rt:day';
const FILTER_KEY = 'rt:dayFilter';
const THEME_KEY = 'theme';

export function loadChecklistState(): Record<string, CheckEntry> {
  try {
    return JSON.parse(localStorage.getItem(CK_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveChecklistState(state: Record<string, CheckEntry>) {
  localStorage.setItem(CK_KEY, JSON.stringify(state));
}

export function loadFeedbackState(): Record<string, Vote> {
  try {
    return JSON.parse(localStorage.getItem(FB_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveFeedbackState(state: Record<string, Vote>) {
  localStorage.setItem(FB_KEY, JSON.stringify(state));
}

export function getSavedDay(): string | null {
  return localStorage.getItem(DAY_KEY);
}

export function setSavedDay(date: string) {
  localStorage.setItem(DAY_KEY, date);
}

export function getDayFilter(): boolean {
  return localStorage.getItem(FILTER_KEY) === '1';
}

export function setDayFilter(on: boolean) {
  localStorage.setItem(FILTER_KEY, on ? '1' : '0');
}

export function getTheme(): 'light' | 'dark' {
  const t = localStorage.getItem(THEME_KEY);
  return t === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: 'light' | 'dark') {
  localStorage.setItem(THEME_KEY, theme);
}
