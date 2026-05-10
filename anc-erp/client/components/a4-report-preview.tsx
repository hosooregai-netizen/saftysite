import type { SafetyReportSection } from "../../packages/contracts/src";
import { A4Preview } from "./a4-preview";

type A4ReportPreviewProps = {
  title?: string;
  sections: SafetyReportSection[];
  watermark?: string;
};

export function A4ReportPreview({
  title = "공사안전보건대장 이행확인 보고서",
  sections,
  watermark = "AI DRAFT",
}: A4ReportPreviewProps) {
  const completedCount = sections.filter((section) =>
    ["edited", "review", "confirmed", "locked"].includes(section.status),
  ).length;

  return (
    <div className="report-a4-frame">
      <div className="report-a4-strip">
        <span>문서형 미리보기</span>
        <strong>
          {completedCount}/{sections.length} sections ready
        </strong>
      </div>
      <A4Preview
        title={title}
        watermark={watermark}
        rows={sections.slice(0, 8).map((section) => ({
          label: section.title,
          status: section.status,
          note: String(section.content.summary ?? "검토 필요"),
        }))}
      />
    </div>
  );
}
