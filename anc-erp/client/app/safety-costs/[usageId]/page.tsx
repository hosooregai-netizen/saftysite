import { ErpShell } from "../../../components/erp-shell";
import { MissingFieldPanel } from "../../../components/missing-field-panel";
import { SafetyCostReportPreviewCard } from "../../../components/safety-cost-report-preview-card";
import { SafetyCostReviewPanel } from "../../../components/safety-cost-review-panel";
import { SafetyCostSyncToReportButton } from "../../../components/safety-cost-sync-to-report-button";
import { SafetyCostUsageForm } from "../../../components/safety-cost-usage-form";
import { SafetyCostUsageRateGauge } from "../../../components/safety-cost-usage-rate-gauge";
import { SafetyCostWarningPanel } from "../../../components/safety-cost-warning-panel";
import { StatusBadge } from "../../../components/status-badge";
import { loadSafetyCostDetailPageData } from "../../../lib/safety-cost-page-data";

type SafetyCostDetailPageProps = {
  params: Promise<{ usageId: string }>;
};

export default async function SafetyCostDetailPage({
  params,
}: SafetyCostDetailPageProps) {
  const { usageId } = await params;
  const pageData = await loadSafetyCostDetailPageData(usageId);
  const missingItems = pageData.validation.warnings.map((warning) => ({
    label: warning.type,
    reason: warning.message,
    severity:
      warning.severity === "danger" ? ("required" as const) : ("recommended" as const),
  }));

  return (
    <ErpShell
      title={`산안비 상세 · ${pageData.detail.ownerDisplayName}`}
      subtitle="계상금액, 사용금액, 사용률, 적정성 의견, 보고서 반영 상태를 함께 검토합니다."
    >
      <div className="section-stack">
        <section className="hero-card safety-cost-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Safety Cost Detail</p>
              <h2 className="hero-title">{pageData.detail.ownerDisplayName} 사용내용 검토본</h2>
              <p className="hero-subtitle">
                기준월, 관련근거, 적정성 의견, 증빙, 보고서 반영 이력을 한 화면에서 교차
                검토합니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge
                tone={pageData.dataSource === "api" ? "submitted" : "review"}
                label={pageData.dataSource === "api" ? "API 데이터" : "샘플 데이터"}
              />
              <StatusBadge tone="info" label={`증빙 ${pageData.detail.evidenceItems.length}건`} />
              <StatusBadge tone="warning" label={`검토 ${missingItems.length}건`} />
            </div>
          </div>
          <div className="hero-summary-grid">
            <div className="hero-summary-card">
              <span>계상금액</span>
              <strong>{pageData.detail.usage.calculatedAmount.toLocaleString()}원</strong>
            </div>
            <div className="hero-summary-card">
              <span>사용금액</span>
              <strong>{pageData.detail.usage.usedAmount.toLocaleString()}원</strong>
            </div>
            <div className="hero-summary-card">
              <span>문서 버전</span>
              <strong>{pageData.detail.documentVersion?.id ?? "미생성"}</strong>
            </div>
            <div className="hero-summary-card">
              <span>검토 이력</span>
              <strong>{pageData.detail.history.length}건</strong>
            </div>
          </div>
        </section>
        <section className="feature-split">
          <div className="section-stack">
            <SafetyCostUsageForm detail={pageData.detail} title="안전관리비 상세" />
            <SafetyCostUsageRateGauge
              usageId={pageData.detail.usage.id}
              calculatedRate={pageData.detail.usage.usedRateCalculated}
              enteredRate={pageData.detail.usage.userEnteredRate}
            />
            <SafetyCostReportPreviewCard
              usage={pageData.detail.usage}
              ownerDisplayName={pageData.detail.ownerDisplayName}
            />
            <SafetyCostSyncToReportButton
              usage={pageData.detail.usage}
              documentId={pageData.detail.reportMapping?.documentId ?? pageData.detail.usage.syncedDocumentId}
            />
          </div>
          <div className="section-stack">
            {missingItems.length ? (
              <MissingFieldPanel title="확정 전 누락 / 검토 필요" items={missingItems} />
            ) : null}
            <SafetyCostWarningPanel
              usageId={pageData.detail.usage.id}
              warnings={pageData.validation.warnings}
            />
            <SafetyCostReviewPanel usage={pageData.detail.usage} reviews={pageData.detail.reviews} />
            <section className="panel">
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Report / Evidence Snapshot</p>
                  <h3 className="panel-title">문서 반영 메모</h3>
                </div>
                <StatusBadge
                  tone={pageData.detail.reportMapping ? "submitted" : "warning"}
                  label={pageData.detail.reportMapping ? "section 연결" : "section 미연결"}
                />
              </div>
              <div className="ops-card-list">
                <div className="ops-item">
                  <strong>관련근거</strong>
                  <span>{pageData.detail.usage.basisDocumentText ?? "산업안전보건관리비 사용내역서 미연결"}</span>
                </div>
                <div className="ops-item">
                  <strong>보고서 섹션</strong>
                  <span>
                    {pageData.detail.reportMapping?.sectionKey ?? "미연결"} ·{" "}
                    {pageData.detail.reportMapping?.documentId ?? "대상 문서 없음"}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </ErpShell>
  );
}
