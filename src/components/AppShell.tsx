import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { BottomNav } from './BottomNav';
import { FamilyOverlay } from './FamilyOverlay';
import { AiPanel } from './AiPanel';
import { PlanContentHost } from './PlanContentHost';

export function AppShell({ children }: { children: ReactNode }) {
  const { loading, error, toast, theme, toggleTheme, checklistCount } = useApp();
  const [familyOpen, setFamilyOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const loc = useLocation();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading">Reiseplan wird geladen…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-loading">
        <div className="loading">⚠️ Fehler: {error}</div>
      </div>
    );
  }

  return (
    <div className="app-shell" data-route={loc.pathname}>
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="app-title">Wildschönau</h1>
          <div className="app-header-actions">
            <button type="button" className="icon-btn" onClick={toggleTheme} title="Theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button type="button" className="icon-btn" onClick={() => setFamilyOpen(true)} title="Familien-Sync">
              👨‍👩‍👧‍👦
            </button>
            <button type="button" className="icon-btn" onClick={() => setAiOpen(true)} title="KI-Assistent">
              ✨
            </button>
          </div>
        </div>
      </header>

      <PlanContentHost />
      <main className="app-main">{children}</main>

      <BottomNav checklistBadge={checklistCount.total ? `${checklistCount.done}/${checklistCount.total}` : undefined} />

      {toast && <div className="toast" role="status">{toast}</div>}

      <FamilyOverlay open={familyOpen} onClose={() => setFamilyOpen(false)} />
      <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
