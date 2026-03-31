import type { OverviewSectionProps } from '@/components/session/workspace/types';
import type { WorkPlanCheckStatus } from '@/types/inspectionSession';

export const WORK_PLAN_STATUS_FULL_LABEL: Record<WorkPlanCheckStatus, string> = {
  written: '작성',
  not_written: '미작성',
  not_applicable: '해당없음',
};

function parsePositiveRound(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildAutoReportTitle(reportDate: string, reportNumber: number) {
  return reportDate
    ? `${reportDate} 보고서 ${reportNumber}`
    : `보고서 ${reportNumber}`;
}

export function updateOverviewField(
  props: OverviewSectionProps,
  key: keyof OverviewSectionProps['session']['document2Overview'],
  value: string,
  source: 'manual' | 'derived' = 'manual',
) {
  props.applyDocumentUpdate('doc2', source, (current) => {
    if (key === 'visitCount') {
      const nextRound = parsePositiveRound(value);
      if (!nextRound) {
        return current;
      }

      const preferredDate =
        current.document2Overview.guidanceDate.trim() || current.meta.reportDate.trim();
      const currentTitle = current.meta.reportTitle.trim();
      const autoTitleCandidates = new Set([
        buildAutoReportTitle(preferredDate, current.reportNumber),
        buildAutoReportTitle(current.meta.reportDate.trim(), current.reportNumber),
        `보고서 ${current.reportNumber}`,
      ]);

      return {
        ...current,
        reportNumber: nextRound,
        meta: {
          ...current.meta,
          reportTitle: autoTitleCandidates.has(currentTitle)
            ? buildAutoReportTitle(preferredDate, nextRound)
            : current.meta.reportTitle,
        },
        document2Overview: {
          ...current.document2Overview,
          visitCount: String(nextRound),
        },
      };
    }

    return {
      ...current,
      document2Overview: { ...current.document2Overview, [key]: value },
    };
  });
}
