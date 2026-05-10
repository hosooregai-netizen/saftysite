import type { WorkScheduleAttachment } from "../../packages/contracts/src";

export function WorkSchedulePreview({ item }: { item?: WorkScheduleAttachment | null }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">WorkSchedulePreview</p>
          <h3>첨부 미리보기</h3>
        </div>
      </div>
      {item ? (
        <div className="a4-preview">
          <strong>{item.fileName}</strong>
          <p>{item.sourceLabel ?? "공정표 미리보기"}</p>
          <div className="a4-surface inspection-attachment-surface">
            <div className="inspection-attachment-stage">
              <div className="inspection-highlight-box" />
              <div className="inspection-highlight-line short" />
              <div className="inspection-highlight-line" />
              <div className="inspection-highlight-line medium" />
            </div>
          </div>
          <p>{item.storagePath}</p>
        </div>
      ) : (
        <p>연결된 공사일정 첨부가 없습니다.</p>
      )}
    </section>
  );
}
