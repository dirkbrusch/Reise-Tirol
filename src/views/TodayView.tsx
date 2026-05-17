import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { WeatherWidget } from '@/components/WeatherWidget';
import { CATEGORY_META } from '@/lib/constants';
import type { TripDay } from '@/lib/types';

export function TodayView() {
  const { daysData, placesData, selectedDay, selectedDate, setSelectedDate, cycleDay, jumpToPlanDay } = useApp();
  if (!daysData || !selectedDay) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDay.date === today;
  const label = isToday ? 'Heute \u00b7 ' + selectedDay.label : 'Gew\u00e4hlt \u00b7 ' + selectedDay.label;
  const places = placesData?.places ?? [];
  const dayPlaceIds = new Set([...(selectedDay.placeIds ?? []), selectedDay.dinner?.placeId].filter(Boolean) as string[]);
  const dayPlaces = places.filter((p) => dayPlaceIds.has(p.id) || p.dayRefs?.includes(selectedDay.date));
  const alerts = [
    ...(selectedDay.alerts ?? []),
    ...(selectedDay.reservations ?? []),
    selectedDay.notes || ''
  ].filter(Boolean);
  const timeline: NonNullable<TripDay['timeline']> =
    selectedDay.timeline?.length
      ? selectedDay.timeline
      : [
          ...(selectedDay.highlights ?? []).slice(0, 4).map((h, i) => ({ time: i === 0 ? 'Vormittag' : undefined, title: h })),
          ...(selectedDay.dinner ? [{ time: 'Abend', title: 'Essen: ' + selectedDay.dinner.name, placeId: selectedDay.dinner.placeId }] : [])
        ];

  return (
    <div className="view today-view">
      <WeatherWidget />
      <div className="day-picker-wrap">
        <label htmlFor="dayPicker">Reisetag</label>
        <select id="dayPicker" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
          {daysData.days.map((d) => (
            <option key={d.date} value={d.date}>
              Tag {d.dayNumber} {'\u00b7'} {d.label}{d.title ? ' \u00b7 ' + d.title : ''}
            </option>
          ))}
        </select>
      </div>
      <article className="today-card">
        <div className="today-card-head">
          <span className="today-card-label">{label}</span>
          <span className="today-card-date">Tag {selectedDay.dayNumber} von {daysData.days.length}</span>
        </div>
        <h2 className="today-card-title">{selectedDay.title}</h2>
        <div className="today-dashboard-grid">
          <section className="today-panel">
            <h3>Ablauf</h3>
            <ol className="today-timeline">
              {timeline.map((item, idx) => {
                const place = places.find((p) => p.id === item.placeId);
                return (
                  <li key={item.title + idx}>
                    <span className="today-time">{item.time || 'Plan'}</span>
                    <span className="today-line-title">{item.title}</span>
                    {place && <Link to={`/karte?place=${place.id}`} className="today-place-link">{place.name}</Link>}
                    {item.note && <span className="today-line-note">{item.note}</span>}
                  </li>
                );
              })}
            </ol>
          </section>
          <section className="today-panel">
            <h3>Wichtig</h3>
            {alerts.length ? (
              <ul className="today-alerts">
                {alerts.map((a) => <li key={a}>{a}</li>)}
              </ul>
            ) : (
              <p className="today-empty">Keine besonderen Hinweise.</p>
            )}
          </section>
        </div>
        <div className="today-card-meta">
          {selectedDay.dinner && (
            <span className="pill">
              {'\ud83c\udf7d\ufe0f'} {selectedDay.dinner.name}{selectedDay.dinner.reserved ? ' \u2713' : ''}
            </span>
          )}
          {(selectedDay.reservations || []).map((r) => (
            <span key={r} className="pill">{'\ud83d\udcc5'} {r}</span>
          ))}
        </div>
        {selectedDay.notes && <p className="today-notes">{selectedDay.notes}</p>}
        <div className="today-card-actions">
          <button type="button" className="today-card-btn" onClick={() => jumpToPlanDay(selectedDay.date)}>
            Zum Tag im Plan
          </button>
          <Link className="today-card-btn" to={`/karte?day=${selectedDay.date}`}>
            Heute auf Karte
          </Link>
          <button type="button" className="today-card-btn ghost" onClick={() => cycleDay(-1)}>{'\u2190'} Vortag</button>
          <button type="button" className="today-card-btn ghost" onClick={() => cycleDay(1)}>Folgetag {'\u2192'}</button>
        </div>
      </article>
      {dayPlaces.length > 0 && (
        <section className="quick-section">
          <h3>Orte heute</h3>
          <div className="today-place-grid">
            {dayPlaces.slice(0, 6).map((p) => {
              const meta = CATEGORY_META[p.category] || { icon: '📍', label: p.category };
              return (
                <Link key={p.id} to={`/karte?place=${p.id}`} className="today-place-card">
                  <span>{meta.icon}</span>
                  <strong>{p.name}</strong>
                  <small>{p.cashOnly ? 'Bargeld einplanen' : meta.label}</small>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      <div className="quick-section">
        <h3>Schnellzugriff</h3>
        <div className="quick-grid compact">
          <Link to="/plan" className="quick-card">
            <span className="quick-card-icon">{'\ud83d\udcd6'}</span>
            <span className="quick-card-title">Gesamtplan</span>
          </Link>
          <Link to="/karte" className="quick-card">
            <span className="quick-card-icon">{'\ud83d\uddfa\ufe0f'}</span>
            <span className="quick-card-title">Karte</span>
          </Link>
          <Link to="/liste" className="quick-card">
            <span className="quick-card-icon">{'\u2705'}</span>
            <span className="quick-card-title">Checkliste</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
