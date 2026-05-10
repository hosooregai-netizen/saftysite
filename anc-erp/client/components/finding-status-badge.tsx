import { StatusBadge } from "./status-badge";

type FindingStatusBadgeProps = {
  status: string;
};

const statusMap: Record<string, { tone: "review" | "warning" | "submitted" | "info" | "danger" | "success"; label: string }> = {
  open: { tone: "warning", label: "미조치" },
  action_requested: { tone: "review", label: "조치 요청" },
  verified: { tone: "success", label: "확인 완료" },
  rejected: { tone: "danger", label: "반려" },
  closed: { tone: "submitted", label: "종결" },
};

export function FindingStatusBadge({ status }: FindingStatusBadgeProps) {
  const config = statusMap[status] ?? { tone: "info" as const, label: status };
  return <StatusBadge tone={config.tone} label={config.label} />;
}
