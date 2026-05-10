import { ReportMappingEditor } from "../../../../components/admin-governance-components";
import { ChecklistItemEditor } from "../../../../components/checklist-item-editor";
import { ChecklistTemplateEditor } from "../../../../components/checklist-template-editor";
import { ErpShell } from "../../../../components/erp-shell";
import { loadAdminChecklistTemplateDetailPageData } from "../../../../lib/admin-page-data";

type PageProps = {
  params: Promise<{ templateId: string }>;
};

export default async function ChecklistTemplateDetailPage({ params }: PageProps) {
  const { templateId } = await params;
  const pageData = await loadAdminChecklistTemplateDetailPageData(templateId);
  return (
    <ErpShell title="체크리스트 템플릿 상세" subtitle="템플릿 발행과 항목 구조는 관리자 화면에서만 관리합니다.">
      <section className="section-stack">
        <ChecklistTemplateEditor template={pageData.detail.template} />
        <ChecklistItemEditor items={pageData.detail.items} />
        <ReportMappingEditor items={pageData.detail.items} />
      </section>
    </ErpShell>
  );
}
