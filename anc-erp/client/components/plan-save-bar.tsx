"use client";

import type { SafetyManagementPlanSection } from "../../packages/contracts/src";
import { saveSafetyManagementPlanSectionDraft } from "../lib/safety-management-plan-actions";

export function PlanSaveBar({ planId, section }: { planId: string; section: SafetyManagementPlanSection }) {
  async function handleSave() {
    await saveSafetyManagementPlanSectionDraft(planId, {
      sectionKey: section.key,
      content: section.content,
      status: "edited",
    });
  }

  return (
    <button className="secondary-button" onClick={handleSave} type="button">
      섹션 저장
    </button>
  );
}
