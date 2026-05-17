import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { TodayView } from '@/views/TodayView';
import { PlanView } from '@/views/PlanView';
import { ChecklistView } from '@/views/ChecklistView';

const MapView = lazy(() => import('@/views/MapView').then((m) => ({ default: m.MapView })));

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/heute" replace />} />
        <Route path="/heute" element={<TodayView />} />
        <Route path="/plan" element={<PlanView />} />
        <Route
          path="/karte"
          element={
            <Suspense fallback={<div className="loading">Karte wird geladen...</div>}>
              <MapView />
            </Suspense>
          }
        />
        <Route path="/liste" element={<ChecklistView />} />
        <Route path="*" element={<Navigate to="/heute" replace />} />
      </Routes>
    </AppShell>
  );
}
