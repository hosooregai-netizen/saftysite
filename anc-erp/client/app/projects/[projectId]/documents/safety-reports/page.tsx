import Link from "next/link";

import { ErpShell } from "../../../../../components/erp-shell";
import { SafetyReportTable } from "../../../../../components/safety-report-table";
import { StatusBadge } from "../../../../../components/status-badge";
import { loadProjectSafetyReportsPageData } from "../../../../../lib/safety-report-page-data";

type ProjectSafetyReportsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSafetyReportsPage({
  params,
}: ProjectSafetyReportsPageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectSafetyReportsPageData(projectId);

  return (
    <ErpShell
      title="공사안전보건대장 이행확인 보고서"
      subtitle="프로젝트 문서함에서 발주처별 보고서 초안, 검토본, 최종본 상태를 함께 관리합니다."
    >
      <div className="feature-split">
        <div className="section-stack">
          <section className="hero-card report-hub-hero">
            <div className="hero-head">
              <div>
                <p className="card-eyebrow">Feature 04 · Project Documents</p>
                <h2 className="hero-title">발주처별 이행확인 보고서 허브</h2>
                <p className="hero-subtitle">
                  Project 안에서 목록을 관리하되, 실제 문서 snapshot과 승인/제출 상태는
                  DocumentInstance에 보존합니다.
                </p>
              </div>
              <div className="hero-badges">
                <StatusBadge
                  tone={pageData.dataSource === "api" ? "success" : "review"}
                  label={pageData.dataSource === "api" ? "API 연결" : "샘플 fallback"}
                />
                <StatusBadge tone="info" label={`${pageData.items.length}건 문서`} />
              </div>
            </div>
            <div className="hero-summary-grid">
              <article className="hero-summary-card">
                <span>초안/검토</span>
                <strong>
                  {pageData.items.filter((item) => item.document.status !== "submitted").length}건
                </strong>
              </article>
              <article className="hero-summary-card">
                <span>제출 완료</span>
                <strong>
                  {pageData.items.filter((item) => item.document.status === "submitted").length}건
                </strong>
              </article>
              <article className="hero-summary-card">
                <span>누락 필수값</span>
                <strong>
                  {pageData.items.reduce((sum, item) => sum + item.missingRequiredCount, 0)}건
                </strong>
              </article>
              <article className="hero-summary-card">
                <span>검토 경고</span>
                <strong>
                  {pageData.items.reduce((sum, item) => sum + item.warningCount, 0)}건
                </strong>
              </article>
            </div>
          </section>
          <SafetyReportTable items={pageData.items} />
        </div>
        <div className="section-stack">
          <section className="panel report-quick-panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Quick Actions</p>
                <h3 className="panel-title">문서 작업 빠른 진입</h3>
              </div>
            </div>
            <div className="ops-card-list">
              <article className="ops-item">
                <strong>새 보고서 초안</strong>
                <span>점검회차와 발주처 branch를 선택해 linked data 기반 초안을 만듭니다.</span>
                <Link className="inline-link" href={`/projects/${projectId}/documents/safety-reports/new`}>
                  초안 생성 열기
                </Link>
              </article>
              <article className="ops-item">
                <strong>검토 우선순위</strong>
                <span>
                  필수 누락 {pageData.items.reduce((sum, item) => sum + item.missingRequiredCount, 0)}건,
                  경고 {pageData.items.reduce((sum, item) => sum + item.warningCount, 0)}건
                </span>
              </article>
              <article className="ops-item">
                <strong>관리 기준</strong>
                <span>문서번호 / 회차 / 발주처 / 상태를 항상 함께 보고 export 가능 여부를 결정합니다.</span>
              </article>
            </div>
          </section>
        </div>
      </div>
    </ErpShell>
  );
}
