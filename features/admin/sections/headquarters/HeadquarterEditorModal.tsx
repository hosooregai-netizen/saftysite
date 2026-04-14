import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { HeadquarterFormState } from './useHeadquartersSectionState';

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
      <div className={styles.contentStack}>
        <section className={styles.contentTypePanel}>
          <div className={styles.contentTypeHeader}>
            <div>
              <h3 className={styles.menuTitle}>기본 식별 정보</h3>
            </div>
          </div>
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
              <span className={styles.label}>건설업면허/등록번호</span>
              <input
                className="app-input"
                value={form.license_no}
                onChange={(event) => onFormChange({ ...form, license_no: event.target.value })}
                disabled={busy}
              />
            </label>
          </div>
        </section>

        <section className={styles.contentTypePanel}>
          <div className={styles.contentTypeHeader}>
            <div>
              <h3 className={styles.menuTitle}>연락 및 메모</h3>
            </div>
          </div>
          <div className={styles.modalGrid}>
            <label className={styles.modalField}>
              <span className={styles.label}>본사 담당자명</span>
              <input
                className="app-input"
                value={form.contact_name}
                onChange={(event) => onFormChange({ ...form, contact_name: event.target.value })}
                disabled={busy}
              />
            </label>
            <label className={styles.modalField}>
              <span className={styles.label}>대표 전화</span>
              <input
                className="app-input"
                value={form.contact_phone}
                onChange={(event) => onFormChange({ ...form, contact_phone: event.target.value })}
                disabled={busy}
              />
            </label>
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>본사 주소</span>
              <input
                className="app-input"
                value={form.address}
                onChange={(event) => onFormChange({ ...form, address: event.target.value })}
                disabled={busy}
              />
            </label>
            <label className={styles.modalFieldWide}>
              <span className={styles.label}>운영 메모</span>
              <textarea
                className="app-textarea"
                value={form.memo}
                onChange={(event) => onFormChange({ ...form, memo: event.target.value })}
                disabled={busy}
                rows={4}
              />
            </label>
          </div>
        </section>
      </div>
    </AppModal>
  );
}
