'use client';

import { useState } from 'react';
import type { SafetyContentItem } from '@/types/backend';
import { CONTENT_TYPE_OPTIONS, formatTimestamp, parseContentBody, stringifyContentBody, toNullableText } from './shared';

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

export default function ContentItemsSection({
  busy,
  styles,
  items,
  onCreate,
  onUpdate,
  onDeactivate,
}: ContentItemsSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const resetForm = () => {
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
    if (editingId) await onUpdate(editingId, payload);
    else await onCreate({ content_type: form.content_type, ...payload });
    resetForm();
  };

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>마스터/콘텐츠 CRUD</h2>
          <p className={styles.sectionDescription}>법령, 재해사례, 시정조치 옵션 등 API 마스터 데이터를 관리합니다.</p>
        </div>
      </div>
      <div className={`${styles.sectionBody} ${styles.splitGrid}`}>
        <div className={styles.recordCard}>
          <div className={styles.recordTop}><strong className={styles.recordTitle}>{editingId ? '콘텐츠 수정' : '콘텐츠 생성'}</strong></div>
          <div className={styles.formGrid} style={{ marginTop: 14 }}>
            <label className={styles.field}><span className={styles.label}>콘텐츠 유형</span><select className="app-select" value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value as SafetyContentItem['content_type'] })} disabled={busy || Boolean(editingId)}>{CONTENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className={styles.field}><span className={styles.label}>제목</span><input className="app-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>코드</span><input className="app-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>정렬 순서</span><input className="app-input" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>시작일</span><input className="app-input" type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} disabled={busy} /></label>
            <label className={styles.field}><span className={styles.label}>종료일</span><input className="app-input" type="date" value={form.effective_to} onChange={(e) => setForm({ ...form, effective_to: e.target.value })} disabled={busy} /></label>
            <label className={styles.fieldWide}><span className={styles.label}>태그</span><input className="app-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} disabled={busy} /></label>
            <label className={styles.fieldWide}><span className={styles.label}>본문(JSON 또는 텍스트)</span><textarea className="app-textarea" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} disabled={busy} /></label>
          </div>
          <div className={styles.formActions}>
            <button type="button" className="app-button app-button-primary" onClick={() => void submit()} disabled={busy}>{editingId ? '저장' : '생성'}</button>
            <button type="button" className="app-button app-button-secondary" onClick={resetForm} disabled={busy}>초기화</button>
          </div>
        </div>

        <div className={styles.recordList}>
          {items.length === 0 ? <div className={styles.empty}>등록된 마스터 데이터가 없습니다.</div> : items.map((item) => (
            <article key={item.id} className={styles.recordCard}>
              <div className={styles.recordTop}>
                <div>
                  <strong className={styles.recordTitle}>{item.title}</strong>
                  <div className={styles.recordMeta}>
                    <span className="app-chip">{item.content_type}</span>
                    <span className="app-chip">{item.code || '코드 없음'}</span>
                    <span className="app-chip">{item.is_active ? '활성' : '비활성'}</span>
                  </div>
                </div>
                <div className={styles.recordActions}>
                  <button type="button" className="app-button app-button-secondary" onClick={() => { setEditingId(item.id); setForm({ content_type: item.content_type, title: item.title, code: item.code ?? '', body: stringifyContentBody(item.body), tags: item.tags.join(', '), sort_order: String(item.sort_order), effective_from: item.effective_from?.slice(0, 10) ?? '', effective_to: item.effective_to?.slice(0, 10) ?? '', is_active: item.is_active }); }} disabled={busy}>수정</button>
                  <button type="button" className="app-button app-button-danger" onClick={() => void onDeactivate(item.id)} disabled={busy || !item.is_active}>비활성화</button>
                </div>
              </div>
              <p className={styles.recordDescription}>
                태그: {item.tags.join(', ') || '없음'}
                {'\n'}정렬순서: {item.sort_order}
                {'\n'}수정일: {formatTimestamp(item.updated_at)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
