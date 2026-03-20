'use client';

import { useState } from 'react';
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

export default function AssignmentsSection({
  busy,
  styles,
  assignments,
  sites,
  users,
  onCreate,
  onUpdate,
  onDeactivate,
}: AssignmentsSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submit = async () => {
    if (!form.user_id || !form.site_id) return;
    if (editingId) {
      await onUpdate(editingId, {
        role_on_site: toNullableText(form.role_on_site),
        memo: toNullableText(form.memo),
        is_active: form.is_active,
      });
    } else {
      await onCreate({
        user_id: form.user_id,
        site_id: form.site_id,
        role_on_site: form.role_on_site.trim() || '담당 지도요원',
        memo: toNullableText(form.memo),
      });
    }
    resetForm();
  };

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>지도요원 배정</h2>
          <p className={styles.sectionDescription}>사용자와 현장을 연결해 실제 작업 대상을 배정합니다.</p>
        </div>
      </div>
      <div className={`${styles.sectionBody} ${styles.splitGrid}`}>
        <div className={styles.recordCard}>
          <div className={styles.recordTop}><strong className={styles.recordTitle}>{editingId ? '배정 수정' : '배정 생성'}</strong></div>
          <div className={styles.formGrid} style={{ marginTop: 14 }}>
            <label className={styles.field}><span className={styles.label}>사용자</span><select className="app-select" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} disabled={busy || Boolean(editingId)}><option value="">선택</option>{users.filter((user) => user.is_active).map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role}</option>)}</select></label>
            <label className={styles.field}><span className={styles.label}>현장</span><select className="app-select" value={form.site_id} onChange={(e) => setForm({ ...form, site_id: e.target.value })} disabled={busy || Boolean(editingId)}><option value="">선택</option>{sites.filter((site) => site.status !== 'closed').map((site) => <option key={site.id} value={site.id}>{site.site_name}</option>)}</select></label>
            <label className={styles.fieldWide}><span className={styles.label}>역할</span><input className="app-input" value={form.role_on_site} onChange={(e) => setForm({ ...form, role_on_site: e.target.value })} disabled={busy} /></label>
            <label className={styles.fieldWide}><span className={styles.label}>메모</span><textarea className="app-textarea" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} disabled={busy} /></label>
          </div>
          <div className={styles.formActions}>
            <button type="button" className="app-button app-button-primary" onClick={() => void submit()} disabled={busy}>{editingId ? '저장' : '배정'}</button>
            <button type="button" className="app-button app-button-secondary" onClick={resetForm} disabled={busy}>초기화</button>
          </div>
        </div>

        <div className={styles.recordList}>
          {assignments.length === 0 ? <div className={styles.empty}>배정 데이터가 없습니다.</div> : assignments.map((assignment) => (
            <article key={assignment.id} className={styles.recordCard}>
              <div className={styles.recordTop}>
                <div>
                  <strong className={styles.recordTitle}>{assignment.user?.name || '미확인 사용자'}</strong>
                  <div className={styles.recordMeta}>
                    <span className="app-chip">{assignment.site?.name || '미확인 현장'}</span>
                    <span className="app-chip">{assignment.role_on_site || '역할 미지정'}</span>
                    <span className="app-chip">{assignment.is_active ? '활성' : '비활성'}</span>
                  </div>
                </div>
                <div className={styles.recordActions}>
                  <button type="button" className="app-button app-button-secondary" onClick={() => { setEditingId(assignment.id); setForm({ user_id: assignment.user_id, site_id: assignment.site_id, role_on_site: assignment.role_on_site, memo: assignment.memo ?? '', is_active: assignment.is_active }); }} disabled={busy}>수정</button>
                  <button type="button" className="app-button app-button-danger" onClick={() => void onDeactivate(assignment.id)} disabled={busy || !assignment.is_active}>비활성화</button>
                </div>
              </div>
              <p className={styles.recordDescription}>
                메모: {assignment.memo || '없음'}
                {'\n'}배정일: {formatTimestamp(assignment.assigned_at)}
                {'\n'}수정일: {formatTimestamp(assignment.updated_at)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
