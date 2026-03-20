'use client';

import { useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { SafetyAssignment } from '@/types/controller';
import { formatTimestamp, toNullableText } from './shared';

interface AssignmentsSectionProps {
  busy: boolean;
  styles: Record<string, string>;
  assignments: SafetyAssignment[];
  sites: SafetySite[];
  users: SafetyUser[];
  onCreate: (input: { user_id: string; site_id: string; role_on_site?: string; memo?: string | null }) => Promise<void>;
  onUpdate: (id: string, input: { role_on_site?: string | null; memo?: string | null; is_active?: boolean | null }) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}

const EMPTY_FORM = {
  user_id: '',
  site_id: '',
  role_on_site: '담당 지도요원',
  memo: '',
  is_active: true,
};

export default function AssignmentsSection(props: AssignmentsSectionProps) {
  const { busy, styles, assignments, sites, users, onCreate, onUpdate, onDeactivate } = props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const isOpen = editingId !== null;

  const openCreate = () => {
    setEditingId('create');
    setForm(EMPTY_FORM);
  };

  const openEdit = (assignment: SafetyAssignment) => {
    setEditingId(assignment.id);
    setForm({
      user_id: assignment.user_id,
      site_id: assignment.site_id,
      role_on_site: assignment.role_on_site,
      memo: assignment.memo ?? '',
      is_active: assignment.is_active,
    });
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submit = async () => {
    if (!form.user_id || !form.site_id) return;
    if (editingId === 'create') {
      await onCreate({
        user_id: form.user_id,
        site_id: form.site_id,
        role_on_site: form.role_on_site.trim() || '담당 지도요원',
        memo: toNullableText(form.memo),
      });
    } else if (editingId) {
      await onUpdate(editingId, {
        role_on_site: toNullableText(form.role_on_site),
        memo: toNullableText(form.memo),
        is_active: form.is_active,
      });
    }
    closeModal();
  };

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>지도요원 배정</h2>
          <p className={styles.sectionDescription}>배정 상태를 테이블에서 확인하고 추가·수정은 모달에서 진행합니다.</p>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">총 {assignments.length}건</span>
          <button type="button" className="app-button app-button-primary" onClick={openCreate} disabled={busy}>배정 추가</button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.tableShell}>
          {assignments.length === 0 ? (
            <div className={styles.tableEmpty}>배정 데이터가 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>지도요원</th>
                    <th>현장</th>
                    <th>역할</th>
                    <th>메모</th>
                    <th>배정일</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.user?.name || '-'}</td>
                      <td>{assignment.site?.name || '-'}</td>
                      <td>{assignment.role_on_site || '-'}</td>
                      <td>{assignment.memo || '-'}</td>
                      <td>{formatTimestamp(assignment.assigned_at)}</td>
                      <td>{assignment.is_active ? '활성' : '비활성'}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <button type="button" className="app-button app-button-secondary" onClick={() => openEdit(assignment)} disabled={busy}>수정</button>
                          <button type="button" className="app-button app-button-danger" onClick={() => void onDeactivate(assignment.id)} disabled={busy || !assignment.is_active}>비활성화</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AppModal
        open={isOpen}
        title={editingId === 'create' ? '배정 추가' : '배정 수정'}
        onClose={closeModal}
        size="large"
        actions={
          <>
            <button type="button" className="app-button app-button-secondary" onClick={closeModal} disabled={busy}>취소</button>
            <button type="button" className="app-button app-button-primary" onClick={() => void submit()} disabled={busy}>{editingId === 'create' ? '생성' : '저장'}</button>
          </>
        }
      >
        <div className={styles.modalGrid}>
          <label className={styles.modalField}><span className={styles.label}>사용자</span><select className="app-select" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} disabled={busy || editingId !== 'create'}><option value="">선택</option>{users.filter((user) => user.is_active).map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role}</option>)}</select></label>
          <label className={styles.modalField}><span className={styles.label}>현장</span><select className="app-select" value={form.site_id} onChange={(e) => setForm({ ...form, site_id: e.target.value })} disabled={busy || editingId !== 'create'}><option value="">선택</option>{sites.filter((site) => site.status !== 'closed').map((site) => <option key={site.id} value={site.id}>{site.site_name}</option>)}</select></label>
          <label className={styles.modalFieldWide}><span className={styles.label}>역할</span><input className="app-input" value={form.role_on_site} onChange={(e) => setForm({ ...form, role_on_site: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalFieldWide}><span className={styles.label}>메모</span><textarea className="app-textarea" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>활성 여부</span><select className="app-select" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })} disabled={busy}><option value="true">활성</option><option value="false">비활성</option></select></label>
        </div>
      </AppModal>
    </section>
  );
}
