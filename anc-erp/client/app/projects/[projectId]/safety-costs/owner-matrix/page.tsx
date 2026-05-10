import { ErpShell } from "../../../../../components/erp-shell";
import { MissingFieldPanel } from "../../../../../components/missing-field-panel";
import { SafetyCostOwnerMatrix } from "../../../../../components/safety-cost-owner-matrix";
import { SafetyCostUsageRateGauge } from "../../../../../components/safety-cost-usage-rate-gauge";
import { StatusBadge } from "../../../../../components/status-badge";
import { loadProjectSafetyCostOwnerMatrixPageData } from "../../../../../lib/safety-cost-page-data";

type ProjectSafetyCostOwnerMatrixPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSafetyCostOwnerMatrixPage({
  params,
}: ProjectSafetyCostOwnerMatrixPageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectSafetyCostOwnerMatrixPageData(projectId);
  const activeRows = pageData.matrix.rows.filter((row) => row.usage);
  const warningItems = pageData.matrix.rows.flatMap((row) =>
    row.warnings.map((warning) => ({
      label: row.ownerDisplayName,
      reason: warning.message,
      severity:
        warning.severity === "danger" ? ("required" as const) : ("recommended" as const),
    })),
  );
  const syncedCount = activeRows.filter(
    (row) => row.usage?.status === "synced_to_report",
  ).length;
  const primaryUsage = activeRows[0]?.usage ?? null;

  return (
    <ErpShell
      title={`발주처별 산안비 매트릭스 · ${projectId}`}
      subtitle="발주처별 계상금액, 사용금액, 사용률, 증빙, 적정성 상태를 비교합니다."
    >
      <div className="section-stack">
        <section className="hero-card safety-cost-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Owner Matrix</p>
              <h2 className="hero-title">발주처별 비교 매트릭스</h2>
              <p className="hero-subtitle">
                OwnerParty 기준으로 계상금액, 사용률, 증빙, 적정성 상태를 같은 눈높이에서
                비교합니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone="info" label={`${pageData.matrix.rows.length}개 발주처`} />
              <StatusBadge tone="submitted" label={`${syncedCount}개 보고서 반영`} />
              <StatusBadge tone="warning" label={`${warningItems.length}건 주의`} />
            </div>
          </div>
          <div className="hero-summary-grid">
            <div className="hero-summary-card">
              <span>활성 원장</span>
              <strong>{activeRows.length}건</strong>
            </div>
            <div className="hero-summary-card">
              <span>보고서 반영 완료</span>
              <strong>{syncedCount}건</strong>
            </div>
            <div className="hero-summary-card">
              <span>검토 필요</span>
              <strong>{warningItems.length}건</strong>
            </div>
            <div className="hero-summary-card">
              <span>비교 기준</span>
              <strong>금액 · 사용률 · 증빙 · 적정성</strong>
            </div>
          </div>
        </section>
        {warningItems.length ? (
          <MissingFieldPanel title="발주처별 우선 검토 항목" items={warningItems} />
        ) : null}
        <SafetyCostOwnerMatrix matrix={pageData.matrix} />
        {primaryUsage ? (
          <SafetyCostUsageRateGauge
            usageId={primaryUsage.id}
            calculatedRate={primaryUsage.usedRateCalculated}
            enteredRate={primaryUsage.userEnteredRate}
          />
        ) : null}
      </div>
    </ErpShell>
  );
}
