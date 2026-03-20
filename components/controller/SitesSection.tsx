'use client';

import { useState } from 'react';
import type { SafetySite } from '@/types/backend';
import type { SafetyHeadquarter } from '@/types/controller';
import { SITE_STATUS_OPTIONS, formatTimestamp, parseOptionalNumber, toNullableText } from './shared';

interface SitesSectionProps {
  busy: boolean;
  styles: Record<string, string>;
  headquarters: SafetyHeadquarter[];
  sites: SafetySite[];
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

export default function SitesSection({
  busy,
  styles,
  headquarters,
  sites,
  onCreate,
  onUpdate,
  onDeactivate,
}: SitesSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const payload = {
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
  };

  const submit = async () => {
    if (!payload.headquarter_id || !payload.site_name) return;
    if (editingId) await onUpdate(editingId, payload);
    else await onCreate(payload);
    resetForm();
  };

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>현장 CRUD</h2>
          <p className={styles.sectionDescription}>사업장에 연결된 현장을 생성하고 상태를 관리합니다.</p>
        </div>
      </div>
      <div className={`${styles.sectionBody} ${styles.splitGrid}`}>
        <div className={styles.recordCard}>
          <div className={styles.recordTop}><strong className={styles.recordTitle}>{editingId ? '현장 수정' : '현장 생성'}</strong></div>
          <div className={styles.formGrid} style={{ marginTop: 14 }}>
            <label className={styles.field}><span className={styles.label}>사업장</span><select className="app-select" value={form.headquarter_id} onChange={(e) => setForm({ ...form, headquarter_id: e.target.value })} disabled={busy}><option value="">선택</option>{headquarters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className={styles.field}><span className={styles.label}>현장명</span><input className="app-input" value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>현장 코드</span><input className="app-input" value={form.site_code} onChange={(e) => setForm({ ...form, site_code: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>관리번호</span><input className="app-input" value={form.management_number} onChange={(e) => setForm({ ...form, management_number: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>공사 시작일</span><input className="app-input" type="date" value={form.project_start_date} onChange={(e) => setForm({ ...form, project_start_date: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>공사 종료일</span><input className="app-input" type="date" value={form.project_end_date} onChange={(e) => setForm({ ...form, project_end_date: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>공사 금액</span><input className="app-input" value={form.project_amount} onChange={(e) => setForm({ ...form, project_amount: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>상태</span><select className="app-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} disabled={busy}>{SITE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className={styles.field}><span className={styles.label}>현장 책임자</span><input className="app-input" value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>책임자 연락처</span><input className="app-input" value={form.manager_phone} onChange={(e) => setForm({ ...form, manager_phone: e.target.value })} disabled={busy} /></label>
            <label className={styles.fieldWide}><span className={styles.label}>현장 주소</span><input className="app-input" value={form.site_address} onChange={(e) => setForm({ ...form, site_address: e.target.value })} disabled={busy} /></label>
            <label className={styles.fieldWide}><span className={styles.label}>메모</span><textarea className="app-textarea" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} disabled={busy} /></label>
          </div>
          <div className={styles.formActions}>
            <button type="button" className="app-button app-button-primary" onClick={() => void submit()} disabled={busy}> {editingId ? '저장' : '생성'} </button>
            <button type="button" className="app-button app-button-secondary" onClick={resetForm} disabled={busy}>초기화</button>
          </div>
        </div>

        <div className={styles.recordList}>
          {sites.length === 0 ? <div className={styles.empty}>등록된 현장이 없습니다.</div> : sites.map((site) => (
            <article key={site.id} className={styles.recordCard}>
              <div className={styles.recordTop}>
                <div>
                  <strong className={styles.recordTitle}>{site.site_name}</strong>
                  <div className={styles.recordMeta}>
                    <span className="app-chip">{site.headquarter_detail?.name || site.headquarter?.name || '사업장 미지정'}</span>
                    <span className="app-chip">{site.status}</span>
                    <span className="app-chip">{site.assigned_user?.name || '배정 없음'}</span>
                  </div>
                </div>
                <div className={styles.recordActions}>
                  <button type="button" className="app-button app-button-secondary" onClick={() => { setEditingId(site.id); setForm({ headquarter_id: site.headquarter_id, site_name: site.site_name, site_code: site.site_code ?? '', management_number: site.management_number ?? '', project_start_date: site.project_start_date ?? '', project_end_date: site.project_end_date ?? '', project_amount: site.project_amount ? String(site.project_amount) : '', manager_name: site.manager_name ?? '', manager_phone: site.manager_phone ?? '', site_address: site.site_address ?? '', status: site.status as typeof EMPTY_FORM.status, memo: site.memo ?? '' }); }} disabled={busy}>수정</button>
                  <button type="button" className="app-button app-button-danger" onClick={() => void onDeactivate(site.id)} disabled={busy || site.status === 'closed'}>종료</button>
                </div>
              </div>
              <p className={styles.recordDescription}>
                관리번호: {site.management_number || '미입력'}
                {'\n'}기간: {site.project_start_date || '-'} ~ {site.project_end_date || '-'}
                {'\n'}책임자: {site.manager_name || '미입력'} / {site.manager_phone || '미입력'}
                {'\n'}주소: {site.site_address || '미입력'}
                {'\n'}수정일: {formatTimestamp(site.updated_at)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
