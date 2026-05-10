import { ErpShell } from "../../../components/erp-shell";
import { PromptTable } from "../../../components/prompt-table";
import { loadAdminPromptsPageData } from "../../../lib/admin-page-data";

export default async function AdminPromptsPage() {
  const pageData = await loadAdminPromptsPageData();

  return (
    <ErpShell title="프롬프트 저장소" subtitle="service_ai, codex, design, reverse prompt를 버전 단위로 검토하고 테스트합니다.">
      <section className="hero-card approval-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Prompt Governance</p>
            <h2 className="hero-title">AI 프롬프트 릴리즈 관리</h2>
            <p className="hero-subtitle">schema / guardrail / test case 실행 이력이 없는 프롬프트는 publish하지 않습니다.</p>
          </div>
        </div>
      </section>
      <PromptTable items={pageData.items} />
    </ErpShell>
  );
}
