import { ErpShell } from "../../../../components/erp-shell";
import { MissingFieldPanel } from "../../../../components/missing-field-panel";
import { SafetyCostSummaryCard } from "../../../../components/safety-cost-summary-card";
import { SafetyCostUsageTable } from "../../../../components/safety-cost-usage-table";
import { StatusBadge } from "../../../../components/status-badge";
import { loadProjectSafetyCostsPageData } from "../../../../lib/safety-cost-page-data";

type ProjectSafetyCostsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSafetyCostsPage({
  params,
}: ProjectSafetyCostsPageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectSafetyCostsPageData(projectId);
  const primary = pageData.items[0];
  const totalCalculatedAmount = pageData.items.reduce(
    (sum, item) => sum + item.usage.calculatedAmount,
    0,
  );
  const totalUsedAmount = pageData.items.reduce(
    (sum, item) => sum + item.usage.usedAmount,
    0,
  );
  const confirmedCount = pageData.items.filter((item) =>
    ["confirmed", "synced_to_report"].includes(item.usage.status),
  ).length;
  const warningItems = pageData.items.flatMap((item) =>
    item.warnings.map((warning) => ({
      label: item.ownerDisplayName,
      reason: warning.message,
      severity:
        warning.severity === "danger" ? ("required" as const) : ("recommended" as const),
    })),
  );

  return (
    <ErpShell
      title={`프로젝트 산안비 · ${projectId}`}
      subtitle="프로젝트 전체 발주처의 산업안전보건관리비 사용내역을 비교 조회합니다."
    >
      <div className="section-stack">
        <section className="hero-card safety-cost-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Feature 07 · Project Safety Cost Hub</p>
              <h2 className="hero-title">발주처별 산업안전보건관리비 운영 현황</h2>
              <p className="hero-subtitle">
                프로젝트 단위에서 발주처별 계상금액, 사용금액, 증빙, 보고서 반영 상태를
                한 번에 비교합니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge
                tone={pageData.dataSource === "api" ? "submitted" : "review"}
                label={pageData.dataSource === "api" ? "API 데이터" : "샘플 데이터"}
              />
              <StatusBadge tone="info" label={`${pageData.items.length}개 발주처`} />
              <StatusBadge tone="warning" label={`${warningItems.length}건 검토`} />
            </div>
          </div>
          <div className="hero-summary-grid">
            <div className="hero-summary-card">
              <span>총 계상금액</span>
              <strong>{totalCalculatedAmount.toLocaleString()}원</strong>
            </div>
            <div className="hero-summary-card">
              <span>총 사용금액</span>
              <strong>{totalUsedAmount.toLocaleString()}원</strong>
            </div>
            <div className="hero-summary-card">
              <span>확정 / 반영 완료</span>
              <strong>
                {confirmedCount} / {pageData.items.length}
              </strong>
            </div>
            <div className="hero-summary-card">
              <span>우선 검토 건수</span>
              <strong>{warningItems.length}건</strong>
            </div>
          </div>
        </section>
        <section className="feature-split">
          <div className="section-stack">
            {primary ? <SafetyCostSummaryCard item={primary} /> : null}
          </div>
          <div className="section-stack">
            {warningItems.length ? (
              <MissingFieldPanel title="프로젝트 산안비 누락 / 검토 우선순위" items={warningItems} />
            ) : (
              <section className="panel">
                <div className="card-head">
                  <div>
                    <p className="card-eyebrow">Project Safety Cost Ops</p>
                    <h3 className="panel-title">오늘 확인할 항목</h3>
                  </div>
                  <StatusBadge tone="success" label="즉시 조치 없음" />
                </div>
                <div className="ops-card-list">
                  <div className="ops-item">
                    <strong>발주처별 증빙 정리</strong>
                    <span>시공사 제출본, 기준월, 관련근거를 보고서 반영 전 동일하게 맞춥니다.</span>
                  </div>
                  <div className="ops-item">
                    <strong>사용률 재확인</strong>
                    <span>입력 사용률과 시스템 계산값이 다르면 검토 의견에 사유를 함께 남깁니다.</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        </section>
        <SafetyCostUsageTable items={pageData.items} title="프로젝트 안전관리비 목록" />
      </div>
    </ErpShell>
  );
}
