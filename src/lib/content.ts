import type { DaysData, PlacesData } from './types';
import { CONTENT_BASE } from './constants';

export async function fetchMarkdown(): Promise<string> {
  const res = await fetch(CONTENT_BASE + 'reiseplan.md');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

export async function fetchDays(): Promise<DaysData> {
  const res = await fetch(CONTENT_BASE + 'days.json');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

export async function fetchPlaces(): Promise<PlacesData> {
  const res = await fetch(CONTENT_BASE + 'places.json');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}
