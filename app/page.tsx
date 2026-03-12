import Link from 'next/link';
import styles from './page.module.css';

const ENTRY_POINTS = [
  {
    href: '/site-overview',
    title: '전경 점검표 작성',
    description:
      '현장 전경 사진을 등록하고 사망사고 다발 기인물 체크표를 검토합니다.',
  },
  {
    href: '/hazard-demo',
    title: '위험성평가 보고서 작성',
    description:
      '위험요인 사진을 보고서 형식으로 정리하고 조치 사항을 수정합니다.',
  },
];

export default function HomePage() {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell print:hidden">
          <div className={styles.hero}>
            <p className={styles.heroKicker}>
              Korea Safety Administration
            </p>
            <h1 className={styles.heroTitle}>한국종합안전 업무 시스템</h1>
            <p className={styles.heroDescription}>
              현장 사진을 기준으로 전경 점검표와 위험성평가 보고서를 작성,
              검토, 출력하는 문서 중심 운영 화면입니다.
            </p>
          </div>

          <div className={styles.entryGrid}>
            {ENTRY_POINTS.map((entry) => (
              <Link key={entry.href} href={entry.href} className={styles.entryCard}>
                <p className={styles.entryTitle}>{entry.title}</p>
                <p className={styles.entryDescription}>{entry.description}</p>
                <span className={styles.entryLink}>화면 열기</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
