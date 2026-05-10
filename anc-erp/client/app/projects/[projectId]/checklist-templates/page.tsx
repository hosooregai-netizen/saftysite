import { ErpShell } from "../../../../components/erp-shell";
import { ChecklistTemplateTable } from "../../../../components/checklist-template-table";
import { loadChecklistTemplateAdminPageData } from "../../../../lib/checklist-page-data";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectChecklistTemplatesPage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadChecklistTemplateAdminPageData(projectId);
  return (
    <ErpShell title="프로젝트 체크리스트 템플릿" subtitle="프로젝트에서 사용할 표준 점검표 템플릿을 조회합니다.">
      <ChecklistTemplateTable templates={pageData.templates} />
    </ErpShell>
  );
}
