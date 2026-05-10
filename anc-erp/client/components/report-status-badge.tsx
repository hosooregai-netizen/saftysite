import { StatusBadge } from "./status-badge";

type ReportStatusBadgeProps = {
  status: string;
};

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  const tone =
    status === "submitted"
      ? "submitted"
      : status === "exported"
        ? "success"
        : status === "confirmed"
          ? "info"
          : status === "review"
            ? "warning"
            : "review";
  return <StatusBadge tone={tone} label={status} />;
}

