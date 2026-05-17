import type { OverviewSectionProps } from '@/components/session/workspace/types';
import { applyInspectionSessionGuidanceDateChange } from '@/features/inspection-session/lib/applyInspectionSessionGuidanceDateChange';
import type { WorkPlanCheckStatus } from '@/types/inspectionSession';

export const WORK_PLAN_STATUS_FULL_LABEL: Record<WorkPlanCheckStatus, string> = {
  written: '작성',
  not_written: '미작성',
  not_applicable: '해당없음',
};

export function updateOverviewField(
  props: OverviewSectionProps,
  key: keyof OverviewSectionProps['session']['document2Overview'],
  value: string,
  source: 'manual' | 'derived' = 'manual',
) {
  if (key === 'visitCount' || key === 'totalVisitCount') {
    return;
  }

  props.applyDocumentUpdate('doc2', source, (current) => {
    if (key === 'guidanceDate') {
      return applyInspectionSessionGuidanceDateChange(current, value);
    }

    return {
      ...current,
      document2Overview: { ...current.document2Overview, [key]: value },
    };
  });
}
