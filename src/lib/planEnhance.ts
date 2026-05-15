import { getSectionLetter, cleanHeadingText, simpleHash } from './utils';
import { loadChecklistState, loadFeedbackState } from './storage';
import type { Vote } from './types';

export interface EnhanceHandlers {
  onChecklistChange: () => void;
  onFeedbackToggle: (itemId: string, bar: HTMLElement, vote: Vote) => void;
}

function findPrecedingH1(el: Element): HTMLElement | null {
  let cur: Element | null = el;
  while (cur) {
    if (cur.previousElementSibling) {
      cur = cur.previousElementSibling;
    } else if (cur.parentElement && cur.parentElement.id !== 'content') {
      cur = cur.parentElement;
      continue;
    } else return null;
    if (cur.tagName === 'H1') return cur as HTMLElement;
    const inner = cur.querySelector?.('h1');
    if (inner) return inner as HTMLElement;
  }
  return null;
}

export function enhanceContent(content: HTMLElement, handlers: EnhanceHandlers) {
  content.querySelectorAll('a[href*="google.com/maps"]').forEach((a) => {
    a.classList.add('map-link');
    (a as HTMLAnchorElement).target = '_blank';
    (a as HTMLAnchorElement).rel = 'noopener';
  });
  content.querySelectorAll('a[href*="komoot."]').forEach((a) => {
    a.classList.add('map-link', 'komoot-link');
    (a as HTMLAnchorElement).target = '_blank';
  });
  content.querySelectorAll('a[href*="wildschoenau.com/de/touren"]').forEach((a) => {
    a.classList.add('map-link', 'tour-link');
    (a as HTMLAnchorElement).target = '_blank';
  });

  content.querySelectorAll('li').forEach((li) => {
    if (/^[🗺️📍]/u.test(li.textContent?.trim() || '')) li.classList.add('map-row');
  });

  content.querySelectorAll('li').forEach((li) => {
    if (li.children.length > 0) return;
    const txt = li.textContent?.trim() || '';
    const hasKm = /\d[\d,.]*\s*km/i.test(txt);
    const hasZeit = /\d[\d:.,]*\s*(?:h\b|Std|Min)/i.test(txt);
    if (!hasKm || !hasZeit || txt.length > 200) return;
    const parts: { cls: string; label: string }[] = [];
    const kmMatch = txt.match(/(?:~?\s*\d[\d,.]*\s*(?:–\s*\d[\d,.]*\s*)?km(?:\s*hin\/zur[üu]ck|\s*one[- ]way|\s*Anstieg|\s*Abstieg)?)/i);
    if (kmMatch) parts.push({ cls: 'km', label: '📏 ' + kmMatch[0].replace(/^Strecke:\s*/i, '').trim() });
    const zeitMatch = txt.match(/(?:\d[\d:.,]*\s*(?:–\s*\d[\d:.,]*\s*)?(?:h\b|Std\.?|Stunden|Min\.?))/i);
    if (zeitMatch) parts.push({ cls: 'zeit', label: '⏱️ ' + zeitMatch[0].replace(/^Gehzeit:\s*/i, '').trim() });
    const hmMatch = txt.match(/(?:hm:\s*)?(\d[\d.,]*(?:\s*hm|\s*Höhenmeter))/i);
    if (hmMatch) parts.push({ cls: 'hm', label: '⛰️ ' + hmMatch[0].replace(/^hm:\s*/i, '').trim() });
    const diffMatch = txt.match(/(?:Schwierigkeit:\s*)?(leicht(?:-mittel)?|mittel(?:-schwer)?|schwer)\b/i);
    if (diffMatch) parts.push({ cls: 'diff', label: '🎯 ' + diffMatch[1] });
    if (parts.length >= 2) {
      const statContainer = document.createElement('div');
      statContainer.className = 'tour-stats';
      parts.forEach((p) => {
        const span = document.createElement('span');
        span.className = 'stat ' + p.cls;
        span.textContent = p.label;
        statContainer.appendChild(span);
      });
      li.replaceWith(statContainer);
    }
  });

  const phoneRegex = /\+43\s?\d[\d\s\-/]{6,}/g;
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('a, .map-link, code, pre')) continue;
    if (phoneRegex.test(node.nodeValue || '')) textNodes.push(node as Text);
    phoneRegex.lastIndex = 0;
  }
  textNodes.forEach((tn) => {
    const block = tn.parentElement?.closest('li, td, p, h3, h4') || tn.parentElement;
    if (!block) return;
    const strong = block.querySelector('strong');
    let context = strong?.textContent?.trim() || block.textContent?.split(/[(–·,]/)[0]?.trim().substring(0, 60) || '';
    if (!context || context.length < 3) return;
    if (!/wild(sch[oö]nau|kaiser)|kufstein|w[oö]rgl|innsbruck/i.test(context)) context += ' Wildschönau';
    if (block.querySelector('a.maps-quick, a[href*="google.com/maps"]')) return;
    const phoneMatch = tn.nodeValue?.match(phoneRegex);
    if (!phoneMatch) return;
    const badge = document.createElement('a');
    badge.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(context);
    badge.target = '_blank';
    badge.rel = 'noopener';
    badge.className = 'map-link maps-quick';
    badge.textContent = '📍 Karte';
    const idx = (tn.nodeValue?.indexOf(phoneMatch[0]) || 0) + phoneMatch[0].length;
    const after = tn.splitText(idx);
    after.parentNode?.insertBefore(document.createTextNode(' '), after);
    after.parentNode?.insertBefore(badge, after);
    phoneRegex.lastIndex = 0;
  });

  content.querySelectorAll('blockquote').forEach((bq) => {
    if (/^💡|^\s*Tipp\b/iu.test(bq.textContent?.trim() || '')) bq.classList.add('tip');
  });

  const checkState = loadChecklistState();
  let taskCounter = 0;
  content.querySelectorAll('li > input[type="checkbox"]').forEach((cb) => {
    const li = cb.parentElement;
    if (!li || li.tagName !== 'LI') return;
    li.classList.add('task-item');
    (cb as HTMLInputElement).disabled = false;
    const h1 = findPrecedingH1(li);
    const sectionId = h1?.id || 'root';
    const text = li.textContent?.trim().substring(0, 80) || '';
    const id = 'ck-' + sectionId + '-' + ++taskCounter + '-' + simpleHash(text);
    (cb as HTMLInputElement).dataset.taskId = id;
    (cb as HTMLInputElement).dataset.taskSection = h1 ? cleanHeadingText(h1.textContent?.replace(/#$/, '') || '') : 'Allgemein';
    (cb as HTMLInputElement).dataset.taskText = text;
    const labelSpan = document.createElement('span');
    labelSpan.className = 'task-label';
    while (cb.nextSibling) labelSpan.appendChild(cb.nextSibling);
    li.appendChild(labelSpan);
    if (checkState[id]) {
      (cb as HTMLInputElement).checked = true;
      li.classList.add('done');
    }
    cb.addEventListener('change', () => {
      handlers.onChecklistChange();
    });
  });

  const fbState = loadFeedbackState();
  content.querySelectorAll('h3').forEach((h3) => {
    if (h3.querySelector('.feedback-bar')) return;
    const id = h3.id || 'fb-' + simpleHash(h3.textContent || '');
    const bar = document.createElement('span');
    bar.className = 'feedback-bar';
    bar.innerHTML =
      '<button type="button" class="feedback-btn" data-vote="up" title="Hat uns gefallen">👍</button>' +
      '<button type="button" class="feedback-btn" data-vote="down" title="Eher nicht">👎</button>';
    h3.appendChild(bar);
    const current = fbState[id];
    bar.querySelectorAll('.feedback-btn').forEach((btn) => {
      const vote = (btn as HTMLElement).dataset.vote as Vote;
      if (current === vote) btn.classList.add('active');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handlers.onFeedbackToggle(id, bar as HTMLElement, vote);
      });
    });
  });

  content.querySelectorAll('h1').forEach((h1) => {
    const letter = getSectionLetter(h1.textContent?.trim() || '');
    if (letter) {
      h1.setAttribute('data-section', letter);
      const icon = { A: '🗺️', B: '🏘️', C: '🍴', D: '🥾', E: '🚠', F: '🚌', G: '🛒', H: '🏛️', I: '☀️', J: '🧀', K: '📅', L: '💡', M: '🗓️', N: '🔗', ZUSATZLISTEN: '⭐', ANHANG_CHECK: '✅', ANHANG_DETAIL: '📑', FAZIT: '🎯' }[letter];
      if (icon) h1.setAttribute('data-icon', icon);
      const firstNode = h1.firstChild;
      if (firstNode?.nodeType === Node.TEXT_NODE) {
        firstNode.textContent = (firstNode.textContent || '').replace(/^ABSCHNITT\s+[A-Z]\s*·\s*/i, '').trim();
      }
    }
  });
}

export function collectDayAnchors(content: HTMLElement): Record<string, string> {
  const anchors: Record<string, string> = {};
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_COMMENT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const m = node.nodeValue?.match(/\s*day:(\d{4}-\d{2}-\d{2})\s*/);
    if (!m) continue;
    let target: ChildNode | null = node.nextSibling;
    while (target && target.nodeType !== Node.ELEMENT_NODE) target = target.nextSibling;
    if (target && target instanceof HTMLElement) {
      const id = 'day-' + m[1];
      target.id = target.id || id;
      target.classList.add('day-block');
      target.dataset.day = m[1];
      anchors[m[1]] = target.id;
    }
  }
  return anchors;
}
