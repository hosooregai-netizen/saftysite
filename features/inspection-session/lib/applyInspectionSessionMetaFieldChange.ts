import { mergeMasterDataIntoSession } from '@/lib/safetyApiMappers/masterData';
import type { SafetyMasterData } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';

export function applyInspectionSessionMetaFieldChange(
  current: InspectionSession,
  field: keyof InspectionSession['meta'],
  value: string,
  masterData: SafetyMasterData,
): InspectionSession {
  const previousReportDate = current.meta.reportDate;
  const previousDrafter = current.meta.drafter;
  const next = {
    ...current,
    meta: { ...current.meta, [field]: value },
    document2Overview: {
      ...current.document2Overview,
      guidanceDate:
        field === 'reportDate' &&
        (!current.document2Overview.guidanceDate ||
          current.document2Overview.guidanceDate === previousReportDate)
          ? value
          : current.document2Overview.guidanceDate,
      assignee:
        field === 'drafter' &&
        (!current.document2Overview.assignee ||
          current.document2Overview.assignee === previousDrafter)
          ? value
          : current.document2Overview.assignee,
    },
    document4FollowUps:
      field === 'reportDate'
        ? current.document4FollowUps.map((item) => ({
            ...item,
            confirmationDate:
              !item.confirmationDate || item.confirmationDate === previousReportDate
                ? value
                : item.confirmationDate,
          }))
        : current.document4FollowUps,
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

  return field === 'reportDate' ? mergeMasterDataIntoSession(next, masterData) : next;
}

