import { useState } from 'react';
import { clearAiKey, fetchAiCompletion, getAiKey, getAiProvider, saveAiKey, type AiProvider } from '@/lib/ai';
import { useApp } from '@/context/AppContext';

export function AiPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { selectedDay } = useApp();
  const [provider, setProvider] = useState<AiProvider>(getAiProvider());
  const [key, setKey] = useState(getAiKey() || '');
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function send() {
    const k = key.trim();
    if (!k) return;
    saveAiKey(k, provider);
    setBusy(true);
    setAnswer('');
    try {
      const system =
        'Du bist ein hilfreicher Reiseassistent für die Wildschönau (Tirol). Antworte kurz auf Deutsch.';
      const ctx = selectedDay
        ? `Aktueller Reisetag: ${selectedDay.label} – ${selectedDay.title}. Highlights: ${(selectedDay.highlights || []).join(', ')}.`
        : '';
      const text = await fetchAiCompletion(provider, k, system, ctx + '\n\n' + prompt);
      setAnswer(text);
    } catch (e) {
      setAnswer('⚠️ ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="overlay-panel ai-panel">
        <header className="overlay-header">
          <h2>✨ KI-Assistent</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </header>
        <p className="overlay-hint">Eigenen API-Key (OpenAI oder Anthropic) – wird nur lokal gespeichert.</p>
        <div className="ai-key-row">
          <select value={provider} onChange={(e) => setProvider(e.target.value as AiProvider)}>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
          <input
            type="password"
            placeholder="API-Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
          />
          <button type="button" className="btn ghost small" onClick={() => { clearAiKey(); setKey(''); }}>
            Löschen
          </button>
        </div>
        <textarea
          id="aiInput"
          rows={3}
          placeholder="Frage zur Reise…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button type="button" className="btn primary" disabled={busy || !prompt.trim()} onClick={send}>
          {busy ? 'Denke nach…' : 'Fragen'}
        </button>
        {answer && <div className="ai-answer">{answer}</div>}
      </div>
    </div>
  );
}
