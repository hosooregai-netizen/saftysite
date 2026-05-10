import { ErpShell } from "../../../components/erp-shell";
import { ChecklistTemplateTable } from "../../../components/checklist-template-table";
import { loadAdminChecklistsPageData } from "../../../lib/admin-page-data";

export default async function ChecklistTemplateAdminPage() {
  const pageData = await loadAdminChecklistsPageData();
  return (
    <ErpShell title="체크리스트 템플릿 관리자" subtitle="표준 점검표와 버전 관리는 관리자 거버넌스 화면에서 다룹니다.">
      <ChecklistTemplateTable templates={pageData.templates} />
    </ErpShell>
  );
}
