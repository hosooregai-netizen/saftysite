'use client';

import { useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import type { SafetyContentItem } from '@/types/backend';
import {
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_OPTIONS,
  formatTimestamp,
  parseContentBody,
  stringifyContentBody,
  toNullableText,
} from './shared';

interface ContentItemsSectionProps {
  busy: boolean;
  styles: Record<string, string>;
  items: SafetyContentItem[];
  onCreate: (input: {
    content_type: SafetyContentItem['content_type'];
    title: string;
    code?: string | null;
    body: Record<string, unknown> | string;
    tags?: string[];
    sort_order?: number;
    effective_from?: string | null;
    effective_to?: string | null;
    is_active?: boolean;
  }) => Promise<void>;
  onUpdate: (id: string, input: Partial<{
    title: string;
    code?: string | null;
    body: Record<string, unknown> | string;
    tags?: string[];
    sort_order?: number;
    effective_from?: string | null;
    effective_to?: string | null;
    is_active?: boolean;
  }>) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}

const EMPTY_FORM = {
  content_type: 'legal_reference' as SafetyContentItem['content_type'],
  title: '',
  code: '',
  body: '',
  tags: '',
  sort_order: '0',
  effective_from: '',
  effective_to: '',
  is_active: true,
};

export default function ContentItemsSection(props: ContentItemsSectionProps) {
  const { busy, styles, items, onCreate, onUpdate, onDeactivate } = props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const isOpen = editingId !== null;

  const openCreate = () => {
    setEditingId('create');
    setForm(EMPTY_FORM);
  };

  const openEdit = (item: SafetyContentItem) => {
    setEditingId(item.id);
    setForm({
      content_type: item.content_type,
      title: item.title,
      code: item.code ?? '',
      body: stringifyContentBody(item.body),
      tags: item.tags.join(', '),
      sort_order: String(item.sort_order),
      effective_from: item.effective_from?.slice(0, 10) ?? '',
      effective_to: item.effective_to?.slice(0, 10) ?? '',
      is_active: item.is_active,
    });
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      code: toNullableText(form.code),
      body: parseContentBody(form.body),
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      sort_order: Number(form.sort_order || 0),
      effective_from: toNullableText(form.effective_from),
      effective_to: toNullableText(form.effective_to),
      is_active: form.is_active,
    };
    if (editingId === 'create') {
      await onCreate({ content_type: form.content_type, ...payload });
    } else if (editingId) {
      await onUpdate(editingId, payload);
    }
    closeModal();
  };

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>마스터/콘텐츠 CRUD</h2>
          <p className={styles.sectionDescription}>콘텐츠를 표에서 비교하고 편집은 모달에서 처리하도록 정리했습니다.</p>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">총 {items.length}개</span>
          <button type="button" className="app-button app-button-primary" onClick={openCreate} disabled={busy}>콘텐츠 추가</button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.tableShell}>
          {items.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 마스터 데이터가 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>유형</th>
                    <th>제목</th>
                    <th>코드</th>
                    <th>태그</th>
                    <th>정렬</th>
                    <th>수정일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{CONTENT_TYPE_LABELS[item.content_type]}</td>
                      <td>
                        <div className={styles.tablePrimary}>{item.title}</div>
                        <div className={styles.tableSecondary}>{item.is_active ? '활성' : '비활성'}</div>
                      </td>
                      <td>{item.code || '-'}</td>
                      <td>{item.tags.join(', ') || '-'}</td>
                      <td>{item.sort_order}</td>
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
        title={editingId === 'create' ? '콘텐츠 추가' : '콘텐츠 수정'}
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
          <label className={styles.modalField}><span className={styles.label}>콘텐츠 유형</span><select className="app-select" value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value as SafetyContentItem['content_type'] })} disabled={busy || editingId !== 'create'}>{CONTENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className={styles.modalField}><span className={styles.label}>제목</span><input className="app-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>코드</span><input className="app-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>정렬 순서</span><input className="app-input" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>시작일</span><input className="app-input" type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>종료일</span><input className="app-input" type="date" value={form.effective_to} onChange={(e) => setForm({ ...form, effective_to: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalFieldWide}><span className={styles.label}>태그</span><input className="app-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalFieldWide}><span className={styles.label}>본문(JSON 또는 텍스트)</span><textarea className="app-textarea" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} disabled={busy} /></label>
          <label className={styles.modalField}><span className={styles.label}>활성 여부</span><select className="app-select" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })} disabled={busy}><option value="true">활성</option><option value="false">비활성</option></select></label>
        </div>
      </AppModal>
    </section>
  );
}
