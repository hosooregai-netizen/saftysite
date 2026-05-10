import { StatusBadge } from "./status-badge";

type SafetyCostStatusBadgeProps = {
  status: string;
};

const statusMap: Record<string, { tone: "review" | "warning" | "submitted" | "info" | "danger" | "success"; label: string }> = {
  draft: { tone: "info", label: "초안" },
  needs_evidence: { tone: "warning", label: "증빙 필요" },
  review: { tone: "review", label: "검토 중" },
  confirmed: { tone: "success", label: "확정" },
  synced_to_report: { tone: "submitted", label: "보고서 반영" },
  rejected: { tone: "danger", label: "반려" },
  archived: { tone: "info", label: "보관" },
};

export function SafetyCostStatusBadge({ status }: SafetyCostStatusBadgeProps) {
  const config = statusMap[status] ?? { tone: "info" as const, label: status };
  return <StatusBadge tone={config.tone} label={config.label} />;
}
