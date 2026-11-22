import type { ReactNode } from 'react';
import { Card } from './card';
import * as s from './detail-section.css';

/**
 * Standard shell for the small content cards on detail pages (warranty,
 * loans, events, metadata, ...). A fixed head (icon chip + title + optional
 * action slot) above a padded body; the body content is built from the
 * shared row vocabulary in `styles/detail.css.ts` (kv rows, list rows,
 * timeline rows, empty state, footer link).
 */
export function DetailSection({ icon, title, action, className, children }: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card
      className={[s.sectionCard, className].filter(Boolean).join(' ')}
      padded={false}
    >
      <header className={s.sectionHead}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>{icon}</span>
          {title}
        </h2>
        {action}
      </header>
      <div className={s.sectionBody}>{children}</div>
    </Card>
  );
}
