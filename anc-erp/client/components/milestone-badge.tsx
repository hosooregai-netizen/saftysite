import { StatusBadge } from "./status-badge";

export function MilestoneBadge({ label }: { label?: string | null }) {
  if (!label) {
    return <StatusBadge tone="neutral" label="milestone 없음" />;
  }
  return <StatusBadge tone="warning" label={label} />;
}
