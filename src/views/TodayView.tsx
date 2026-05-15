import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { WeatherWidget } from '@/components/WeatherWidget';

export function TodayView() {
  const { daysData, selectedDay, selectedDate, setSelectedDate, cycleDay, jumpToPlanDay } = useApp();
  if (!daysData || !selectedDay) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDay.date === today;
  const label = isToday ? 'Heute \u00b7 ' + selectedDay.label : 'Gew\u00e4hlt \u00b7 ' + selectedDay.label;

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
        {selectedDay.highlights?.length ? (
          <ul className="today-card-list">
            {selectedDay.highlights.slice(0, 4).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : null}
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
          <button type="button" className="today-card-btn ghost" onClick={() => cycleDay(-1)}>{'\u2190'} Vortag</button>
          <button type="button" className="today-card-btn ghost" onClick={() => cycleDay(1)}>Folgetag {'\u2192'}</button>
        </div>
      </article>
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