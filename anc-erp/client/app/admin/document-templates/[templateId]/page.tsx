import {
  PublishChecklist,
  TemplateConditionBuilder,
  TemplateLoopEditor,
  TemplateSectionEditor,
  TemplateSectionTree,
  TemplateStatusBadge,
  TemplateTypeBadge,
} from "../../../../components/admin-governance-components";
import { ErpShell } from "../../../../components/erp-shell";
import { TemplateGovernanceWorkspace } from "../../../../components/template-governance-workspace";
import { loadAdminTemplateDetailPageData } from "../../../../lib/admin-page-data";

type AdminDocumentTemplateDetailPageProps = {
  params: Promise<{ templateId: string }>;
};

export default async function AdminDocumentTemplateDetailPage({ params }: AdminDocumentTemplateDetailPageProps) {
  const { templateId } = await params;
  const pageData = await loadAdminTemplateDetailPageData(templateId);

  return (
    <ErpShell title={`템플릿 상세: ${pageData.detail.template.name}`} subtitle="section, variable, preview, publish 상태를 같은 화면에서 점검합니다.">
      <section className="hero-badges" style={{ marginBottom: 16 }}>
        <TemplateTypeBadge documentType={pageData.detail.template.documentType} />
        <TemplateStatusBadge status={pageData.detail.currentVersion?.status ?? pageData.detail.template.status} />
      </section>
      <TemplateGovernanceWorkspace detail={pageData.detail} />
      <TemplateSectionTree sections={pageData.detail.sections} />
      <TemplateSectionEditor sections={pageData.detail.sections} />
      <TemplateLoopEditor loops={pageData.detail.loops} />
      <TemplateConditionBuilder conditions={pageData.detail.conditions} />
      <PublishChecklist blockedItems={pageData.detail.currentVersion?.missingRequiredVariables ?? []} />
    </ErpShell>
  );
}
