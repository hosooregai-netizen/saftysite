import { PublishChecklist, RollbackButton, VersionDiffViewer } from "../../../../../components/admin-governance-components";
import { ErpShell } from "../../../../../components/erp-shell";
import { loadAdminTemplateVersionsPageData } from "../../../../../lib/admin-page-data";

type AdminDocumentTemplateVersionsPageProps = {
  params: Promise<{ templateId: string }>;
};

export default async function AdminDocumentTemplateVersionsPage({ params }: AdminDocumentTemplateVersionsPageProps) {
  const { templateId } = await params;
  const pageData = await loadAdminTemplateVersionsPageData(templateId);

  return (
    <ErpShell title="템플릿 버전 이력" subtitle="문서 템플릿 버전 이력, diff 성격의 상태 변화, rollback 준비 상태를 분리해서 검토합니다.">
      <VersionDiffViewer
        currentVersionId={pageData.detail.currentVersion?.id ?? pageData.detail.template.currentVersionId}
        versions={pageData.versions}
      />
      <PublishChecklist blockedItems={pageData.detail.currentVersion?.missingRequiredVariables ?? []} readyLabel="버전 이력 검토 완료" />
      <RollbackButton versionId={pageData.detail.currentVersion?.id} />
    </ErpShell>
  );
}
