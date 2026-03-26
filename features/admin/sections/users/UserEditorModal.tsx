import AppModal from '@/components/ui/AppModal';
import { USER_ROLE_OPTIONS, type UserRoleView } from '@/lib/admin';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';

interface UserFormState {
  email: string;
  is_active: boolean;
  name: string;
  organization_name: string;
  password: string;
  phone: string;
  position: string;
  role: UserRoleView;
}

interface UserEditorModalProps {
  busy: boolean;
  editingId: string | null;
  form: UserFormState;
  onClose: () => void;
  onFormChange: (next: UserFormState) => void;
  onSubmit: () => void | Promise<void>;
  open: boolean;
}

export function UserEditorModal({
  busy,
  editingId,
  form,
  onClose,
  onFormChange,
  onSubmit,
  open,
}: UserEditorModalProps) {
  return (
    <AppModal
      open={open}
      title={editingId === 'create' ? '사용자 추가' : '사용자 수정'}
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
      <div className={styles.modalForm}>
        <div className={styles.modalGrid}>
          <label className={styles.modalField}>
            <span className={styles.label}>이름</span>
            <input
              className="app-input"
              value={form.name}
              onChange={(event) => onFormChange({ ...form, name: event.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>이메일</span>
            <input
              className="app-input"
              value={form.email}
              onChange={(event) => onFormChange({ ...form, email: event.target.value })}
              disabled={busy || editingId !== 'create'}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>{editingId === 'create' ? '비밀번호' : '새 비밀번호'}</span>
            <input
              className="app-input"
              type="password"
              value={form.password}
              onChange={(event) => onFormChange({ ...form, password: event.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>권한</span>
            <select
              className="app-select"
              value={form.role}
              onChange={(event) =>
                onFormChange({ ...form, role: event.target.value as UserRoleView })
              }
              disabled={busy}
            >
              {USER_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>전화번호</span>
            <input
              className="app-input"
              value={form.phone}
              onChange={(event) => onFormChange({ ...form, phone: event.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>직책</span>
            <input
              className="app-input"
              value={form.position}
              onChange={(event) => onFormChange({ ...form, position: event.target.value })}
              disabled={busy}
            />
          </label>
          <label className={styles.modalFieldWide}>
            <span className={styles.label}>소속</span>
            <input
              className="app-input"
              value={form.organization_name}
              onChange={(event) =>
                onFormChange({ ...form, organization_name: event.target.value })
              }
              disabled={busy}
            />
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>활성 여부</span>
            <select
              className="app-select"
              value={form.is_active ? 'true' : 'false'}
              onChange={(event) =>
                onFormChange({ ...form, is_active: event.target.value === 'true' })
              }
              disabled={busy}
            >
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </label>
        </div>
      </div>
    </AppModal>
  );
}

