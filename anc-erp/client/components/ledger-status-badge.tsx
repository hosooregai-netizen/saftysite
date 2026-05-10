import { StatusBadge } from "./status-badge";

const toneMap: Record<string, "neutral" | "review" | "warning" | "info" | "success" | "danger" | "submitted"> = {
  draft: "neutral",
  review: "review",
  confirmed: "success",
  exported: "submitted",
  archived: "info",
};

export function LedgerStatusBadge({ label }: { label: string }) {
  return <StatusBadge tone={toneMap[label] ?? "neutral"} label={label} />;
}
