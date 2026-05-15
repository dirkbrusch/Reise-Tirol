import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '@/context/AppContext';
import { CATEGORY_META } from '@/lib/constants';
import { haversineKm } from '@/lib/utils';
import type { Place } from '@/lib/types';

function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();
  useEffect(() => {
    if (!places.length) return;
    const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [map, places]);
  return null;
}

function makeIcon(emoji: string) {
  return L.divIcon({
    className: 'rt-pin',
    html: `<div style="font-size:1.4rem;line-height:1;text-align:center">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

export function MapView() {
  const { placesData, showToast } = useApp();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);

  const places = placesData?.places ?? [];

  const categories = useMemo(() => {
    const cats = new Set<string>(['all']);
    places.forEach((p) => cats.add(p.category || 'ort'));
    return Array.from(cats);
  }, [places]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return places.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return typeof p.lat === 'number' && typeof p.lon === 'number';
    });
  }, [places, category, search]);

  const nearby = useMemo(() => {
    if (!userPos) return filtered;
    return [...filtered].sort(
      (a, b) => haversineKm(userPos.lat, userPos.lon, a.lat, a.lon) - haversineKm(userPos.lat, userPos.lon, b.lat, b.lon)
    );
  }, [filtered, userPos]);

  function locateMe() {
    if (!navigator.geolocation) {
      showToast('Standort nicht verfügbar');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => showToast('Standort verweigert')
    );
  }

  if (!places.length) {
    return <div className="view map-view"><p className="loading">Keine Orte geladen.</p></div>;
  }

  const center: [number, number] = [47.4253, 11.9747];

  return (
    <div className="view map-view">
      <div className="map-controls">
        <input
          type="search"
          placeholder="Ort suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="btn ghost small" onClick={locateMe}>
          📍 In meiner Nähe
        </button>
      </div>
      <div className="map-filters" id="mapFilters">
        {categories.map((c) => {
          const m = CATEGORY_META[c] || { icon: '📌', label: c };
          return (
            <button
              key={c}
              type="button"
              className={'map-filter-btn' + (category === c ? ' active' : '')}
              onClick={() => setCategory(c)}
            >
              {m.icon} {m.label}
            </button>
          );
        })}
      </div>

      <div className="map-split">
        <div className="map-canvas-wrap">
          <MapContainer center={center} zoom={11} scrollWheelZoom className="map-canvas" id="mapCanvas">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds places={nearby} />
            {nearby.map((p) => {
              const meta = CATEGORY_META[p.category] || { icon: '📌' };
              return (
                <Marker
                  key={p.id}
                  position={[p.lat, p.lon]}
                  icon={makeIcon(meta.icon)}
                  eventHandlers={{ click: () => setSelected(p) }}
                >
                  <Popup>
                    <strong>{p.name}</strong>
                    {p.cashOnly && <div>💶 nur Bargeld</div>}
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=15/${p.lat}/${p.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      In OSM öffnen
                    </a>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {selected && (
          <aside className="map-detail-panel">
            <button type="button" className="icon-btn map-detail-close" onClick={() => setSelected(null)}>
              ✕
            </button>
            <h3>{selected.name}</h3>
            <p className="map-detail-cat">{(CATEGORY_META[selected.category] || {}).label || selected.category}</p>
            {selected.description && <p>{selected.description}</p>}
            {selected.cashOnly && <p>💶 Nur Bargeld</p>}
            {selected.phone && <p>📞 {selected.phone}</p>}
            {selected.openHours && <p>🕐 {selected.openHours}</p>}
            {userPos && (
              <p className="map-detail-dist">
                📏 ca. {haversineKm(userPos.lat, userPos.lon, selected.lat, selected.lon).toFixed(1)} km
              </p>
            )}
            {selected.tourUrl && (
              <a href={selected.tourUrl} target="_blank" rel="noopener noreferrer" className="btn ghost small">
                Tour-Info
              </a>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn primary small"
            >
              Google Maps
            </a>
          </aside>
        )}
      </div>
      {placesData?.attribution && <p className="map-attribution">{placesData.attribution}</p>}
    </div>
  );
}
