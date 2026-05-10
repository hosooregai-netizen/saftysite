import { ErpShell } from "../../../../../../components/erp-shell";
import { MissingFieldPanel } from "../../../../../../components/missing-field-panel";
import { SafetyCostReportPreviewCard } from "../../../../../../components/safety-cost-report-preview-card";
import { SafetyCostSyncToReportButton } from "../../../../../../components/safety-cost-sync-to-report-button";
import { SafetyCostWarningPanel } from "../../../../../../components/safety-cost-warning-panel";
import { StatusBadge } from "../../../../../../components/status-badge";
import { loadDocumentSafetyCostPageData } from "../../../../../../lib/safety-cost-page-data";

type DocumentSafetyCostSectionPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function DocumentSafetyCostSectionPage({
  params,
}: DocumentSafetyCostSectionPageProps) {
  const { documentId } = await params;
  const pageData = await loadDocumentSafetyCostPageData(documentId);
  const missingItems = pageData.payload.warnings.map((warning) => ({
    label: warning.type,
    reason: warning.message,
    severity:
      warning.severity === "danger" ? ("required" as const) : ("recommended" as const),
  }));

  return (
    <ErpShell
      title={`보고서 산안비 섹션 · ${documentId}`}
      subtitle="Document section에 반영된 산업안전보건관리비 사용내용을 검토합니다."
    >
      <div className="section-stack">
        <section className="hero-card safety-cost-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Document Section · safety_cost_usage</p>
              <h2 className="hero-title">보고서 산안비 섹션 검토</h2>
              <p className="hero-subtitle">
                회차 원본과 발주처별 산안비 사용내역을 문서 section에 반영한 결과를 A4
                미리보기 기준으로 확인합니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge
                tone={pageData.dataSource === "api" ? "submitted" : "review"}
                label={pageData.dataSource === "api" ? "API 데이터" : "샘플 데이터"}
              />
              <StatusBadge
                tone={pageData.payload.documentVersion ? "submitted" : "warning"}
                label={pageData.payload.documentVersion ? "버전 생성" : "버전 미생성"}
              />
              <StatusBadge tone="warning" label={`${missingItems.length}건 검토`} />
            </div>
          </div>
          <div className="hero-summary-grid">
            <div className="hero-summary-card">
              <span>문서 ID</span>
              <strong>{pageData.payload.documentId}</strong>
            </div>
            <div className="hero-summary-card">
              <span>반영 원장</span>
              <strong>{pageData.payload.section.safetyCostUsageId}</strong>
            </div>
            <div className="hero-summary-card">
              <span>증빙</span>
              <strong>{pageData.payload.evidenceItems.length}건</strong>
            </div>
            <div className="hero-summary-card">
              <span>업데이트 시각</span>
              <strong>{pageData.payload.section.updatedAt.slice(0, 10)}</strong>
            </div>
          </div>
        </section>
        <section className="feature-split">
          <div className="section-stack">
            <SafetyCostReportPreviewCard
              usage={pageData.payload.usage}
              ownerDisplayName="발주처별 반영본"
            />
            <SafetyCostSyncToReportButton
              usage={pageData.payload.usage}
              documentId={pageData.payload.documentId}
            />
          </div>
          <div className="section-stack">
            {missingItems.length ? (
              <MissingFieldPanel title="문서 반영 전 확인" items={missingItems} />
            ) : null}
            <SafetyCostWarningPanel
              usageId={pageData.payload.usage.id}
              warnings={pageData.payload.warnings}
            />
            <section className="panel">
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Section Snapshot</p>
                  <h3 className="panel-title">문서 반영 문구</h3>
                </div>
                <StatusBadge tone="info" label={pageData.payload.section.sectionKey} />
              </div>
              <div className="ops-card-list">
                <div className="ops-item">
                  <strong>project_summary</strong>
                  <span>{pageData.payload.section.projectSummaryPhrase}</span>
                </div>
                <div className="ops-item">
                  <strong>implementation_confirmation</strong>
                  <span>{pageData.payload.section.implementationBudgetPhrase}</span>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </ErpShell>
  );
}
