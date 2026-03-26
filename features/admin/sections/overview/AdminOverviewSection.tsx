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
    { label: '운영 현장', value: activeSites.length, target: 'sites' },
    { label: '지도요원', value: activeFieldAgents.length, target: 'users' },
    { label: '전체 보고서', value: reportStats.total, target: 'sites' },
    { label: '진행 중 보고서', value: reportStats.inProgress, target: 'sites' },
    { label: '완료 보고서', value: reportStats.completed, target: 'sites' },
    { label: '미배정 현장', value: unassignedActiveSiteCount, target: 'sites' },
  ];

  const insights = [
    unassignedActiveSiteCount > 0
      ? {
          title: '미배정 현장 확인',
          text: `운영 중 현장 ${unassignedActiveSiteCount}곳이 아직 지도요원 배정이 없습니다.`,
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
          text: `${overloadedAgents[0].name}님에게 ${overloadedAgents[0].siteCount}개 현장이 배정되어 있습니다. 배정 균형을 한번 확인해보세요.`,
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
          text: `비활성 사용자 ${inactiveUsers.length}명이 있습니다. 재사용 여부를 확인하면 관리가 더 깔끔해집니다.`,
          target: 'users' as const,
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; text: string; target: AdminSectionKey }>;

  const fallbackInsights = [
    {
      title: '운영 상태 양호',
      text: '현재 확인할 즉시 조치 항목은 없습니다. 필요할 때 각 관리 탭에서 데이터를 점검해 주세요.',
      target: 'overview' as const,
    },
  ];

  return (
    <section className={`${styles.sectionCard} ${styles.overviewCard}`}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>관리자 운영 개요</h2>
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
              <p className={`${styles.statMeta} ${styles.overviewStatMeta}`}>해당 테이블 보기</p>
            </button>
          ))}
        </div>

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
                  역할: {latestAssignment.role_on_site || '미지정'}
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
              상단 요약 카드와 빠른 메뉴 탭으로 바로 해당 관리 화면에 이동할 수 있습니다.
              모바일과 태블릿에서는 긴 모달과 필터 영역이 화면 안에서 자연스럽게 흐르도록
              정리했습니다.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

