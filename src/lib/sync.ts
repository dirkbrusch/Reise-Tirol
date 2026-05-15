import { loadChecklistState, saveChecklistState, loadFeedbackState, saveFeedbackState } from './storage';
import { getMemberName } from './supabase';
import type { Vote } from './types';

export function applyChecklistToDom(root: HTMLElement) {
  const state = loadChecklistState();
  root.querySelectorAll('li.task-item input[type="checkbox"]').forEach((cb) => {
    const el = cb as HTMLInputElement;
    const id = el.dataset.taskId;
    const on = !!(id && state[id]);
    el.checked = on;
    el.closest('li')?.classList.toggle('done', on);
  });
}

export function applyFeedbackToDom(root: HTMLElement) {
  const state = loadFeedbackState();
  root.querySelectorAll('h3 .feedback-bar').forEach((bar) => {
    const h3 = bar.closest('h3');
    if (!h3) return;
    const id = h3.id || '';
    const vote = state[id];
    bar.querySelectorAll('.feedback-btn').forEach((b) => {
      b.classList.toggle('active', vote === (b as HTMLElement).dataset.vote);
    });
  });
}

export function mergeRemoteChecks(
  root: HTMLElement,
  rows: { task_id: string; section?: string; task_text?: string; checked: boolean; updated_by?: string }[]
) {
  const state = loadChecklistState();
  (rows || []).forEach((r) => {
    if (r.checked) {
      state[r.task_id] = { t: r.task_text, s: r.section, d: Date.now(), by: r.updated_by };
    } else {
      delete state[r.task_id];
    }
  });
  saveChecklistState(state);
  applyChecklistToDom(root);
}

export function mergeRemoteFeedback(
  root: HTMLElement,
  rows: { item_id: string; voter: string; vote: Vote | null }[]
) {
  const me = getMemberName();
  const state = loadFeedbackState();
  (rows || []).forEach((r) => {
    if (r.voter !== me) return;
    if (r.vote) state[r.item_id] = r.vote;
    else delete state[r.item_id];
  });
  saveFeedbackState(state);
  applyFeedbackToDom(root);
}
