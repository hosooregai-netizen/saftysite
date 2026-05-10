import type { WebhardStorageUsageResponse } from "../../packages/contracts/src";

export function StorageUsageCard({ usage }: { usage: WebhardStorageUsageResponse }) {
  const totalSizeKb = Math.round((usage.totalSizeBytes ?? 0) / 1024);
  const activeRatio =
    usage.totalFiles > 0 ? Math.min(100, Math.round((usage.activeFiles / usage.totalFiles) * 100)) : 0;

  return (
    <section className="panel webhard-storage-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">StorageUsageCard</p>
          <h3 className="panel-title">저장공간 요약</h3>
          <p className="inline-link-meta">활성 파일, 잠금 파일, 휴지통 보관 비중을 한 번에 확인합니다.</p>
        </div>
        <span className="pill outline">{usage.totalFiles} files</span>
      </div>
      <div className="hero-progress-row">
        <div className="hero-progress-label">
          활성 파일 비중
          <span className="hero-progress-value">{activeRatio}%</span>
        </div>
        <div className="progress-track compact">
          <div className="progress-fill" style={{ width: `${activeRatio}%` }} />
        </div>
      </div>
      <div className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">정상 파일</p>
          <p className="stat-value">{usage.activeFiles}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">잠금 파일</p>
          <p className="stat-value">{usage.lockedFiles}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">휴지통</p>
          <p className="stat-value">{usage.deletedFiles}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">총 용량</p>
          <p className="stat-value">{totalSizeKb} KB</p>
        </article>
      </div>
    </section>
  );
}
