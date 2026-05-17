const ALLOWED_ATTR_PREFIXES = ['aria-', 'data-'];
const ALLOWED_ATTRS = new Set([
  'alt',
  'class',
  'colspan',
  'href',
  'id',
  'rel',
  'rowspan',
  'src',
  'target',
  'title',
  'type'
]);
const URI_ATTRS = new Set(['href', 'src']);

function isSafeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return true;
  try {
    const url = new URL(trimmed, window.location.origin);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function sanitizeHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.body.querySelectorAll('script, iframe, object, embed, form, input:not([type="checkbox"]), button, style, link, meta').forEach((el) => {
    el.remove();
  });

  doc.body.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const allowed = ALLOWED_ATTRS.has(name) || ALLOWED_ATTR_PREFIXES.some((prefix) => name.startsWith(prefix));
      if (!allowed || name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if (URI_ATTRS.has(name) && !isSafeUrl(attr.value)) {
        el.removeAttribute(attr.name);
      }
    });
    if (el.tagName === 'A') {
      const a = el as HTMLAnchorElement;
      if (a.target === '_blank') a.rel = 'noopener noreferrer';
    }
  });

  return doc.body.innerHTML;
}
