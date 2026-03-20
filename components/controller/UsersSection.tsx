'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import type { SafetySite, SafetyUser } from '@/types/backend';
import { getSessionTitle } from '@/constants/inspectionSession';
import type { InspectionSession } from '@/types/inspectionSession';
import type { SafetyAssignment } from '@/types/controller';
import {
  USER_ROLE_OPTIONS,
  formatTimestamp,
  getUserRoleLabel,
  toBackendUserRole,
  toNullableText,
  toUserRoleView,
  type UserRoleView,
} from './shared';

interface UsersSectionProps {
  assignments: SafetyAssignment[];
  busy: boolean;
  sessions: InspectionSession[];
  sites: SafetySite[];
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
  onSaveEdit: (id: string, input: {
    name?: string | null;
    phone?: string | null;
    role?: SafetyUser['role'];
    position?: string | null;
    organization_name?: string | null;
    is_active?: boolean | null;
  }, password?: string | null) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}

const EMPTY_FORM = {
  email: '',
  name: '',
  password: '',
  phone: '',
  role: 'field_agent' as UserRoleView,
  position: '',
  organization_name: '',
  is_active: true,
};

export default function UsersSection(props: UsersSectionProps) {
  const { assignments, busy, sessions, sites, styles, users, onCreate, onSaveEdit, onDeactivate } = props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [editingRoleSource, setEditingRoleSource] = useState<SafetyUser['role']>('field_agent');
  const isOpen = editingId !== null;
  const sitesById = useMemo(() => new Map(sites.map((site) => [site.id, site])), [sites]);
  const activeAssignmentsByUser = useMemo(() => {
    const next = new Map<string, SafetyAssignment[]>();
    assignments.filter((item) => item.is_active).forEach((item) => {
      next.set(item.user_id, [...(next.get(item.user_id) || []), item]);
    });
    return next;
  }, [assignments]);

  const openCreate = () => {
    setEditingId('create');
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setEditingRoleSource('field_agent');
  };

  const openEdit = (user: SafetyUser) => {
    setEditingId(user.id);
    const nextForm = {
      email: user.email,
      name: user.name,
      password: '',
      phone: user.phone ?? '',
      role: toUserRoleView(user.role),
      position: user.position ?? '',
      organization_name: user.organization_name ?? '',
      is_active: user.is_active,
    };
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditingRoleSource(user.role);
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setEditingRoleSource('field_agent');
  };

  const buildUpdateInput = () => {
    const nextRole =
      form.role !== initialForm.role
        ? toBackendUserRole(form.role, editingRoleSource)
        : undefined;
    const next = {
      name: form.name.trim(),
      phone: toNullableText(form.phone),
      role: nextRole,
      position: toNullableText(form.position),
      organization_name: toNullableText(form.organization_name),
      is_active: form.is_active,
    };
    const previous = {
      name: initialForm.name.trim(),
      phone: toNullableText(initialForm.phone),
      role: initialForm.role,
      position: toNullableText(initialForm.position),
      organization_name: toNullableText(initialForm.organization_name),
      is_active: initialForm.is_active,
    };
    return Object.fromEntries(
      Object.entries(next).filter(
        ([key, value]) =>
          value !== undefined && previous[key as keyof typeof previous] !== value
      )
    ) as NonNullable<Parameters<UsersSectionProps['onSaveEdit']>[1]>;
  };

  const submit = async () => {
    if (!form.name.trim()) return;

    if (editingId === 'create') {
      if (!form.email.trim() || !form.password.trim()) return;
      await onCreate({
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password.trim(),
        phone: toNullableText(form.phone),
        role: toBackendUserRole(form.role),
        position: toNullableText(form.position),
        organization_name: toNullableText(form.organization_name),
        is_active: form.is_active,
      });
    } else if (editingId) {
      const updateInput = buildUpdateInput();
      const nextPassword = form.password.trim() || null;
      if (Object.keys(updateInput).length === 0 && !nextPassword) {
        closeModal();
        return;
      }
      await onSaveEdit(editingId, updateInput, nextPassword);
    }

    closeModal();
  };

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>사용자 CRUD</h2>
          <p className={styles.sectionDescription}>계정 목록을 테이블에서 보고 추가와 수정은 모달로 처리합니다.</p>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">총 {users.length}명</span>
          <button type="button" className="app-button app-button-primary" onClick={openCreate} disabled={busy}>사용자 추가</button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.tableShell}>
          {users.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 사용자가 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>권한</th>
                    <th>담당 현장</th>
                    <th>보고서</th>
                    <th>연락처</th>
                    <th>상태</th>
                    <th>최근 로그인</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const assignedSites = (activeAssignmentsByUser.get(user.id) || [])
                      .map((assignment) => sitesById.get(assignment.site_id))
                      .filter(Boolean) as SafetySite[];
                    const relatedSessions = sessions.filter((session) =>
                      assignedSites.some((site) => site.id === session.siteKey)
                    );
                    const latestSession = [...relatedSessions].sort((left, right) =>
                      right.updatedAt.localeCompare(left.updatedAt)
                    )[0];

                    return (
                    <tr key={user.id}>
                      <td>
                        <div className={styles.tablePrimary}>{user.name}</div>
                        <div className={styles.tableSecondary}>
                          {user.position || '직책 미입력'} · {user.organization_name || '소속 미입력'}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{getUserRoleLabel(user.role)}</td>
                      <td>
                        {assignedSites.length === 0 ? (
                          '-'
                        ) : (
                          <div className={styles.tableActions}>
                            {assignedSites.map((site) => (
                              <Link key={site.id} href={`/sites/${encodeURIComponent(site.id)}`} className="app-button app-button-secondary">
                                {site.site_name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        {assignedSites.length === 0 ? (
                          '-'
                        ) : (
                          <>
                            <div className={styles.tablePrimary}>{relatedSessions.length}건</div>
                            <div className={styles.tableActions} style={{ marginTop: 8 }}>
                              {latestSession ? (
                                <Link href={`/sessions/${encodeURIComponent(latestSession.id)}`} className="app-button app-button-primary">
                                  최근 보고서
                                </Link>
                              ) : null}
                              {assignedSites[0] ? (
                                <Link href={`/sites/${encodeURIComponent(assignedSites[0].id)}`} className="app-button app-button-secondary">
                                  보고서 목록
                                </Link>
                              ) : null}
                            </div>
                            {latestSession ? (
                              <div className={styles.tableSecondary}>{getSessionTitle(latestSession)}</div>
                            ) : null}
                          </>
                        )}
                      </td>
                      <td>{user.phone || '-'}</td>
                      <td>{user.is_active ? '활성' : '비활성'}</td>
                      <td>{formatTimestamp(user.last_login_at)}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <button type="button" className="app-button app-button-secondary" onClick={() => openEdit(user)} disabled={busy}>수정</button>
                          <button type="button" className="app-button app-button-danger" onClick={() => void onDeactivate(user.id)} disabled={busy || !user.is_active}>비활성화</button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AppModal
        open={isOpen}
        title={editingId === 'create' ? '사용자 추가' : '사용자 수정'}
        size="large"
        onClose={closeModal}
        actions={
          <>
            <button type="button" className="app-button app-button-secondary" onClick={closeModal} disabled={busy}>취소</button>
            <button type="button" className="app-button app-button-primary" onClick={() => void submit()} disabled={busy}>{editingId === 'create' ? '생성' : '저장'}</button>
          </>
        }
      >
        <div className={styles.modalForm}>
          <div className={styles.modalGrid}>
            <label className={styles.modalField}><span className={styles.label}>이름</span><input className="app-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={busy} /></label>
            <label className={styles.modalField}><span className={styles.label}>이메일</span><input className="app-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={busy || editingId !== 'create'} /></label>
            <label className={styles.modalField}>
              <span className={styles.label}>{editingId === 'create' ? '비밀번호' : '새 비밀번호'}</span>
              <input className="app-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} disabled={busy} />
              {editingId !== 'create' ? <span className={styles.modalHint}>입력한 경우에만 비밀번호 변경 API를 별도로 호출합니다.</span> : null}
            </label>
            <label className={styles.modalField}><span className={styles.label}>권한</span><select className="app-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRoleView })} disabled={busy}>{USER_ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className={styles.modalField}><span className={styles.label}>전화번호</span><input className="app-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={busy} /></label>
            <label className={styles.modalField}><span className={styles.label}>직책</span><input className="app-input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} disabled={busy} /></label>
            <label className={styles.modalFieldWide}><span className={styles.label}>소속</span><input className="app-input" value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} disabled={busy} /></label>
            <label className={styles.modalField}><span className={styles.label}>활성 여부</span><select className="app-select" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })} disabled={busy}><option value="true">활성</option><option value="false">비활성</option></select></label>
          </div>
          <p className={styles.modalHint}>{editingId === 'create' ? '신규 계정은 이메일과 비밀번호가 모두 필요합니다.' : '수정 모드에서는 비밀번호를 입력한 경우에만 재설정됩니다.'}</p>
        </div>
      </AppModal>
    </section>
  );
}
