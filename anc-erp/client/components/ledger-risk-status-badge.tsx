import { StatusBadge } from "./status-badge";

const toneMap: Record<string, "neutral" | "review" | "warning" | "info" | "success" | "danger" | "submitted"> = {
  identified: "neutral",
  planned: "info",
  in_control: "success",
  needs_action: "warning",
  repeated: "danger",
  closed: "submitted",
};

export function LedgerRiskStatusBadge({ label }: { label: string }) {
  return <StatusBadge tone={toneMap[label] ?? "neutral"} label={label} />;
}
