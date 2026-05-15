import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

interface TaskRow {
  id: string;
  section: string;
  text: string;
  checked: boolean;
}

export function ChecklistView() {
  const { contentRef, refreshChecklistBadge } = useApp();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const rows: TaskRow[] = [];
    root.querySelectorAll('li.task-item input[type="checkbox"]').forEach((cb) => {
      const el = cb as HTMLInputElement;
      if (!el.dataset.taskId) return;
      rows.push({
        id: el.dataset.taskId,
        section: el.dataset.taskSection || 'Allgemein',
        text: el.dataset.taskText || '',
        checked: el.checked
      });
    });
    setTasks(rows);
  }, [contentRef, refreshChecklistBadge]);

  const shown = tasks.filter((t) => {
    if (filter === 'open') return !t.checked;
    if (filter === 'done') return t.checked;
    return true;
  });

  const done = tasks.filter((t) => t.checked).length;

  function toggleTask(task: TaskRow) {
    const root = contentRef.current;
    if (!root) return;
    const cb = root.querySelector(`input[data-task-id="${task.id}"]`) as HTMLInputElement | null;
    if (!cb) return;
    cb.checked = !cb.checked;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, checked: cb.checked } : t)));
  }

  return (
    <div className="view checklist-view">
      <header className="checklist-header">
        <h2>✅ Checkliste</h2>
        <p>
          {done} / {tasks.length} erledigt
        </p>
        <div className="checklist-filters">
          <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            Alle
          </button>
          <button type="button" className={filter === 'open' ? 'active' : ''} onClick={() => setFilter('open')}>
            Offen
          </button>
          <button type="button" className={filter === 'done' ? 'active' : ''} onClick={() => setFilter('done')}>
            Erledigt
          </button>
        </div>
      </header>
      {shown.length === 0 ? (
        <p className="loading">Keine Aufgaben – Checkboxen stehen im Reiseplan (Abschnitt Anhang).</p>
      ) : (
        <ul className="checklist-list">
          {shown.map((t) => (
            <li key={t.id} className={'checklist-item' + (t.checked ? ' done' : '')}>
              <label>
                <input type="checkbox" checked={t.checked} onChange={() => toggleTask(t)} />
                <span className="checklist-section">{t.section}</span>
                <span className="checklist-text">{t.text}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
