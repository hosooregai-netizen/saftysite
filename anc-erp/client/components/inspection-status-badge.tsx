import type { InspectionRoundStatus } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

const toneMap: Record<InspectionRoundStatus, "neutral" | "info" | "success" | "warning" | "danger" | "review"> = {
  planned: "neutral",
  scheduled: "info",
  in_progress: "info",
  checked: "success",
  review: "review",
  report_ready: "warning",
  submitted: "success",
  closed: "success",
  cancelled: "danger",
};

export function InspectionStatusBadge({ status }: { status: InspectionRoundStatus }) {
  return <StatusBadge tone={toneMap[status]} label={status} />;
}
