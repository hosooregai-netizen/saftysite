import { StatusBadge } from "./status-badge";

type FindingRiskBadgeProps = {
  riskType?: string | null;
};

const riskMap: Record<string, { tone: "danger" | "warning" | "info"; label: string }> = {
  fall: { tone: "danger", label: "추락" },
  electrical: { tone: "warning", label: "전기" },
  housekeeping: { tone: "info", label: "정리정돈" },
};

export function FindingRiskBadge({ riskType }: FindingRiskBadgeProps) {
  const config = riskMap[riskType ?? ""] ?? { tone: "info" as const, label: riskType ?? "미분류" };
  return <StatusBadge tone={config.tone} label={config.label} />;
}
