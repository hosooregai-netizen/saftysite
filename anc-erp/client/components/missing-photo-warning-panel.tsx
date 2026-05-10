import type { PhotoLedgerWarning } from "../../packages/contracts/src";
import { MissingFieldPanel } from "./missing-field-panel";

type MissingPhotoWarningPanelProps = {
  warnings: PhotoLedgerWarning[];
};

export function MissingPhotoWarningPanel({ warnings }: MissingPhotoWarningPanelProps) {
  return (
    <MissingFieldPanel
      title="사진대지 경고"
      items={warnings.map((warning) => ({
        label: warning.code,
        reason: warning.message,
        severity: warning.severity === "danger" ? ("required" as const) : ("recommended" as const),
      }))}
    />
  );
}
