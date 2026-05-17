import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { marked } from 'marked';
import type { ContentMeta, DaysData, PlacesData, TripDay, Vote } from '@/lib/types';
import { fetchTripContent } from '@/lib/content';
import { loadWeather, type WxDay } from '@/lib/weather';
import { enhanceContent, collectDayAnchors } from '@/lib/planEnhance';
import { slugify, cleanHeadingText, getSectionLetter } from '@/lib/utils';
import { SECTION_GROUPS, SECTION_ICONS } from '@/lib/constants';
import {
  loadChecklistState,
  saveChecklistState,
  loadFeedbackState,
  saveFeedbackState,
  getDayFilter,
  setDayFilter,
  getTheme,
  setTheme
} from '@/lib/storage';
import { cycleDayDate, pickDay, resolveSelectedDay } from '@/lib/dayUtils';
import { mergeRemoteChecks, mergeRemoteFeedback } from '@/lib/sync';
import * as db from '@/lib/supabase';
import { sanitizeHtml } from '@/lib/sanitize';
marked.setOptions({ gfm: true, breaks: false });

export interface NavLink {
  href: string;
  label: string;
  icon?: string;
  sub?: boolean;
}

export interface NavGroup {
  title: string;
  icon: string;
  links: NavLink[];
}

interface AppState {
  loading: boolean;
  error: string | null;
  daysData: DaysData | null;
  placesData: PlacesData | null;
  selectedDate: string;
  selectedDay: TripDay | null;
  dayFilter: boolean;
  weather: WxDay[];
  weatherLoading: boolean;
  theme: 'light' | 'dark';
  planHtml: string;
  contentMeta: ContentMeta[];
  navGroups: NavGroup[];
  dayAnchors: Record<string, string>;
  sectionToId: Record<string, string>;
  checklistCount: { done: number; total: number };
  familyConnected: boolean;
  familyName: string;
  pendingSync: number;
  toast: string | null;
  contentRef: React.RefObject<HTMLDivElement | null>;
  setSelectedDate: (date: string) => void;
  setDayFilter: (on: boolean) => void;
  toggleTheme: () => void;
  showToast: (msg: string) => void;
  refreshChecklistBadge: () => void;
  jumpToPlanDay: (date: string) => void;
  cycleDay: (delta: number) => void;
}

const AppCtx = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}

function persistCheckFromDom(content: HTMLElement) {
  const state = loadChecklistState();
  content.querySelectorAll('li.task-item input[type="checkbox"]').forEach((cb) => {
    const el = cb as HTMLInputElement;
    const id = el.dataset.taskId;
    if (!id) return;
    const li = el.closest('li');
    if (el.checked) {
      state[id] = {
        t: el.dataset.taskText,
        s: el.dataset.taskSection,
        d: Date.now(),
        by: db.getMemberName()
      };
      li?.classList.add('done');
    } else {
      delete state[id];
      li?.classList.remove('done');
    }
  });
  saveChecklistState(state);
}

function countChecks(content: HTMLElement | null, selectedDay: TripDay | null) {
  const state = loadChecklistState();
  const dayTasks = selectedDay?.tasks ?? [];
  const dayTotal = dayTasks.length;
  let dayDone = 0;
  dayTasks.forEach((_, idx) => {
    if (selectedDay && state[`day-${selectedDay.date}-${idx}`]) dayDone++;
  });
  if (!content) return { done: dayDone, total: dayTotal };
  const boxes = content.querySelectorAll('li.task-item input[type="checkbox"]');
  let done = 0;
  boxes.forEach((cb) => {
    if ((cb as HTMLInputElement).checked) done++;
  });
  return { done: done + dayDone, total: boxes.length + dayTotal };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysData, setDaysData] = useState<DaysData | null>(null);
  const [placesData, setPlacesData] = useState<PlacesData | null>(null);
  const [selectedDate, setSelectedDateState] = useState('');
  const [dayFilter, setDayFilterState] = useState(getDayFilter);
  const [weather, setWeather] = useState<WxDay[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [theme, setThemeState] = useState<'light' | 'dark'>(getTheme);
  const [planHtml, setPlanHtml] = useState('');
  const [contentMeta, setContentMeta] = useState<ContentMeta[]>([]);
  const [navGroups, setNavGroups] = useState<NavGroup[]>([]);
  const [dayAnchors, setDayAnchors] = useState<Record<string, string>>({});
  const [sectionToId, setSectionToId] = useState<Record<string, string>>({});
  const [checklistCount, setChecklistCount] = useState({ done: 0, total: 0 });
  const [familyConnected, setFamilyConnected] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const enhancedRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  const selectedDay = useMemo(
    () => daysData?.days.find((d) => d.date === selectedDate) ?? null,
    [daysData, selectedDate]
  );

  const refreshChecklistBadge = useCallback(() => {
    setChecklistCount(countChecks(contentRef.current, selectedDay));
  }, [selectedDay]);

  const onChecklistChange = useCallback(() => {
    const root = contentRef.current;
    if (!root) return;
    persistCheckFromDom(root);
    refreshChecklistBadge();
    root.querySelectorAll('li.task-item input[type="checkbox"]').forEach((cb) => {
      const el = cb as HTMLInputElement;
      const id = el.dataset.taskId;
      if (!id || !db.isConnected()) return;
      db.saveCheck(id, {
        checked: el.checked,
        section: el.dataset.taskSection,
        text: el.dataset.taskText
      }).catch(() => showToast('Offline – wird später synchronisiert'));
    });
  }, [refreshChecklistBadge, showToast]);

  const onFeedbackToggle = useCallback(
    (itemId: string, bar: HTMLElement, vote: Vote) => {
      const state = loadFeedbackState();
      const current = state[itemId];
      const next = current === vote ? undefined : vote;
      if (next) state[itemId] = next;
      else delete state[itemId];
      saveFeedbackState(state);
      bar.querySelectorAll('.feedback-btn').forEach((btn) => {
        btn.classList.toggle('active', (btn as HTMLElement).dataset.vote === next);
      });
      if (db.isConnected()) {
        db.saveFeedback(itemId, next ?? null).catch(() => showToast('Offline – Feedback später'));
      }
    },
    [showToast]
  );

  const buildNavFromDom = useCallback((content: HTMLElement) => {
    const headings = content.querySelectorAll('h1, h2');
    const used = new Set<string>();
    headings.forEach((h) => {
      let id = slugify(h.textContent || '');
      let n = 1;
      while (used.has(id)) id = slugify(h.textContent || '') + '-' + ++n;
      used.add(id);
      h.id = id;
    });

    const sectionMap: Record<string, HTMLElement[]> = {};
    headings.forEach((h) => {
      if (h.tagName !== 'H1') return;
      const letter = h.getAttribute('data-section') || getSectionLetter(h.textContent?.replace(/#$/, '') || '');
      if (letter) {
        sectionMap[letter] = sectionMap[letter] || [];
        sectionMap[letter].push(h as HTMLElement);
      }
    });

    const secIds: Record<string, string> = {};
    Object.keys(sectionMap).forEach((letter) => {
      const first = sectionMap[letter][0];
      if (first?.id) secIds[letter] = first.id;
    });
    setSectionToId(secIds);

    const groups: NavGroup[] = [];
    SECTION_GROUPS.forEach((group) => {
      const links: NavLink[] = [];
      group.sections.forEach((letter) => {
        (sectionMap[letter] || []).forEach((h1) => {
          const clean = cleanHeadingText(h1.textContent?.replace(/#$/, '') || '');
          links.push({
            href: '#' + h1.id,
            label: clean,
            icon: SECTION_ICONS[letter] || '📌'
          });
          let next = h1.nextElementSibling;
          while (next && next.tagName !== 'H1') {
            if (next.tagName === 'H2') {
              links.push({
                href: '#' + next.id,
                label: cleanHeadingText(next.textContent?.replace(/#$/, '') || ''),
                sub: true
              });
            }
            next = next.nextElementSibling;
          }
        });
      });
      if (links.length) groups.push({ title: group.title, icon: group.icon, links });
    });
    setNavGroups(groups);
  }, []);

  const runEnhance = useCallback(() => {
    const root = contentRef.current;
    if (!root || enhancedRef.current) return;
    enhanceContent(root, { onChecklistChange, onFeedbackToggle });
    const anchors = collectDayAnchors(root);
    setDayAnchors(anchors);
    buildNavFromDom(root);
    enhancedRef.current = true;
    refreshChecklistBadge();
    if (db.isConnected() && root) {
      Promise.all([db.fetchChecks(), db.fetchFeedback()])
        .then(([checks, feedback]) => {
          mergeRemoteChecks(root, checks);
          mergeRemoteFeedback(root, feedback);
          refreshChecklistBadge();
        })
        .catch(() => {});
    }
  }, [onChecklistChange, onFeedbackToggle, buildNavFromDom, refreshChecklistBadge]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const content = await fetchTripContent();
        if (cancelled) return;
        const html = sanitizeHtml(await marked.parse(content.markdown.value));
        setPlanHtml(html);
        setDaysData(content.days.value);
        setPlacesData(content.places.value);
        setContentMeta([content.markdown.meta, content.days.meta, content.places.meta]);
        const date = resolveSelectedDay(content.days.value, window.location.search, window.location.hash);
        setSelectedDateState(date);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    })();
    loadWeather()
      .then((w) => {
        if (!cancelled) setWeather(w);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setWeatherLoading(false);
      });
    db.init().then((ok) => setFamilyConnected(ok));
    const off = db.on('status', (p: unknown) => {
      const s = p as { connected?: boolean };
      setFamilyConnected(!!s.connected);
    });
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  useEffect(() => {
    if (!planHtml || enhancedRef.current) return;
    enhancedRef.current = false;
    requestAnimationFrame(() => runEnhance());
  }, [planHtml, runEnhance]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    root.querySelectorAll('.day-block').forEach((el) => {
      el.classList.toggle('day-hidden', dayFilter && (el as HTMLElement).dataset.day !== selectedDate);
    });
    root.querySelectorAll('.day-block').forEach((el) => el.classList.remove('day-current'));
    const id = dayAnchors[selectedDate];
    if (id) document.getElementById(id)?.classList.add('day-current');
    refreshChecklistBadge();
  }, [dayFilter, selectedDate, dayAnchors, planHtml, refreshChecklistBadge]);

  const setSelectedDate = useCallback(
    (date: string) => {
      if (!daysData) return;
      setSelectedDateState(date);
      pickDay(daysData, date);
      try {
        const u = new URL(window.location.href);
        u.searchParams.set('day', date);
        window.history.replaceState(null, '', u.pathname + u.search + u.hash);
      } catch {
        /* ignore */
      }
    },
    [daysData]
  );

  const jumpToPlanDay = useCallback(
    (date: string) => {
      const id = dayAnchors[date];
      if (!id) {
        showToast('Kein Anker im Plan');
        return;
      }
      setSelectedDate(date);
      window.location.hash = '#/plan';
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    },
    [dayAnchors, setSelectedDate, showToast]
  );

  const cycleDay = useCallback(
    (delta: number) => {
      if (!daysData) return;
      setSelectedDate(cycleDayDate(daysData, selectedDate, delta));
    },
    [daysData, selectedDate, setSelectedDate]
  );

  const value = useMemo<AppState>(
    () => ({
      loading,
      error,
      daysData,
      placesData,
      selectedDate,
      selectedDay,
      dayFilter,
      weather,
      weatherLoading,
      theme,
      planHtml,
      contentMeta,
      navGroups,
      dayAnchors,
      sectionToId,
      checklistCount,
      familyConnected,
      familyName: db.getMemberName(),
      pendingSync: db.getPendingCount(),
      toast,
      contentRef,
      setSelectedDate,
      setDayFilter: (on: boolean) => {
        setDayFilterState(on);
        setDayFilter(on);
      },
      toggleTheme: () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setThemeState(next);
        setTheme(next);
      },
      showToast,
      refreshChecklistBadge,
      jumpToPlanDay,
      cycleDay
    }),
    [
      loading,
      error,
      daysData,
      placesData,
      selectedDate,
      selectedDay,
      dayFilter,
      weather,
      weatherLoading,
      theme,
      planHtml,
      contentMeta,
      navGroups,
      dayAnchors,
      sectionToId,
      checklistCount,
      familyConnected,
      toast,
      setSelectedDate,
      theme,
      showToast,
      refreshChecklistBadge,
      jumpToPlanDay,
      cycleDay
    ]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
