"use client";

import { regenerateSafetyManagementPlanSectionDraft } from "../lib/safety-management-plan-actions";

export function PlanSectionRegenerateButton({ planId, sectionKey }: { planId: string; sectionKey: string }) {
  async function handleRegenerate() {
    await regenerateSafetyManagementPlanSectionDraft(planId, sectionKey);
  }

  return (
    <button className="secondary-button" onClick={handleRegenerate} type="button">
      AI draft 재생성
    </button>
  );
}
