import { getSessionProgress } from '@/constants/inspectionSession';
import type { InspectionSession } from '@/types/inspectionSession';
import type { ControllerDashboardData } from '@/types/controller';
import { formatTimestamp, isFieldAgentUserRole, type ControllerSectionKey } from './shared';

interface OverviewPanelProps {
  data: ControllerDashboardData;
  onSelectSection: (section: ControllerSectionKey) => void;
  sessions: InspectionSession[];
  styles: Record<string, string>;
}

export default function OverviewPanel({
  data,
  onSelectSection,
  sessions,
  styles,
}: OverviewPanelProps) {
  const latestAssignment = [...data.assignments]
    .sort((left, right) => right.assigned_at.localeCompare(left.assigned_at))[0];
  const activeAssignments = data.assignments.filter((item) => item.is_active);
  const activeSites = data.sites.filter((item) => item.status === 'active');
  const assignedSiteIds = new Set(activeAssignments.map((item) => item.site_id));
  const activeFieldAgents = data.users.filter(
    (item) => isFieldAgentUserRole(item.role) && item.is_active
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
  const stats: Array<{
    label: string;
    target: ControllerSectionKey;
    value: number;
  }> = [
    { label: '전체 사용자', value: data.users.length, target: 'users' },
    { label: '사업장', value: data.headquarters.length, target: 'headquarters' },
    { label: '운영 현장', value: activeSites.length, target: 'sites' },
    { label: '지도요원', value: activeFieldAgents.length, target: 'users' },
    { label: '전체 보고서', value: reportStats.total, target: 'sites' },
    { label: '진행 중 보고서', value: reportStats.inProgress, target: 'sites' },
    { label: '완료 보고서', value: reportStats.completed, target: 'sites' },
    {
      label: '미배정 현장',
      value: activeSites.filter((item) => !assignedSiteIds.has(item.id)).length,
      target: 'sites',
    },
  ];

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>관리자 운영 개요</h2>
          <p className={styles.sectionDescription}>
            사업장, 현장, 사용자, 배정, 콘텐츠 데이터를 한 화면에서 관리할 수 있습니다.
          </p>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.stats}>
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              className={`${styles.statCard} ${styles.statButton}`}
              onClick={() => onSelectSection(stat.target)}
            >
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statMeta}>해당 테이블 보기</p>
            </button>
          ))}
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
              상단 요약 카드를 누르면 바로 해당 관리 테이블로 이동합니다. 모바일에서는
              긴 모달도 화면 안에서 스크롤되도록 정리했습니다.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
