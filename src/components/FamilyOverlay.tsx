import { useEffect, useState } from 'react';
import * as db from '@/lib/supabase';

const DEFAULT_CODE = import.meta.env.VITE_DEFAULT_TRIP_CODE || 'WILD2026';

export function FamilyOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [connected, setConnected] = useState(db.isConnected());

  useEffect(() => {
    if (!open) return;
    setConnected(db.isConnected());
    const trip = db.getTrip();
    if (trip) {
      setCode(trip.code);
      setName(trip.name);
    }
    const off = db.on('status', (p: unknown) => {
      const s = p as { connected?: boolean };
      setConnected(!!s.connected);
    });
    return () => { off(); };
  }, [open]);

  if (!open) return null;

  async function connect() {
    setStatus('Verbinde…');
    try {
      await db.connectTrip(code, name || 'Familie');
      setConnected(true);
      setStatus('Verbunden ✓');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Fehler');
    }
  }

  function disconnect() {
    db.disconnectTrip();
    setConnected(false);
    setStatus('Getrennt');
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="overlay-panel family-panel">
        <header className="overlay-header">
          <h2>👨‍👩‍👧‍👦 Familien-Sync</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </header>
        <p className="overlay-hint">Checklisten und Bewertungen mit der Familie teilen (Supabase).</p>
        {connected ? (
          <div>
            <p>
              Verbunden als <strong>{db.getMemberName()}</strong> · Trip <strong>{db.getTrip()?.code}</strong>
            </p>
            {db.getPendingCount() > 0 && <p className="warn">⏳ {db.getPendingCount()} ausstehende Sync-Einträge</p>}
            <button type="button" className="btn ghost" onClick={disconnect}>
              Trennen
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              connect();
            }}
          >
            <label>
              Trip-Code
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            </label>
            <label>
              Dein Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Kevin" />
            </label>
            <button type="submit" className="btn primary">
              Verbinden
            </button>
          </form>
        )}
        {status && <p className="status-line">{status}</p>}
      </div>
    </div>
  );
}
