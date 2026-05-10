import { StatusBadge } from "./status-badge";

type ApprovalStatusBadgeProps = {
  status: string;
};

const toneMap: Record<string, Parameters<typeof StatusBadge>[0]["tone"]> = {
  requested: "warning",
  in_review: "review",
  approved: "success",
  changes_requested: "danger",
  rejected: "danger",
  cancelled: "neutral",
  pending: "neutral",
  current: "info",
  completed: "success",
};

export function ApprovalStatusBadge({ status }: ApprovalStatusBadgeProps) {
  return <StatusBadge tone={toneMap[status] ?? "neutral"} label={status} />;
}
