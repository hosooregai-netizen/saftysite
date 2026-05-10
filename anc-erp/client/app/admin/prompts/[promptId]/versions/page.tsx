import { PromptReleaseAction, PublishChecklist, RollbackButton, VersionDiffViewer } from "../../../../../components/admin-governance-components";
import { ErpShell } from "../../../../../components/erp-shell";
import { loadAdminPromptVersionsPageData } from "../../../../../lib/admin-page-data";

type AdminPromptVersionsPageProps = {
  params: Promise<{ promptId: string }>;
};

export default async function AdminPromptVersionsPage({ params }: AdminPromptVersionsPageProps) {
  const { promptId } = await params;
  const pageData = await loadAdminPromptVersionsPageData(promptId);
  const currentVersion = pageData.detail.currentVersion ?? pageData.versions[0];
  const blockedItems: string[] = [];

  if (!currentVersion?.lastTestRunAt) {
    blockedItems.push("최근 테스트 실행 이력 없음");
  }
  if (pageData.detail.testCases.length === 0) {
    blockedItems.push("테스트 케이스 없음");
  }

  return (
    <ErpShell title="프롬프트 버전 이력" subtitle="버전 히스토리, 테스트 이력, publish/rollback readiness를 route 단위로 분리해 검토합니다.">
      <VersionDiffViewer currentVersionId={currentVersion?.id} versions={pageData.versions} />
      <PublishChecklist blockedItems={blockedItems} readyLabel="프롬프트 발행 가능" />
      <PromptReleaseAction versionId={currentVersion?.id} />
      <RollbackButton versionId={currentVersion?.id} kind="prompt" />
    </ErpShell>
  );
}
