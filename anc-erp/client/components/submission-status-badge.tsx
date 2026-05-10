import { StatusBadge } from "./status-badge";

type SubmissionStatusBadgeProps = {
  status: string;
};

const toneMap: Record<string, Parameters<typeof StatusBadge>[0]["tone"]> = {
  draft: "neutral",
  submitted: "submitted",
  manual_submitted: "warning",
  received: "success",
  revision_requested: "danger",
  resubmitted: "info",
  archived: "neutral",
};

export function SubmissionStatusBadge({ status }: SubmissionStatusBadgeProps) {
  return <StatusBadge tone={toneMap[status] ?? "neutral"} label={status} />;
}
