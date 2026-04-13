import styles from './HomeScreen.module.css';

export function AssignedSitesTableSkeleton() {
  return (
    <div className={styles.listViewport} aria-busy="true">
      <div className={styles.listTrack}>
        <div className={styles.listHead} aria-hidden="true">
          <span>고객명</span>
          <span>현장명</span>
          <span className={styles.desktopOnly}>담당</span>
          <span className={styles.desktopOnly}>진행상태</span>
          <span>최근 지도일</span>
          <span>보고서 수</span>
          <span className={styles.desktopOnly}>마지막 저장</span>
          <span>메뉴</span>
        </div>

        <div className={styles.siteList}>
          {Array.from({ length: 5 }).map((_, index) => (
            <article
              key={`assigned-site-skeleton-${index + 1}`}
              className={`${styles.siteRow} ${styles.siteRowLoading}`}
              aria-hidden="true"
            >
              <div className={`${styles.cell} ${styles.customerCell}`}>
                <span className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonShort}`} />
              </div>
              <div className={`${styles.primaryCell} ${styles.siteNameCell}`}>
                <span className={`${styles.loadingSkeleton} ${styles.loadingSkeletonLong}`} />
              </div>
              <div className={`${styles.cell} ${styles.assigneeCell} ${styles.desktopOnly}`}>
                <span className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonShort}`} />
              </div>
              <div className={`${styles.cell} ${styles.statusCell} ${styles.desktopOnly}`}>
                <span className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonTiny}`} />
              </div>
              <div className={`${styles.cell} ${styles.dateCell}`}>
                <span className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonTiny}`} />
              </div>
              <div className={`${styles.cell} ${styles.countCell}`}>
                <span className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonTiny}`} />
              </div>
              <div className={`${styles.cell} ${styles.savedCell} ${styles.desktopOnly}`}>
                <span className={`${styles.cellValue} ${styles.loadingSkeleton} ${styles.loadingSkeletonShort}`} />
              </div>
              <div className={`${styles.actionCell} ${styles.actionsCell}`}>
                <span className={`${styles.loadingSkeleton} ${styles.loadingSkeletonIcon}`} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
