export function RiskMatrixBadge({ level }: { level: string }) {
  return <span className={`micro-pill ${level}`}>{level}</span>;
}
