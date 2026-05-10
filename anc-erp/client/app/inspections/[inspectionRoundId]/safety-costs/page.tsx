import { ErpShell } from "../../../../components/erp-shell";
import { MissingFieldPanel } from "../../../../components/missing-field-panel";
import { SafetyCostSummaryCard } from "../../../../components/safety-cost-summary-card";
import { SafetyCostUsageTable } from "../../../../components/safety-cost-usage-table";
import { StatusBadge } from "../../../../components/status-badge";
import { loadRoundSafetyCostsPageData } from "../../../../lib/safety-cost-page-data";

type SafetyCostsPageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function SafetyCostsPage({ params }: SafetyCostsPageProps) {
  const { inspectionRoundId } = await params;
  const pageData = await loadRoundSafetyCostsPageData(inspectionRoundId);
  const warningItems = pageData.items.flatMap((item) =>
    item.warnings.map((warning) => ({
      label: item.ownerDisplayName,
      reason: warning.message,
      severity:
        warning.severity === "danger" ? ("required" as const) : ("recommended" as const),
    })),
  );
  const confirmedCount = pageData.items.filter((item) =>
    ["confirmed", "synced_to_report"].includes(item.usage.status),
  ).length;
  const evidenceTotal = pageData.items.reduce(
    (sum, item) => sum + item.evidenceCount,
    0,
  );

  return (
    <ErpShell
      title={`회차 산안비 · ${inspectionRoundId}`}
      subtitle="InspectionRound 기준 발주처별 산업안전보건관리비 사용내역을 입력·검토합니다."
    >
      <div className="section-stack">
        <section className="hero-card safety-cost-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Inspection Round Safety Cost</p>
              <h2 className="hero-title">회차별 산안비 검토 대기열</h2>
              <p className="hero-subtitle">
                같은 점검회차 안에서 발주처별 금액, 증빙, 적정성 의견, 보고서 반영 준비도를
                함께 관리합니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone="info" label={`${pageData.items.length}개 발주처`} />
              <StatusBadge tone="submitted" label={`${confirmedCount}건 확정 / 반영`} />
              <StatusBadge tone="warning" label={`${warningItems.length}건 검토`} />
            </div>
          </div>
          <div className="hero-summary-grid">
            <div className="hero-summary-card">
              <span>증빙 파일</span>
              <strong>{evidenceTotal}건</strong>
            </div>
            <div className="hero-summary-card">
              <span>확정 / 반영 완료</span>
              <strong>{confirmedCount}건</strong>
            </div>
            <div className="hero-summary-card">
              <span>누락 / 경고</span>
              <strong>{warningItems.length}건</strong>
            </div>
            <div className="hero-summary-card">
              <span>문서 반영 기준</span>
              <strong>OwnerParty + 보고서 section</strong>
            </div>
          </div>
        </section>
        <section className="feature-split">
          <div className="section-stack">
            {pageData.items.map((item) => (
              <SafetyCostSummaryCard item={item} key={item.usage.id} />
            ))}
          </div>
          <div className="section-stack">
            {warningItems.length ? (
              <MissingFieldPanel title="회차 검토 전 확인" items={warningItems} />
            ) : null}
            <SafetyCostUsageTable items={pageData.items} title="점검회차 안전관리비 목록" />
          </div>
        </section>
      </div>
    </ErpShell>
  );
}
