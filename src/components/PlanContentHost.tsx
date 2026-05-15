import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

/** Hält den Plan-DOM-Knoten; PlanView dockt ihn per appendChild an. */
export function PlanContentHost() {
  const { planHtml, contentRef, dayFilter } = useApp();
  const hiddenRef = useRef<HTMLDivElement>(null);
  const loc = useLocation();
  const onPlan = loc.pathname === '/plan';

  useEffect(() => {
    const node = contentRef.current;
    const hidden = hiddenRef.current;
    if (!node || !hidden) return;
    if (!onPlan && node.parentElement !== hidden) {
      hidden.appendChild(node);
    }
  }, [onPlan, planHtml, contentRef]);

  if (!planHtml) return null;

  return (
    <div
      ref={hiddenRef}
      className="plan-content-hidden"
      aria-hidden={onPlan ? undefined : true}
      hidden={onPlan}
    >
      <article
        id="content"
        className={'content' + (dayFilter ? ' day-filter-active' : '')}
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: planHtml }}
      />
    </div>
  );
}
