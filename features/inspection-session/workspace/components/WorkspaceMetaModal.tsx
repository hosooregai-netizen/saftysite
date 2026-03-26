import AppModal from '@/components/ui/AppModal';
import type { InspectionSession } from '@/types/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

interface WorkspaceMetaModalProps {
  meta: InspectionSession['meta'];
  onClose: () => void;
  onMetaChange: (field: keyof InspectionSession['meta'], value: string) => void;
  open: boolean;
}

const META_FIELDS = [
  ['siteName', '현장명'],
  ['reportDate', '작성일'],
  ['drafter', '담당'],
  ['reviewer', '검토'],
  ['approver', '확인'],
] as const;

export function WorkspaceMetaModal({
  meta,
  onClose,
  onMetaChange,
  open,
}: WorkspaceMetaModalProps) {
  return (
    <AppModal
      open={open}
      title="보고서 기본 정보"
      size="large"
      onClose={onClose}
      actions={
        <button
          type="button"
          className="app-button app-button-primary"
          onClick={onClose}
        >
          완료
        </button>
      }
    >
      <div className={styles.metaModal}>
        <div className={styles.metaGrid}>
          {META_FIELDS.map(([field, label]) => (
            <label key={field} className={styles.metaField}>
              <span className={styles.metaLabel}>{label}</span>
              <input
                type={field === 'reportDate' ? 'date' : 'text'}
                className="app-input"
                value={meta[field]}
                onChange={(event) => onMetaChange(field, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
    </AppModal>
  );
}

