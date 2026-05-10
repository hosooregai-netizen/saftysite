import { StatusBadge } from "./status-badge";

type CorrectiveActionStatusBadgeProps = {
  status: string;
};

const statusMap: Record<string, { tone: "review" | "warning" | "submitted" | "danger" | "success" | "info"; label: string }> = {
  draft: { tone: "info", label: "초안" },
  submitted: { tone: "review", label: "제출" },
  verified: { tone: "success", label: "확인" },
  rejected: { tone: "danger", label: "반려" },
};

export function CorrectiveActionStatusBadge({ status }: CorrectiveActionStatusBadgeProps) {
  const config = statusMap[status] ?? { tone: "info" as const, label: status };
  return <StatusBadge tone={config.tone} label={config.label} />;
}
