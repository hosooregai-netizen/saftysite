import { StatusBadge } from "./status-badge";

type OwnerReportBranchBadgeProps = {
  ownerDisplayName: string;
};

export function OwnerReportBranchBadge({
  ownerDisplayName,
}: OwnerReportBranchBadgeProps) {
  return <StatusBadge tone="info" label={ownerDisplayName} />;
}

