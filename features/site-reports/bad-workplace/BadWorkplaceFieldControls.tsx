import operationalStyles from '@/components/site/OperationalReports.module.css';

interface SnapshotInputCellProps {
  colSpan?: number;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export function SnapshotInputCell({
  colSpan,
  label,
  onChange,
  placeholder,
  value,
}: SnapshotInputCellProps) {
  return (
    <td className={operationalStyles.snapshotValueCell} colSpan={colSpan}>
      <input
        aria-label={label}
        className={`app-input ${operationalStyles.snapshotControl}`}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </td>
  );
}

interface SnapshotDualInputCellProps {
  labels: [string, string];
  onChange: [(value: string) => void, (value: string) => void];
  values: [string, string];
}

export function SnapshotDualInputCell({
  labels,
  onChange,
  values,
}: SnapshotDualInputCellProps) {
  return (
    <td className={operationalStyles.snapshotValueCell}>
      <div className={operationalStyles.snapshotDualInput}>
        <input
          aria-label={labels[0]}
          className={`app-input ${operationalStyles.snapshotControl}`}
          value={values[0]}
          onChange={(event) => onChange[0](event.target.value)}
        />
        <input
          aria-label={labels[1]}
          className={`app-input ${operationalStyles.snapshotControl}`}
          value={values[1]}
          onChange={(event) => onChange[1](event.target.value)}
        />
      </div>
    </td>
  );
}
