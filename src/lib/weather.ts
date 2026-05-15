const WX_KEY = 'rt:wx:v1';
const WX_TTL = 30 * 60 * 1000;

const WX_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '⛈️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
};

export interface WxDay {
  label: string;
  icon: string;
  tmax: number;
  tmin: number;
  rain: string;
}

export async function loadWeather(): Promise<WxDay[]> {
  try {
    const cached = JSON.parse(localStorage.getItem(WX_KEY) || 'null');
    if (cached && Date.now() - cached.ts < WX_TTL) return renderWeatherData(cached.data);
  } catch {
    /* ignore */
  }
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=47.4253&longitude=11.9747&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FVienna&forecast_days=3';
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  try {
    localStorage.setItem(WX_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* ignore */
  }
  return renderWeatherData(data);
}

function renderWeatherData(data: {
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: (number | null)[] };
}): WxDay[] {
  const d = data.daily;
  const fmt = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  const out: WxDay[] = [];
  for (let i = 0; i < d.time.length && i < 3; i++) {
    const label = i === 0 ? 'Heute' : fmt.format(new Date(d.time[i]));
    const rain = d.precipitation_probability_max[i];
    out.push({
      label,
      icon: WX_ICONS[d.weather_code[i]] || '🌡️',
      tmax: Math.round(d.temperature_2m_max[i]),
      tmin: Math.round(d.temperature_2m_min[i]),
      rain: rain == null ? '–' : rain + '%'
    });
  }
  return out;
}
