'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import ActionMenu from '@/components/ui/ActionMenu';
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

const DISASTER_CASE_BATCH_SIZE = 4;

type DisasterCaseBatchItem = {
  title: string;
  summary: string;
  image_url: string;
  image_name: string;
};

function createEmptyDisasterCaseBatchItems(): DisasterCaseBatchItem[] {
  return Array.from({ length: DISASTER_CASE_BATCH_SIZE }, () => ({
    title: '',
    summary: '',
    image_url: '',
    image_name: '',
  }));
}

interface ContentItemsSectionProps {
  busy: boolean;
  styles: Record<string, string>;
  items: SafetyContentItem[];
  canDelete: boolean;
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
  onDelete: (id: string) => Promise<void>;
}

export default function ContentItemsSection(props: ContentItemsSectionProps) {
  const { busy, styles, items, canDelete, onCreate, onUpdate, onDelete } = props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<SafetyContentItem['content_type'] | 'all'>('all');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(createEmptyContentForm());
  const [disasterCaseBatchItems, setDisasterCaseBatchItems] = useState<DisasterCaseBatchItem[]>(
    createEmptyDisasterCaseBatchItems(),
  );
  const isOpen = editingId !== null;
  const deferredQuery = useDeferredValue(query);

  const filteredItems = useMemo(
    () =>
      (activeType === 'all'
        ? items
        : items.filter((item) => item.content_type === activeType)
      ).filter((item) => {
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
    [activeType, deferredQuery, items],
  );
  const createContentType =
    activeType === 'all' ? createEmptyContentForm().content_type : activeType;
  const createButtonLabel =
    activeType === 'all'
      ? '콘텐츠 추가'
      : `${CONTENT_TYPE_LABELS[createContentType]} 추가`;

  const activeTypeMeta =
    form.content_type in CONTENT_TYPE_META ? CONTENT_TYPE_META[form.content_type] : null;
  const isMeasurementTemplate = form.content_type === 'measurement_template';
  const isSafetyNews = form.content_type === 'safety_news';
  const isDisasterCase = form.content_type === 'disaster_case';
  const isDisasterCaseBatchCreate = editingId === 'create' && isDisasterCase;
  const titleLabel = isMeasurementTemplate ? '장비명' : '제목';
  const titlePlaceholder = isMeasurementTemplate ? '예: 조도계' : '';

  const openCreate = () => {
    setEditingId('create');
    setForm(createEmptyContentForm(createContentType));
    setDisasterCaseBatchItems(createEmptyDisasterCaseBatchItems());
  };

  const openEdit = (item: SafetyContentItem) => {
    setEditingId(item.id);
    setForm(mapContentItemToForm(item));
    setDisasterCaseBatchItems(createEmptyDisasterCaseBatchItems());
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(createEmptyContentForm());
    setDisasterCaseBatchItems(createEmptyDisasterCaseBatchItems());
  };

  const submit = async () => {
    if (isDisasterCaseBatchCreate) {
      const sharedPayload = {
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        sort_order: Number(form.sort_order || 0),
        effective_from: toNullableText(form.effective_from),
        effective_to: toNullableText(form.effective_to),
        is_active: form.is_active,
      };
      const entries = disasterCaseBatchItems
        .map((item, index) => ({
          item,
          index,
          title: item.title.trim(),
          summary: item.summary.trim(),
        }))
        .filter(({ title, summary, item }) => title || summary || item.image_url);

      if (entries.length === 0) return;

      for (const { item, index, title, summary } of entries) {
        await onCreate({
          content_type: 'disaster_case',
          title: title || `재해 사례 ${index + 1}`,
          code: null,
          body: {
            body: summary,
            summary,
            imageUrl: item.image_url || '',
            imageName: item.image_name || '',
          },
          tags: sharedPayload.tags,
          sort_order: sharedPayload.sort_order + index,
          effective_from: sharedPayload.effective_from,
          effective_to: sharedPayload.effective_to,
          is_active: sharedPayload.is_active,
        });
      }

      closeModal();
      return;
    }

    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      code: toNullableText(form.code),
      body: buildContentBody(form),
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
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

  const handleDeleteContentItem = async (item: SafetyContentItem) => {
    const confirmed = window.confirm(
      `'${item.title}' 콘텐츠를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;
    await onDelete(item.id);
  };

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>콘텐츠 데이터 CRUD</h2>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">총 {filteredItems.length}개</span>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={openCreate}
            disabled={busy}
          >
            {createButtonLabel}
          </button>
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
          <button
            type="button"
            className={`${styles.filterButton} ${activeType === 'all' ? styles.filterButtonActive : ''}`}
            onClick={() => setActiveType('all')}
          >
            전체
          </button>
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.filterButton} ${activeType === option.value ? styles.filterButtonActive : ''}`}
              onClick={() => setActiveType(option.value)}
            >
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
                    <th>메뉴</th>
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
                          {`${item.code || '코드 없음'} · ${item.is_active ? '활성' : '비활성'}`}
                        </div>
                      </td>
                      <td>{getContentPreview(item)}</td>
                      <td>{getContentAttachmentSummary(item)}</td>
                      <td>{formatTimestamp(item.updated_at)}</td>
                      <td>
                        <div className={styles.tableActionMenuWrap}>
                          <ActionMenu
                            label={`${item.title} 콘텐츠 작업 메뉴 열기`}
                            items={[
                              {
                                label: '수정',
                                onSelect: () => {
                                  if (!busy) openEdit(item);
                                },
                              },
                              ...(canDelete
                                ? [{
                                    label: '삭제',
                                    tone: 'danger' as const,
                                    onSelect: () => {
                                      if (!busy) void handleDeleteContentItem(item);
                                    },
                                  }]
                                : []),
                            ]}
                          />
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
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={closeModal}
              disabled={busy}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void submit()}
              disabled={busy}
            >
              {editingId === 'create' ? '생성' : '저장'}
            </button>
          </>
        }
      >
        <div className={styles.modalForm}>
          <div className={styles.modalGrid}>
            <label className={styles.modalField}>
              <span className={styles.label}>콘텐츠 유형</span>
              <select
                className="app-select"
                value={form.content_type}
                onChange={(e) => {
                  const nextType = e.target.value as SafetyContentItem['content_type'];
                  setForm((current) => switchContentType(current, nextType));
                  if (nextType === 'disaster_case') {
                    setDisasterCaseBatchItems(createEmptyDisasterCaseBatchItems());
                  }
                }}
                disabled={busy || editingId !== 'create'}
              >
                {editingId !== 'create' &&
                !CONTENT_TYPE_OPTIONS.some((option) => option.value === form.content_type) ? (
                  <option value={form.content_type}>{CONTENT_TYPE_LABELS[form.content_type]}</option>
                ) : null}
                {CONTENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {!isDisasterCaseBatchCreate ? (
              <label className={styles.modalField}>
                <span className={styles.label}>{titleLabel}</span>
                <input
                  className="app-input"
                  value={form.title}
                  placeholder={titlePlaceholder}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  disabled={busy}
                />
              </label>
            ) : null}

            {!isDisasterCaseBatchCreate ? (
              <label className={styles.modalField}>
                <span className={styles.label}>코드</span>
                <input
                  className="app-input"
                  placeholder="선택 입력"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  disabled={busy}
                />
              </label>
            ) : null}

            <label className={styles.modalField}>
              <span className={styles.label}>정렬 순서</span>
              <input
                className="app-input"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                disabled={busy}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.label}>시작일</span>
              <input
                className="app-input"
                type="date"
                value={form.effective_from}
                onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
                disabled={busy}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.label}>종료일</span>
              <input
                className="app-input"
                type="date"
                value={form.effective_to}
                onChange={(e) => setForm({ ...form, effective_to: e.target.value })}
                disabled={busy}
              />
            </label>

            <label className={styles.modalFieldWide}>
              <span className={styles.label}>태그</span>
              <input
                className="app-input"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                disabled={busy}
              />
            </label>
          </div>

          {activeTypeMeta ? (
            <div className={styles.contentTypePanel}>
              <div className={styles.contentTypeHeader}>
                <div>
                  <strong>{activeTypeMeta.label}</strong>
                  <p className={styles.modalHint}>{activeTypeMeta.description}</p>
                  {activeTypeMeta.usageHint ? (
                    <p className={styles.modalHintStrong}>{activeTypeMeta.usageHint}</p>
                  ) : null}
                </div>
                <span className="app-chip">{CONTENT_EDITOR_MODE_LABELS[activeTypeMeta.editorMode]}</span>
              </div>

              {isMeasurementTemplate ? (
                <label className={styles.modalFieldWide}>
                  <span className={styles.label}>안전 기준</span>
                  <textarea
                    className="app-textarea"
                    rows={8}
                    placeholder={'예:\n1. 초정밀작업 : 750 Lux 이상\n2. 정밀작업 : 300 Lux 이상'}
                    value={form.text_body}
                    onChange={(e) => setForm({ ...form, text_body: e.target.value })}
                    disabled={busy}
                  />
                </label>
              ) : null}

              {isSafetyNews ? (
                <>
                  <label className={styles.modalFieldWide}>
                    <span className={styles.label}>안내 문구(선택)</span>
                    <textarea
                      className="app-textarea"
                      rows={4}
                      placeholder="문서 14 하단에 함께 보여줄 짧은 안내 문구가 있으면 입력"
                      value={form.text_body}
                      onChange={(e) => setForm({ ...form, text_body: e.target.value })}
                      disabled={busy}
                    />
                  </label>
                </>
              ) : null}

              {isDisasterCase ? (
                isDisasterCaseBatchCreate ? (
                  <div className={styles.batchCaseGrid}>
                    {disasterCaseBatchItems.map((item, index) => (
                      <article key={`batch-case-${index + 1}`} className={styles.batchCaseCard}>
                        <div className={styles.batchCaseHeader}>
                          <strong>{`재해 사례 ${index + 1}`}</strong>
                        </div>
                        <label className={styles.modalField}>
                          <span className={styles.label}>제목</span>
                          <input
                            className="app-input"
                            value={item.title}
                            placeholder={`예: 재해 사례 ${index + 1}`}
                            onChange={(e) =>
                              setDisasterCaseBatchItems((current) =>
                                current.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, title: e.target.value } : entry,
                                ),
                              )
                            }
                            disabled={busy}
                          />
                        </label>
                        <label className={styles.modalField}>
                          <span className={styles.label}>사례 요약(선택)</span>
                          <textarea
                            className="app-textarea"
                            rows={4}
                            placeholder="문서 13 카드 하단에 보여줄 사례 요약"
                            value={item.summary}
                            onChange={(e) =>
                              setDisasterCaseBatchItems((current) =>
                                current.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, summary: e.target.value } : entry,
                                ),
                              )
                            }
                            disabled={busy}
                          />
                        </label>
                        <ContentAssetField
                          accept="image/*"
                          disabled={busy}
                          label="대표 이미지"
                          mode="image"
                          value={item.image_url}
                          fileName={item.image_name}
                          onChange={({ dataUrl, fileName }) =>
                            setDisasterCaseBatchItems((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, image_url: dataUrl, image_name: fileName }
                                  : entry,
                              ),
                            )
                          }
                          onClear={() =>
                            setDisasterCaseBatchItems((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, image_url: '', image_name: '' }
                                  : entry,
                              ),
                            )
                          }
                        />
                      </article>
                    ))}
                  </div>
                ) : (
                  <label className={styles.modalFieldWide}>
                    <span className={styles.label}>사례 요약(선택)</span>
                    <textarea
                      className="app-textarea"
                      rows={4}
                      placeholder="문서 13 카드 하단에 보여줄 사례 요약이 있으면 입력"
                      value={form.text_body}
                      onChange={(e) => setForm({ ...form, text_body: e.target.value })}
                      disabled={busy}
                    />
                  </label>
                )
              ) : null}

              {!isMeasurementTemplate && !isSafetyNews && !isDisasterCase ? (
                <label className={styles.modalFieldWide}>
                  <span className={styles.label}>{activeTypeMeta.bodyLabel}</span>
                  <textarea
                    className="app-textarea"
                    value={form.text_body}
                    onChange={(e) => setForm({ ...form, text_body: e.target.value })}
                    disabled={busy}
                  />
                </label>
              ) : null}

              {activeTypeMeta.editorMode === 'image' && !isDisasterCaseBatchCreate ? (
                <ContentAssetField
                  accept="image/*"
                  disabled={busy}
                  label="대표 이미지"
                  mode="image"
                  value={form.image_url}
                  fileName={form.image_name}
                  onChange={({ dataUrl, fileName }) =>
                    setForm({ ...form, image_url: dataUrl, image_name: fileName })
                  }
                  onClear={() => setForm({ ...form, image_url: '', image_name: '' })}
                />
              ) : null}

              {activeTypeMeta.editorMode === 'file' && !isSafetyNews ? (
                <div className={styles.assetGrid}>
                  <ContentAssetField
                    accept=".pdf,.doc,.docx,.hwp,.png,.jpg,.jpeg,.gif,.webp"
                    disabled={busy}
                    label={activeTypeMeta.fileLabels?.[0] || '파일 1'}
                    mode="file"
                    value={form.file_url_1}
                    fileName={form.file_name_1}
                    onChange={({ dataUrl, fileName }) =>
                      setForm({ ...form, file_url_1: dataUrl, file_name_1: fileName })
                    }
                    onClear={() => setForm({ ...form, file_url_1: '', file_name_1: '' })}
                  />
                  <ContentAssetField
                    accept=".pdf,.doc,.docx,.hwp,.png,.jpg,.jpeg,.gif,.webp"
                    disabled={busy}
                    label={activeTypeMeta.fileLabels?.[1] || '파일 2'}
                    mode="file"
                    value={form.file_url_2}
                    fileName={form.file_name_2}
                    onChange={({ dataUrl, fileName }) =>
                      setForm({ ...form, file_url_2: dataUrl, file_name_2: fileName })
                    }
                    onClear={() => setForm({ ...form, file_url_2: '', file_name_2: '' })}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <label className={styles.modalField}>
            <span className={styles.label}>활성 여부</span>
            <select
              className="app-select"
              value={form.is_active ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
              disabled={busy}
            >
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </label>
        </div>
      </AppModal>
    </section>
  );
}
