import { StatusBadge } from "./status-badge";

export function PlanStatusBadge({ label }: { label: string }) {
  const tone = label === "confirmed" || label === "exported" ? "success" : label === "draft" ? "warning" : "info";
  return <StatusBadge tone={tone} label={label} />;
}
