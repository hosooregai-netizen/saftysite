'use client';

import { useMemo, useState } from 'react';
import type { SafetyUser } from '@/types/backend';
import { USER_ROLE_OPTIONS, formatTimestamp, toNullableText } from './shared';

interface UsersSectionProps {
  busy: boolean;
  styles: Record<string, string>;
  users: SafetyUser[];
  onCreate: (input: {
    email: string;
    name: string;
    password: string;
    phone?: string | null;
    role: SafetyUser['role'];
    position?: string | null;
    organization_name?: string | null;
    is_active?: boolean;
  }) => Promise<void>;
  onUpdate: (id: string, input: {
    name?: string | null;
    phone?: string | null;
    role?: SafetyUser['role'] | null;
    position?: string | null;
    organization_name?: string | null;
    is_active?: boolean | null;
  }) => Promise<void>;
  onResetPassword: (id: string, password: string) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}

const EMPTY_FORM = {
  email: '',
  name: '',
  password: '',
  phone: '',
  role: 'field_agent' as SafetyUser['role'],
  position: '',
  organization_name: '',
  is_active: true,
};

export default function UsersSection({
  busy,
  styles,
  users,
  onCreate,
  onUpdate,
  onResetPassword,
  onDeactivate,
}: UsersSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const roleLabel = useMemo(
    () => Object.fromEntries(USER_ROLE_OPTIONS.map((option) => [option.value, option.label])),
    []
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    if (editingId) {
      await onUpdate(editingId, {
        name: form.name.trim(),
        phone: toNullableText(form.phone),
        role: form.role,
        position: toNullableText(form.position),
        organization_name: toNullableText(form.organization_name),
        is_active: form.is_active,
      });
      if (form.password.trim()) {
        await onResetPassword(editingId, form.password.trim());
      }
    } else if (form.email.trim() && form.password.trim()) {
      await onCreate({
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password.trim(),
        phone: toNullableText(form.phone),
        role: form.role,
        position: toNullableText(form.position),
        organization_name: toNullableText(form.organization_name),
        is_active: form.is_active,
      });
    }

    resetForm();
  };

  const startEdit = (user: SafetyUser) => {
    setEditingId(user.id);
    setForm({
      email: user.email,
      name: user.name,
      password: '',
      phone: user.phone ?? '',
      role: user.role,
      position: user.position ?? '',
      organization_name: user.organization_name ?? '',
      is_active: user.is_active,
    });
  };

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>사용자 CRUD</h2>
          <p className={styles.sectionDescription}>관제, 지도요원, 열람 계정을 생성하고 수정합니다.</p>
        </div>
      </div>
      <div className={`${styles.sectionBody} ${styles.splitGrid}`}>
        <div className={styles.recordCard}>
          <div className={styles.recordTop}>
            <strong className={styles.recordTitle}>{editingId ? '사용자 수정' : '사용자 생성'}</strong>
          </div>
          <div className={styles.formGrid} style={{ marginTop: 14 }}>
            <label className={styles.field}><span className={styles.label}>이름</span><input className="app-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>이메일</span><input className="app-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={busy || Boolean(editingId)} /></label>
            <label className={styles.field}><span className={styles.label}>{editingId ? '새 비밀번호' : '비밀번호'}</span><input className="app-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>권한</span><select className="app-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as SafetyUser['role'] })} disabled={busy}>{USER_ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className={styles.field}><span className={styles.label}>전화번호</span><input className="app-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>직책</span><input className="app-input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} disabled={busy} /></label>
            <label className={styles.fieldWide}><span className={styles.label}>소속</span><input className="app-input" value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} disabled={busy} /></label>
          </div>
          <label className={styles.field} style={{ marginTop: 12 }}><span className={styles.label}>활성 여부</span><select className="app-select" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })} disabled={busy}><option value="true">활성</option><option value="false">비활성</option></select></label>
          <div className={styles.formActions} style={{ marginTop: 14 }}>
            <button type="button" className="app-button app-button-primary" onClick={() => void handleSubmit()} disabled={busy}>{editingId ? '저장' : '생성'}</button>
            <button type="button" className="app-button app-button-secondary" onClick={resetForm} disabled={busy}>초기화</button>
          </div>
          <p className={styles.hint}>{editingId ? '비밀번호를 입력하면 저장 후 즉시 재설정됩니다.' : '신규 계정은 이메일과 비밀번호가 모두 필요합니다.'}</p>
        </div>

        <div className={styles.recordList}>
          {users.length === 0 ? (
            <div className={styles.empty}>등록된 사용자가 없습니다.</div>
          ) : users.map((user) => (
            <article key={user.id} className={styles.recordCard}>
              <div className={styles.recordTop}>
                <div>
                  <strong className={styles.recordTitle}>{user.name}</strong>
                  <div className={styles.recordMeta}>
                    <span className="app-chip">{roleLabel[user.role]}</span>
                    <span className="app-chip">{user.email}</span>
                    <span className="app-chip">{user.is_active ? '활성' : '비활성'}</span>
                  </div>
                </div>
                <div className={styles.recordActions}>
                  <button type="button" className="app-button app-button-secondary" onClick={() => startEdit(user)} disabled={busy}>수정</button>
                  <button type="button" className="app-button app-button-danger" onClick={() => void onDeactivate(user.id)} disabled={busy || !user.is_active}>비활성화</button>
                </div>
              </div>
              <p className={styles.recordDescription}>
                연락처: {user.phone || '미입력'}
                {'\n'}직책: {user.position || '미입력'}
                {'\n'}소속: {user.organization_name || '미입력'}
                {'\n'}최근 로그인: {formatTimestamp(user.last_login_at)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
