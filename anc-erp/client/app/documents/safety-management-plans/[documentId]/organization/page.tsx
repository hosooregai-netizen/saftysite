import { ErpShell } from "../../../../../components/erp-shell";
import { SafetyOrganizationEditor } from "../../../../../components/safety-organization-editor";
import { loadSafetyManagementPlanDetailPageData } from "../../../../../lib/safety-management-plan-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyManagementPlanOrganizationPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyManagementPlanDetailPageData(documentId);
  return (
    <ErpShell title="안전관리조직" subtitle="조직도와 역할 책임을 계획서 기준으로 관리합니다.">
      <SafetyOrganizationEditor planId={documentId} organization={pageData.detail.organization} />
    </ErpShell>
  );
}
