import { ChecklistItemCard } from "../../../../../components/checklist-item-card";
import { ErpShell } from "../../../../../components/erp-shell";
import { MobileChecklistBottomBar } from "../../../../../components/mobile-checklist-bottom-bar";
import { OfflineDraftIndicator } from "../../../../../components/offline-draft-indicator";
import { StatusBadge } from "../../../../../components/status-badge";
import { loadChecklistRoundPageData } from "../../../../../lib/checklist-page-data";

type PageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function ChecklistMobilePage({ params }: PageProps) {
  const { inspectionRoundId } = await params;
  const pageData = await loadChecklistRoundPageData(inspectionRoundId);
  return (
    <ErpShell title="체크리스트 모바일 입력" subtitle="장갑을 낀 상태에서도 누를 수 있도록 큰 결과 버튼과 sticky draft bar 중심으로 구성합니다.">
      <section className="section-stack">
        <section className="hero-card checklist-mobile-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Mobile Checklist</p>
              <h2 className="hero-title">리움미술관 승강기 교체공사</h2>
              <p className="hero-subtitle">
                {pageData.detail.session.inspectionRoundId} · 현재 카테고리 {pageData.detail.categories[0]?.title ?? "공통"}
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone="info" label={`${Math.round((pageData.detail.session.progressRate ?? 0) * 100)}%`} />
              <StatusBadge tone="review" label={pageData.detail.session.status} />
            </div>
          </div>
        </section>
        <OfflineDraftIndicator draft={pageData.detail.mobileDrafts[0] ?? null} />
        {pageData.detail.results.map((result) => (
          <ChecklistItemCard key={result.id} result={result} />
        ))}
        <MobileChecklistBottomBar
          sessionId={pageData.detail.session.id}
          draftId={pageData.detail.mobileDrafts[0]?.id ?? "checklist-mobile-draft-sample-001"}
        />
      </section>
    </ErpShell>
  );
}
