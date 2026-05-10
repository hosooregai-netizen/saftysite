import {
  PromptGuardrailEditor,
  PromptMessageEditor,
  PromptMetadataEditor,
  PromptSchemaEditor,
  PromptStatusBadge,
  PromptTypeBadge,
} from "../../../../components/admin-governance-components";
import { ErpShell } from "../../../../components/erp-shell";
import { PromptGovernanceWorkspace } from "../../../../components/prompt-governance-workspace";
import { loadAdminPromptDetailPageData } from "../../../../lib/admin-page-data";

type AdminPromptDetailPageProps = {
  params: Promise<{ promptId: string }>;
};

export default async function AdminPromptDetailPage({ params }: AdminPromptDetailPageProps) {
  const { promptId } = await params;
  const pageData = await loadAdminPromptDetailPageData(promptId);

  return (
    <ErpShell title={`프롬프트 상세: ${pageData.detail.prompt.name}`} subtitle="prompt version, test case, run log를 한 화면에서 검토합니다.">
      <section className="hero-badges" style={{ marginBottom: 16 }}>
        <PromptTypeBadge promptType={pageData.detail.prompt.promptType} />
        <PromptStatusBadge status={pageData.detail.currentVersion?.status ?? pageData.detail.prompt.status} />
      </section>
      <PromptGovernanceWorkspace detail={pageData.detail} />
      <PromptMetadataEditor detail={pageData.detail} />
      <PromptMessageEditor detail={pageData.detail} />
      <PromptSchemaEditor detail={pageData.detail} />
      <PromptGuardrailEditor detail={pageData.detail} />
    </ErpShell>
  );
}
