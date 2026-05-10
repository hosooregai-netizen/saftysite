import { TemplateVariableTable } from "../../../../../components/admin-governance-components";
import { ErpShell } from "../../../../../components/erp-shell";
import { loadAdminTemplateVariablesPageData } from "../../../../../lib/admin-page-data";

type AdminDocumentTemplateVariablesPageProps = {
  params: Promise<{ templateId: string }>;
};

export default async function AdminDocumentTemplateVariablesPage({ params }: AdminDocumentTemplateVariablesPageProps) {
  const { templateId } = await params;
  const pageData = await loadAdminTemplateVariablesPageData(templateId);

  return (
    <ErpShell title="템플릿 변수 맵" subtitle="source model, dataPath, owner-specific 여부를 검토하는 변수 전용 화면입니다.">
      <TemplateVariableTable variables={pageData.variables} />
    </ErpShell>
  );
}
