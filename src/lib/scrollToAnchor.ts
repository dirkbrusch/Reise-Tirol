export function scrollToAnchor(id: string, behavior: ScrollBehavior = 'smooth'): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: 'start' });
  return true;
}

export function anchorIdFromHref(href: string | null | undefined): string | null {
  if (!href || !href.startsWith('#')) return null;
  const id = href.slice(1).split('?')[0];
  return id || null;
}