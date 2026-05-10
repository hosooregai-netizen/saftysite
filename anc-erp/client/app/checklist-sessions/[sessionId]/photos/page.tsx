import { ChecklistPhotoGrid } from "../../../../components/checklist-photo-grid";
import { ChecklistPhotoUploader } from "../../../../components/checklist-photo-uploader";
import { ErpShell } from "../../../../components/erp-shell";
import { loadChecklistSessionPageData } from "../../../../lib/checklist-page-data";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ChecklistPhotosPage({ params }: PageProps) {
  const { sessionId } = await params;
  const pageData = await loadChecklistSessionPageData(sessionId);
  return (
    <ErpShell title="체크리스트 사진" subtitle="결과별 현장사진과 사진 업로드 API 연결을 함께 검토합니다.">
      <section className="feature-split">
        <ChecklistPhotoUploader
          resultId={pageData.detail.results[2]?.id ?? pageData.detail.results[0].id}
          photos={pageData.detail.photos}
        />
        <ChecklistPhotoGrid photos={pageData.detail.photos} />
      </section>
    </ErpShell>
  );
}
