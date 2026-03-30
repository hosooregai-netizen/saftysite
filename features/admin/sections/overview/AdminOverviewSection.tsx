import OperationalKpiPanel from '@/components/controller/OperationalKpiPanel';
import { buildAdminOverviewModel } from '@/features/admin/lib/buildAdminOverviewModel';
import { formatTimestamp } from '@/lib/admin';
import type { AdminSectionKey } from '@/lib/admin';
import type { ControllerDashboardData } from '@/types/controller';
import type { InspectionSession } from '@/types/inspectionSession';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';

interface AdminOverviewSectionProps {
  data: ControllerDashboardData;
  onSelectSection: (section: AdminSectionKey) => void;
  sessions: InspectionSession[];
}

export function AdminOverviewSection({
  data,
  onSelectSection,
  sessions,
}: AdminOverviewSectionProps) {
  const {
    activeFieldAgents,
    activeSites,
    expiringContentCount,
    inactiveUsers,
    latestAssignment,
    overloadedAgents,
    reportStats,
    unassignedActiveSiteCount,
  } = buildAdminOverviewModel(data, sessions);

  const stats: Array<{ label: string; target: AdminSectionKey; value: number }> = [
    { label: '전체 사용자', value: data.users.length, target: 'users' },
    { label: '사업장', value: data.headquarters.length, target: 'headquarters' },
    { label: '운영 현장', value: activeSites.length, target: 'headquarters' },
    { label: '지도요원', value: activeFieldAgents.length, target: 'users' },
    { label: '전체 보고서', value: reportStats.total, target: 'headquarters' },
    { label: '진행 중 보고서', value: reportStats.inProgress, target: 'headquarters' },
    { label: '완료 보고서', value: reportStats.completed, target: 'headquarters' },
    { label: '미배정 현장', value: unassignedActiveSiteCount, target: 'headquarters' },
  ];

  const insights = [
    unassignedActiveSiteCount > 0
      ? {
          title: '미배정 현장 확인',
          text: `운영 중인 현장 ${unassignedActiveSiteCount}곳이 아직 지도요원 배정 없이 남아 있습니다.`,
          target: 'headquarters' as const,
        }
      : null,
    reportStats.inProgress > 0
      ? {
          title: '진행 중 보고서 점검',
          text: `작성 중인 보고서가 ${reportStats.inProgress}건 있습니다. 사업장 드릴다운에서 바로 이어 확인할 수 있습니다.`,
          target: 'headquarters' as const,
        }
      : null,
    overloadedAgents[0]
      ? {
          title: '지도요원 배정 편중',
          text: `${overloadedAgents[0].name}님에게 ${overloadedAgents[0].siteCount}개 현장이 배정되어 있습니다. 담당 현장 분산이 필요한지 확인해 주세요.`,
          target: 'users' as const,
        }
      : null,
    expiringContentCount > 0
      ? {
          title: '콘텐츠 만료 예정',
          text: `2주 이내 만료 예정인 콘텐츠가 ${expiringContentCount}건 있습니다.`,
          target: 'content' as const,
        }
      : null,
    inactiveUsers.length > 0
      ? {
          title: '비활성 사용자 정리',
          text: `비활성 사용자 계정이 ${inactiveUsers.length}명 있습니다. 계정 상태를 정리해 주세요.`,
          target: 'users' as const,
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; text: string; target: AdminSectionKey }>;

  const fallbackInsights = [
    {
      title: '운영 상태 양호',
      text: '지금 바로 조치가 필요한 운영 이슈는 보이지 않습니다. 현장과 보고서를 순서대로 점검해 주세요.',
      target: 'overview' as const,
    },
  ];

  return (
    <section className={`${styles.sectionCard} ${styles.overviewCard}`}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>관리자 운영 개요</h2>
          <p className={styles.hint}>
            현장 운영 현황과 계정, 콘텐츠 상태를 한 화면에서 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <div className={`${styles.sectionBody} ${styles.overviewBody}`}>
        <div className={`${styles.stats} ${styles.overviewStats}`}>
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              className={`${styles.statCard} ${styles.statButton} ${styles.overviewStatButton}`}
              onClick={() => onSelectSection(stat.target)}
            >
              <p className={`${styles.statLabel} ${styles.overviewStatLabel}`}>{stat.label}</p>
              <p className={`${styles.statValue} ${styles.overviewStatValue}`}>{stat.value}</p>
              <p className={`${styles.statMeta} ${styles.overviewStatMeta}`}>해당 화면 보기</p>
            </button>
          ))}
        </div>

        <OperationalKpiPanel sites={data.sites} styles={styles} users={data.users} />

        <div className={`${styles.insightGrid} ${styles.overviewInsights}`}>
          {(insights.length > 0 ? insights : fallbackInsights).map((insight) => (
            <article
              key={insight.title}
              className={`${styles.insightCard} ${styles.overviewInsightCard}`}
            >
              <strong className={`${styles.insightTitle} ${styles.overviewInsightTitle}`}>
                {insight.title}
              </strong>
              <p className={`${styles.insightText} ${styles.overviewInsightText}`}>
                {insight.text}
              </p>
              <div className={`${styles.insightActions} ${styles.overviewInsightActions}`}>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={() => onSelectSection(insight.target)}
                >
                  바로 보기
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className={`${styles.splitGrid} ${styles.overviewSplitGrid}`}>
          <article className={`${styles.recordCard} ${styles.overviewRecordCard}`}>
            <div className={styles.recordTop}>
              <strong className={`${styles.recordTitle} ${styles.overviewRecordTitle}`}>
                최근 배정
              </strong>
            </div>
            {latestAssignment ? (
              <>
                <div className={styles.recordMeta}>
                  <span className="app-chip">{latestAssignment.user?.name || '미확인 사용자'}</span>
                  <span className="app-chip">{latestAssignment.site?.name || '미확인 현장'}</span>
                  <span className="app-chip">{formatTimestamp(latestAssignment.assigned_at)}</span>
                </div>
                <p className={`${styles.recordDescription} ${styles.overviewRecordDescription}`}>
                  역할: {latestAssignment.role_on_site || '미정'}
                  {'\n'}
                  메모: {latestAssignment.memo || '없음'}
                </p>
              </>
            ) : (
              <div className={styles.empty}>배정 이력이 아직 없습니다.</div>
            )}
          </article>

          <article className={`${styles.recordCard} ${styles.overviewRecordCard}`}>
            <div className={styles.recordTop}>
              <strong className={`${styles.recordTitle} ${styles.overviewRecordTitle}`}>
                운영 메모
              </strong>
            </div>
            <p className={`${styles.recordDescription} ${styles.overviewRecordDescription}`}>
              사업장 탭에서는 사업장, 현장, 보고서를 단계적으로 확인할 수 있고, overview에서는
              우선 조치가 필요한 분기 누락 현장과 월간 신고 미달 요원을 먼저 확인할 수 있도록
              구성했습니다.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
