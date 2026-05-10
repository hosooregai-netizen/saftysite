import { EducationPlanTable } from "../../../../../components/education-plan-table";
import { ErpShell } from "../../../../../components/erp-shell";
import { loadSafetyManagementPlanDetailPageData } from "../../../../../lib/safety-management-plan-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyManagementPlanEducationPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyManagementPlanDetailPageData(documentId);
  return (
    <ErpShell title="안전교육 계획" subtitle="교육 주기와 기록 방식 초안을 정리합니다.">
      <EducationPlanTable planId={documentId} education={pageData.detail.education} />
    </ErpShell>
  );
}
