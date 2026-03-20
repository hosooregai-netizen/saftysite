'use client';

import Link from 'next/link';
import { useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { SafetyAssignment, SafetyHeadquarter } from '@/types/controller';
import SiteAssignmentModal from './SiteAssignmentModal';
import {
  SITE_STATUS_LABELS,
  SITE_STATUS_OPTIONS,
  parseOptionalNumber,
  toNullableText,
} from './shared';

interface SitesSectionProps {
  busy: boolean;
  styles: Record<string, string>;
  assignments: SafetyAssignment[];
  headquarters: SafetyHeadquarter[];
  sites: SafetySite[];
  users: SafetyUser[];
  onCreate: (input: {
    headquarter_id: string;
    site_name: string;
    site_code?: string | null;
    management_number?: string | null;
    project_start_date?: string | null;
    project_end_date?: string | null;
    project_amount?: number | null;
    manager_name?: string | null;
    manager_phone?: string | null;
    site_address?: string | null;
    status?: 'planned' | 'active' | 'closed';
    memo?: string | null;
  }) => Promise<void>;
  onUpdate: (id: string, input: Partial<{
    headquarter_id: string;
    site_name: string;
    site_code?: string | null;
    management_number?: string | null;
    project_start_date?: string | null;
    project_end_date?: string | null;
    project_amount?: number | null;
    manager_name?: string | null;
    manager_phone?: string | null;
    site_address?: string | null;
    status?: 'planned' | 'active' | 'closed';
    memo?: string | null;
  }>) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
  onAssignFieldAgent: (siteId: string, userId: string | null) => Promise<void>;
}

const EMPTY_FORM = {
  headquarter_id: '',
  site_name: '',
  site_code: '',
  management_number: '',
  project_start_date: '',
  project_end_date: '',
  project_amount: '',
  manager_name: '',
  manager_phone: '',
  site_address: '',
  status: 'active' as const,
  memo: '',
};

export default function SitesSection(props: SitesSectionProps) {
  const {
    assignments,
    busy,
    styles,
    headquarters,
    sites,
    users,
    onCreate,
    onUpdate,
    onDeactivate,
    onAssignFieldAgent,
  } = props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignmentSiteId, setAssignmentSiteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const isOpen = editingId !== null;
  const assignmentSite = sites.find((site) => site.id === assignmentSiteId) || null;
  const currentAssignment =
    assignments.find((assignment) => assignment.site_id === assignmentSiteId && assignment.is_active) || null;
  const usersById = new Map(users.map((user) => [user.id, user]));

  const openCreate = () => {
    setEditingId('create');
    setForm(EMPTY_FORM);
  };

  const openEdit = (site: SafetySite) => {
    setEditingId(site.id);
    setForm({
      headquarter_id: site.headquarter_id,
      site_name: site.site_name,
      site_code: site.site_code ?? '',
      management_number: site.management_number ?? '',
      project_start_date: site.project_start_date ?? '',
      project_end_date: site.project_end_date ?? '',
      project_amount: site.project_amount ? String(site.project_amount) : '',
      manager_name: site.manager_name ?? '',
      manager_phone: site.manager_phone ?? '',
      site_address: site.site_address ?? '',
      status: site.status as typeof EMPTY_FORM.status,
      memo: site.memo ?? '',
    });
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const buildPayload = () => ({
    headquarter_id: form.headquarter_id,
    site_name: form.site_name.trim(),
    site_code: toNullableText(form.site_code),
    management_number: toNullableText(form.management_number),
    project_start_date: toNullableText(form.project_start_date),
    project_end_date: toNullableText(form.project_end_date),
    project_amount: parseOptionalNumber(form.project_amount),
    manager_name: toNullableText(form.manager_name),
    manager_phone: toNullableText(form.manager_phone),
    site_address: toNullableText(form.site_address),
    status: form.status,
    memo: toNullableText(form.memo),
  });

  const submit = async () => {
    const payload = buildPayload();
    if (!payload.headquarter_id || !payload.site_name) return;
    if (editingId === 'create') await onCreate(payload);
    else if (editingId) await onUpdate(editingId, payload);
    closeModal();
  };

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>현장 CRUD</h2>
          <p className={styles.sectionDescription}>현장 목록은 테이블로, 추가와 수정은 모달 폼으로 정리했습니다.</p>
          <p className={styles.modalHint}>공사 시작일과 종료일은 현재 서버 오류로 임시 저장 제외 처리됩니다.</p>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">총 {sites.length}개</span>
          <button type="button" className="app-button app-button-primary" onClick={openCreate} disabled={busy}>현장 추가</button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.tableShell}>
          {sites.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 현장이 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>현장명</th>
                    <th>사업장</th>
                    <th>관리번호</th>
                    <th>책임자</th>
                    <th>배정 지도요원</th>
                    <th>기간</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => {
                    const siteAssignment =
                      assignments.find((assignment) => assignment.site_id === site.id && assignment.is_active) || null;
                    const assignedUser =
                      (siteAssignment ? usersById.get(siteAssignment.user_id) : null) ||
                      (site.assigned_user ? usersById.get(site.assigned_user.id) : null) ||
                      null;
                    return (
                    <tr key={site.id}>
                      <td>
                        <div className={styles.tablePrimary}>{site.site_name}</div>
                        <div className={styles.tableSecondary}>{site.site_address || '주소 미입력'}</div>
                      </td>
                      <td>{site.headquarter_detail?.name || site.headquarter?.name || '-'}</td>
                      <td>{site.management_number || '-'}</td>
                      <td>
                        <div className={styles.tablePrimary}>{site.manager_name || '-'}</div>
                        <div className={styles.tableSecondary}>{site.manager_phone || '연락처 미입력'}</div>
                      </td>
                      <td>
                        <div className={styles.tablePrimary}>
                          {assignedUser?.name || site.assigned_user?.name || '-'}
                        </div>
                        <div className={styles.tableSecondary}>
                          {assignedUser
                            ? [assignedUser.position || '직급 미입력', assignedUser.organization_name || '소속 미입력'].join(' · ')
                            : '배정 정보 없음'}
                        </div>
                      </td>
                      <td>{site.project_start_date || '-'} ~ {site.project_end_date || '-'}</td>
                      <td>{SITE_STATUS_LABELS[site.status as keyof typeof SITE_STATUS_LABELS] || site.status}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <Link href={`/sites/${encodeURIComponent(site.id)}`} className="app-button app-button-primary">
                            보고서
                          </Link>
                          <button type="button" className="app-button app-button-secondary" onClick={() => setAssignmentSiteId(site.id)} disabled={busy}>지도요원 배정</button>
                          <button type="button" className="app-button app-button-secondary" onClick={() => openEdit(site)} disabled={busy}>수정</button>
                          <button type="button" className="app-button app-button-danger" onClick={() => void onDeactivate(site.id)} disabled={busy || site.status === 'closed'}>종료</button>
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
        title={editingId === 'create' ? '현장 추가' : '현장 수정'}
        size="large"
        onClose={closeModal}
        actions={
          <>
            <button type="button" className="app-button app-button-secondary" onClick={closeModal} disabled={busy}>취소</button>
            <button type="button" className="app-button app-button-primary" onClick={() => void submit()} disabled={busy}>{editingId === 'create' ? '생성' : '저장'}</button>
          </>
        }
      >
        <div className={styles.modalGrid}>
          <label className={styles.modalField}><span className={styles.label}>사업장</span><select className="app-select" value={form.headquarter_id} onChange={(e) => setForm({ ...form, headquarter_id: e.target.value })} disabled={busy}><option value="">선택</option>{headquarters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className={styles.modalField}><span className={styles.label}>현장명</span><input className="app-input" value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>현장 코드</span><input className="app-input" value={form.site_code} onChange={(e) => setForm({ ...form, site_code: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>관리번호</span><input className="app-input" value={form.management_number} onChange={(e) => setForm({ ...form, management_number: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>공사 시작일</span><input className="app-input" type="date" value={form.project_start_date} onChange={(e) => setForm({ ...form, project_start_date: e.target.value })} disabled /></label>
          <label className={styles.modalField}><span className={styles.label}>공사 종료일</span><input className="app-input" type="date" value={form.project_end_date} onChange={(e) => setForm({ ...form, project_end_date: e.target.value })} disabled /></label>
          <label className={styles.modalField}><span className={styles.label}>공사 금액</span><input className="app-input" value={form.project_amount} onChange={(e) => setForm({ ...form, project_amount: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>상태</span><select className="app-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} disabled={busy}>{SITE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className={styles.modalField}><span className={styles.label}>현장 책임자</span><input className="app-input" value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>책임자 연락처</span><input className="app-input" value={form.manager_phone} onChange={(e) => setForm({ ...form, manager_phone: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalFieldWide}><span className={styles.label}>현장 주소</span><input className="app-input" value={form.site_address} onChange={(e) => setForm({ ...form, site_address: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalFieldWide}><span className={styles.label}>메모</span><textarea className="app-textarea" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} disabled={busy} /></label>
          <p className={styles.modalHint}>날짜 필드는 백엔드 수정 후 다시 활성화하는 편이 안전합니다.</p>
        </div>
      </AppModal>

      <SiteAssignmentModal
        open={Boolean(assignmentSite)}
        busy={busy}
        styles={styles}
        site={assignmentSite}
        users={users}
        currentAssignment={currentAssignment}
        onClose={() => setAssignmentSiteId(null)}
        onAssign={async (siteId, userId) => {
          await onAssignFieldAgent(siteId, userId);
          setAssignmentSiteId(null);
        }}
        onClear={async (siteId) => {
          await onAssignFieldAgent(siteId, null);
          setAssignmentSiteId(null);
        }}
      />
    </section>
  );
}
