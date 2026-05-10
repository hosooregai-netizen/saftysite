export function InspectionFilterBar() {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionFilterBar</p>
          <h3>캘린더 필터</h3>
          <p>프로젝트, 담당자, 발주처, 지연 상태를 큐 관점으로 정리합니다.</p>
        </div>
      </div>
      <div className="badge-row">
        <span className="pill">프로젝트</span>
        <span className="pill">담당자</span>
        <span className="pill">발주처</span>
        <span className="pill">미제출</span>
        <span className="pill">지연</span>
      </div>
      <div className="badge-row" style={{ marginTop: 12 }}>
        <span className="pill outline">월간</span>
        <span className="pill outline">주간</span>
        <span className="pill outline">리스트</span>
        <span className="pill outline">연도 타임라인</span>
      </div>
    </section>
  );
}
