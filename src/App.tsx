import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { TodayView } from '@/views/TodayView';
import { PlanView } from '@/views/PlanView';
import { MapView } from '@/views/MapView';
import { ChecklistView } from '@/views/ChecklistView';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/heute" replace />} />
        <Route path="/heute" element={<TodayView />} />
        <Route path="/plan" element={<PlanView />} />
        <Route path="/karte" element={<MapView />} />
        <Route path="/liste" element={<ChecklistView />} />
        <Route path="*" element={<Navigate to="/heute" replace />} />
      </Routes>
    </AppShell>
  );
}
