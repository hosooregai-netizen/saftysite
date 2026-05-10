import type {
  ProjectExtractionResult,
  ProjectExtractionValidationResult,
} from "../../packages/contracts/src";
import { DocumentPreview } from "./document-preview";
import { StatusBadge } from "./status-badge";

export function ProjectExtractionPreview({
  preview,
  validation,
  projectId,
}: {
  preview: ProjectExtractionResult;
  validation: ProjectExtractionValidationResult | null;
  projectId: string;
}) {
  const ownerRows = preview.projectParties
    .filter((item) => item.role === "owner")
    .map((item) => ({
      label: item.organizationName,
      status: item.requiresSeparateReport == null ? "확인 필요" : item.requiresSeparateReport ? "별도 제출" : "공통 제출",
      note:
        item.reportRecipient == null
          ? "보고서 수신 여부 확인 필요"
          : item.reportRecipient
            ? "보고서 수신 대상"
            : "수신 미대상",
    }));

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ProjectExtractionPreview</p>
          <h3>문서에서 정보 추출</h3>
          <p>계약서나 총괄현황에서 추출한 초안을 preview 상태로 보여주고, 원장 반영 전 검토 경고를 분리합니다.</p>
        </div>
        <StatusBadge tone="review" label="AI Draft Only" />
      </div>

      <div className="feature-split">
        <div className="feature-side-stack">
          <div className="metric-stack">
            <div className="metric-row emphasized">
              <span>추출된 프로젝트명</span>
              <strong>{preview.project.projectName ?? "미확인"}</strong>
            </div>
            <div className="metric-row">
              <span>추출된 발주처</span>
              <strong>{preview.projectParties.filter((item) => item.role === "owner").length}곳</strong>
            </div>
            <div className="metric-row">
              <span>추출된 담당자</span>
              <strong>{preview.contacts.length}명</strong>
            </div>
            <div className="metric-row">
              <span>연결 API</span>
              <strong>
                extract / validate / apply
              </strong>
            </div>
          </div>

          <div className="badge-row">
            <StatusBadge tone="review" label="POST /projects/extract-from-document" />
            <StatusBadge tone="info" label={`POST /projects/${projectId}/validate-extracted-info`} />
            <StatusBadge tone="warning" label={`POST /projects/${projectId}/apply-extracted-info`} />
          </div>

          {validation ? (
            <div className="task-list">
              {validation.warnings.map((warning, index) => (
                <div className="task-item" key={`${warning}-${index}`}>
                  <span className="task-index">0{index + 1}</span>
                  <strong>{warning}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <DocumentPreview
          title="추출 초안 미리보기"
          previewTitle={`${preview.project.projectName ?? "프로젝트 정보"} 추출 초안`}
          rows={ownerRows}
          statusLabel="Preview Only"
          statusTone="review"
          noteBadges={["AI 초안", "사용자 승인 전 미반영", "발주처 분기 확인"]}
        />
      </div>
    </section>
  );
}
