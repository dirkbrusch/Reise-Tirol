import type { DaysData } from './types';
import { getSavedDay, setSavedDay } from './storage';

export function resolveSelectedDay(daysData: DaysData, search: string, hash: string): string {
  const params = new URLSearchParams(search);
  const qp = params.get('day');
  if (qp && /^\d{4}-\d{2}-\d{2}$/.test(qp) && daysData.days.find((d) => d.date === qp)) return qp;

  const fromHash = hash.match(/^#?day-(\d{4}-\d{2}-\d{2})(?:\b|$)/);
  if (fromHash && daysData.days.find((d) => d.date === fromHash[1])) return fromHash[1];

  const saved = getSavedDay();
  if (saved && daysData.days.find((d) => d.date === saved)) return saved;

  const today = new Date().toISOString().slice(0, 10);
  if (daysData.days.find((d) => d.date === today)) return today;

  const todayMs = Date.now();
  let best = daysData.days[0];
  let bestDiff = Math.abs(new Date(best.date).getTime() - todayMs);
  for (const d of daysData.days) {
    const diff = Math.abs(new Date(d.date).getTime() - todayMs);
    if (diff < bestDiff) {
      best = d;
      bestDiff = diff;
    }
  }
  return best.date;
}

export function pickDay(daysData: DaysData, date: string) {
  setSavedDay(date);
  return daysData.days.find((d) => d.date === date) ?? null;
}

export function cycleDayDate(daysData: DaysData, current: string, delta: number): string {
  const idx = daysData.days.findIndex((d) => d.date === current);
  if (idx < 0) return current;
  const next = daysData.days[Math.min(daysData.days.length - 1, Math.max(0, idx + delta))];
  return next.date;
}
