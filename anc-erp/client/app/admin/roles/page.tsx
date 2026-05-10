import { PermissionGroupTabs, RoleForm } from "../../../components/admin-governance-components";
import { ErpShell } from "../../../components/erp-shell";
import { PermissionMatrix } from "../../../components/permission-matrix";
import { loadAdminRolesPageData } from "../../../lib/admin-page-data";

export default async function AdminRolesPage() {
  const pageData = await loadAdminRolesPageData();
  return (
    <ErpShell title="역할 / 권한" subtitle="system role과 custom role의 permission key를 그룹 단위로 조정합니다.">
      <RoleForm />
      <PermissionGroupTabs permissions={pageData.permissions} />
      <PermissionMatrix roles={pageData.roles} permissions={pageData.permissions} />
    </ErpShell>
  );
}
