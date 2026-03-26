import styles from '@/components/session/InspectionSessionWorkspace.module.css';

interface InfoTableProps {
  rows: Array<{ label: string; value: string }>;
  title: string;
}

export function InfoTable({ rows, title }: InfoTableProps) {
  return (
    <section className={styles.infoTable}>
      <div className={styles.infoTableHeader}>{title}</div>
      <div className={styles.infoTableBody}>
        {rows.map((row) => (
          <div key={row.label} className={styles.infoRow}>
            <div className={styles.infoLabel}>{row.label}</div>
            <div className={styles.infoValue}>{row.value || '미입력'}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

