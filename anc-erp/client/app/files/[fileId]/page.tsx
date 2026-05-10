import { FileClassificationSuggestionPanel } from "../../../components/file-classification-suggestion-panel";
import { FileDetailPanel } from "../../../components/file-detail-panel";
import { FilePreviewPanel } from "../../../components/file-preview-panel";
import { ShareLinkModal } from "../../../components/share-link-modal";
import { WebhardLeftRail } from "../../../components/webhard-left-rail";
import { WebhardShell } from "../../../components/webhard-shell";
import { loadFilePageData } from "../../../lib/webhard-page-data";

type FilePageProps = {
  params: Promise<{ fileId: string }>;
};

export default async function FilePage({ params }: FilePageProps) {
  const { fileId } = await params;
  const pageData = await loadFilePageData(fileId);

  return (
    <WebhardShell
      title={pageData.detail.file.fileName}
      subtitle="미리보기, 태그, 연결정보, 버전, 공유, 활동이력을 한 화면에서 검토합니다."
      leftRail={<WebhardLeftRail projectId={pageData.detail.file.projectId} />}
      folderTree={null}
      detailPanel={
        <div className="content-grid">
          <ShareLinkModal fileId={pageData.detail.file.id} projectId={pageData.detail.file.projectId} />
          <FileClassificationSuggestionPanel
            fileId={pageData.detail.file.id}
            suggestion={pageData.detail.suggestion}
          />
          <section className="missing-panel">
            <strong>검토 포인트</strong>
            <div className="missing-list">
              <div className="missing-item">
                <strong>문서형 파일</strong>
                <span>generated document, signed, submitted 파일은 버전과 잠금 상태를 먼저 확인합니다.</span>
              </div>
              <div className="missing-item">
                <strong>공유/제출 추적</strong>
                <span>공유 링크, 메일 저장, 제출 연결이 빠지면 후속 경로 추적이 약해집니다.</span>
              </div>
            </div>
          </section>
        </div>
      }
    >
      <FilePreviewPanel
        file={pageData.preview.file}
        previewPath={pageData.preview.previewPath}
        previewStatus={pageData.preview.previewStatus}
      />
      <FileDetailPanel detail={pageData.detail} />
    </WebhardShell>
  );
}
