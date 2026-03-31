import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';

interface HeadquarterFormState {
  address: string;
  business_registration_no: string;
  contact_name: string;
  contact_phone: string;
  corporate_registration_no: string;
  is_active: boolean;
  license_no: string;
  memo: string;
  name: string;
}

interface HeadquarterEditorModalProps {
  busy: boolean;
  editingId: string | null;
  form: HeadquarterFormState;
  onClose: () => void;
  onFormChange: (next: HeadquarterFormState) => void;
  onSubmit: () => void | Promise<void>;
  open: boolean;
}

export function HeadquarterEditorModal({
  busy,
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
            disabled={busy}
          >
            {editingId === 'create' ? '생성' : '저장'}
          </button>
        </>
      }
    >
      <div className={styles.modalGrid}>
        <label className={styles.modalField}>
          <span className={styles.label}>사업장명</span>
          <input
            className="app-input"
            value={form.name}
            onChange={(event) => onFormChange({ ...form, name: event.target.value })}
            disabled={busy}
          />
        </label>
        <label className={styles.modalField}>
          <span className={styles.label}>담당자</span>
          <input
            className="app-input"
            value={form.contact_name}
            onChange={(event) => onFormChange({ ...form, contact_name: event.target.value })}
            disabled={busy}
          />
        </label>
        <label className={styles.modalField}>
          <span className={styles.label}>사업자등록번호</span>
          <input
            className="app-input"
            value={form.business_registration_no}
            onChange={(event) =>
              onFormChange({ ...form, business_registration_no: event.target.value })
            }
            disabled={busy}
          />
        </label>
        <label className={styles.modalField}>
          <span className={styles.label}>법인등록번호</span>
          <input
            className="app-input"
            value={form.corporate_registration_no}
            onChange={(event) =>
              onFormChange({ ...form, corporate_registration_no: event.target.value })
            }
            disabled={busy}
          />
        </label>
        <label className={styles.modalField}>
          <span className={styles.label}>면허번호</span>
          <input
            className="app-input"
            value={form.license_no}
            onChange={(event) => onFormChange({ ...form, license_no: event.target.value })}
            disabled={busy}
          />
        </label>
        <label className={styles.modalField}>
          <span className={styles.label}>연락처</span>
          <input
            className="app-input"
            value={form.contact_phone}
            onChange={(event) => onFormChange({ ...form, contact_phone: event.target.value })}
            disabled={busy}
          />
        </label>
        <label className={styles.modalFieldWide}>
          <span className={styles.label}>주소</span>
          <input
            className="app-input"
            value={form.address}
            onChange={(event) => onFormChange({ ...form, address: event.target.value })}
            disabled={busy}
          />
        </label>
        <label className={styles.modalFieldWide}>
          <span className={styles.label}>메모</span>
          <textarea
            className="app-textarea"
            value={form.memo}
            onChange={(event) => onFormChange({ ...form, memo: event.target.value })}
            disabled={busy}
          />
        </label>
      </div>
    </AppModal>
  );
}

