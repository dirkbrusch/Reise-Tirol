export const SECTION_GROUPS = [
  { title: 'Übersicht', icon: '📍', sections: ['A', 'B'] },
  { title: 'Genuss & Kulinarik', icon: '🍽️', sections: ['C', 'J'] },
  { title: 'Aktivitäten', icon: '🥾', sections: ['D', 'I'] },
  { title: 'Mobilität & Versorgung', icon: '🚌', sections: ['E', 'F', 'G'] },
  { title: 'Ausflüge & Events', icon: '🏰', sections: ['H', 'K'] },
  { title: 'Praxis & Programme', icon: '📋', sections: ['L', 'M'] },
  { title: 'Quellen & Anhang', icon: '📚', sections: ['N', 'ZUSATZLISTEN', 'ANHANG_CHECK', 'ANHANG_DETAIL', 'FAZIT'] }
];

export const SECTION_ICONS: Record<string, string> = {
  A: '🗺️', B: '🏘️', C: '🍴', D: '🥾', E: '🚠', F: '🚌', G: '🛒', H: '🏛️',
  I: '☀️', J: '🧀', K: '📅', L: '💡', M: '🗓️', N: '🔗',
  ZUSATZLISTEN: '⭐', ANHANG_CHECK: '✅', ANHANG_DETAIL: '📑', FAZIT: '🎯'
};

export const QUICK_LINKS = [
  { icon: '🥾', title: 'Wanderungen', desc: 'Kurz · Tagestouren · Gipfel', section: 'D' },
  { icon: '🚠', title: 'Bergbahnen', desc: 'Schatzberg, Markbachjoch & Umkreis', section: 'E' },
  { icon: '🍴', title: 'Restaurants & Almen', desc: 'Alle Orte des Tals', section: 'C' },
  { icon: '☀️', title: 'Sommer-Aktivitäten', desc: 'Bäder, Bike, Paragliding', section: 'I' },
  { icon: '🏰', title: 'Ausflugsziele', desc: 'Kufstein, Achensee, Innsbruck', section: 'H' },
  { icon: '🗓️', title: 'Tagesprogramme', desc: '2 / 3 / 5 / 7 Tage', section: 'M' }
];

export const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  all: { icon: '📍', label: 'Alle' },
  ort: { icon: '🏘️', label: 'Orte' },
  bergbahn: { icon: '🚠', label: 'Bergbahnen' },
  alm: { icon: '🐄', label: 'Almen' },
  restaurant: { icon: '🍴', label: 'Restaurants' },
  hotel: { icon: '🛏️', label: 'Hotels' },
  ausflug: { icon: '🏰', label: 'Ausflüge' },
  natur: { icon: '🌲', label: 'Natur' },
  hofladen: { icon: '🧀', label: 'Hofläden' }
};

export const CONTENT_BASE = import.meta.env.BASE_URL + 'content/';
