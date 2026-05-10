import type { InspectionRoundListItem } from "../../packages/contracts/src";

export function InspectionYearGrid({ items }: { items: InspectionRoundListItem[] }) {
  const groups = items.reduce<Record<string, InspectionRoundListItem[]>>((acc, item) => {
    const year = item.round.plannedMonth?.slice(0, 4) ?? "미정";
    acc[year] ??= [];
    acc[year].push(item);
    return acc;
  }, {});
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionYearGrid</p>
          <h3>연도별 점검회차</h3>
        </div>
      </div>
      <div className="card-grid">
        {Object.entries(groups).map(([year, yearItems]) => (
          <div className="card card-soft" key={year}>
            <h4>{year}</h4>
            <div className="link-list">
              {yearItems.map((item) => (
                <span className="pill" key={item.round.id}>
                  {item.round.roundNo}회 / {item.round.plannedMonth}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
