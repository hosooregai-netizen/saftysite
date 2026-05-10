import { StatusBadge } from "./status-badge";

type MissingFieldItem = {
  label: string;
  reason: string;
  severity: "required" | "recommended";
};

type MissingFieldPanelProps = {
  title?: string;
  items: MissingFieldItem[];
};

export function MissingFieldPanel({
  title = "누락 정보 / 검토 필요",
  items,
}: MissingFieldPanelProps) {
  return (
    <section className="missing-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">MissingFieldPanel</p>
          <h3 className="panel-title">{title}</h3>
        </div>
        <StatusBadge tone="warning" label={`${items.length}건 확인 필요`} />
      </div>
      <div className="missing-list">
        {items.map((item) => (
          <div className="missing-item" key={`${item.label}-${item.reason}`}>
            <strong>{item.label}</strong>
            <span>{item.reason}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
