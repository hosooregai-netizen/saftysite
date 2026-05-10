'use client';

import type { ReactNode } from 'react';
import layoutStyles from '@/components/WebhardScreen.module.css';

export function WebhardLayout({
  content,
  detail,
  sidebar,
}: {
  content: ReactNode;
  detail: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <section className={layoutStyles.shell}>
      <div className={layoutStyles.pane}>{sidebar}</div>
      <div className={layoutStyles.pane}>{content}</div>
      <div className={layoutStyles.pane}>{detail}</div>
    </section>
  );
}
