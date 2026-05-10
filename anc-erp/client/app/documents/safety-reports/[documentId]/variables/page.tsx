import { ErpShell } from "../../../../../components/erp-shell";
import { MissingFieldPanel } from "../../../../../components/missing-field-panel";
import { ReportVariablePanel } from "../../../../../components/report-variable-panel";
import { loadSafetyReportVariablesPageData } from "../../../../../lib/safety-report-page-data";

type SafetyReportVariablesPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyReportVariablesPage({
  params,
}: SafetyReportVariablesPageProps) {
  const { documentId } = await params;
  const pageData = await loadSafetyReportVariablesPageData(documentId);

  return (
    <ErpShell
      title={`변수 관리 · ${documentId}`}
      subtitle="owner-specific 변수와 누락 데이터 원인을 문서 편집 전에 먼저 확인합니다."
    >
      <section className="feature-split">
        <ReportVariablePanel payload={pageData.variables} />
        <MissingFieldPanel
          items={pageData.missingFields.map((item) => ({
            label: String((item as { label?: string; field?: string }).label ?? (item as { field?: string }).field ?? "field"),
            reason: String((item as { reason?: string; message?: string }).reason ?? (item as { message?: string }).message ?? ""),
            severity: (item as { severity?: string }).severity === "required" ? "required" : "recommended",
          }))}
        />
      </section>
    </ErpShell>
  );
}

