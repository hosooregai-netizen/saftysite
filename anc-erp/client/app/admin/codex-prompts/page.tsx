import { ErpShell } from "../../../components/erp-shell";
import { PromptTable } from "../../../components/prompt-table";
import { loadAdminPromptsPageData } from "../../../lib/admin-page-data";

export default async function AdminCodexPromptsPage() {
  const pageData = await loadAdminPromptsPageData();
  const items = pageData.items.filter((item) => item.prompt.promptType === "codex" || item.prompt.promptKey.includes("codex"));
  return (
    <ErpShell title="Codex Prompts" subtitle="구현 프롬프트 저장소를 별도 필터로 검토합니다.">
      <PromptTable items={items.length > 0 ? items : pageData.items} />
    </ErpShell>
  );
}
