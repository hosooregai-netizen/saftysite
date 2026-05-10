import { ErpShell } from "../../../components/erp-shell";
import { PromptTable } from "../../../components/prompt-table";
import { loadAdminPromptsPageData } from "../../../lib/admin-page-data";

export default async function AdminDesignPromptsPage() {
  const pageData = await loadAdminPromptsPageData();
  const items = pageData.items.filter((item) => item.prompt.promptType === "design" || item.prompt.promptKey.includes("design"));
  return (
    <ErpShell title="Design Prompts" subtitle="디자인 프롬프트 릴리즈 상태를 별도 필터로 검토합니다.">
      <PromptTable items={items.length > 0 ? items : pageData.items} />
    </ErpShell>
  );
}
