import { isAdminUserRole, isFieldAgentUserRole } from '@/lib/admin';
import type { SafetyUser } from '@/types/backend';
import type { InspectionSite } from '@/types/inspectionSession';

interface ReportArchivePermissionInput {
  currentSite: InspectionSite | null | undefined;
  currentUser: Pick<SafetyUser, 'role'> | null | undefined;
}

export function canArchiveReportsForSite({
  currentSite,
  currentUser,
}: ReportArchivePermissionInput): boolean {
  if (!currentUser) return false;
  if (isAdminUserRole(currentUser.role)) return true;
  return isFieldAgentUserRole(currentUser.role) && Boolean(currentSite?.id);
}
