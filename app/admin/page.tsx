import { Suspense } from 'react';
import { AdminScreen } from '@/features/admin/components/AdminScreen';
import styles from '@/features/admin/components/AdminDashboardShell.module.css';

function AdminPageFallback() {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <div className={styles.contentColumn}>
            <header className={styles.hero}>
              <div className={styles.heroBody}>
                <div className={styles.heroMain}>
                  <h1 className={styles.heroTitle}>관리 대시보드</h1>
                </div>
              </div>
            </header>
            <div className={styles.pageGrid}>
              <section className={styles.contentStack}>
                <section className={styles.sectionCard}>
                  <div className={styles.sectionBody}>
                    <h2 className={styles.sectionTitle}>관리자 화면을 준비하고 있습니다.</h2>
                    <p>검색 파라미터와 초기 화면을 불러오는 중입니다.</p>
                  </div>
                </section>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <AdminScreen />
    </Suspense>
  );
}
