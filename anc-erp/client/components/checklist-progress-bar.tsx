export function ChecklistProgressBar({
  completed,
  total,
  goodCount,
  cautionCount,
  badCount,
  notApplicableCount,
  notCheckedCount,
  photoMissingCount,
}: {
  completed: number;
  total: number;
  goodCount: number;
  cautionCount: number;
  badCount: number;
  notApplicableCount: number;
  notCheckedCount: number;
  photoMissingCount: number;
}) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <section className="hero-card checklist-progress-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistProgressBar</p>
          <h3>입력 진행률</h3>
          <p className="hero-subtitle">필수 입력, 주의/불량, 사진 누락 상태를 한 번에 검토합니다.</p>
        </div>
        <strong>{percentage}%</strong>
      </div>
      <div className="hero-progress-row">
        <span className="hero-progress-label">Checklist Progress</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percentage}%` }} />
        </div>
      </div>
      <div className="hero-summary-grid checklist-summary-grid">
        <div className="hero-summary-card">
          <span>전체 항목</span>
          <strong>{total}건</strong>
        </div>
        <div className="hero-summary-card">
          <span>입력완료</span>
          <strong>{completed}건</strong>
        </div>
        <div className="hero-summary-card">
          <span>양호</span>
          <strong>{goodCount}건</strong>
        </div>
        <div className="hero-summary-card">
          <span>주의</span>
          <strong>{cautionCount}건</strong>
        </div>
        <div className="hero-summary-card">
          <span>불량</span>
          <strong>{badCount}건</strong>
        </div>
        <div className="hero-summary-card">
          <span>해당없음</span>
          <strong>{notApplicableCount}건</strong>
        </div>
        <div className="hero-summary-card">
          <span>미점검</span>
          <strong>{notCheckedCount}건</strong>
        </div>
        <div className="hero-summary-card">
          <span>사진누락</span>
          <strong>{photoMissingCount}건</strong>
        </div>
      </div>
      <div className="progress-rail sr-only" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <p className="helper-text">
        완료 {completed}건 / 전체 {total}건
      </p>
    </section>
  );
}
