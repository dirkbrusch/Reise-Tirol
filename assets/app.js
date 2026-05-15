
// Section grouping with icons
const SECTION_GROUPS = [
  {title:"Übersicht",icon:"📍",sections:["A","B"]},
  {title:"Genuss & Kulinarik",icon:"🍽️",sections:["C","J"]},
  {title:"Aktivitäten",icon:"🥾",sections:["D","I"]},
  {title:"Mobilität & Versorgung",icon:"🚌",sections:["E","F","G"]},
  {title:"Ausflüge & Events",icon:"🏰",sections:["H","K"]},
  {title:"Praxis & Programme",icon:"📋",sections:["L","M"]},
  {title:"Quellen & Anhang",icon:"📚",sections:["N","ZUSATZLISTEN","ANHANG_CHECK","ANHANG_DETAIL","FAZIT"]}
];

const SECTION_ICONS = {
  "A":"🗺️","B":"🏘️","C":"🍴","D":"🥾","E":"🚠","F":"🚌","G":"🛒","H":"🏛️",
  "I":"☀️","J":"🧀","K":"📅","L":"💡","M":"🗓️","N":"🔗",
  "ZUSATZLISTEN":"⭐","ANHANG_CHECK":"✅","ANHANG_DETAIL":"📑","FAZIT":"🎯"
};

const QUICK_LINKS = [
  {icon:"🥾",title:"Wanderungen",desc:"Kurz · Tagestouren · Gipfel",section:"D"},
  {icon:"🚠",title:"Bergbahnen",desc:"Schatzberg, Markbachjoch & Umkreis",section:"E"},
  {icon:"🍴",title:"Restaurants & Almen",desc:"Alle Orte des Tals",section:"C"},
  {icon:"☀️",title:"Sommer-Aktivitäten",desc:"Bäder, Bike, Paragliding",section:"I"},
  {icon:"🏰",title:"Ausflugsziele",desc:"Kufstein, Achensee, Innsbruck",section:"H"},
  {icon:"🗓️",title:"Tagesprogramme",desc:"2 / 3 / 5 / 7 Tage",section:"M"}
];

function slugify(text){
  return text.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^\w\s-]/g,'')
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-')
    .replace(/^-|-$/g,'')
    .substring(0,80);
}

function getSectionLetter(text){
  // Match "ABSCHNITT A · ..." or "ABSCHNITT D · Wanderungen"
  const m = text.match(/^ABSCHNITT\s+([A-Z])\b/i);
  if(m) return m[1].toUpperCase();
  if(/^ZUSATZLISTEN/i.test(text)) return "ZUSATZLISTEN";
  if(/^ANHANG\s*·\s*Reiseplanungs/i.test(text)) return "ANHANG_CHECK";
  if(/^ANHANG\s*·\s*Detail/i.test(text)) return "ANHANG_DETAIL";
  if(/^ANHANG\b/i.test(text)) return "ANHANG_DETAIL";
  if(/^FAZIT/i.test(text)) return "FAZIT";
  return null;
}

function cleanHeadingText(text){
  // Remove markdown emoji indicators and "ABSCHNITT X · " prefix
  return text
    .replace(/^#+\s*/,'')
    .replace(/^ABSCHNITT\s+[A-Z]\s*·\s*/i,'')
    .replace(/^[🚨🔝📍🌧️🍽️⛰️🗓️✅]+\s*/u,'')
    .trim();
}

async function load(){
  try{
    const res = await fetch('reiseplan.md');
    if(!res.ok) throw new Error('HTTP '+res.status);
    const md = await res.text();
    marked.setOptions({gfm:true,breaks:false,headerIds:false,mangle:false});
    const html = marked.parse(md);
    const content = document.getElementById('content');
    content.innerHTML = html;
    enhanceContent();
    buildNav();
    buildQuickLinks();
    setupScrollSpy();
    setupSearch();
    handleHash();
  } catch(err){
    document.getElementById('content').innerHTML =
      '<div class="loading">⚠️ Fehler beim Laden: '+err.message+'</div>';
  }
}

function enhanceContent(){
  const content = document.getElementById('content');

  // 1. Map-link badges: Google Maps and Komoot links
  content.querySelectorAll('a[href*="google.com/maps"]').forEach(a => {
    a.classList.add('map-link');
    a.target = '_blank';
    a.rel = 'noopener';
  });
  content.querySelectorAll('a[href*="komoot."]').forEach(a => {
    a.classList.add('map-link','komoot-link');
    a.target = '_blank';
    a.rel = 'noopener';
  });
  content.querySelectorAll('a[href*="wildschoenau.com/de/touren"]').forEach(a => {
    a.classList.add('map-link','tour-link');
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // 2. List items that contain only map-links → tighten layout
  content.querySelectorAll('li').forEach(li => {
    const txt = li.textContent.trim();
    if(/^[🗺️📍]/u.test(txt)){
      li.classList.add('map-row');
    }
  });

  // 3. Tour stats detection: list items like "10 km · 3 h · 310 hm · leicht-mittel"
  // These appear in D.2 narrative hikes as the FIRST <li> after a <strong> heading
  content.querySelectorAll('li').forEach(li => {
    if(li.children.length > 0) return; // only plain text li
    const txt = li.textContent.trim();
    // Match pattern: contains "km" AND ("h" or "Min") AND optionally "hm"
    // Examples: "Strecke: ~10 km hin/zurück · Gehzeit: 3 h · hm: 310 · Schwierigkeit: leicht"
    //           "8,2 km · 3 h · 271 hm · leicht-mittel"
    //           "~12 km · 4 h · 450 hm · leicht-mittel"
    const hasKm = /\d[\d,.]*\s*km/i.test(txt);
    const hasZeit = /\d[\d:.,]*\s*(?:h\b|Std|Min)/i.test(txt);
    if(!hasKm || !hasZeit) return;
    if(txt.length > 200) return; // skip long descriptions

    // Try to extract pieces
    const parts = [];
    const kmMatch = txt.match(/(?:~?\s*\d[\d,.]*\s*(?:–\s*\d[\d,.]*\s*)?km(?:\s*hin\/zur[üu]ck|\s*one[- ]way|\s*Anstieg|\s*Abstieg)?)/i);
    if(kmMatch) parts.push({cls:'km',label:'📏 '+kmMatch[0].replace(/^Strecke:\s*/i,'').trim()});

    const zeitMatch = txt.match(/(?:\d[\d:.,]*\s*(?:–\s*\d[\d:.,]*\s*)?(?:h\b|Std\.?|Stunden|Min\.?))/i);
    if(zeitMatch) parts.push({cls:'zeit',label:'⏱️ '+zeitMatch[0].replace(/^Gehzeit:\s*/i,'').trim()});

    const hmMatch = txt.match(/(?:hm:\s*)?(\d[\d.,]*(?:\s*hm[↑↓]?(?:\s*\/\s*\d[\d.,]*\s*hm[↑↓]?)?|\s*Höhenmeter|\s*hm))/i);
    if(hmMatch && hmMatch[0].toLowerCase().includes('hm')) parts.push({cls:'hm',label:'⛰️ '+hmMatch[0].replace(/^hm:\s*/i,'').trim()});

    const diffMatch = txt.match(/(?:Schwierigkeit:\s*)?(leicht(?:-mittel)?|mittel(?:-schwer)?|schwer)\b/i);
    if(diffMatch) parts.push({cls:'diff',label:'🎯 '+diffMatch[1]});

    if(parts.length >= 2){
      // Replace the li content with stat pills
      const statContainer = document.createElement('div');
      statContainer.className = 'tour-stats';
      parts.forEach(p => {
        const span = document.createElement('span');
        span.className = 'stat '+p.cls;
        span.textContent = p.label;
        statContainer.appendChild(span);
      });
      li.replaceWith(statContainer);
    }
  });

  // 3b. Auto-Maps badges next to Austrian phone numbers
  // Heuristic: find phone pattern "+43 ..." in text nodes, find nearest preceding <strong>
  // in the same parent block, and append a small 📍 Maps link.
  const phoneRegex = /\+43\s?\d[\d\s\-/]{6,}/g;
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while(node = walker.nextNode()){
    if(node.parentElement.closest('a, .map-link, code, pre')) continue;
    if(phoneRegex.test(node.nodeValue)) textNodes.push(node);
    phoneRegex.lastIndex = 0;
  }
  textNodes.forEach(tn => {
    const parent = tn.parentElement;
    // Find context: prefer text content of nearest <strong> ancestor or preceding strong sibling
    let context = '';
    const block = parent.closest('li, td, p, h3, h4') || parent;
    const strong = block.querySelector('strong');
    if(strong) context = strong.textContent.trim();
    if(!context) context = block.textContent.split(/[(–·,]/)[0].trim().substring(0,60);
    if(!context || context.length < 3) return;
    // Add "Wildschönau" hint if not already there
    let query = context;
    if(!/wild(sch[oö]nau|kaiser|en\s*kaiser)|kufstein|w[oö]rgl|alpbach|kitzb|innsbruck|kramsach|rattenberg|achensee/i.test(context)){
      query += ' Wildschönau';
    }
    // Avoid duplicate: skip if a map-link already exists in this block
    if(block.querySelector('a.maps-quick, a[href*="google.com/maps"]')) return;
    const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
    const badge = document.createElement('a');
    badge.href = mapsUrl;
    badge.target = '_blank';
    badge.rel = 'noopener';
    badge.className = 'map-link maps-quick';
    badge.innerHTML = '📍 Karte';
    badge.title = 'In Google Maps: ' + query;
    // Insert AFTER the phone number text node
    const m = tn.nodeValue.match(phoneRegex);
    if(!m) return;
    // Split text node so badge appears right after the phone
    const phoneMatch = tn.nodeValue.match(phoneRegex);
    if(!phoneMatch) return;
    const idx = tn.nodeValue.indexOf(phoneMatch[0]) + phoneMatch[0].length;
    const after = tn.splitText(idx);
    after.parentNode.insertBefore(document.createTextNode(' '), after);
    after.parentNode.insertBefore(badge, after);
    phoneRegex.lastIndex = 0;
  });

  // 4. Tip blockquotes (💡 prefix) get tip styling
  content.querySelectorAll('blockquote').forEach(bq => {
    const txt = bq.textContent.trim();
    if(/^💡|^\s*Tipp\b/iu.test(txt)){
      bq.classList.add('tip');
    }
  });

  // 4b. Checklist items: marked v12 erzeugt für "- [ ] text" => <li><input type="checkbox" disabled>text</li>
  // Wir entfernen `disabled`, hängen IDs an, verkabeln localStorage.
  const checkState = loadChecklistState();
  let taskCounter = 0;
  content.querySelectorAll('li > input[type="checkbox"]').forEach(cb => {
    const li = cb.parentElement;
    if(!li || li.tagName !== 'LI') return;
    li.classList.add('task-item');
    cb.disabled = false;
    // Stabile ID: nächstgelegener H1 + lfd. Nummer + Texthash
    const h1 = findPrecedingH1(li);
    const sectionId = h1 ? h1.id : 'root';
    const text = li.textContent.trim().substring(0, 80);
    const id = 'ck-' + sectionId + '-' + (++taskCounter) + '-' + simpleHash(text);
    cb.dataset.taskId = id;
    cb.dataset.taskSection = h1 ? cleanHeadingText(h1.textContent.replace(/#$/,'')) : 'Allgemein';
    cb.dataset.taskText = text;
    // Verbleibender Text in einen span (für strike-through)
    const labelSpan = document.createElement('span');
    labelSpan.className = 'task-label';
    while(cb.nextSibling){ labelSpan.appendChild(cb.nextSibling); }
    li.appendChild(labelSpan);
    if(checkState[id]){
      cb.checked = true;
      li.classList.add('done');
    }
    cb.addEventListener('change', () => {
      onChecklistToggle(cb, id, li);
    });
  });
  updateChecklistBadge();

  // 4c. Feedback-Buttons (👍/👎) an H3 anhängen
  const fbState = loadFeedbackState();
  content.querySelectorAll('h3').forEach(h3 => {
    if(h3.querySelector('.feedback-bar')) return;
    const id = h3.id || ('fb-'+simpleHash(h3.textContent));
    const bar = document.createElement('span');
    bar.className = 'feedback-bar';
    bar.innerHTML = '<button class="feedback-btn" data-vote="up" title="Hat uns gefallen">👍</button>'+
                    '<button class="feedback-btn" data-vote="down" title="Eher nicht">👎</button>';
    h3.appendChild(bar);
    const current = fbState[id];
    bar.querySelectorAll('.feedback-btn').forEach(btn => {
      if(current === btn.dataset.vote) btn.classList.add('active');
      btn.addEventListener('click', e => {
        e.preventDefault();
        onFeedbackToggle(id, bar, btn.dataset.vote);
      });
    });
  });

  // 5. Add icons + persist section letter to data-attr (used later by buildNav)
  content.querySelectorAll('h1').forEach(h1 => {
    const letter = getSectionLetter(h1.textContent.trim());
    if(letter){
      h1.setAttribute('data-section', letter);
      if(SECTION_ICONS[letter]) h1.setAttribute('data-icon', SECTION_ICONS[letter]);
      // Strip "ABSCHNITT X · " prefix from displayed text
      const firstNode = h1.firstChild;
      if(firstNode && firstNode.nodeType === Node.TEXT_NODE){
        firstNode.textContent = firstNode.textContent.replace(/^ABSCHNITT\s+[A-Z]\s*·\s*/i,'').trim();
      }
    }
  });
}

function buildNav(){
  const content = document.getElementById('content');
  const headings = content.querySelectorAll('h1, h2');
  const nav = document.getElementById('nav');
  const used = new Set();

  // First, assign IDs to all headings
  headings.forEach(h => {
    let id = slugify(h.textContent);
    let n = 1;
    while(used.has(id)){id = slugify(h.textContent)+'-'+(++n)}
    used.add(id);
    h.id = id;
    // Add anchor / share button
    const anchor = document.createElement('a');
    anchor.href = '#'+id;
    anchor.className = 'heading-anchor share-btn';
    anchor.textContent = '#';
    anchor.title = 'Link kopieren';
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const url = location.origin + location.pathname + '#' + id;
      copyToClipboard(url, 'Link kopiert');
      history.replaceState(null, '', '#'+id);
    });
    h.appendChild(anchor);
  });

  // Group H1s by SECTION_GROUPS
  const sectionMap = {};
  headings.forEach(h => {
    if(h.tagName !== 'H1') return;
    const letter = h.getAttribute('data-section') || getSectionLetter(h.textContent.replace(/#$/,'').trim());
    if(letter){
      sectionMap[letter] = sectionMap[letter] || [];
      sectionMap[letter].push(h);
    }
  });

  // Build nav HTML
  nav.innerHTML = '';
  SECTION_GROUPS.forEach(group => {
    const groupSections = group.sections.filter(s => sectionMap[s]);
    if(groupSections.length === 0) return;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'nav-group';
    groupDiv.innerHTML = `<div class="nav-group-title">${group.icon} ${group.title}</div>`;

    groupSections.forEach(letter => {
      sectionMap[letter].forEach(h1 => {
        const a = document.createElement('a');
        a.href = '#'+h1.id;
        const cleanText = cleanHeadingText(h1.textContent.replace(/#$/,''));
        const icon = SECTION_ICONS[letter] || '📌';
        a.innerHTML = `<span class="nav-icon">${icon}</span><span>${cleanText}</span>`;
        groupDiv.appendChild(a);

        // Add H2s as sub-items (within this section, until next H1)
        let next = h1.nextElementSibling;
        while(next && next.tagName !== 'H1'){
          if(next.tagName === 'H2'){
            const sub = document.createElement('a');
            sub.href = '#'+next.id;
            sub.className = 'sub';
            sub.textContent = cleanHeadingText(next.textContent.replace(/#$/,''));
            groupDiv.appendChild(sub);
          }
          next = next.nextElementSibling;
        }
      });
    });

    nav.appendChild(groupDiv);
  });
}

function buildQuickLinks(){
  const grid = document.getElementById('quickGrid');
  const headings = document.querySelectorAll('#content h1');
  const sectionToId = {};
  headings.forEach(h => {
    const letter = h.getAttribute('data-section') || getSectionLetter(h.textContent.replace(/#$/,'').trim());
    if(letter && !sectionToId[letter]) sectionToId[letter] = h.id;
  });

  grid.innerHTML = QUICK_LINKS.map(l => {
    const id = sectionToId[l.section];
    if(!id) return '';
    return `<a class="quick-card" href="#${id}">
      <div class="quick-card-icon">${l.icon}</div>
      <div class="quick-card-title">${l.title}</div>
      <div class="quick-card-desc">${l.desc}</div>
    </a>`;
  }).join('');
}

function setupScrollSpy(){
  const navLinks = document.querySelectorAll('.nav a[href^="#"]');
  const headings = document.querySelectorAll('#content h1, #content h2');
  const topbarTitle = document.getElementById('topbarTitle');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        navLinks.forEach(l => {
          const isActive = l.getAttribute('href') === '#'+e.target.id;
          l.classList.toggle('active', isActive);
          if(isActive){
            const text = cleanHeadingText(e.target.textContent.replace(/#$/,''));
            topbarTitle.innerHTML = '<strong>'+text+'</strong>';
            // Auto-scroll active link into view in sidebar
            const navContainer = document.getElementById('nav');
            const linkRect = l.getBoundingClientRect();
            const navRect = navContainer.getBoundingClientRect();
            if(linkRect.top < navRect.top || linkRect.bottom > navRect.bottom){
              l.scrollIntoView({block:'nearest',behavior:'smooth'});
            }
          }
        });
      }
    });
  }, {rootMargin:'-15% 0px -75% 0px'});
  headings.forEach(h => observer.observe(h));

  // Close sidebar on link click (mobile)
  navLinks.forEach(l => l.addEventListener('click', () => {
    if(window.innerWidth <= 920) toggleSidebar(false);
  }));
}

function setupSearch(){
  const input = document.getElementById('searchInput');
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    const links = document.querySelectorAll('.nav a');
    const groups = document.querySelectorAll('.nav-group');
    links.forEach(a => {
      const txt = a.textContent.toLowerCase();
      a.classList.toggle('hidden', q && !txt.includes(q));
    });
    groups.forEach(g => {
      const visible = g.querySelectorAll('a:not(.hidden)').length;
      g.style.display = visible ? '' : 'none';
    });
  });
}

function toggleSidebar(force){
  const sb = document.getElementById('sidebar');
  if(typeof force === 'boolean'){
    sb.classList.toggle('open', force);
  } else {
    sb.classList.toggle('open');
  }
}

function toggleTheme(){
  const html = document.documentElement;
  const cur = html.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.getElementById('themeBtn').textContent = next === 'dark' ? '☀️' : '🌙';
}

// Init theme
(function(){
  const saved = localStorage.getItem('theme');
  if(saved){
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeBtn').textContent = saved === 'dark' ? '☀️' : '🌙';
  }
})();

// Back to top
window.addEventListener('scroll', () => {
  document.getElementById('backToTop').classList.toggle('visible', window.scrollY > 600);
});

function handleHash(){
  if(location.hash){
    const el = document.querySelector(location.hash);
    if(el) setTimeout(() => el.scrollIntoView({behavior:'smooth',block:'start'}), 150);
  }
}

// Close mobile sidebar on overlay click
document.addEventListener('click', e => {
  const sb = document.getElementById('sidebar');
  if(window.innerWidth <= 920 && sb.classList.contains('open')){
    if(!sb.contains(e.target) && !e.target.closest('.menu-toggle')){
      toggleSidebar(false);
    }
  }
});

// === Stufe 1: Checklisten ===
const CK_KEY = 'rt:check:v1';
function loadChecklistState(){
  try { return JSON.parse(localStorage.getItem(CK_KEY) || '{}'); } catch(e){ return {}; }
}
function saveChecklistState(state){
  try { localStorage.setItem(CK_KEY, JSON.stringify(state)); } catch(e){}
}
function updateChecklistBadge(){
  const state = loadChecklistState();
  const n = Object.keys(state).length;
  const badge = document.getElementById('checklistBadge');
  if(!badge) return;
  if(n > 0){ badge.textContent = n; badge.hidden = false; }
  else { badge.hidden = true; }
}
function openChecklistOverlay(){
  const overlay = document.getElementById('checklistOverlay');
  const body = document.getElementById('checklistBody');
  const state = loadChecklistState();
  const all = Array.from(document.querySelectorAll('#content li.task-item input[type="checkbox"]'));
  if(all.length === 0){
    body.innerHTML = '<p class="muted">Im Reiseplan stehen noch keine Häkchen-Listen. Markdown-Syntax: <code>- [ ] Eintrag</code>.</p>';
  } else {
    const grouped = {};
    all.forEach(cb => {
      const sec = cb.dataset.taskSection || 'Allgemein';
      (grouped[sec] = grouped[sec] || []).push(cb);
    });
    let html = '';
    Object.keys(grouped).forEach(sec => {
      html += '<div class="ck-group"><h3>'+escapeHtml(sec)+'</h3>';
      grouped[sec].forEach(cb => {
        const done = cb.checked;
        html += '<label class="ck-item '+(done?'done':'')+'">'+
                '<input type="checkbox" data-mirror="'+escapeHtml(cb.dataset.taskId)+'" '+(done?'checked':'')+'>'+
                '<span>'+escapeHtml(cb.dataset.taskText || '')+'</span></label>';
      });
      html += '</div>';
    });
    body.innerHTML = html;
    body.querySelectorAll('input[data-mirror]').forEach(mirror => {
      mirror.addEventListener('change', () => {
        const id = mirror.dataset.mirror;
        const orig = document.querySelector('#content input[type="checkbox"][data-task-id="'+id+'"]');
        if(orig){ orig.checked = mirror.checked; orig.dispatchEvent(new Event('change')); }
        mirror.closest('.ck-item').classList.toggle('done', mirror.checked);
      });
    });
  }
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeChecklistOverlay(){
  document.getElementById('checklistOverlay').hidden = true;
  document.body.style.overflow = '';
}
async function resetChecklist(){
  if(!confirm('Alle Häkchen wirklich zurücksetzen?')) return;
  const all = Array.from(document.querySelectorAll('#content li.task-item input[type="checkbox"]'));
  saveChecklistState({});
  all.forEach(cb => {
    cb.checked = false;
    cb.closest('li').classList.remove('done');
  });
  if(cloudEnabled()){
    for(const cb of all){
      try {
        await ReiseDB.saveCheck(cb.dataset.taskId, {
          checked: false,
          section: cb.dataset.taskSection,
          text: cb.dataset.taskText
        });
      } catch(e){}
    }
  }
  updateChecklistBadge();
  openChecklistOverlay();
}
function copyChecklistText(){
  const all = Array.from(document.querySelectorAll('#content li.task-item input[type="checkbox"]'));
  if(all.length === 0){ showToast('Keine Einträge.'); return; }
  const lines = ['Reiseplan-Checkliste'];
  const grouped = {};
  all.forEach(cb => {
    const sec = cb.dataset.taskSection || 'Allgemein';
    (grouped[sec] = grouped[sec] || []).push(cb);
  });
  Object.keys(grouped).forEach(sec => {
    lines.push('', '## '+sec);
    grouped[sec].forEach(cb => {
      lines.push('- ['+(cb.checked?'x':' ')+'] '+(cb.dataset.taskText||''));
    });
  });
  copyToClipboard(lines.join('\n'), 'Liste kopiert');
}

// === Stufe 1: Feedback ===
const FB_KEY = 'rt:fb:v1';
function loadFeedbackState(){
  try { return JSON.parse(localStorage.getItem(FB_KEY) || '{}'); } catch(e){ return {}; }
}
function saveFeedbackState(state){
  try { localStorage.setItem(FB_KEY, JSON.stringify(state)); } catch(e){}
}

// === Familien-Sync (Supabase via ReiseDB) ===
function cloudEnabled(){
  return typeof ReiseDB !== 'undefined' && ReiseDB.isConnected();
}

function applyChecklistToDom(){
  const state = loadChecklistState();
  document.querySelectorAll('#content li.task-item input[type="checkbox"]').forEach(cb => {
    const id = cb.dataset.taskId;
    const on = !!state[id];
    cb.checked = on;
    const li = cb.closest('li');
    if(li) li.classList.toggle('done', on);
  });
  updateChecklistBadge();
}

function applyFeedbackToDom(){
  const state = loadFeedbackState();
  document.querySelectorAll('#content h3 .feedback-bar').forEach(bar => {
    const h3 = bar.closest('h3');
    if(!h3) return;
    const id = h3.id || ('fb-'+simpleHash(h3.textContent));
    const vote = state[id];
    bar.querySelectorAll('.feedback-btn').forEach(b => {
      b.classList.toggle('active', vote === b.dataset.vote);
    });
  });
}

function mergeRemoteChecks(rows){
  const state = loadChecklistState();
  (rows || []).forEach(r => {
    if(r.checked){
      state[r.task_id] = { t: r.task_text, s: r.section, d: Date.now(), by: r.updated_by };
    } else {
      delete state[r.task_id];
    }
  });
  saveChecklistState(state);
  applyChecklistToDom();
}

function mergeRemoteFeedback(rows){
  const me = (typeof ReiseDB !== 'undefined' && ReiseDB.getMemberName()) || '';
  const state = loadFeedbackState();
  (rows || []).forEach(r => {
    if(r.voter !== me) return;
    if(r.vote) state[r.item_id] = r.vote;
    else delete state[r.item_id];
  });
  saveFeedbackState(state);
  applyFeedbackToDom();
}

function onChecklistToggle(cb, id, li){
  const state = loadChecklistState();
  if(cb.checked){
    state[id] = { t: cb.dataset.taskText, s: cb.dataset.taskSection, d: Date.now() };
  } else {
    delete state[id];
  }
  saveChecklistState(state);
  if(li) li.classList.toggle('done', cb.checked);
  updateChecklistBadge();
  if(cloudEnabled()){
    ReiseDB.saveCheck(id, {
      checked: cb.checked,
      section: cb.dataset.taskSection,
      text: cb.dataset.taskText
    }).catch(() => showToast('Lokal gespeichert — Sync folgt'));
  }
}

function onFeedbackToggle(itemId, bar, vote){
  const state = loadFeedbackState();
  const next = state[itemId] === vote ? null : vote;
  if(next) state[itemId] = next;
  else delete state[itemId];
  saveFeedbackState(state);
  bar.querySelectorAll('.feedback-btn').forEach(b => {
    b.classList.toggle('active', state[itemId] === b.dataset.vote);
  });
  if(cloudEnabled()){
    ReiseDB.saveFeedback(itemId, next).catch(() => showToast('Lokal gespeichert — Sync folgt'));
  }
}

function updateFamilyUi(){
  const dot = document.getElementById('familySyncDot');
  const connected = document.getElementById('familyConnected');
  const form = document.getElementById('familyForm');
  const trip = (typeof ReiseDB !== 'undefined' && ReiseDB.getTrip()) || null;
  if(dot) dot.hidden = !trip;
  if(connected) connected.hidden = !trip;
  if(form) form.hidden = !!trip;
  if(trip){
    const t = document.getElementById('familyTripTitle');
    const c = document.getElementById('familyTripCode');
    const n = document.getElementById('familyMemberName');
    if(t) t.textContent = trip.title || '';
    if(c) c.textContent = trip.code || '';
    if(n) n.textContent = trip.name || '';
  }
}

function openFamilyOverlay(){
  const cfg = window.SUPABASE_CONFIG;
  const body = document.getElementById('familyBody');
  if(!cfg || !cfg.url){
    if(body) body.innerHTML = '<p class="muted">Cloud-Sync ist nicht konfiguriert.</p>';
  }
  const codeIn = document.getElementById('familyCodeInput');
  if(codeIn && cfg && cfg.defaultTripCode && !codeIn.value) codeIn.value = cfg.defaultTripCode;
  updateFamilyUi();
  document.getElementById('familyOverlay').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeFamilyOverlay(){
  document.getElementById('familyOverlay').hidden = true;
  document.body.style.overflow = '';
}

async function connectFamily(e){
  if(e) e.preventDefault();
  const code = (document.getElementById('familyCodeInput').value || '').trim();
  const name = (document.getElementById('familyNameInput').value || '').trim();
  if(!code || !name){ showToast('Code und Name eingeben'); return; }
  try {
    await ReiseDB.connectTrip(code, name);
    const checks = await ReiseDB.fetchChecks();
    const feedback = await ReiseDB.fetchFeedback();
    mergeRemoteChecks(checks);
    mergeRemoteFeedback(feedback);
    updateFamilyUi();
    showToast('Mit Familie verbunden');
    closeFamilyOverlay();
  } catch(err){
    showToast('Verbindung fehlgeschlagen: ' + err.message);
  }
}

function disconnectFamily(){
  if(typeof ReiseDB !== 'undefined') ReiseDB.disconnectTrip();
  updateFamilyUi();
  showToast('Verbindung getrennt');
}

async function initFamilySync(){
  if(typeof ReiseDB === 'undefined') return;
  ReiseDB.on('checks', payload => {
    const row = payload.new || payload.old;
    if(!row || !row.task_id) return;
    if(payload.eventType === 'DELETE' || !row.checked){
      const state = loadChecklistState();
      delete state[row.task_id];
      saveChecklistState(state);
    } else {
      const state = loadChecklistState();
      state[row.task_id] = { t: row.task_text, s: row.section, d: Date.now(), by: row.updated_by };
      saveChecklistState(state);
    }
    applyChecklistToDom();
  });
  ReiseDB.on('feedback', payload => {
    const row = payload.new || payload.old;
    if(!row || !row.item_id) return;
    const me = ReiseDB.getMemberName();
    if(row.voter && row.voter !== me) return;
    const state = loadFeedbackState();
    if(payload.eventType === 'DELETE' || !row.vote) delete state[row.item_id];
    else state[row.item_id] = row.vote;
    saveFeedbackState(state);
    applyFeedbackToDom();
  });
  ReiseDB.on('status', () => updateFamilyUi());
  const ok = await ReiseDB.init();
  if(ok){
    try {
      mergeRemoteChecks(await ReiseDB.fetchChecks());
      mergeRemoteFeedback(await ReiseDB.fetchFeedback());
    } catch(e){ console.warn('Sync laden:', e.message); }
  }
  updateFamilyUi();
}

// === Stufe 1: Wetter (Open-Meteo, Auffach ca. 47.4253/11.9747) ===
const WX_KEY = 'rt:wx:v1';
const WX_TTL = 30 * 60 * 1000;
const WX_ICONS = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',
  45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌦️',
  61:'🌧️',63:'🌧️',65:'🌧️',
  71:'🌨️',73:'🌨️',75:'❄️',
  80:'🌦️',81:'🌧️',82:'⛈️',
  95:'⛈️',96:'⛈️',99:'⛈️'
};
async function loadWeather(){
  const slot = document.getElementById('heroWeather');
  if(!slot) return;
  try {
    const cached = JSON.parse(localStorage.getItem(WX_KEY) || 'null');
    if(cached && Date.now() - cached.ts < WX_TTL){
      renderWeather(cached.data);
      return;
    }
  } catch(e){}
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=47.4253&longitude=11.9747&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FVienna&forecast_days=3';
    const res = await fetch(url);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    try { localStorage.setItem(WX_KEY, JSON.stringify({ts:Date.now(), data})); } catch(e){}
    renderWeather(data);
  } catch(err){
    slot.innerHTML = '<div class="wx-error">Wetter nicht verfügbar</div>';
  }
}
function renderWeather(data){
  const slot = document.getElementById('heroWeather');
  if(!slot || !data || !data.daily) return;
  const d = data.daily;
  const fmt = new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'});
  let html = '';
  for(let i=0; i<d.time.length && i<3; i++){
    const date = new Date(d.time[i]);
    const label = i===0 ? 'Heute' : fmt.format(date);
    const icon = WX_ICONS[d.weather_code[i]] || '🌡️';
    const tmax = Math.round(d.temperature_2m_max[i]);
    const tmin = Math.round(d.temperature_2m_min[i]);
    const rain = d.precipitation_probability_max[i];
    html += '<div class="wx-day">'+
            '<div class="wx-day-label">'+label+'</div>'+
            '<div class="wx-day-icon">'+icon+'</div>'+
            '<div class="wx-day-temp">'+tmax+'°<span class="tmin">'+tmin+'°</span></div>'+
            '<div class="wx-day-rain">💧 '+(rain==null?'–':rain+'%')+'</div>'+
            '</div>';
  }
  slot.innerHTML = html;
}

// === Stufe 1: Utilities ===
function copyToClipboard(text, msg){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(() => showToast(msg||'Kopiert'), () => showToast('Kopieren fehlgeschlagen'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast(msg||'Kopiert'); }
    catch(e){ showToast('Kopieren fehlgeschlagen'); }
    document.body.removeChild(ta);
  }
}
let _toastTimer;
function showToast(msg){
  let el = document.getElementById('rtToast');
  if(!el){
    el = document.createElement('div');
    el.id = 'rtToast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('visible'), 1800);
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function simpleHash(s){
  let h = 0; for(let i=0;i<s.length;i++){ h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(36);
}
function findPrecedingH1(el){
  let cur = el;
  while(cur){
    if(cur.previousElementSibling){ cur = cur.previousElementSibling; }
    else if(cur.parentElement && cur.parentElement.id !== 'content'){ cur = cur.parentElement; continue; }
    else { return null; }
    if(cur.tagName === 'H1') return cur;
    const inner = cur.querySelector && cur.querySelector('h1');
    if(inner) return inner;
  }
  return null;
}

function parseAiErrorBody(raw){
  try{
    const j = JSON.parse(raw);
    const inner = j.error || j;
    let msg = inner.message || inner.type || '';
    if(!msg && typeof inner === 'string') msg = inner;
    msg = msg || raw.slice(0, 280);
    if(/cors|browser|not allowed for this Organization|CORS requests are not allowed/i.test(msg + raw)){
      msg += ' Hinweis: Manche Anbieter sperren API-Aufrufe aus dem Browser nach Organisations-Regeln — dann braucht es einen kleinen Server-Proxy.';
    }
    return msg;
  } catch(e){
    return raw.slice(0, 280);
  }
}

// === Stufe 2: Tagesplan ===
const DAY_KEY = 'rt:day';
const FILTER_KEY = 'rt:dayFilter';
let _daysData = null;
let _dayAnchors = {};

async function loadDays(){
  try {
    const res = await fetch('days.json');
    if(!res.ok) throw new Error('HTTP '+res.status);
    _daysData = await res.json();
  } catch(err){
    console.warn('days.json nicht geladen:', err.message);
    _daysData = null;
    return;
  }
  collectDayAnchors();
  validateDayAnchors();
  buildDayPicker();
  applySelectedDay(getSelectedDay());
  if(localStorage.getItem(FILTER_KEY) === '1'){
    const cb = document.getElementById('dayFilterToggle');
    if(cb){ cb.checked = true; }
    applyDayFilter(true);
  }
}

function collectDayAnchors(){
  // marked rendert HTML-Kommentare als <!-- day:... --> direkt in den DOM.
  // Wir finden sie via TreeWalker auf Kommentar-Knoten.
  _dayAnchors = {};
  const content = document.getElementById('content');
  if(!content) return;
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_COMMENT, null);
  let node;
  while(node = walker.nextNode()){
    const m = node.nodeValue && node.nodeValue.match(/\s*day:(\d{4}-\d{2}-\d{2})\s*/);
    if(m){
      // Anker = naechstes Element-Geschwister mit Inhalt (Paragraph mit Tagestitel)
      let target = node.nextSibling;
      while(target && target.nodeType !== Node.ELEMENT_NODE) target = target.nextSibling;
      if(target){
        const id = 'day-' + m[1];
        target.id = target.id || id;
        target.classList.add('day-block');
        target.dataset.day = m[1];
        _dayAnchors[m[1]] = target.id;
      }
    }
  }
}

function validateDayAnchors(){
  if(!_daysData) return;
  const missing = _daysData.days.filter(d => !_dayAnchors[d.date]).map(d => d.date);
  if(missing.length){
    console.warn('[days.json] Anker fehlen im reiseplan.md:', missing);
  }
}

function buildDayPicker(){
  if(!_daysData) return;
  const wrap = document.getElementById('dayPickerWrap');
  const sel = document.getElementById('dayPicker');
  if(!wrap || !sel) return;
  sel.innerHTML = _daysData.days.map(d => {
    const t = d.title ? ' · '+d.title : '';
    return '<option value="'+d.date+'">'+escapeHtml('Tag '+d.dayNumber+' · '+d.label+t)+'</option>';
  }).join('');
  wrap.hidden = false;
  sel.addEventListener('change', () => applySelectedDay(sel.value));
  const filter = document.getElementById('dayFilterToggle');
  if(filter){
    filter.addEventListener('change', () => {
      localStorage.setItem(FILTER_KEY, filter.checked ? '1' : '0');
      applyDayFilter(filter.checked);
    });
  }
}

function getSelectedDay(){
  if(!_daysData) return null;
  const params = new URLSearchParams(location.search);
  const qp = params.get('day');
  if(qp && /^\d{4}-\d{2}-\d{2}$/.test(qp) && _daysData.days.find(d => d.date === qp)) return qp;
  // Hash #day-YYYY-MM-DD (Kurzlink)
  const fromHash = location.hash.match(/^#day-(\d{4}-\d{2}-\d{2})(?:\b|$)/);
  if(fromHash && _daysData.days.find(d => d.date === fromHash[1])) return fromHash[1];
  const saved = localStorage.getItem(DAY_KEY);
  if(saved && _daysData.days.find(d => d.date === saved)){
    return saved;
  }
  const today = new Date().toISOString().slice(0,10);
  if(_daysData.days.find(d => d.date === today)) return today;
  // naechstgelegen
  const todayMs = Date.now();
  let best = _daysData.days[0];
  let bestDiff = Math.abs(new Date(best.date).getTime() - todayMs);
  for(const d of _daysData.days){
    const diff = Math.abs(new Date(d.date).getTime() - todayMs);
    if(diff < bestDiff){ best = d; bestDiff = diff; }
  }
  return best.date;
}

function applySelectedDay(date){
  if(!_daysData || !date) return;
  const day = _daysData.days.find(d => d.date === date);
  if(!day) return;
  localStorage.setItem(DAY_KEY, date);
  const sel = document.getElementById('dayPicker');
  if(sel && sel.value !== date) sel.value = date;
  renderTodayCard(day);
  markCurrentDayInPlan(date);
  syncDayToUrl(date);
  if(document.body.classList.contains('day-filter-active')) applyDayFilter(true);
}

function syncDayToUrl(date){
  try{
    const u = new URL(window.location.href);
    if(date) u.searchParams.set('day', date);
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  }catch(e){}
}

function renderTodayCard(day){
  const card = document.getElementById('todayCard');
  if(!card) return;
  const today = new Date().toISOString().slice(0,10);
  const isToday = day.date === today;
  const label = isToday ? 'Heute · '+day.label : 'Gewählt · '+day.label;
  const highlights = (day.highlights||[]).slice(0,4).map(h => '<li>'+escapeHtml(h)+'</li>').join('');
  const dinner = day.dinner ? '<span class="pill">🍽️ '+escapeHtml(day.dinner.name)+(day.dinner.reserved?' ✓':'')+'</span>' : '';
  const reservations = (day.reservations||[]).map(r => '<span class="pill">📌 '+escapeHtml(r)+'</span>').join('');
  const anchorId = _dayAnchors[day.date];
  card.innerHTML =
    '<div class="today-card-head">'+
      '<span class="today-card-label">'+escapeHtml(label)+'</span>'+
      '<span class="today-card-date">Tag '+day.dayNumber+' von '+_daysData.days.length+'</span>'+
    '</div>'+
    '<div class="today-card-title">'+escapeHtml(day.title||'')+'</div>'+
    (highlights ? '<ul class="today-card-list">'+highlights+'</ul>' : '')+
    '<div class="today-card-meta">'+dinner+reservations+'</div>'+
    '<div class="today-card-actions">'+
      (anchorId ? '<button class="today-card-btn" onclick="jumpToDay(\''+day.date+'\')">Zum Tag im Plan</button>' : '')+
      '<button class="today-card-btn ghost" onclick="cycleDay(-1)">← Vortag</button>'+
      '<button class="today-card-btn ghost" onclick="cycleDay(1)">Folgetag →</button>'+
    '</div>';
  card.hidden = false;
}

function markCurrentDayInPlan(date){
  document.querySelectorAll('#content .day-block').forEach(el => el.classList.remove('day-current'));
  const id = _dayAnchors[date];
  if(id){
    const el = document.getElementById(id);
    if(el) el.classList.add('day-current');
  }
}

function jumpToDay(date){
  const id = _dayAnchors[date];
  if(!id){ showToast('Kein Anker im Plan'); return; }
  applySelectedDay(date);
  try{
    const u = new URL(window.location.href);
    u.searchParams.set('day', date);
    u.hash = '#'+id;
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  }catch(e){}
  const el = document.getElementById(id);
  if(el){
    el.scrollIntoView({behavior:'smooth', block:'start'});
  }
}

function cycleDay(delta){
  if(!_daysData) return;
  const cur = getSelectedDay();
  const idx = _daysData.days.findIndex(d => d.date === cur);
  if(idx < 0) return;
  const next = _daysData.days[Math.min(_daysData.days.length-1, Math.max(0, idx+delta))];
  applySelectedDay(next.date);
}

function jumpToToday(){
  if(!_daysData) return;
  const today = new Date().toISOString().slice(0,10);
  const exact = _daysData.days.find(d => d.date === today);
  if(exact){ applySelectedDay(exact.date); return; }
  // ausserhalb des Reisezeitraums -> naechstgelegen
  let best = _daysData.days[0], bestDiff = Infinity;
  for(const d of _daysData.days){
    const diff = Math.abs(new Date(d.date).getTime() - Date.now());
    if(diff < bestDiff){ best = d; bestDiff = diff; }
  }
  applySelectedDay(best.date);
  showToast('Heute liegt ausserhalb der Reise - naechster Tag gewaehlt');
}

function applyDayFilter(active){
  document.body.classList.toggle('day-filter-active', active);
  const all = Array.from(document.querySelectorAll('#content .day-block'));
  const cur = getSelectedDay();
  all.forEach(el => {
    el.classList.toggle('day-hidden', active && el.dataset.day !== cur);
  });
}

// === Stufe 3: PWA ===
let _deferredPrompt = null;
function setupPWA(){
  if(!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if(!newSW) return;
        newSW.addEventListener('statechange', () => {
          if(newSW.state === 'installed' && navigator.serviceWorker.controller){
            showUpdateBanner(newSW);
          }
        });
      });
    }).catch(err => console.warn('SW-Registrierung fehlgeschlagen:', err.message));
  });

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredPrompt = e;
    const btn = document.getElementById('installBtn');
    if(btn) btn.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    _deferredPrompt = null;
    const btn = document.getElementById('installBtn');
    if(btn) btn.hidden = true;
    showToast('Installiert');
  });

  const update = () => {
    const ind = document.getElementById('offlineIndicator');
    if(!ind) return;
    if(navigator.onLine){ ind.hidden = true; }
    else { ind.hidden = false; }
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}
function promptInstall(){
  if(!_deferredPrompt){ showToast('Installation nicht verfuegbar'); return; }
  _deferredPrompt.prompt();
  _deferredPrompt.userChoice.finally(() => { _deferredPrompt = null; const b=document.getElementById('installBtn'); if(b) b.hidden = true; });
}
function showUpdateBanner(newSW){
  let el = document.getElementById('rtUpdateBanner');
  if(el) return;
  el = document.createElement('div');
  el.id = 'rtUpdateBanner';
  el.className = 'update-banner';
  el.innerHTML = '<span>Neue Version verfuegbar.</span><button>Neu laden</button>';
  el.querySelector('button').addEventListener('click', () => {
    newSW.postMessage('skipWaiting');
    setTimeout(() => location.reload(), 200);
  });
  document.body.appendChild(el);
}
setupPWA();

// === Stufe 4: KI-Assistent (Bring-your-own-Key) ===
const AI_KEY_STORE = 'rt:aiKey';
const AI_PROVIDER_STORE = 'rt:aiProvider';
function toggleAiPanel(force){
  const p = document.getElementById('aiPanel');
  if(!p) return;
  const open = typeof force === 'boolean' ? force : p.hidden;
  p.hidden = !open;
  if(open){ renderAiSetup(); updateAiContext(); }
}
function renderAiSetup(){
  const hasKey = !!sessionStorage.getItem(AI_KEY_STORE);
  const provSel = document.getElementById('aiProvider');
  if(provSel){
    const p = sessionStorage.getItem(AI_PROVIDER_STORE) || 'openai';
    if(provSel.querySelector('option[value="'+p+'"]')) provSel.value = p;
  }
  document.getElementById('aiSetup').hidden = hasKey;
  document.getElementById('aiChat').hidden = !hasKey;
}
function saveAiKey(){
  const k = document.getElementById('aiKeyInput').value.trim();
  if(!k){ showToast('Key fehlt'); return; }
  const provEl = document.getElementById('aiProvider');
  const prov = (provEl && provEl.value) || 'openai';
  sessionStorage.setItem(AI_KEY_STORE, k);
  sessionStorage.setItem(AI_PROVIDER_STORE, prov);
  document.getElementById('aiKeyInput').value = '';
  renderAiSetup();
  showToast('Key gespeichert (nur diese Session)');
}
function clearAiKey(){
  sessionStorage.removeItem(AI_KEY_STORE);
  renderAiSetup();
  showToast('Key entfernt');
}
function getCurrentSectionContext(){
  // Aktuell aktiver Nav-Link -> zugehöriges H1 + nachfolgender Text bis nächstes H1
  const active = document.querySelector('.nav a.active');
  let h1 = null;
  if(active){
    const id = active.getAttribute('href').replace('#','');
    const target = document.getElementById(id);
    if(target){
      h1 = target.closest('h1') || target.tagName === 'H1' ? target : findNearestH1Up(target);
    }
  }
  if(!h1){
    h1 = document.querySelector('#content h1');
  }
  if(!h1) return { title: '', text: '' };
  const title = cleanHeadingText(h1.textContent.replace(/#$/,''));
  let text = '';
  let node = h1.nextElementSibling;
  while(node && node.tagName !== 'H1'){
    text += (node.innerText || node.textContent || '') + '\n';
    if(text.length > 4500) break;
    node = node.nextElementSibling;
  }
  return { title, text: text.trim().slice(0, 4500) };
}
function findNearestH1Up(el){
  let cur = el;
  while(cur){
    if(cur.previousElementSibling){ cur = cur.previousElementSibling; if(cur.tagName === 'H1') return cur; }
    else { cur = cur.parentElement; if(!cur || cur.id === 'content') return null; }
  }
  return null;
}
function updateAiContext(){
  const ctx = document.getElementById('aiContext');
  if(!ctx) return;
  const { title } = getCurrentSectionContext();
  ctx.textContent = 'Kontext: ' + (title || 'Reiseplan');
}
function appendAiMsg(role, text){
  const m = document.getElementById('aiMessages');
  if(!m) return;
  const div = document.createElement('div');
  div.className = 'ai-msg ' + role;
  div.textContent = text;
  m.appendChild(div);
  m.scrollTop = m.scrollHeight;
  return div;
}
async function fetchAiCompletion(key, provider, system, userMsg){
  if(provider === 'anthropic'){
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1200,
        temperature: 0.3,
        system,
        messages: [{ role: 'user', content: userMsg }]
      })
    });
    const raw = await res.text();
    if(!res.ok) throw new Error(parseAiErrorBody(raw));
    const data = JSON.parse(raw);
    const block = data.content && data.content[0];
    return (block && block.type === 'text' && block.text) ? block.text : '(leere Antwort)';
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg }
      ]
    })
  });
  const raw = await res.text();
  if(!res.ok) throw new Error(parseAiErrorBody(raw));
  const data = JSON.parse(raw);
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '(leere Antwort)';
}
async function askAi(prompt){
  const key = sessionStorage.getItem(AI_KEY_STORE);
  if(!key){ renderAiSetup(); showToast('Bitte zuerst Key eintragen'); return; }
  const { title, text } = getCurrentSectionContext();
  updateAiContext();
  appendAiMsg('user', prompt);
  const pending = appendAiMsg('assistant', '…');
  const system = 'Du bist ein knapper Reise-Assistent fuer einen Reiseplan in der Wildschoenau/Tirol. '
    + 'Antworte auf Deutsch, in 5-8 Stichpunkten oder einem kurzen Absatz. '
    + 'Beziehe dich AUSSCHLIESSLICH auf den uebermittelten Plan-Auszug. Wenn etwas fehlt, sag es klar.';
  const userMsg = '## Plan-Abschnitt: ' + (title||'(unbenannt)') + '\n\n' + text + '\n\n---\n\nFrage: ' + prompt;
  try {
    const provider = sessionStorage.getItem(AI_PROVIDER_STORE) || 'openai';
    const answer = await fetchAiCompletion(key, provider, system, userMsg);
    pending.textContent = answer;
  } catch(err){
    pending.classList.remove('assistant'); pending.classList.add('error');
    pending.textContent = 'Fehler: ' + err.message;
  }
}
function sendAiPrompt(){
  const input = document.getElementById('aiInput');
  const txt = (input.value||'').trim();
  if(!txt) return;
  input.value = '';
  askAi(txt);
}

// === Stufe 4: Karte (Leaflet + OSM) ===
let _map = null;
let _placesData = null;
let _activeCategory = 'all';
const CATEGORY_META = {
  all:       { icon: '📍', label: 'Alle' },
  ort:       { icon: '🏘️', label: 'Orte' },
  bergbahn:  { icon: '🚠', label: 'Bergbahnen' },
  alm:       { icon: '🐄', label: 'Almen' },
  restaurant:{ icon: '🍴', label: 'Restaurants' },
  hotel:     { icon: '🛏️', label: 'Hotels' },
  ausflug:   { icon: '🏰', label: 'Ausflüge' },
  natur:     { icon: '🌲', label: 'Natur' },
  hofladen:  { icon: '🧀', label: 'Hofläden' }
};
async function ensurePlaces(){
  if(_placesData) return _placesData;
  try {
    const res = await fetch('places.json');
    if(!res.ok) throw new Error('HTTP '+res.status);
    _placesData = await res.json();
  } catch(err){
    console.warn('places.json nicht geladen:', err.message);
    _placesData = { places: [] };
  }
  return _placesData;
}
async function openMapOverlay(){
  const overlay = document.getElementById('mapOverlay');
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  const data = await ensurePlaces();
  buildMapFilters(data.places);
  setTimeout(() => { initMap(data.places); }, 60);
}
function closeMapOverlay(){
  document.getElementById('mapOverlay').hidden = true;
  document.body.style.overflow = '';
}

/** Reiseplan: Ziel-Anker (optional `planAnchor` = DOM-Id ohne #). */
function getPlanFragmentForPlace(p){
  const raw = p && typeof p.planAnchor === 'string' ? p.planAnchor.replace(/^#/,'').trim() : '';
  if(raw && /^[A-Za-z0-9_-]+$/.test(raw) && document.getElementById(raw)) return '#' + raw;
  const cat = ((p && p.category) ? String(p.category) : 'ort').toLowerCase();
  const letter =
    cat === 'bergbahn' ? 'E' :
    cat === 'alm' ? 'C' :
    cat === 'restaurant' ? 'C' :
    cat === 'hotel' ? 'B' :
    cat === 'ausflug' ? 'H' :
    cat === 'natur' ? 'D' :
    cat === 'hofladen' ? 'J' : 'B';
  const h = document.querySelector('#content h1[data-section="'+letter+'"]');
  return h && h.id ? '#' + h.id : '';
}

function jumpToPlanFromMap(fragment){
  if(!fragment || fragment === '#') return;
  closeMapOverlay();
  const id = fragment.replace(/^#/,'');
  setTimeout(() => {
    const el = document.getElementById(id);
    if(el){
      try { history.replaceState(null, '', fragment); } catch(e){}
      el.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }, 140);
}

function buildMapFilters(places){
  const wrap = document.getElementById('mapFilters');
  if(!wrap) return;
  const cats = new Set(['all']);
  places.forEach(p => cats.add(p.category || 'ort'));
  wrap.innerHTML = Array.from(cats).map(c => {
    const m = CATEGORY_META[c] || { icon: '📌', label: c };
    return '<button class="map-filter-btn'+(c===_activeCategory?' active':'')+'" data-cat="'+escapeHtml(c)+'">'+m.icon+' '+escapeHtml(m.label)+'</button>';
  }).join('');
  wrap.querySelectorAll('.map-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeCategory = btn.dataset.cat;
      wrap.querySelectorAll('.map-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === _activeCategory));
      refreshMapMarkers();
    });
  });
}
function initMap(places){
  const el = document.getElementById('mapCanvas');
  if(!el || typeof L === 'undefined'){
    if(el) el.innerHTML = '<div class="loading">Karte nicht verfügbar (Leaflet konnte nicht geladen werden)</div>';
    return;
  }
  if(!_map){
    _map = L.map(el, { scrollWheelZoom: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
    }).addTo(_map);
    _map._markerLayer = L.layerGroup().addTo(_map);
  }
  refreshMapMarkers();
  _map.invalidateSize();
}
function refreshMapMarkers(){
  if(!_map || !_placesData) return;
  _map._markerLayer.clearLayers();
  const filtered = _placesData.places.filter(p => _activeCategory === 'all' || p.category === _activeCategory);
  const latlngs = [];
  filtered.forEach(p => {
    if(typeof p.lat !== 'number' || typeof p.lon !== 'number') return;
    const m = CATEGORY_META[p.category||'ort'] || { icon: '📌' };
    const marker = L.marker([p.lat, p.lon], {
      icon: L.divIcon({
        className: 'rt-pin',
        html: '<div style="font-size:1.4rem;line-height:1;text-align:center">'+m.icon+'</div>',
        iconSize: [28,28],
        iconAnchor: [14,14]
      }),
      title: p.name
    });
    const frag = getPlanFragmentForPlace(p);
    const pid = frag && frag.length > 1 ? frag.slice(1) : '';
    const planBtn = pid && /^[A-Za-z0-9_-]+$/.test(pid)
      ? '<div class="map-popup-row"><button type="button" class="map-popup-btn" onclick="jumpToPlanFromMap(\'#'+pid+'\')">📄 Im Reiseplan</button></div>'
      : '';
    const popup = '<div class="map-popup"><strong>'+escapeHtml(p.name)+'</strong>'+
      (p.cashOnly ? '<div>💶 nur Bargeld</div>' : '')+
      planBtn+
      '<a href="https://www.openstreetmap.org/?mlat='+p.lat+'&mlon='+p.lon+'#map=15/'+p.lat+'/'+p.lon+'" target="_blank" rel="noopener">In OSM öffnen</a></div>';
    marker.bindPopup(popup);
    marker.addTo(_map._markerLayer);
    latlngs.push([p.lat, p.lon]);
  });
  if(latlngs.length){
    _map.fitBounds(latlngs, { padding: [40,40], maxZoom: 12 });
  }
}

document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    const ai = document.getElementById('aiPanel');
    const map = document.getElementById('mapOverlay');
    const fam = document.getElementById('familyOverlay');
    const ck = document.getElementById('checklistOverlay');
    if(ai && !ai.hidden){ toggleAiPanel(false); e.preventDefault(); return; }
    if(map && !map.hidden){ closeMapOverlay(); e.preventDefault(); return; }
    if(fam && !fam.hidden){ closeFamilyOverlay(); e.preventDefault(); return; }
    if(ck && !ck.hidden){ closeChecklistOverlay(); e.preventDefault(); return; }
  }
  if(e.key === 'Enter' && document.activeElement && document.activeElement.id === 'aiInput'){
    sendAiPrompt();
  }
});

load().then(() => {
  loadWeather();
  loadDays();
  initFamilySync();
});
