'use client';

import { useState } from 'react';
import AppModal from '@/components/ui/AppModal';
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

export default function HeadquartersSection(props: HeadquartersSectionProps) {
  const { busy, styles, headquarters, onCreate, onUpdate, onDeactivate } = props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const isOpen = editingId !== null;

  const openCreate = () => {
    setEditingId('create');
    setForm(EMPTY_FORM);
  };

  const openEdit = (item: SafetyHeadquarter) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      business_registration_no: item.business_registration_no ?? '',
      corporate_registration_no: item.corporate_registration_no ?? '',
      license_no: item.license_no ?? '',
      contact_name: item.contact_name ?? '',
      contact_phone: item.contact_phone ?? '',
      address: item.address ?? '',
      memo: item.memo ?? '',
      is_active: item.is_active,
    });
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submit = async () => {
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
    if (editingId === 'create') await onCreate(payload);
    else if (editingId) await onUpdate(editingId, payload);
    closeModal();
  };

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>사업장 정보 CRUD</h2>
          <p className={styles.sectionDescription}>사업장 리스트를 테이블에서 보고 추가와 수정은 모달에서 처리합니다.</p>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">총 {headquarters.length}개</span>
          <button type="button" className="app-button app-button-primary" onClick={openCreate} disabled={busy}>사업장 추가</button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.tableShell}>
          {headquarters.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 사업장이 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>사업장명</th>
                    <th>담당자</th>
                    <th>사업자등록번호</th>
                    <th>법인등록번호</th>
                    <th>주소</th>
                    <th>수정일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {headquarters.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.tablePrimary}>{item.name}</div>
                        <div className={styles.tableSecondary}>면허번호 {item.license_no || '-'}</div>
                      </td>
                      <td>
                        <div className={styles.tablePrimary}>{item.contact_name || '-'}</div>
                        <div className={styles.tableSecondary}>{item.contact_phone || '연락처 미입력'}</div>
                      </td>
                      <td>{item.business_registration_no || '-'}</td>
                      <td>{item.corporate_registration_no || '-'}</td>
                      <td>{item.address || '-'}</td>
                      <td>{formatTimestamp(item.updated_at)}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <button type="button" className="app-button app-button-secondary" onClick={() => openEdit(item)} disabled={busy}>수정</button>
                          <button type="button" className="app-button app-button-danger" onClick={() => void onDeactivate(item.id)} disabled={busy || !item.is_active}>비활성화</button>
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
        title={editingId === 'create' ? '사업장 추가' : '사업장 수정'}
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
          <label className={styles.modalField}><span className={styles.label}>사업장명</span><input className="app-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>담당자</span><input className="app-input" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>사업자등록번호</span><input className="app-input" value={form.business_registration_no} onChange={(e) => setForm({ ...form, business_registration_no: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>법인등록번호</span><input className="app-input" value={form.corporate_registration_no} onChange={(e) => setForm({ ...form, corporate_registration_no: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>면허번호</span><input className="app-input" value={form.license_no} onChange={(e) => setForm({ ...form, license_no: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>연락처</span><input className="app-input" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalFieldWide}><span className={styles.label}>주소</span><input className="app-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalFieldWide}><span className={styles.label}>메모</span><textarea className="app-textarea" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>활성 여부</span><select className="app-select" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })} disabled={busy}><option value="true">활성</option><option value="false">비활성</option></select></label>
        </div>
      </AppModal>
    </section>
  );
}
