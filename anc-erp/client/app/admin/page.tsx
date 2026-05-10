import { AdminRecentActivity, AdminWarningList } from "../../components/admin-governance-components";
import { AdminAuditLogTable } from "../../components/admin-audit-log-table";
import { AdminStatCard } from "../../components/admin-stat-card";
import { ErpShell } from "../../components/erp-shell";
import { PromptTable } from "../../components/prompt-table";
import { StatusBadge } from "../../components/status-badge";
import { TemplateTable } from "../../components/template-table";
import { loadAdminDashboardPageData } from "../../lib/admin-page-data";

export default async function AdminPage() {
  const pageData = await loadAdminDashboardPageData();

  return (
    <ErpShell title="관리자 / 템플릿 / 프롬프트" subtitle="전역 운영 정책, 문서 템플릿 버전, 프롬프트 릴리즈를 Admin module에서 통제합니다.">
      <section className="hero-card admin-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Feature 13</p>
            <h2 className="hero-title">템플릿, 프롬프트, 체크리스트 운영 거버넌스</h2>
            <p className="hero-subtitle">
              published 버전 불변성, 검토 전 발행 차단, 감사로그 축적을 중심으로 문서 자동화 품질을 통제합니다.
            </p>
          </div>
          <div className="hero-badges">
            <StatusBadge tone="review" label="Admin module" />
            <StatusBadge tone="info" label="버전 스냅샷 고정" />
            <StatusBadge tone={pageData.summary.counts.failedPromptTests > 0 ? "warning" : "success"} label="발행 전 검증 게이트" />
          </div>
        </div>
        <div className="hero-summary-grid">
          <AdminStatCard label="active templates" value={`${pageData.summary.counts.activeTemplates}개`} helper="운영 반영된 문서 템플릿" />
          <AdminStatCard label="review templates" value={`${pageData.summary.counts.reviewTemplates}개`} helper="검토 대기 버전" />
          <AdminStatCard label="published prompts" value={`${pageData.summary.counts.publishedPrompts}개`} helper="현재 서비스 AI 적용본" />
          <AdminStatCard label="failed prompt tests" value={`${pageData.summary.counts.failedPromptTests}건`} helper="발행 차단 우선 검토" />
        </div>
        <div className="admin-governance-grid">
          <article className="admin-governance-card">
            <p className="card-eyebrow">Release Focus</p>
            <strong>이번 주 우선 검토</strong>
            <p className="card-copy">review 단계 템플릿과 테스트 실패 프롬프트를 먼저 정리한 뒤 publish하도록 작업 순서를 고정합니다.</p>
          </article>
          <article className="admin-governance-card">
            <p className="card-eyebrow">Snapshot Rule</p>
            <strong>기존 문서는 기존 버전 유지</strong>
            <p className="card-copy">새 정책 반영은 다음 생성 건부터만 적용하고, 이미 생성된 문서는 snapshot 기준으로 보존합니다.</p>
          </article>
          <article className="admin-governance-card">
            <p className="card-eyebrow">Audit Coverage</p>
            <strong>위험 작업은 모두 로그화</strong>
            <p className="card-copy">publish, rollback, permission 변경, legal clause 승인처럼 운영 영향이 큰 작업은 사유와 필드를 함께 남깁니다.</p>
          </article>
        </div>
      </section>
      <section className="admin-dashboard-layout">
        <div className="section-stack">
          <TemplateTable items={pageData.templates.slice(0, 3)} />
          <PromptTable items={pageData.prompts.slice(0, 3)} />
        </div>
        <div className="section-stack">
          <AdminWarningList warnings={pageData.summary.warnings} />
          <AdminRecentActivity logs={pageData.summary.recentLegalChanges} />
          <AdminAuditLogTable logs={pageData.summary.recentAuditLogs} title="최근 운영 변경" />
        </div>
      </section>
    </ErpShell>
  );
}
