type StatusTone =
  | "neutral"
  | "review"
  | "warning"
  | "info"
  | "success"
  | "danger"
  | "submitted";

type StatusBadgeProps = {
  tone: StatusTone;
  label: string;
};

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return <span className={`status ${tone}`}>{label}</span>;
}
