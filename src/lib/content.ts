import type { ContentKey, ContentMeta, DaysData, PlacesData } from './types';
import { CONTENT_BASE } from './constants';
import { fetchContentOverride } from './supabase';

const CACHE_PREFIX = 'rt:content:v1:';
const CONTENT_KEYS = {
  markdown: 'reiseplan.md',
  days: 'days.json',
  places: 'places.json'
} as const;

interface LoadedContent<T> {
  value: T;
  meta: ContentMeta;
}

export interface TripContent {
  markdown: LoadedContent<string>;
  days: LoadedContent<DaysData>;
  places: LoadedContent<PlacesData>;
}

function cacheKey(key: ContentKey) {
  return CACHE_PREFIX + key;
}

function loadCache<T>(key: ContentKey): LoadedContent<T> | null {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey(key)) || 'null') as LoadedContent<T> | null;
    if (!cached?.value) return null;
    return { value: cached.value, meta: { ...cached.meta, key, source: 'cache' } };
  } catch {
    return null;
  }
}

function saveCache<T>(key: ContentKey, content: LoadedContent<T>) {
  try {
    localStorage.setItem(cacheKey(key), JSON.stringify(content));
  } catch {
    /* ignore */
  }
}

async function fetchFileText(key: ContentKey) {
  const res = await fetch(CONTENT_BASE + key);
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
  return res.text();
}

function parseJson<T>(key: ContentKey, raw: string, validate: (value: unknown) => value is T): T {
  const parsed = JSON.parse(raw) as unknown;
  if (!validate(parsed)) throw new Error(`${key}: ungültiges Format`);
  return parsed;
}

function isDaysData(value: unknown): value is DaysData {
  const v = value as DaysData;
  return !!v && typeof v.version === 'number' && Array.isArray(v.days) && v.days.every((d) => !!d.date && !!d.title);
}

function isPlacesData(value: unknown): value is PlacesData {
  const v = value as PlacesData;
  return !!v && typeof v.version === 'number' && Array.isArray(v.places) && v.places.every((p) => !!p.id && typeof p.lat === 'number' && typeof p.lon === 'number');
}

async function fetchHybrid<T>(
  key: ContentKey,
  contentType: 'markdown' | 'json',
  parse: (raw: string) => T
): Promise<LoadedContent<T>> {
  let fileContent: LoadedContent<T> | null = null;
  try {
    const raw = await fetchFileText(key);
    fileContent = { value: parse(raw), meta: { key, source: 'file' } };
  } catch (e) {
    const cached = loadCache<T>(key);
    if (cached) return cached;
    throw e;
  }

  try {
    const live = await fetchContentOverride(key);
    if (live?.content && live.content_type === contentType) {
      const liveContent: LoadedContent<T> = {
        value: parse(live.content),
        meta: {
          key,
          source: 'live',
          version: live.version,
          updatedAt: live.updated_at
        }
      };
      saveCache(key, liveContent);
      return liveContent;
    }
  } catch {
    /* Keep the freshly loaded file fallback when live content is missing or invalid. */
  }

  saveCache(key, fileContent);
  return fileContent;
}

export async function fetchTripContent(): Promise<TripContent> {
  const [markdown, days, places] = await Promise.all([
    fetchHybrid(CONTENT_KEYS.markdown, 'markdown', (raw) => raw),
    fetchHybrid(CONTENT_KEYS.days, 'json', (raw) => parseJson(CONTENT_KEYS.days, raw, isDaysData)),
    fetchHybrid(CONTENT_KEYS.places, 'json', (raw) => parseJson(CONTENT_KEYS.places, raw, isPlacesData))
  ]);
  return { markdown, days, places };
}

export async function fetchMarkdown(): Promise<string> {
  return (await fetchTripContent()).markdown.value;
}

export async function fetchDays(): Promise<DaysData> {
  return (await fetchTripContent()).days.value;
}

export async function fetchPlaces(): Promise<PlacesData> {
  return (await fetchTripContent()).places.value;
}
