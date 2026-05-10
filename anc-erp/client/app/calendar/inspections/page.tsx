import { ErpShell } from "../../../components/erp-shell";
import { InspectionCalendar } from "../../../components/inspection-calendar";
import { InspectionFilterBar } from "../../../components/inspection-filter-bar";
import { loadInspectionCalendarPageData } from "../../../lib/inspection-page-data";

export default async function InspectionCalendarPage() {
  const pageData = await loadInspectionCalendarPageData();
  const submittedCount = pageData.rounds.rounds.filter((item) => item.round.status === "submitted" || item.round.status === "closed").length;
  return (
    <ErpShell title="점검 캘린더" subtitle="전역 캘린더이지만 실제 데이터 소유권은 Project / InspectionRound에 유지됩니다.">
      <section className="hero-card inspection-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Inspection Calendar</p>
            <h2 className="hero-title">점검 캘린더</h2>
            <p className="hero-subtitle">
              월간, 리스트, 연도 타임라인 관점으로 점검일과 제출 흐름을 함께 추적합니다.
            </p>
          </div>
        </div>
        <div className="hero-summary-grid">
          <div className="hero-summary-card">
            <span>표시 회차</span>
            <strong>{pageData.rounds.rounds.length}건</strong>
          </div>
          <div className="hero-summary-card">
            <span>캘린더 업무</span>
            <strong>{pageData.tasks.tasks.length}건</strong>
          </div>
          <div className="hero-summary-card">
            <span>제출 정리</span>
            <strong>{submittedCount}건</strong>
          </div>
          <div className="hero-summary-card">
            <span>조회 기간</span>
            <strong>2026-2028</strong>
          </div>
        </div>
      </section>
      <InspectionFilterBar />
      <InspectionCalendar data={pageData.rounds} />
    </ErpShell>
  );
}
