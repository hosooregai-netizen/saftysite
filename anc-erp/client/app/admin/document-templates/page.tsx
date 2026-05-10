import { ErpShell } from "../../../components/erp-shell";
import { TemplateTable } from "../../../components/template-table";
import { loadAdminTemplatesPageData } from "../../../lib/admin-page-data";

export default async function AdminDocumentTemplatesPage() {
  const pageData = await loadAdminTemplatesPageData();

  return (
    <ErpShell title="문서 템플릿" subtitle="문서별 body template, variable map, publish lifecycle을 Admin module에서 관리합니다.">
      <section className="hero-card approval-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Document Templates</p>
            <h2 className="hero-title">템플릿 버전 운영</h2>
            <p className="hero-subtitle">문서 생성 시점에는 snapshot version만 사용하고, 운영 변경은 새 버전 생성과 publish로만 진행합니다.</p>
          </div>
        </div>
      </section>
      <TemplateTable items={pageData.items} />
    </ErpShell>
  );
}
