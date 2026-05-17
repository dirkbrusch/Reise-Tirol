export type Vote = 'up' | 'down';

export interface TripDay {
  date: string;
  dayNumber: number;
  label: string;
  title: string;
  highlights?: string[];
  timeline?: { time?: string; title: string; placeId?: string; note?: string }[];
  placeIds?: string[];
  tasks?: string[];
  alerts?: string[];
  dinner?: { name: string; placeId?: string; reserved?: boolean };
  reservations?: string[];
  notes?: string;
}

export interface DaysData {
  version: number;
  tripStart: string;
  tripEnd: string;
  default?: { weatherLocation?: string };
  days: TripDay[];
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: string;
  cashOnly?: boolean;
  description?: string;
  phone?: string;
  openHours?: string;
  imageUrl?: string;
  tourUrl?: string;
  planAnchor?: string;
  dayRefs?: string[];
  priority?: number;
  mapsUrl?: string;
  reservation?: string;
}

export interface PlacesData {
  version: number;
  attribution?: string;
  places: Place[];
}

export interface CheckEntry {
  t?: string;
  s?: string;
  d?: number;
  by?: string;
}

export interface TripSession {
  tripId: string;
  code: string;
  title: string;
  name: string;
}

export interface NoteRow {
  id: number;
  trip_id: string;
  scope: string;
  body: string;
  author: string;
  created_at: string;
}
