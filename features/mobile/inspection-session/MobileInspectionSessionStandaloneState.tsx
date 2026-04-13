'use client';

import type { ReactNode } from 'react';
import styles from '@/features/mobile/components/MobileShell.module.css';

export function MobileInspectionSessionStandaloneState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <main className="app-page">
      <div className={styles.pageShell}>
        <div className={styles.content}>
          <section className={styles.stateCard}>
            <div className={styles.sectionTitleWrap}>
              <span className={styles.sectionEyebrow}>모바일 보고서</span>
              <h1 className={styles.sectionTitle}>{title}</h1>
            </div>
            {description ? <p className={styles.inlineNotice}>{description}</p> : null}
            {action}
          </section>
        </div>
      </div>
    </main>
  );
}
