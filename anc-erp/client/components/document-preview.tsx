import { A4Preview } from "./a4-preview";
import { StatusBadge } from "./status-badge";

type DocumentPreviewProps = {
  title: string;
  statusLabel: string;
  statusTone: "review" | "warning" | "submitted" | "info";
  previewTitle?: string;
  rows?: Array<{ label: string; status: string; note: string }>;
  noteBadges?: string[];
};

export function DocumentPreview({
  title,
  statusLabel,
  statusTone,
  previewTitle,
  rows,
  noteBadges,
}: DocumentPreviewProps) {
  return (
    <section className="panel a4-preview">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">A4Preview / DocumentPreview</p>
          <h3 className="panel-title">{title}</h3>
        </div>
        <StatusBadge tone={statusTone} label={statusLabel} />
      </div>
      <A4Preview rows={rows} title={previewTitle} />
      <div className="a4-note">
        {(noteBadges ?? ["AI 초안", "발주처별 분기 전"]).map((badge) => (
          <StatusBadge
            key={badge}
            tone={badge.includes("초안") ? "review" : badge.includes("분기") ? "warning" : "info"}
            label={badge}
          />
        ))}
      </div>
    </section>
  );
}
