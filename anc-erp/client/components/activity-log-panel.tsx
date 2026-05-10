import { StatusBadge } from "./status-badge";

export function ActivityLogPanel() {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ActivityLogPanel</p>
          <h3 className="panel-title">부트스트랩 활동 로그</h3>
        </div>
        <StatusBadge tone="info" label="실시간 저장 Stub" />
      </div>
      <div className="timeline">
        <div className="timeline-item">
          <span className="timeline-time">09:00</span>
          <div className="timeline-body">
            <strong>ERP Shell 로드</strong>
            <span>전역 route와 contained placeholder route가 초기화되었습니다.</span>
          </div>
        </div>
        <div className="timeline-item">
          <span className="timeline-time">09:12</span>
          <div className="timeline-body">
            <strong>문서 미리보기 준비</strong>
            <span>AI 초안과 최종본을 구분하는 A4 preview frame이 준비되었습니다.</span>
          </div>
        </div>
        <div className="timeline-item">
          <span className="timeline-time">09:25</span>
          <div className="timeline-body">
            <strong>연결키 점검</strong>
            <span>`projectId`, `inspectionRoundId`, `documentId` 기준 탐색 UI를 고정했습니다.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
