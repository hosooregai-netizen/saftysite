import { ErpShell } from "../../../../../components/erp-shell";
import { loadAdminTemplatePreviewPageData } from "../../../../../lib/admin-page-data";

type AdminDocumentTemplatePreviewPageProps = {
  params: Promise<{ templateId: string }>;
};

export default async function AdminDocumentTemplatePreviewPage({ params }: AdminDocumentTemplatePreviewPageProps) {
  const { templateId } = await params;
  const pageData = await loadAdminTemplatePreviewPageData(templateId);

  return (
    <ErpShell title="템플릿 미리보기" subtitle="A4 문서 초안과 누락 필드를 발행 전에 함께 확인합니다.">
      <section className="feature-split">
        <article className="panel">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">Preview</p>
              <h3 className="panel-title">{pageData.detail.template.name}</h3>
            </div>
          </div>
          <div className="document-preview-sheet">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{pageData.previewText}</pre>
          </div>
        </article>
        <article className="panel">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">Missing Fields</p>
              <h3 className="panel-title">검토 필요 항목</h3>
            </div>
          </div>
          <div className="stack-list">
            {pageData.missingFields.length > 0 ? (
              pageData.missingFields.map((field) => (
                <article className="ops-item" key={`${field.field}-${field.reason}`}>
                  <div>
                    <strong>{field.field}</strong>
                    <span>{field.reason}</span>
                  </div>
                </article>
              ))
            ) : (
              <article className="ops-item">
                <div>
                  <strong>누락 없음</strong>
                  <span>현재 sample preview 기준 필수값 누락이 없습니다.</span>
                </div>
              </article>
            )}
          </div>
        </article>
      </section>
    </ErpShell>
  );
}
