import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { QUICK_LINKS } from '@/lib/constants';
import { anchorIdFromHref, scrollToAnchor } from '@/lib/scrollToAnchor';

export function PlanView() {
  const { navGroups, contentRef, dayFilter, setDayFilter, daysData, sectionToId } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const planMountRef = useRef<HTMLDivElement>(null);
  const loc = useLocation();

  const scrollToSection = useCallback((id: string) => {
    if (scrollToAnchor(id)) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const node = contentRef.current;
    const host = planMountRef.current;
    if (node && host && node.parentElement !== host) host.appendChild(node);
    return () => {
      const hidden = document.querySelector('.plan-content-hidden');
      if (node && hidden && node.parentElement !== hidden) hidden.appendChild(node);
    };
  }, [contentRef, loc.pathname]);

  useEffect(() => {
    const host = planMountRef.current;
    if (!host) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a');
      if (!a) return;
      const id = anchorIdFromHref(a.getAttribute('href'));
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      scrollToSection(id);
    };
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  }, [scrollToSection, loc.pathname]);

  const filteredGroups = navGroups
    .map((g) => ({
      ...g,
      links: g.links.filter((l) => !search || l.label.toLowerCase().includes(search.toLowerCase()))
    }))
    .filter((g) => g.links.length > 0);

  return (
    <div className="view plan-view">
      <div className="plan-toolbar">
        <button type="button" className="btn ghost small plan-menu-btn" onClick={() => setSidebarOpen((o) => !o)}>
          Inhalt
        </button>
        {daysData && (
          <label className="day-filter-toggle">
            <input type="checkbox" checked={dayFilter} onChange={(e) => setDayFilter(e.target.checked)} />
            Nur gewählter Tag
          </label>
        )}
      </div>
      {sidebarOpen && (
        <button type="button" className="plan-sidebar-backdrop" aria-label="Navigation schließen" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={'plan-layout' + (sidebarOpen ? ' sidebar-open' : '')}>
        <aside className="plan-sidebar" aria-label="Plan-Inhaltsverzeichnis">
          <input type="search" className="nav-search" placeholder="Suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <nav className="nav">
            {filteredGroups.length === 0 ? (
              <p className="plan-nav-empty">Inhaltsverzeichnis wird geladen</p>
            ) : (
              filteredGroups.map((g) => (
                <div key={g.title} className="nav-group">
                  <div className="nav-group-title">{g.icon} {g.title}</div>
                  {g.links.map((l) => {
                    const id = anchorIdFromHref(l.href);
                    return (
                      <a key={l.href + l.label} href={l.href} className={l.sub ? 'sub' : ''} onClick={(e) => { if (id) { e.preventDefault(); scrollToSection(id); } }}>
                        {l.icon && <span className="nav-icon">{l.icon}</span>}
                        <span>{l.label}</span>
                      </a>
                    );
                  })}
                </div>
              ))
            )}
          </nav>
        </aside>
        <div className="plan-main">
          <div className="quick-grid" id="quickGrid">
            {QUICK_LINKS.map((l) => {
              const id = sectionToId[l.section];
              if (!id) return null;
              return (
                <button key={l.section} type="button" className="quick-card" onClick={() => scrollToSection(id)}>
                  <div className="quick-card-icon">{l.icon}</div>
                  <div className="quick-card-title">{l.title}</div>
                  <div className="quick-card-desc">{l.desc}</div>
                </button>
              );
            })}
          </div>
          <div ref={planMountRef} className="plan-content-mount" />
        </div>
      </div>
    </div>
  );
}