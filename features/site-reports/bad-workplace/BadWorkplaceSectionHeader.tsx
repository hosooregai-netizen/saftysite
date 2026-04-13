import operationalStyles from '@/components/site/OperationalReports.module.css';

interface BadWorkplaceSectionHeaderProps {
  chips?: string[];
  title: string;
}

export function BadWorkplaceSectionHeader({
  chips,
  title,
}: BadWorkplaceSectionHeaderProps) {
  return (
    <div className={operationalStyles.reportCardHeader}>
      <strong className={operationalStyles.reportCardTitle}>{title}</strong>
      {chips && chips.length > 0 ? (
        <div className={operationalStyles.statusRow}>
          {chips.map((chip) => (
            <span key={chip} className="app-chip">
              {chip}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
