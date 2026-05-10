import { ChecklistCategoryTabs } from "../../../components/checklist-category-tabs";
import { ChecklistProgressBar } from "../../../components/checklist-progress-bar";
import { ChecklistSessionHeader } from "../../../components/checklist-session-header";
import { ErpShell } from "../../../components/erp-shell";
import { loadChecklistSessionPageData } from "../../../lib/checklist-page-data";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ChecklistSessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  const pageData = await loadChecklistSessionPageData(sessionId);
  const goodCount = pageData.detail.results.filter((item) => item.result === "good").length;
  const cautionCount = pageData.detail.results.filter((item) => item.result === "caution").length;
  const badCount = pageData.detail.results.filter((item) => item.result === "bad").length;
  const notApplicableCount = pageData.detail.results.filter((item) => item.result === "not_applicable").length;
  const notCheckedCount = pageData.detail.results.filter((item) => item.result === "not_checked").length;
  const photoMissingCount = pageData.detail.results.filter((item) => ["caution", "bad"].includes(item.result) && item.photoIds.length === 0).length;
  return (
    <ErpShell title="Checklist Session" subtitle="세션 상태, 버전, 진행률과 연결 aggregate를 확인합니다.">
      <section className="section-stack">
        <ChecklistSessionHeader session={pageData.detail.session} template={pageData.detail.template} />
        <ChecklistProgressBar
          completed={pageData.detail.session.completedCount ?? 0}
          total={pageData.detail.session.resultCount ?? 0}
          goodCount={goodCount}
          cautionCount={cautionCount}
          badCount={badCount}
          notApplicableCount={notApplicableCount}
          notCheckedCount={notCheckedCount}
          photoMissingCount={photoMissingCount}
        />
        <ChecklistCategoryTabs categories={pageData.detail.categories} />
      </section>
    </ErpShell>
  );
}
