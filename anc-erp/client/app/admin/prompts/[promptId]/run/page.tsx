import { PromptRunConsole, PromptRunResultPanel } from "../../../../../components/admin-governance-components";
import { ErpShell } from "../../../../../components/erp-shell";
import { loadAdminPromptRunPageData } from "../../../../../lib/admin-page-data";

type AdminPromptRunPageProps = {
  params: Promise<{ promptId: string }>;
};

export default async function AdminPromptRunPage({ params }: AdminPromptRunPageProps) {
  const { promptId } = await params;
  const pageData = await loadAdminPromptRunPageData(promptId);

  return (
    <ErpShell title="프롬프트 실행 콘솔" subtitle="입력 fixture와 실행 결과를 즉시 검토하는 운영 콘솔입니다.">
      <PromptRunConsole detail={pageData.detail} initialOutput={pageData.runLogs[0]?.outputText} />
      <PromptRunResultPanel runLogs={pageData.runLogs} />
    </ErpShell>
  );
}
