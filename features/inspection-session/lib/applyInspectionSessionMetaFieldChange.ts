import { mergeMasterDataIntoSession } from '@/lib/safetyApiMappers/masterData';
import type { SafetyMasterData } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';
import { applyInspectionSessionGuidanceDateChange } from './applyInspectionSessionGuidanceDateChange';

export function applyInspectionSessionMetaFieldChange(
  current: InspectionSession,
  field: keyof InspectionSession['meta'],
  value: string,
  masterData: SafetyMasterData,
): InspectionSession {
  if (field === 'reportDate') {
    return mergeMasterDataIntoSession(
      applyInspectionSessionGuidanceDateChange(current, value),
      masterData,
    );
  }

  const previousDrafter = current.meta.drafter;
  const next = {
    ...current,
    meta: { ...current.meta, [field]: value },
    document2Overview: {
      ...current.document2Overview,
      guidanceDate: current.document2Overview.guidanceDate,
      assignee:
        field === 'drafter' &&
        (!current.document2Overview.assignee ||
          current.document2Overview.assignee === previousDrafter)
          ? value
          : current.document2Overview.assignee,
    },
    document4FollowUps: current.document4FollowUps,
    document7Findings:
      field === 'drafter'
        ? current.document7Findings.map((item) => ({
            ...item,
            inspector:
              !item.inspector || item.inspector === previousDrafter
                ? value
                : item.inspector,
          }))
        : current.document7Findings,
  };

  return next;
}

