import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { QUICK_LINKS } from '@/lib/constants';

export function PlanView() {
  const { navGroups, contentRef, dayFilter, setDayFilter, daysData, sectionToId } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const planMountRef = useRef<HTMLDivElement>(null);
  const loc = useLocation();

  useEffect(() => {
    const node = contentRef.current;
    const host = planMountRef.current;
    if (node && host && node.parentElement !== host) {
      host.appendChild(node);
    }
    return () => {
      const hidden = document.querySelector('.plan-content-hidden');
      if (node && hidden && node.parentElement !== hidden) {
        hidden.appendChild(node);
      }
    };
  }, [contentRef, loc.pathname]);

  useEffect(() => {
    const raw = window.location.hash.replace(/^#\/?plan#?/, '').replace(/^#/, '');
    if (raw && raw !== 'plan' && raw !== '/plan') {
      setTimeout(() => document.getElementById(raw)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [loc.pathname]);

  const filteredGroups = navGroups
    .map((g) => ({
      ...g,
      links: g.links.filter((l) => !search || l.label.toLowerCase().includes(search.toLowerCase()))
    }))
    .filter((g) => g.links.length > 0);

  return (
    <div className="view plan-view">
      <div className="plan-toolbar">
        <button type="button" className="btn ghost small" onClick={() => setSidebarOpen((o) => !o)}>
          ☰ Inhalt
        </button>
        {daysData && (
          <label className="day-filter-toggle">
            <input type="checkbox" checked={dayFilter} onChange={(e) => setDayFilter(e.target.checked)} />
            Nur gewählter Tag
          </label>
        )}
      </div>

      <div className={'plan-layout' + (sidebarOpen ? ' sidebar-open' : '')}>
        <aside className="plan-sidebar">
          <input
            type="search"
            className="nav-search"
            placeholder="Suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <nav className="nav">
            {filteredGroups.map((g) => (
              <div key={g.title} className="nav-group">
                <div className="nav-group-title">
                  {g.icon} {g.title}
                </div>
                {g.links.map((l) => (
                  <a
                    key={l.href + l.label}
                    href={l.href}
                    className={l.sub ? 'sub' : ''}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {l.icon && <span className="nav-icon">{l.icon}</span>}
                    <span>{l.label}</span>
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="plan-main">
          <div className="quick-grid" id="quickGrid">
            {QUICK_LINKS.map((l) => {
              const id = sectionToId[l.section];
              if (!id) return null;
              return (
                <a key={l.section} className="quick-card" href={'#' + id}>
                  <div className="quick-card-icon">{l.icon}</div>
                  <div className="quick-card-title">{l.title}</div>
                  <div className="quick-card-desc">{l.desc}</div>
                </a>
              );
            })}
          </div>
          <div ref={planMountRef} className="plan-content-mount" />
        </div>
      </div>
    </div>
  );
}
