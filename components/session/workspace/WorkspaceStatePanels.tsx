'use client';

import Link from 'next/link';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

export function LoadingStatePanel() {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <div className={styles.statePanel}>
            <h1 className={styles.stateTitle}>보고서를 불러오는 중입니다.</h1>
            <p className={styles.stateDescription}>세션 데이터를 준비하고 있습니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export function MissingStatePanel() {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <div className={styles.statePanel}>
            <h1 className={styles.stateTitle}>보고서를 찾을 수 없습니다.</h1>
            <p className={styles.stateDescription}>
              삭제되었거나 아직 로드되지 않은 세션입니다.
            </p>
            <Link href="/" className="app-button app-button-primary">
              현장 목록으로 이동
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
