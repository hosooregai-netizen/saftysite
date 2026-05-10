import { StatusBadge } from "./status-badge";

export function RiskRecurrenceBadge({ count }: { count: number }) {
  return <StatusBadge tone={count > 1 ? "danger" : "neutral"} label={count > 1 ? `반복 ${count}회` : "단일"} />;
}
