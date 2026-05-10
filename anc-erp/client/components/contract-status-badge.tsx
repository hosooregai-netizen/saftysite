import type { ContractStatus } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const tone =
    status === "signed"
      ? "success"
      : status === "sent"
        ? "submitted"
        : status === "archived"
          ? "neutral"
          : "review";
  const label =
    status === "signed"
      ? "날인 완료"
      : status === "sent"
        ? "발송 완료"
        : status === "archived"
          ? "보관"
          : "초안";
  return <StatusBadge tone={tone} label={label} />;
}
