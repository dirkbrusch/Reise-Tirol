import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/heute', icon: '📅', label: 'Heute' },
  { to: '/plan', icon: '📖', label: 'Plan' },
  { to: '/karte', icon: '🗺️', label: 'Karte' },
  { to: '/liste', icon: '✅', label: 'Liste' }
];

export function BottomNav({ checklistBadge }: { checklistBadge?: string }) {
  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' active' : '')}>
          <span className="bottom-nav-icon">{t.icon}</span>
          <span className="bottom-nav-label">{t.label}</span>
          {t.to === '/liste' && checklistBadge && <span className="bottom-nav-badge">{checklistBadge}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
