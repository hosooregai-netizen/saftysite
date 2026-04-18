'use client';

import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import localStyles from '@/features/admin/sections/analytics/AnalyticsSection.module.css';
import { getDeltaClassName } from './analyticsSectionHelpers';

interface AnalyticsSummarySectionProps {
  analytics: {
    stats: {
      countedSiteCount: number;
      excludedSiteCount: number;
      overdueCount: number;
      remainingRounds: number;
      totalExecutedRounds: number;
      totalScopedRounds: number;
    };
    summaryCards: Array<{
      deltaLabel: string;
      deltaTone: 'negative' | 'neutral' | 'positive';
      deltaValue: string;
      label: string;
      value: string;
    }>;
  };
  isInitialLoading: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  loadError: string | null;
  scopeChips: Array<{ label: string; value: string }>;
}

export function AnalyticsSummarySection({
  analytics,
  isInitialLoading,
  isLoading,
  isRefreshing,
  loadError,
  scopeChips,
}: AnalyticsSummarySectionProps) {
  if (isInitialLoading) {
    return (
      <div className={`${sharedStyles.sectionBody} ${localStyles.summaryBody}`}>
        <div className={localStyles.scopeBar}>
          {scopeChips.map((chip) => (
            <div key={`${chip.label}-${chip.value}`} className={`${localStyles.scopeChip} ${localStyles.scopeChipSkeleton}`} />
          ))}
        </div>
        <div className={localStyles.kpiGrid}>
          {Array.from({ length: 7 }, (_, index) => (
            <article key={`analytics-kpi-skeleton-${index + 1}`} className={localStyles.kpiCard}>
              <span className={`${localStyles.skeletonBlock} ${localStyles.skeletonLabel}`} />
              <span className={`${localStyles.skeletonBlock} ${localStyles.skeletonValue}`} />
              <span className={`${localStyles.skeletonBlock} ${localStyles.skeletonMeta}`} />
            </article>
          ))}
        </div>
        <div className={localStyles.supportStrip}>
          {Array.from({ length: 5 }, (_, index) => (
            <div key={`analytics-support-skeleton-${index + 1}`} className={localStyles.supportItem}>
              <span className={`${localStyles.skeletonBlock} ${localStyles.skeletonLabel}`} />
              <span className={`${localStyles.skeletonBlock} ${localStyles.skeletonMeta}`} />
            </div>
          ))}
        </div>
        <div className={localStyles.loadingHint}>실적/매출 데이터를 준비하고 있습니다.</div>
      </div>
    );
  }

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
          <span className={localStyles.supportLabel}>실회차</span>
          <strong className={localStyles.supportValue}>{analytics.stats.totalExecutedRounds}회</strong>
        </div>
        <div className={localStyles.supportItem}>
          <span className={localStyles.supportLabel}>남은 회차</span>
          <strong className={localStyles.supportValue}>{analytics.stats.remainingRounds}회</strong>
        </div>
        <div className={localStyles.supportItem}>
          <span className={localStyles.supportLabel}>계약 회차</span>
          <strong className={localStyles.supportValue}>{analytics.stats.totalScopedRounds}회</strong>
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
      {isRefreshing ? <div className={localStyles.loadingHint}>조건 변경을 반영하고 있습니다.</div> : null}
      {isLoading && !isRefreshing ? <div className={localStyles.loadingHint}>실적/매출 데이터를 불러오고 있습니다.</div> : null}
    </div>
  );
}
