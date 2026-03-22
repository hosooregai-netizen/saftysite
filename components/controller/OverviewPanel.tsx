import { getSessionProgress } from '@/constants/inspectionSession';
import type { InspectionSession } from '@/types/inspectionSession';
import type { ControllerDashboardData } from '@/types/controller';
import { formatTimestamp, isFieldAgentUserRole, type ControllerSectionKey } from './shared';

const NOW = Date.now();

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
  const inactiveUsers = data.users.filter((item) => !item.is_active);
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
  const overloadedAgents = activeFieldAgents
    .map((user) => ({
      name: user.name,
      siteCount: activeAssignments.filter((assignment) => assignment.user_id === user.id).length,
    }))
    .filter((item) => item.siteCount >= 3)
    .sort((left, right) => right.siteCount - left.siteCount);
  const expiringContents = data.contentItems.filter((item) => {
    if (!item.is_active || !item.effective_to) return false;
    const end = new Date(item.effective_to);
    if (Number.isNaN(end.getTime())) return false;
    const diff = end.getTime() - NOW;
    return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 14;
  });
  const insights = [
    activeSites.filter((item) => !assignedSiteIds.has(item.id)).length > 0
      ? {
          title: '미배정 현장 확인',
          text: `운영 중 현장 중 ${activeSites.filter((item) => !assignedSiteIds.has(item.id)).length}곳이 아직 지도요원 배정이 없습니다.`,
          target: 'sites' as const,
        }
      : null,
    reportStats.inProgress > 0
      ? {
          title: '진행 중 보고서 점검',
          text: `작성 중 보고서가 ${reportStats.inProgress}건 있습니다. 현장 탭에서 바로 들어가 이어서 검토할 수 있습니다.`,
          target: 'sites' as const,
        }
      : null,
    overloadedAgents[0]
      ? {
          title: '지도요원 배정 편중',
          text: `${overloadedAgents[0].name}님에게 ${overloadedAgents[0].siteCount}개 현장이 배정되어 있습니다. 배정 균형을 한 번 확인해보세요.`,
          target: 'users' as const,
        }
      : null,
    expiringContents.length > 0
      ? {
          title: '콘텐츠 만료 예정',
          text: `2주 이내 만료 예정인 콘텐츠가 ${expiringContents.length}건 있습니다.`,
          target: 'content' as const,
        }
      : null,
    inactiveUsers.length > 0
      ? {
          title: '비활성 사용자 정리',
          text: `비활성 사용자 ${inactiveUsers.length}명이 있습니다. 재사용 여부를 확인하면 관리가 더 깔끔해집니다.`,
          target: 'users' as const,
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; text: string; target: ControllerSectionKey }>;

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

        <div className={styles.insightGrid}>
          {(insights.length > 0
            ? insights
            : [
                {
                  title: '운영 상태 양호',
                  text: '현재 확인된 즉시 조치 항목은 없습니다. 필요할 때 각 관리 탭에서 세부 데이터를 점검해 주세요.',
                  target: 'overview' as const,
                },
              ]).map((insight) => (
            <article key={insight.title} className={styles.insightCard}>
              <strong className={styles.insightTitle}>{insight.title}</strong>
              <p className={styles.insightText}>{insight.text}</p>
              <div className={styles.insightActions}>
                <button type="button" className="app-button app-button-secondary" onClick={() => onSelectSection(insight.target)}>
                  바로 보기
                </button>
              </div>
            </article>
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
              상단 요약 카드와 빠른 메뉴 탭으로 바로 해당 관리 화면에 이동할 수 있습니다.
              모바일과 태블릿에서는 긴 모달과 필터 영역이 화면 안에서 자연스럽게 흐르도록 정리했습니다.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
