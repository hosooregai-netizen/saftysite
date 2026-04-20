'use client';

import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import localStyles from '@/features/admin/sections/analytics/AnalyticsSection.module.css';
import { getDeltaClassName } from './analyticsSectionHelpers';

const HIDDEN_SUMMARY_CARD_LABELS = new Set([
  '계약 예정 매출',
  '계약 회차',
  '완료 보고서',
  '지연 일정',
  '실회차',
  '남은 회차',
]);

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
  const visibleSummaryCards = analytics.summaryCards.filter(
    (card) => !HIDDEN_SUMMARY_CARD_LABELS.has(card.label),
  );

  if (isInitialLoading) {
    return (
      <div className={`${sharedStyles.sectionBody} ${localStyles.summaryBody}`}>
        <div className={localStyles.scopeBar}>
          {scopeChips.map((chip) => (
            <div key={`${chip.label}-${chip.value}`} className={`${localStyles.scopeChip} ${localStyles.scopeChipSkeleton}`} />
          ))}
        </div>
        <div className={localStyles.kpiGrid}>
          {Array.from({ length: Math.max(visibleSummaryCards.length, 1) }, (_, index) => (
            <article key={`analytics-kpi-skeleton-${index + 1}`} className={localStyles.kpiCard}>
              <span className={`${localStyles.skeletonBlock} ${localStyles.skeletonLabel}`} />
              <span className={`${localStyles.skeletonBlock} ${localStyles.skeletonValue}`} />
              <span className={`${localStyles.skeletonBlock} ${localStyles.skeletonMeta}`} />
            </article>
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
        {visibleSummaryCards.map((card) => (
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
      {isRefreshing ? <div className={localStyles.loadingHint}>조건 변경을 반영하고 있습니다.</div> : null}
      {isLoading && !isRefreshing ? <div className={localStyles.loadingHint}>실적/매출 데이터를 불러오고 있습니다.</div> : null}
    </div>
  );
}
