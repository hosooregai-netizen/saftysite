import { AdminAuditLogTable } from "../../../components/admin-audit-log-table";
import { ErpShell } from "../../../components/erp-shell";
import { loadAdminAuditLogsPageData } from "../../../lib/admin-page-data";

export default async function AdminAuditLogsPage() {
  const pageData = await loadAdminAuditLogsPageData();
  return (
    <ErpShell title="관리자 감사로그" subtitle="권한, 템플릿, 프롬프트, 법령 변경 이력을 targetType 기준으로 추적합니다.">
      <AdminAuditLogTable logs={pageData.logs} />
    </ErpShell>
  );
}
