import { ApprovalTemplateTable } from "../../../components/approval-template-table";
import { SubmissionDetailCard } from "../../../components/admin-governance-components";
import { ErpShell } from "../../../components/erp-shell";
import { loadAdminApprovalTemplatesPageData } from "../../../lib/admin-page-data";

export default async function ApprovalTemplatesAdminPage() {
  const pageData = await loadAdminApprovalTemplatesPageData();
  return (
    <ErpShell title="Approval Templates" subtitle="문서 유형별 결재선 템플릿 관리 화면입니다.">
      <section className="hero-card approval-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Approval Template Admin</p>
            <h2 className="hero-title">문서 유형별 결재선 템플릿 운영</h2>
            <p className="hero-subtitle">문서 컨테이너 안에서 재사용되는 결재선을 중앙 관리하되, 실제 workflow 소유권은 문서에 남겨둡니다.</p>
          </div>
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>template count</span>
            <strong>{pageData.templates.length}개</strong>
          </article>
          <article className="hero-summary-card">
            <span>published</span>
            <strong>{pageData.templates.filter((item) => item.template.status === "published").length}개</strong>
          </article>
          <article className="hero-summary-card">
            <span>draft</span>
            <strong>{pageData.templates.filter((item) => item.template.status !== "published").length}개</strong>
          </article>
          <article className="hero-summary-card">
            <span>linked assets</span>
            <strong>{pageData.assets.length}개</strong>
          </article>
        </div>
      </section>
      <ApprovalTemplateTable items={pageData.templates} />
      {pageData.templates[0] ? <SubmissionDetailCard detail={pageData.templates[0]} /> : null}
      <section className="panel">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">Approval Templates</p>
            <h3 className="panel-title">결재 템플릿</h3>
            <p className="card-copy">문서 유형, 단계 수, 상태를 한 번에 읽는 관리자 리스트입니다.</p>
          </div>
        </div>
        <div className="stack-list">
          {pageData.templates.map((item) => (
            <article className="ops-item" key={item.template.id}>
              <strong>{item.template.name}</strong>
              <span>{item.template.documentType}</span>
              <span>{item.steps.length}단계 · {item.template.status}</span>
            </article>
          ))}
        </div>
      </section>
    </ErpShell>
  );
}
