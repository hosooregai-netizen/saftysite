import type { ProjectStatus } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type ProjectStatusBadgeProps = {
  status: ProjectStatus;
};

const statusToneMap: Record<ProjectStatus, "info" | "success" | "warning" | "neutral"> = {
  planning: "info",
  active: "success",
  paused: "warning",
  completed: "neutral",
  archived: "neutral",
};

const statusLabelMap: Record<ProjectStatus, string> = {
  planning: "등록 준비",
  active: "진행중",
  paused: "일시중지",
  completed: "완료",
  archived: "보관",
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return <StatusBadge tone={statusToneMap[status]} label={statusLabelMap[status]} />;
}
