import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { TripSession, Vote } from './types';

const TRIP_KEY = 'rt:trip:v1';
const PENDING_KEY = 'rt:sync:pending:v1';

type Listener = (payload: unknown) => void;

let client: SupabaseClient | null = null;
let trip: TripSession | null = null;
let ready = false;
let channel: ReturnType<SupabaseClient['channel']> | null = null;
const listeners: Record<string, Set<Listener>> = {
  checks: new Set(),
  feedback: new Set(),
  status: new Set(),
  notes: new Set()
};

function emit(kind: string, payload: unknown) {
  listeners[kind]?.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      /* ignore */
    }
  });
}

function getClient() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export function loadTripSession(): TripSession | null {
  try {
    return JSON.parse(localStorage.getItem(TRIP_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveTripSession(s: TripSession | null) {
  if (s) localStorage.setItem(TRIP_KEY, JSON.stringify(s));
  else localStorage.removeItem(TRIP_KEY);
  trip = s;
}

export function isConnected() {
  return !!(ready && trip?.tripId);
}

export function getTrip() {
  return trip;
}

export function getMemberName() {
  return trip?.name || 'Familie';
}

export async function resolveTripCode(code: string) {
  const c = getClient();
  if (!c) throw new Error('Supabase nicht konfiguriert');
  const trimmed = code.trim().toUpperCase();
  const { data, error } = await c.from('trips').select('id, code, title').eq('code', trimmed).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Unbekannter Trip-Code');
  return data;
}

export async function connectTrip(code: string, displayName: string) {
  const row = await resolveTripCode(code);
  const session: TripSession = {
    tripId: row.id,
    code: row.code,
    title: row.title,
    name: displayName.trim() || 'Familie'
  };
  saveTripSession(session);
  await init();
  emit('status', { connected: true, trip: session });
  return session;
}

export function disconnectTrip() {
  channel?.unsubscribe();
  channel = null;
  saveTripSession(null);
  ready = false;
  emit('status', { connected: false });
}

export async function fetchChecks() {
  if (!isConnected() || !trip) return [];
  const { data, error } = await getClient()!
    .from('checks')
    .select('task_id, section, task_text, checked, updated_by, updated_at')
    .eq('trip_id', trip.tripId);
  if (error) throw error;
  return data || [];
}

export async function fetchFeedback() {
  if (!isConnected() || !trip) return [];
  const { data, error } = await getClient()!
    .from('feedback')
    .select('item_id, voter, vote, updated_at')
    .eq('trip_id', trip.tripId);
  if (error) throw error;
  return data || [];
}

export async function fetchNotes(scope?: string) {
  if (!isConnected() || !trip) return [];
  let q = getClient()!.from('notes').select('*').eq('trip_id', trip.tripId).order('created_at', { ascending: true });
  if (scope) q = q.eq('scope', scope);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function upsertCheck(taskId: string, fields: { checked: boolean; section?: string; text?: string }) {
  if (!trip) return;
  const row = {
    trip_id: trip.tripId,
    task_id: taskId,
    section: fields.section || null,
    task_text: fields.text || null,
    checked: fields.checked,
    updated_by: getMemberName(),
    updated_at: new Date().toISOString()
  };
  const { error } = await getClient()!.from('checks').upsert(row, { onConflict: 'trip_id,task_id' });
  if (error) throw error;
}

async function upsertFeedback(itemId: string, vote: Vote | null) {
  if (!trip) return;
  const voter = getMemberName();
  if (!vote) {
    const { error } = await getClient()!
      .from('feedback')
      .delete()
      .eq('trip_id', trip.tripId)
      .eq('item_id', itemId)
      .eq('voter', voter);
    if (error) throw error;
    return;
  }
  const { error } = await getClient()!.from('feedback').upsert(
    { trip_id: trip.tripId, item_id: itemId, voter, vote, updated_at: new Date().toISOString() },
    { onConflict: 'trip_id,item_id,voter' }
  );
  if (error) throw error;
}

export async function insertNote(scope: string, body: string) {
  if (!trip) throw new Error('Nicht verbunden');
  const { error } = await getClient()!.from('notes').insert({
    trip_id: trip.tripId,
    scope,
    body,
    author: getMemberName()
  });
  if (error) throw error;
}

function loadPending() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  } catch {
    return [];
  }
}

function savePending(list: unknown[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

function queuePending(op: object) {
  savePending([...loadPending(), { ...op, ts: Date.now() }]);
}

export function getPendingCount() {
  return loadPending().length;
}

async function flushPending() {
  if (!isConnected()) return;
  const rest: object[] = [];
  for (const op of loadPending() as { type: string; taskId?: string; itemId?: string; fields?: object; vote?: Vote }[]) {
    try {
      if (op.type === 'check' && op.taskId && op.fields) await upsertCheck(op.taskId, op.fields as { checked: boolean; section?: string; text?: string });
      else if (op.type === 'feedback' && op.itemId) await upsertFeedback(op.itemId, op.vote ?? null);
    } catch {
      rest.push(op);
    }
  }
  savePending(rest);
}

export async function saveCheck(taskId: string, fields: { checked: boolean; section?: string; text?: string }) {
  try {
    await upsertCheck(taskId, fields);
  } catch {
    queuePending({ type: 'check', taskId, fields });
    throw new Error('offline');
  }
}

export async function saveFeedback(itemId: string, vote: Vote | null) {
  try {
    await upsertFeedback(itemId, vote);
  } catch {
    queuePending({ type: 'feedback', itemId, vote });
    throw new Error('offline');
  }
}

function subscribeRealtime() {
  if (!isConnected() || !trip || !getClient()) return;
  channel = getClient()!
    .channel('rt-family-' + trip.tripId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'checks', filter: 'trip_id=eq.' + trip.tripId }, (p) =>
      emit('checks', p)
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback', filter: 'trip_id=eq.' + trip.tripId }, (p) =>
      emit('feedback', p)
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: 'trip_id=eq.' + trip.tripId }, (p) =>
      emit('notes', p)
    )
    .subscribe();
}

export async function init() {
  const c = getClient();
  if (!c) {
    ready = false;
    return false;
  }
  trip = loadTripSession();
  if (!trip?.tripId) {
    ready = false;
    return false;
  }
  try {
    await flushPending();
    subscribeRealtime();
    ready = true;
    emit('status', { connected: true, trip });
    return true;
  } catch {
    ready = false;
    return false;
  }
}

export function on(event: string, fn: Listener) {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(fn);
  return () => listeners[event].delete(fn);
}
