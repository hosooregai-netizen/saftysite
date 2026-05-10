export function PlanFilterBar() {
  return (
    <section className="panel plan-filter-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PlanFilterBar</p>
          <h3 className="panel-title">문서 필터</h3>
        </div>
      </div>
      <div className="report-meta-strip">
        <span>상태: 전체</span>
        <span>템플릿: 표준 v1</span>
        <span>누락정보: 우선 검토</span>
        <span>최종본: 전체</span>
      </div>
      <p className="helper-text">상태, 템플릿 버전, 누락정보, 최종본 여부 기준으로 계획서를 검토합니다.</p>
    </section>
  );
}
