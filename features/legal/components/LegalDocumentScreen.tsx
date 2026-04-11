import Link from 'next/link';
import styles from './LegalDocumentScreen.module.css';

interface LegalDocumentSection {
  title: string;
  body: string[];
}

interface LegalDocumentScreenProps {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalDocumentSection[];
}

export function LegalDocumentScreen({
  eyebrow,
  title,
  description,
  sections,
}: LegalDocumentScreenProps) {
  return (
    <main className={`app-page ${styles.page}`}>
      <div className={`app-container ${styles.container}`}>
        <section className={`app-shell ${styles.shell}`}>
          <header className={styles.hero}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>
            <div className={styles.linkRow}>
              <Link href="/service-intro" className={styles.linkButton}>
                서비스 소개
              </Link>
              <Link href="/privacy" className={styles.linkButton}>
                개인정보처리방침
              </Link>
              <Link href="/terms" className={styles.linkButton}>
                이용약관
              </Link>
            </div>
          </header>

          <div className={styles.content}>
            {sections.map((section) => (
              <section key={section.title} className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <div className={styles.sectionBody}>
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
