type AdminStatCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function AdminStatCard({ label, value, helper }: AdminStatCardProps) {
  return (
    <article className="hero-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}
