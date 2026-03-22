'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import ContentAssetField from '@/components/controller/ContentAssetField';
import type { SafetyContentItem } from '@/types/backend';
import {
  CONTENT_EDITOR_MODE_LABELS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_META,
  CONTENT_TYPE_OPTIONS,
  formatTimestamp,
  toNullableText,
} from './shared';
import {
  buildContentBody,
  createEmptyContentForm,
  getContentAttachmentSummary,
  getContentPreview,
  mapContentItemToForm,
  switchContentType,
} from './contentItems';

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

export default function ContentItemsSection(props: ContentItemsSectionProps) {
  const { busy, styles, items, onCreate, onUpdate, onDeactivate } = props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<SafetyContentItem['content_type'] | 'all'>('all');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(createEmptyContentForm());
  const isOpen = editingId !== null;
  const deferredQuery = useDeferredValue(query);
  const filteredItems = useMemo(
    () => (activeType === 'all' ? items : items.filter((item) => item.content_type === activeType)).filter((item) => {
      const normalizedQuery = deferredQuery.trim().toLowerCase();
      if (!normalizedQuery) return true;
      return [
        item.title,
        item.code ?? '',
        getContentPreview(item),
        getContentAttachmentSummary(item),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    }),
    [activeType, deferredQuery, items]
  );
  const activeTypeMeta =
    form.content_type in CONTENT_TYPE_META ? CONTENT_TYPE_META[form.content_type] : null;

  const openCreate = () => {
    setEditingId('create');
    setForm(createEmptyContentForm());
  };

  const openEdit = (item: SafetyContentItem) => {
    setEditingId(item.id);
    setForm(mapContentItemToForm(item));
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(createEmptyContentForm());
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      code: toNullableText(form.code),
      body: buildContentBody(form),
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
          <h2 className={styles.sectionTitle}>콘텐츠 데이터 CRUD</h2>
          <p className={styles.sectionDescription}>유형별로 분류해서 보고, 이미지형과 파일형은 업로드 방식에 맞춰 입력할 수 있습니다.</p>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">총 {filteredItems.length}개</span>
          <button type="button" className="app-button app-button-primary" onClick={openCreate} disabled={busy}>콘텐츠 추가</button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.filterRow}>
          <input
            className={`app-input ${styles.filterSearch}`}
            placeholder="제목, 코드, 미리보기 내용으로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="button" className={`${styles.filterButton} ${activeType === 'all' ? styles.filterButtonActive : ''}`} onClick={() => setActiveType('all')}>
            전체
          </button>
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <button key={option.value} type="button" className={`${styles.filterButton} ${activeType === option.value ? styles.filterButtonActive : ''}`} onClick={() => setActiveType(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
        <div className={styles.tableShell}>
          {filteredItems.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 콘텐츠 데이터가 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>유형</th>
                    <th>입력 방식</th>
                    <th>제목</th>
                    <th>내용 미리보기</th>
                    <th>첨부</th>
                    <th>수정일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>{CONTENT_TYPE_LABELS[item.content_type]}</td>
                      <td>{CONTENT_EDITOR_MODE_LABELS[CONTENT_TYPE_META[item.content_type].editorMode]}</td>
                      <td>
                        <div className={styles.tablePrimary}>{item.title}</div>
                        <div className={styles.tableSecondary}>
                          {item.code || '코드 없음'} · {item.is_active ? '활성' : '비활성'}
                        </div>
                      </td>
                      <td>{getContentPreview(item)}</td>
                      <td>{getContentAttachmentSummary(item)}</td>
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
        <div className={styles.modalForm}>
          <div className={styles.modalGrid}>
            <label className={styles.modalField}><span className={styles.label}>콘텐츠 유형</span><select className="app-select" value={form.content_type} onChange={(e) => setForm((current) => switchContentType(current, e.target.value as SafetyContentItem['content_type']))} disabled={busy || editingId !== 'create'}>{CONTENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className={styles.modalField}><span className={styles.label}>제목</span><input className="app-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={busy} /></label>
            <label className={styles.modalField}><span className={styles.label}>코드</span><input className="app-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={busy} /></label>
            <label className={styles.modalField}><span className={styles.label}>정렬 순서</span><input className="app-input" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} disabled={busy} /></label>
            <label className={styles.modalField}><span className={styles.label}>시작일</span><input className="app-input" type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} disabled={busy} /></label>
            <label className={styles.modalField}><span className={styles.label}>종료일</span><input className="app-input" type="date" value={form.effective_to} onChange={(e) => setForm({ ...form, effective_to: e.target.value })} disabled={busy} /></label>
            <label className={styles.modalFieldWide}><span className={styles.label}>태그</span><input className="app-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} disabled={busy} /></label>
          </div>

          {activeTypeMeta ? (
            <div className={styles.contentTypePanel}>
              <div className={styles.contentTypeHeader}>
                <div>
                  <strong>{activeTypeMeta.label}</strong>
                  <p className={styles.modalHint}>{activeTypeMeta.description}</p>
                </div>
                <span className="app-chip">{CONTENT_EDITOR_MODE_LABELS[activeTypeMeta.editorMode]}</span>
              </div>

              <label className={styles.modalFieldWide}>
                <span className={styles.label}>{activeTypeMeta.bodyLabel}</span>
                <textarea className="app-textarea" value={form.text_body} onChange={(e) => setForm({ ...form, text_body: e.target.value })} disabled={busy} />
              </label>

              {activeTypeMeta.editorMode === 'image' ? (
                <ContentAssetField
                  accept="image/*"
                  disabled={busy}
                  label="대표 이미지"
                  mode="image"
                  value={form.image_url}
                  fileName={form.image_name}
                  onChange={({ dataUrl, fileName }) => setForm({ ...form, image_url: dataUrl, image_name: fileName })}
                  onClear={() => setForm({ ...form, image_url: '', image_name: '' })}
                />
              ) : null}

              {activeTypeMeta.editorMode === 'file' ? (
                <div className={styles.assetGrid}>
                  <ContentAssetField
                    accept=".pdf,.doc,.docx,.hwp,.png,.jpg,.jpeg,.gif,.webp"
                    disabled={busy}
                    label={activeTypeMeta.fileLabels?.[0] || '파일 1'}
                    mode="file"
                    value={form.file_url_1}
                    fileName={form.file_name_1}
                    onChange={({ dataUrl, fileName }) => setForm({ ...form, file_url_1: dataUrl, file_name_1: fileName })}
                    onClear={() => setForm({ ...form, file_url_1: '', file_name_1: '' })}
                  />
                  <ContentAssetField
                    accept=".pdf,.doc,.docx,.hwp,.png,.jpg,.jpeg,.gif,.webp"
                    disabled={busy}
                    label={activeTypeMeta.fileLabels?.[1] || '파일 2'}
                    mode="file"
                    value={form.file_url_2}
                    fileName={form.file_name_2}
                    onChange={({ dataUrl, fileName }) => setForm({ ...form, file_url_2: dataUrl, file_name_2: fileName })}
                    onClear={() => setForm({ ...form, file_url_2: '', file_name_2: '' })}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <label className={styles.modalField}>
            <span className={styles.label}>활성 여부</span>
            <select className="app-select" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })} disabled={busy}>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </label>
        </div>
      </AppModal>
    </section>
  );
}
