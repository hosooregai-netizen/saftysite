import { ErpShell } from "../../../components/erp-shell";
import { PromptTable } from "../../../components/prompt-table";
import { loadAdminPromptsPageData } from "../../../lib/admin-page-data";

export default async function AdminReversePromptsPage() {
  const pageData = await loadAdminPromptsPageData();
  const items = pageData.items.filter((item) => item.prompt.promptType === "reverse" || item.prompt.promptKey.includes("reverse"));
  return (
    <ErpShell title="Reverse Prompts" subtitle="reverse audit 프롬프트와 테스트 로그를 별도 필터로 검토합니다.">
      <PromptTable items={items.length > 0 ? items : pageData.items} />
    </ErpShell>
  );
}
