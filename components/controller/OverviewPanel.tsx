import { getSessionProgress } from '@/constants/inspectionSession';
import type { InspectionSession } from '@/types/inspectionSession';
import type { ControllerDashboardData } from '@/types/controller';
import { formatTimestamp } from './shared';

interface OverviewPanelProps {
  data: ControllerDashboardData;
  sessions: InspectionSession[];
  styles: Record<string, string>;
}

export default function OverviewPanel({ data, sessions, styles }: OverviewPanelProps) {
  const latestAssignment = [...data.assignments]
    .sort((left, right) => right.assigned_at.localeCompare(left.assigned_at))[0];
  const activeAssignments = data.assignments.filter((item) => item.is_active);
  const activeSites = data.sites.filter((item) => item.status === 'active');
  const assignedSiteIds = new Set(activeAssignments.map((item) => item.site_id));
  const activeFieldAgents = data.users.filter(
    (item) => item.role === 'field_agent' && item.is_active
  );
  const reportStats = sessions.reduce(
    (accumulator, session) => {
      const percentage = getSessionProgress(session).percentage;
      accumulator.total += 1;
      if (percentage >= 100) accumulator.completed += 1;
      else if (percentage > 0) accumulator.inProgress += 1;
      else accumulator.notStarted += 1;
      return accumulator;
    },
    { total: 0, inProgress: 0, completed: 0, notStarted: 0 }
  );

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>관제 운영 개요</h2>
          <p className={styles.sectionDescription}>
            사업장, 현장, 사용자, 배정, 마스터 데이터를 한 화면에서 관리할 수 있습니다.
          </p>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.stats}>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>전체 사용자</p>
            <p className={styles.statValue}>{data.users.length}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>사업장</p>
            <p className={styles.statValue}>{data.headquarters.length}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>운영 현장</p>
            <p className={styles.statValue}>{activeSites.length}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>지도요원</p>
            <p className={styles.statValue}>{activeFieldAgents.length}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>전체 보고서</p>
            <p className={styles.statValue}>{reportStats.total}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>진행 중 보고서</p>
            <p className={styles.statValue}>{reportStats.inProgress}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>완료 보고서</p>
            <p className={styles.statValue}>{reportStats.completed}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>미배정 현장</p>
            <p className={styles.statValue}>
              {activeSites.filter((item) => !assignedSiteIds.has(item.id)).length}
            </p>
          </article>
        </div>

        <div className={styles.splitGrid} style={{ marginTop: 16 }}>
          <article className={styles.recordCard}>
            <div className={styles.recordTop}>
              <strong className={styles.recordTitle}>최근 배정</strong>
            </div>
            {latestAssignment ? (
              <>
                <div className={styles.recordMeta}>
                  <span className="app-chip">{latestAssignment.user?.name || '미확인 사용자'}</span>
                  <span className="app-chip">{latestAssignment.site?.name || '미확인 현장'}</span>
                  <span className="app-chip">{formatTimestamp(latestAssignment.assigned_at)}</span>
                </div>
                <p className={styles.recordDescription}>
                  역할: {latestAssignment.role_on_site || '미지정'}
                  {'\n'}
                  메모: {latestAssignment.memo || '없음'}
                </p>
              </>
            ) : (
              <div className={styles.empty}>배정 이력이 아직 없습니다.</div>
            )}
          </article>

          <article className={styles.recordCard}>
            <div className={styles.recordTop}>
              <strong className={styles.recordTitle}>운영 메모</strong>
            </div>
            <p className={styles.recordDescription}>
              관제 계정은 사업장/현장 CRUD와 지도요원 배정, 마스터 데이터 관리가
              가능해야 합니다. 모바일에서는 상단 메뉴 버튼으로 섹션을 전환할 수 있습니다.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
