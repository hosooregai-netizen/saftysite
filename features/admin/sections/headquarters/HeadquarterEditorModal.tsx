import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';

interface HeadquarterFormState {
  contact_phone: string;
  is_active: boolean;
  management_number: string;
  name: string;
  opening_number: string;
}

interface HeadquarterEditorModalProps {
  busy: boolean;
  canSubmit: boolean;
  editingId: string | null;
  form: HeadquarterFormState;
  onClose: () => void;
  onFormChange: (next: HeadquarterFormState) => void;
  onSubmit: () => void | Promise<void>;
  open: boolean;
}

export function HeadquarterEditorModal({
  busy,
  canSubmit,
  editingId,
  form,
  onClose,
  onFormChange,
  onSubmit,
  open,
}: HeadquarterEditorModalProps) {
  return (
    <AppModal
      open={open}
      title={editingId === 'create' ? '사업장 추가' : '사업장 수정'}
      size="large"
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onClose}
            disabled={busy}
          >
            취소
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => void onSubmit()}
            disabled={busy || !canSubmit}
          >
            {editingId === 'create' ? '생성' : '저장'}
          </button>
        </>
      }
    >
      <div className={styles.modalGrid}>
        <label className={styles.modalField}>
          <span className={styles.label}>회사명</span>
          <input
            className="app-input"
            value={form.name}
            onChange={(event) => onFormChange({ ...form, name: event.target.value })}
            disabled={busy}
          />
        </label>
        <label className={styles.modalField}>
          <span className={styles.label}>사업장관리번호</span>
          <input
            className="app-input"
            value={form.management_number}
            onChange={(event) =>
              onFormChange({ ...form, management_number: event.target.value })
            }
            disabled={busy}
          />
        </label>
        <label className={styles.modalField}>
          <span className={styles.label}>사업장개시번호</span>
          <input
            className="app-input"
            value={form.opening_number}
            onChange={(event) => onFormChange({ ...form, opening_number: event.target.value })}
            disabled={busy}
          />
        </label>
        <label className={styles.modalField}>
          <span className={styles.label}>전화</span>
          <input
            className="app-input"
            value={form.contact_phone}
            onChange={(event) => onFormChange({ ...form, contact_phone: event.target.value })}
            disabled={busy}
          />
        </label>
      </div>
    </AppModal>
  );
}
