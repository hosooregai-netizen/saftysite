import type { MissingField } from "../../packages/contracts/src";
import { MissingFieldPanel } from "./missing-field-panel";

export function LedgerMissingFieldPanel({ items }: { items: MissingField[] }) {
  return (
    <MissingFieldPanel
      title="대장 누락 정보"
      items={items.map((item) => ({
        label: item.label ?? item.field,
        reason: item.message,
        severity: item.severity === "required" ? "required" : "recommended",
      }))}
    />
  );
}
