import { ErpShell } from "../../../../../components/erp-shell";
import { PlanA4Preview } from "../../../../../components/plan-a4-preview";
import { PlanRequiredDataPanel } from "../../../../../components/plan-required-data-panel";
import { StaleSourceWarningPanel } from "../../../../../components/stale-source-warning-panel";
import { loadSafetyManagementPlanDetailPageData } from "../../../../../lib/safety-management-plan-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyManagementPlanPreviewPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyManagementPlanDetailPageData(documentId);
  return (
    <ErpShell title="안전관리계획서 미리보기" subtitle="A4 기준으로 section draft와 누락정보를 함께 검토합니다.">
      <PlanRequiredDataPanel items={pageData.validation.missingFields} />
      <StaleSourceWarningPanel warnings={pageData.detail.warnings} />
      <PlanA4Preview sections={pageData.detail.sections} />
    </ErpShell>
  );
}
