'use client';

import { useState } from 'react';
import type { SafetyHeadquarter } from '@/types/controller';
import { formatTimestamp, toNullableText } from './shared';

interface HeadquartersSectionProps {
  busy: boolean;
  styles: Record<string, string>;
  headquarters: SafetyHeadquarter[];
  onCreate: (input: {
    name: string;
    business_registration_no?: string | null;
    corporate_registration_no?: string | null;
    license_no?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
    address?: string | null;
    memo?: string | null;
    is_active?: boolean;
  }) => Promise<void>;
  onUpdate: (id: string, input: Partial<{
    name: string;
    business_registration_no?: string | null;
    corporate_registration_no?: string | null;
    license_no?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
    address?: string | null;
    memo?: string | null;
    is_active?: boolean;
  }>) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}

const EMPTY_FORM = {
  name: '',
  business_registration_no: '',
  corporate_registration_no: '',
  license_no: '',
  contact_name: '',
  contact_phone: '',
  address: '',
  memo: '',
  is_active: true,
};

export default function HeadquartersSection({
  busy,
  styles,
  headquarters,
  onCreate,
  onUpdate,
  onDeactivate,
}: HeadquartersSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      business_registration_no: toNullableText(form.business_registration_no),
      corporate_registration_no: toNullableText(form.corporate_registration_no),
      license_no: toNullableText(form.license_no),
      contact_name: toNullableText(form.contact_name),
      contact_phone: toNullableText(form.contact_phone),
      address: toNullableText(form.address),
      memo: toNullableText(form.memo),
      is_active: form.is_active,
    };

    if (editingId) await onUpdate(editingId, payload);
    else await onCreate(payload);
    resetForm();
  };

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>사업장 정보 CRUD</h2>
          <p className={styles.sectionDescription}>본사/사업장 기본 정보와 연락처를 관리합니다.</p>
        </div>
      </div>
      <div className={`${styles.sectionBody} ${styles.splitGrid}`}>
        <div className={styles.recordCard}>
          <div className={styles.recordTop}><strong className={styles.recordTitle}>{editingId ? '사업장 수정' : '사업장 생성'}</strong></div>
          <div className={styles.formGrid} style={{ marginTop: 14 }}>
            <label className={styles.field}><span className={styles.label}>사업장명</span><input className="app-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>담당자</span><input className="app-input" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>사업자등록번호</span><input className="app-input" value={form.business_registration_no} onChange={(e) => setForm({ ...form, business_registration_no: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>법인등록번호</span><input className="app-input" value={form.corporate_registration_no} onChange={(e) => setForm({ ...form, corporate_registration_no: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>면허번호</span><input className="app-input" value={form.license_no} onChange={(e) => setForm({ ...form, license_no: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>연락처</span><input className="app-input" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} disabled={busy} /></label>
            <label className={styles.fieldWide}><span className={styles.label}>주소</span><input className="app-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={busy} /></label>
            <label className={styles.fieldWide}><span className={styles.label}>메모</span><textarea className="app-textarea" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} disabled={busy} /></label>
          </div>
          <div className={styles.formActions}>
            <button type="button" className="app-button app-button-primary" onClick={() => void handleSubmit()} disabled={busy}>{editingId ? '저장' : '생성'}</button>
            <button type="button" className="app-button app-button-secondary" onClick={resetForm} disabled={busy}>초기화</button>
          </div>
        </div>

        <div className={styles.recordList}>
          {headquarters.length === 0 ? <div className={styles.empty}>등록된 사업장이 없습니다.</div> : headquarters.map((item) => (
            <article key={item.id} className={styles.recordCard}>
              <div className={styles.recordTop}>
                <div>
                  <strong className={styles.recordTitle}>{item.name}</strong>
                  <div className={styles.recordMeta}>
                    <span className="app-chip">{item.is_active ? '활성' : '비활성'}</span>
                    <span className="app-chip">{item.contact_name || '담당자 미입력'}</span>
                  </div>
                </div>
                <div className={styles.recordActions}>
                  <button type="button" className="app-button app-button-secondary" onClick={() => { setEditingId(item.id); setForm({ name: item.name, business_registration_no: item.business_registration_no ?? '', corporate_registration_no: item.corporate_registration_no ?? '', license_no: item.license_no ?? '', contact_name: item.contact_name ?? '', contact_phone: item.contact_phone ?? '', address: item.address ?? '', memo: item.memo ?? '', is_active: item.is_active }); }} disabled={busy}>수정</button>
                  <button type="button" className="app-button app-button-danger" onClick={() => void onDeactivate(item.id)} disabled={busy || !item.is_active}>비활성화</button>
                </div>
              </div>
              <p className={styles.recordDescription}>
                사업자등록번호: {item.business_registration_no || '미입력'}
                {'\n'}법인등록번호: {item.corporate_registration_no || '미입력'}
                {'\n'}연락처: {item.contact_phone || '미입력'}
                {'\n'}주소: {item.address || '미입력'}
                {'\n'}수정일: {formatTimestamp(item.updated_at)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
