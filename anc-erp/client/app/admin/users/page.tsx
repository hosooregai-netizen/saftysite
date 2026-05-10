import { PermissionGroupTabs } from "../../../components/admin-governance-components";
import { ErpShell } from "../../../components/erp-shell";
import { PermissionMatrix } from "../../../components/permission-matrix";
import { UserTable } from "../../../components/user-table";
import { loadAdminUsersPageData } from "../../../lib/admin-page-data";

export default async function AdminUsersPage() {
  const pageData = await loadAdminUsersPageData();
  return (
    <ErpShell title="관리자 계정" subtitle="관리자 계정, 역할, 권한 매트릭스를 운영 정책과 함께 관리합니다.">
      <UserTable users={pageData.users} roles={pageData.roles} />
      <PermissionGroupTabs permissions={pageData.permissions} />
      <PermissionMatrix roles={pageData.roles} permissions={pageData.permissions} />
    </ErpShell>
  );
}
