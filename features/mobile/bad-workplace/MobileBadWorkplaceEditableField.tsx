'use client';

import styles from '@/features/mobile/components/MobileShell.module.css';

interface MobileBadWorkplaceEditableFieldProps {
  label: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
  wide?: boolean;
}

export function MobileBadWorkplaceEditableField({
  label,
  multiline = false,
  onChange,
  placeholder,
  rows = 3,
  value,
  wide = false,
}: MobileBadWorkplaceEditableFieldProps) {
  return (
    <label
      className={`${styles.mobileEditorFieldGroup} ${
        wide ? styles.mobileImplementationFieldWide : ''
      }`}
    >
      <span className={styles.mobileEditorFieldLabel}>{label}</span>
      {multiline ? (
        <textarea
          className={`app-textarea ${styles.mobileEditorTextareaCompact}`}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="app-input"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
