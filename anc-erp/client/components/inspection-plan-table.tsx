export function InspectionPlanTable({ inspectionRoundId }: { inspectionRoundId?: string | null }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionPlanTable</p>
          <h3 className="panel-title">점검 계획</h3>
        </div>
      </div>
      <p className="helper-text">연결 회차: {inspectionRoundId ?? "미연결"}</p>
    </section>
  );
}
