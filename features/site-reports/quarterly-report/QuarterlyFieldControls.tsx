import operationalStyles from '@/components/site/OperationalReports.module.css';

export function FieldInput(props: {
  label: string;
  readOnly?: boolean;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className={operationalStyles.field}>
      <span className={operationalStyles.fieldLabel}>{props.label}</span>
      <input
        className={`app-input ${props.readOnly ? operationalStyles.readOnlyField : ''}`}
        type={props.type}
        value={props.value}
        placeholder={props.placeholder}
        readOnly={props.readOnly}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

export function SnapshotInputCell(props: {
  label: string;
  readOnly?: boolean;
  value: string | number;
  onChange: (value: string) => void;
  colSpan?: number;
}) {
  return (
    <td className={operationalStyles.snapshotValueCell} colSpan={props.colSpan}>
      <input
        aria-label={props.label}
        className={`app-input ${operationalStyles.snapshotControl} ${
          props.readOnly ? operationalStyles.readOnlyField : ''
        }`}
        value={props.value}
        readOnly={props.readOnly}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </td>
  );
}

export function ImplementationInputCell(props: {
  readOnly?: boolean;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  min?: number;
}) {
  return (
    <td className={operationalStyles.implementationValueCell}>
      <input
        className={`app-input ${operationalStyles.implementationControl} ${
          props.readOnly ? operationalStyles.readOnlyField : ''
        }`}
        type={props.type}
        min={props.min}
        value={props.value}
        readOnly={props.readOnly}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </td>
  );
}

export function FuturePlanInputCell(props: {
  readOnly?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <td className={operationalStyles.implementationValueCell}>
      <textarea
        className={`app-textarea ${operationalStyles.futurePlanControl} ${
          props.readOnly ? operationalStyles.readOnlyField : ''
        }`}
        value={props.value}
        readOnly={props.readOnly}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </td>
  );
}
