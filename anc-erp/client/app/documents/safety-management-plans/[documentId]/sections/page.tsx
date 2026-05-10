import { ErpShell } from "../../../../../components/erp-shell";
import { SafetyManagementPlanEditWorkspace } from "../../../../../components/safety-management-plan-edit-workspace";
import { loadSafetyManagementPlanDetailPageData } from "../../../../../lib/safety-management-plan-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyManagementPlanSectionsPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyManagementPlanDetailPageData(documentId);
  return (
    <ErpShell title="섹션 관리" subtitle="섹션별 상태와 regenerate/save 흐름">
      <SafetyManagementPlanEditWorkspace planId={documentId} sections={pageData.detail.sections} />
    </ErpShell>
  );
}
