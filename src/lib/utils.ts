export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

export function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

export function getSectionLetter(text: string): string | null {
  const m = text.match(/^ABSCHNITT\s+([A-Z])\b/i);
  if (m) return m[1].toUpperCase();
  if (/^ZUSATZLISTEN/i.test(text)) return 'ZUSATZLISTEN';
  if (/^ANHANG\s*·\s*Reiseplanungs/i.test(text)) return 'ANHANG_CHECK';
  if (/^ANHANG\s*·\s*Detail/i.test(text)) return 'ANHANG_DETAIL';
  if (/^ANHANG\b/i.test(text)) return 'ANHANG_DETAIL';
  if (/^FAZIT/i.test(text)) return 'FAZIT';
  return null;
}

export function cleanHeadingText(text: string): string {
  return text
    .replace(/^#+\s*/, '')
    .replace(/^ABSCHNITT\s+[A-Z]\s*·\s*/i, '')
    .replace(/^[🚨🔝📍🌧️🍽️⛰️🗓️✅]+\s*/u, '')
    .trim();
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
