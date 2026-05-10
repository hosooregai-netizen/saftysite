export function ProjectFilterBar() {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Project Filter</p>
          <h3>프로젝트 검색 / 필터</h3>
        </div>
      </div>
      <div className="filter-grid">
        <div className="fake-input">프로젝트명, 현장명, 주소 검색</div>
        <div className="fake-input">상태: 진행중</div>
        <div className="fake-input">발주처: 전체</div>
        <div className="fake-input">시공사: 전체</div>
        <div className="fake-input">문서 미제출: 전체</div>
        <div className="fake-input">미조치 지적사항: 전체</div>
      </div>
    </section>
  );
}
