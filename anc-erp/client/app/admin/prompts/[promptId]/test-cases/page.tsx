import { PromptExpectedCheckEditor, PromptTestCaseTable } from "../../../../../components/admin-governance-components";
import { ErpShell } from "../../../../../components/erp-shell";
import { loadAdminPromptTestCasesPageData } from "../../../../../lib/admin-page-data";

type AdminPromptTestCasesPageProps = {
  params: Promise<{ promptId: string }>;
};

export default async function AdminPromptTestCasesPage({ params }: AdminPromptTestCasesPageProps) {
  const { promptId } = await params;
  const pageData = await loadAdminPromptTestCasesPageData(promptId);

  return (
    <ErpShell title="프롬프트 테스트 케이스" subtitle="발행 전 필수 케이스와 기대 문자열 검사를 관리합니다.">
      <PromptTestCaseTable testCases={pageData.testCases} />
      <PromptExpectedCheckEditor testCases={pageData.testCases} />
    </ErpShell>
  );
}
