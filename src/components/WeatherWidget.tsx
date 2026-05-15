import { useApp } from '@/context/AppContext';

export function WeatherWidget() {
  const { weather, weatherLoading } = useApp();
  if (weatherLoading) return <div className="wx-strip loading">Wetter …</div>;
  if (!weather.length) return null;
  return (
    <div className="wx-strip">
      {weather.map((d) => (
        <div key={d.label} className="wx-day">
          <span className="wx-label">{d.label}</span>
          <span className="wx-icon">{d.icon}</span>
          <span className="wx-temp">
            {d.tmax}° / {d.tmin}°
          </span>
          <span className="wx-rain">💧 {d.rain}</span>
        </div>
      ))}
    </div>
  );
}
