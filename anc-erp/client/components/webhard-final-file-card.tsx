type WebhardFinalFileCardProps = {
  fileId?: string | null;
};

export function WebhardFinalFileCard({ fileId }: WebhardFinalFileCardProps) {
  return (
    <section className="card submission-link-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Webhard Final File</p>
          <h3>최종 제출본</h3>
        </div>
        <span className="pill outline">{fileId ? "linked" : "missing"}</span>
      </div>
      <p className="card-copy">{fileId ?? "최종 파일 미연결"}</p>
      <p className="helper-text">최종본과 날인본은 제출 패키지의 기준 파일로 분리 관리해야 합니다.</p>
    </section>
  );
}
