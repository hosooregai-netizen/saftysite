import styles from './AdminDashboardShell.module.css';

interface AdminDashboardStateBannersProps {
  error: string | null;
  notice: string | null;
}

export function AdminDashboardStateBanners({
  error,
  notice,
}: AdminDashboardStateBannersProps) {
  if (!error && !notice) return null;

  return (
    <>
      {error ? <div className={styles.bannerError}>{error}</div> : null}
      {notice ? <div className={styles.bannerNotice}>{notice}</div> : null}
    </>
  );
}

