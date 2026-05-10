import { TrashTable } from "../../../components/trash-table";
import { WebhardLeftRail } from "../../../components/webhard-left-rail";
import { WebhardShell } from "../../../components/webhard-shell";
import { loadTrashPageData } from "../../../lib/webhard-page-data";

export default async function WebhardTrashPage() {
  const pageData = await loadTrashPageData();

  return (
    <WebhardShell
      title="휴지통"
      subtitle="삭제 파일은 즉시 영구삭제하지 않고 복구 가능한 상태로 보관합니다."
      activeSection="trash"
      leftRail={<WebhardLeftRail activeView="trash" projectId="project-sample-001" />}
      folderTree={null}
      detailPanel={null}
    >
      <section className="hero-card webhard-trash-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Trash Review</p>
            <h2 className="hero-title">복구 전용 검토 보관함</h2>
            <p className="hero-subtitle">삭제 파일은 즉시 제거하지 않고, 최종본과 메일 첨부가 섞이지 않았는지 먼저 검토합니다.</p>
          </div>
          <div className="hero-badges">
            <span className="status danger">{pageData.items.length} files</span>
          </div>
        </div>
      </section>
      <TrashTable items={pageData.items} />
    </WebhardShell>
  );
}
