'use client';

import { formatAnalyticsStatValue } from '@/features/admin/lib/buildAdminControlCenterModel';
import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import localStyles from '@/features/admin/sections/analytics/AnalyticsSection.module.css';
import { getDeltaClassName } from './analyticsSectionHelpers';

interface AnalyticsSummarySectionProps {
  analytics: {
    stats: {
      completionRate: number;
      countedSiteCount: number;
      excludedSiteCount: number;
      overdueCount: number;
      plannedRounds: number;
      totalExecutedRounds: number;
    };
    summaryCards: Array<{
      deltaLabel: string;
      deltaTone: 'negative' | 'neutral' | 'positive';
      deltaValue: string;
      label: string;
      value: string;
    }>;
  };
  isLoading: boolean;
  loadError: string | null;
  scopeChips: Array<{ label: string; value: string }>;
}

export function AnalyticsSummarySection({
  analytics,
  isLoading,
  loadError,
  scopeChips,
}: AnalyticsSummarySectionProps) {
  return (
    <div className={`${sharedStyles.sectionBody} ${localStyles.summaryBody}`}>
      {loadError ? <div className={sharedStyles.tableEmpty}>{loadError}</div> : null}
      <div className={localStyles.scopeBar}>
        {scopeChips.map((chip) => (
          <div key={`${chip.label}-${chip.value}`} className={localStyles.scopeChip}>
            <span className={localStyles.scopeChipLabel}>{chip.label}</span>
            <strong className={localStyles.scopeChipValue}>{chip.value}</strong>
          </div>
        ))}
      </div>

      <div className={localStyles.kpiGrid}>
        {analytics.summaryCards.map((card) => (
          <article key={card.label} className={localStyles.kpiCard}>
            <span className={localStyles.kpiLabel}>{card.label}</span>
            <strong className={localStyles.kpiValue}>{card.value}</strong>
            <div className={localStyles.kpiDeltaRow}>
              <span className={localStyles.kpiDeltaLabel}>{card.deltaLabel}</span>
              <span className={`${localStyles.kpiDeltaValue} ${getDeltaClassName(card.deltaTone, localStyles)}`}>
                {card.deltaValue}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className={localStyles.supportStrip}>
        <div className={localStyles.supportItem}>
          <span className={localStyles.supportLabel}>실행 회차</span>
          <strong className={localStyles.supportValue}>{analytics.stats.totalExecutedRounds}회</strong>
        </div>
        <div className={localStyles.supportItem}>
          <span className={localStyles.supportLabel}>예정 회차</span>
          <strong className={localStyles.supportValue}>{analytics.stats.plannedRounds}회</strong>
        </div>
        <div className={localStyles.supportItem}>
          <span className={localStyles.supportLabel}>완료율</span>
          <strong className={localStyles.supportValue}>
            {formatAnalyticsStatValue('percent', analytics.stats.completionRate)}
          </strong>
        </div>
        <div className={localStyles.supportItem}>
          <span className={localStyles.supportLabel}>지연 건수</span>
          <strong className={localStyles.supportValue}>{analytics.stats.overdueCount}건</strong>
        </div>
        <div className={localStyles.supportItem}>
          <span className={localStyles.supportLabel}>집계 현장</span>
          <strong className={localStyles.supportValue}>{analytics.stats.countedSiteCount}개</strong>
          <span className={localStyles.supportMeta}>제외 {analytics.stats.excludedSiteCount}개</span>
        </div>
      </div>
      {isLoading ? <div className={localStyles.loadingHint}>실적/매출 데이터를 불러오는 중입니다.</div> : null}
    </div>
  );
}
