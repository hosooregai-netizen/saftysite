import { EmergencyContactTable } from "../../../../../components/emergency-contact-table";
import { ErpShell } from "../../../../../components/erp-shell";
import { loadSafetyManagementPlanDetailPageData } from "../../../../../lib/safety-management-plan-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyManagementPlanEmergencyPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyManagementPlanDetailPageData(documentId);
  return (
    <ErpShell title="비상대응 계획" subtitle="비상연락망과 사고대응 초안을 점검합니다.">
      <EmergencyContactTable planId={documentId} emergency={pageData.detail.emergency} />
    </ErpShell>
  );
}
