'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import ActionMenu from '@/components/ui/ActionMenu';
import {
  buildSortMenuOptions,
  SortableHeaderCell,
} from '@/features/admin/components/SortableHeaderCell';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  uploadSafetyAssetFile,
  usesSafetyProxyUpload,
  validateSafetyAssetFile,
} from '@/lib/safetyApi/assets';
import {
  CONTENT_EDITOR_MODE_LABELS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_META,
  CONTENT_TYPE_OPTIONS,
  toNullableText,
} from '@/lib/admin';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import { formatDateRange } from '@/lib/safetyApiMappers/utils';
import type { TableSortState } from '@/types/admin';
import type { SafetyContentItem } from '@/types/backend';
import { ContentAssetField } from './ContentAssetField';
import {
  buildContentBody,
  buildContentTitle,
  createEmptyContentForm,
  getContentAttachmentSummary,
  getContentPreview,
  mapContentItemToForm,
  switchContentType,
} from './lib/contentItems';

// TODO(admin-refactor): Extract the editor modal and disaster-case batch fields.
// This file stayed large in this pass because the content CRUD flow has many type-specific branches that were safer to keep together.

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
  items: SafetyContentItem[];
  canDelete: boolean;
  canUploadAssets: boolean;
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

export function ContentItemsSection(props: ContentItemsSectionProps) {
  const { busy, items, canDelete, canUploadAssets, onCreate, onUpdate, onDelete } = props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<SafetyContentItem['content_type'] | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<TableSortState>({
    direction: 'asc',
    key: 'title',
  });
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
  const sortedItems = useMemo(() => {
    const direction = sort.direction === 'asc' ? 1 : -1;

    return [...filteredItems].sort((left, right) => {
      if (sort.key === 'content_type') {
        return left.content_type.localeCompare(right.content_type, 'ko') * direction;
      }

      if (sort.key === 'sort_order') {
        return (left.sort_order - right.sort_order) * direction;
      }

      if (sort.key === 'updated_at') {
        return left.updated_at.localeCompare(right.updated_at) * direction;
      }

      if (sort.key === 'effective_from') {
        return (left.effective_from ?? '').localeCompare(right.effective_from ?? '') * direction;
      }

      return left.title.localeCompare(right.title, 'ko') * direction;
    });
  }, [filteredItems, sort.direction, sort.key]);
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
  const isDoc7ReferenceMaterial = form.content_type === 'doc7_reference_material';
  const isGenericTitleType =
    !isMeasurementTemplate &&
    !isSafetyNews &&
    !isDisasterCase &&
    !isDoc7ReferenceMaterial;
  const isDisasterCaseBatchCreate = editingId === 'create' && isDisasterCase;
  const titleLabel = isMeasurementTemplate ? '장비명' : '제목';
  const titlePlaceholder = isMeasurementTemplate ? '예: 조도계' : ''; 
  const usesSafetyProxy = usesSafetyProxyUpload();
  const uploadPermissionHelperText = canUploadAssets
    ? '이미지 파일 업로드 API를 사용할 수 없습니다.'
    : '현재 권한에서는 콘텐츠 자산 업로드나 교체를 할 수 없습니다.';
  const fileUploadHelperText = canUploadAssets
    ? usesSafetyProxy
      ? '현재는 기본 업로드 용량이 50MB이며, 배포 환경의 제한이 더 작으면 업로드가 실패할 수 있습니다.'
      : undefined
    : uploadPermissionHelperText;

  const validateLargeFile = (file: File) =>
    validateSafetyAssetFile(file, { usesProxy: usesSafetyProxy });

  const uploadFileAsset = async (file: File) => {
    const uploaded = await uploadSafetyAssetFile(file);
    return {
      fileName: uploaded.file_name || file.name,
      value: uploaded.url,
    };
  };

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
        code: toNullableText(form.code),
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
          code: sharedPayload.code,
          title: title || `재해 사례 ${index + 1}`,
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

    const nextTitle = buildContentTitle(form);
    if (!nextTitle) return;
    const payload = {
      title: nextTitle,
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
      `'${item.title}' 콘텐츠를 비활성화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
    );

    if (!confirmed) return;
    await onDelete(item.id);
  };
  const handleExport = () =>
    void exportAdminWorkbook('content', [
      {
        name: '콘텐츠',
        columns: [
          { key: 'content_type', label: '유형' },
          { key: 'title', label: '제목' },
          { key: 'preview', label: '내용 미리보기' },
          { key: 'attachment', label: '첨부 요약' },
          { key: 'period', label: '시작일 ~ 종료일' },
          { key: 'sort_order', label: '정렬순서' },
          { key: 'updated_at', label: '수정일' },
        ],
        rows: sortedItems.map((item) => ({
          attachment: getContentAttachmentSummary(item),
          content_type: CONTENT_TYPE_LABELS[item.content_type],
          period: formatDateRange(item.effective_from, item.effective_to) || '',
          preview: getContentPreview(item),
          sort_order: item.sort_order,
          title: item.title,
          updated_at: item.updated_at,
        })),
      },
    ]);

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderTitleBlock}>
          <h2 className={styles.sectionTitle}>콘텐츠 데이터 CRUD</h2>
        </div>
        <div className={`${styles.sectionHeaderActions} ${styles.sectionHeaderToolbarActions}`}>
          <input
            className={`app-input ${styles.sectionHeaderSearch} ${styles.sectionHeaderToolbarSearch}`}
            placeholder="제목, 미리보기 내용으로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className={`app-select ${styles.sectionHeaderSelect}`}
            aria-label="콘텐츠 분류 필터"
            value={activeType}
            onChange={(event) =>
              setActiveType(
                event.target.value as SafetyContentItem['content_type'] | 'all',
              )
            }
          >
            <option value="all">전체 분류</option>
            {CONTENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={handleExport}
            disabled={busy}
          >
            엑셀 내보내기
          </button>
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
        <div className={styles.tableShell}>
          {sortedItems.length === 0 ? (
            <div className={styles.tableEmpty}>등록된 콘텐츠 데이터가 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr style={{ display: 'none' }}>
                    <th>유형</th>
                    <th>입력 방식</th>
                    <th>제목</th>
                    <th>내용 미리보기</th>
                    <th>첨부</th>
                    <th>수정일</th>
                    <th>메뉴</th>
                  </tr>
                  <tr>
                    <SortableHeaderCell
                      column={{ key: 'content_type' }}
                      current={sort}
                      label="유형"
                      onChange={setSort}
                      sortMenuOptions={buildSortMenuOptions('content_type', {
                        asc: '유형 오름차순',
                        desc: '유형 내림차순',
                      })}
                    />
                    <SortableHeaderCell
                      column={{ key: 'title' }}
                      current={sort}
                      label="제목"
                      onChange={setSort}
                    />
                    <th>내용 미리보기</th>
                    <SortableHeaderCell
                      column={{ key: 'effective_from' }}
                      current={sort}
                      defaultDirection="desc"
                      label="시작일 ~ 종료일"
                      onChange={setSort}
                      title="시작일 정렬"
                    />
                    <th>메뉴</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr key={item.id}>
                      <td>{CONTENT_TYPE_LABELS[item.content_type]}</td>
                      <td>
                        <div className={styles.tablePrimary}>{item.title}</div>
                        <div className={styles.tableSecondary}>
                          {item.is_active ? '활성' : '비활성'}
                        </div>
                      </td>
                      <td>{getContentPreview(item)}</td>
                      <td>{formatDateRange(item.effective_from, item.effective_to) || '-'}</td>
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
                                    label: '비활성화',
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
          </div>

          <label className={styles.modalFieldWide}>
            <span className={styles.label}>태그</span>
            <input
              className="app-input"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              disabled={busy}
            />
          </label>

          {activeTypeMeta ? (
            <div className={styles.contentTypePanel}>
              <div className={styles.contentTypeHeader}>
                <div>
                  <strong>{activeTypeMeta.label}</strong>
                </div>
                <span className="app-chip">{CONTENT_EDITOR_MODE_LABELS[activeTypeMeta.editorMode]}</span>
              </div>

              {isMeasurementTemplate ? (
                <>
                  <label className={styles.modalFieldWide}>
                    <span className={styles.label}>{titleLabel}</span>
                    <input
                      className="app-input"
                      value={form.title}
                      placeholder={titlePlaceholder}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      disabled={busy}
                    />
                  </label>
                  <label className={styles.modalFieldWide}>
                    <span className={styles.label}>안전 기준</span>
                    <textarea
                      className="app-textarea"
                      rows={8}
                      placeholder={'예시\n1. 초정밀작업 : 750 Lux 이상\n2. 정밀작업 : 300 Lux 이상'}
                      value={form.text_body}
                      onChange={(e) => setForm({ ...form, text_body: e.target.value })}
                      disabled={busy}
                    />
                  </label>
                </>
              ) : null}

              {isSafetyNews ? (
                <>
                  <label className={styles.modalFieldWide}>
                    <span className={styles.label}>{titleLabel}</span>
                    <input
                      className="app-input"
                      value={form.title}
                      placeholder={titlePlaceholder}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      disabled={busy}
                    />
                  </label>
                  <label className={styles.modalFieldWide}>
                    <span className={styles.label}>안내 문구(선택)</span>
                    <textarea
                      className="app-textarea"
                      rows={4}
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
                        <ContentAssetField
                          accept="image/*"
                          disabled={busy || !canUploadAssets}
                          helperText={uploadPermissionHelperText}
                          label="대표 이미지"
                          mode="image"
                          readOnly={!canUploadAssets}
                          value={item.image_url}
                          fileName={item.image_name}
                          onChange={({ value, fileName }) =>
                            setDisasterCaseBatchItems((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, image_url: value, image_name: fileName }
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
                          resolveFile={uploadFileAsset}
                          validateFile={validateLargeFile}
                        />
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.batchCaseGrid}>
                    <article
                      className={`${styles.batchCaseCard} ${styles.batchCaseCardSingle}`}
                    >
                      <div className={styles.batchCaseHeader}>
                        <strong>재해 사례</strong>
                      </div>
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
                      <label className={styles.modalField}>
                        <span className={styles.label}>사례 요약(선택)</span>
                        <textarea
                          className="app-textarea"
                          rows={4}
                          value={form.text_body}
                          onChange={(e) => setForm({ ...form, text_body: e.target.value })}
                          disabled={busy}
                        />
                      </label>
                      <ContentAssetField
                        accept="image/*"
                        disabled={busy || !canUploadAssets}
                        helperText={uploadPermissionHelperText}
                        label="대표 이미지"
                        mode="image"
                        readOnly={!canUploadAssets}
                        value={form.image_url}
                        fileName={form.image_name}
                        onChange={({ value, fileName }) =>
                          setForm({ ...form, image_url: value, image_name: fileName })
                        }
                        onClear={() => setForm({ ...form, image_url: '', image_name: '' })}
                        resolveFile={uploadFileAsset}
                        validateFile={validateLargeFile}
                      />
                    </article>
                  </div>
                )
              ) : null}

              {isDoc7ReferenceMaterial ? (
                <>
                  <div className={styles.modalGrid}>
                    <label className={styles.modalField}>
                      <span className={styles.label}>재해유형</span>
                      <input
                        className="app-input"
                        type="text"
                        value={form.accident_type}
                        placeholder="재해유형 직접 입력"
                        onChange={(e) => setForm({ ...form, accident_type: e.target.value })}
                        disabled={busy}
                        autoComplete="off"
                      />
                    </label>
                    <label className={styles.modalField}>
                      <span className={styles.label}>기인물 유형</span>
                      <input
                        className="app-input"
                        type="text"
                        value={form.causative_agent_key}
                        placeholder="기인물 직접 입력 (표준 키 또는 문구)"
                        onChange={(e) =>
                          setForm({ ...form, causative_agent_key: e.target.value })
                        }
                        disabled={busy}
                        autoComplete="off"
                      />
                    </label>
                  </div>
                  <div className={styles.referenceMaterialEditorGrid}>
                    <div className={styles.referenceMaterialTextField}>
                      <label className={styles.modalField}>
                        <span className={styles.label}>참고자료 1 제목</span>
                        <input
                          className="app-input"
                          value={form.reference_title_1}
                          placeholder="예: 추락 재해사례"
                          onChange={(e) =>
                            setForm({ ...form, reference_title_1: e.target.value })
                          }
                          disabled={busy}
                        />
                      </label>
                    <ContentAssetField
                      accept="image/*"
                      disabled={busy || !canUploadAssets}
                      label="참고자료 이미지"
                      mode="image"
                      readOnly={!canUploadAssets}
                      value={form.image_url}
                      fileName={form.image_name}
                      onChange={({ value, fileName }) =>
                        setForm({ ...form, image_url: value, image_name: fileName })
                      }
                      onClear={() => setForm({ ...form, image_url: '', image_name: '' })}
                      resolveFile={uploadFileAsset}
                      validateFile={validateLargeFile}
                    />
                    </div>
                    <label className={styles.referenceMaterialTextField}>
                      <span className={styles.label}>참고자료 2 제목</span>
                      <input
                        className="app-input"
                        value={form.reference_title_2}
                        placeholder="예: 재해 개요 및 원인"
                        onChange={(e) =>
                          setForm({ ...form, reference_title_2: e.target.value })
                        }
                        disabled={busy}
                      />
                      <span className={styles.label}>{activeTypeMeta.bodyLabel}</span>
                      <div className={styles.referenceMaterialTextBox}>
                        <textarea
                          className={styles.referenceMaterialTextArea}
                          value={form.text_body}
                          placeholder="참고자료 내용을 입력"
                          onChange={(e) =>
                            setForm({ ...form, text_body: e.target.value })
                          }
                          disabled={busy}
                        />
                      </div>
                    </label>
                  </div>
                </>
              ) : null}

              {isGenericTitleType ? (
                <label className={styles.modalFieldWide}>
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

              {!isMeasurementTemplate &&
              !isSafetyNews &&
              !isDisasterCase &&
              !isDoc7ReferenceMaterial ? (
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

              {activeTypeMeta.editorMode === 'image' &&
              !isDisasterCaseBatchCreate &&
              !isDoc7ReferenceMaterial &&
              !isDisasterCase ? (
                <ContentAssetField
                  accept={isSafetyNews ? '.pdf,.png,.jpg,.jpeg,.gif,.webp' : 'image/*'}
                  disabled={busy || !canUploadAssets}
                  helperText={isSafetyNews ? fileUploadHelperText : uploadPermissionHelperText}
                  label="대표 이미지"
                  mode="image"
                  readOnly={!canUploadAssets}
                  value={form.image_url}
                  fileName={form.image_name}
                  onChange={({ value, fileName }) =>
                    setForm({ ...form, image_url: value, image_name: fileName })
                  }
                  onClear={() => setForm({ ...form, image_url: '', image_name: '' })}
                  resolveFile={uploadFileAsset}
                  validateFile={validateLargeFile}
                />
              ) : null}

              {activeTypeMeta.editorMode === 'file' && !isSafetyNews ? (
                <div className={styles.assetGrid}>
                  <ContentAssetField
                    accept=".pdf,.doc,.docx,.hwp,.png,.jpg,.jpeg,.gif,.webp"
                    disabled={busy || !canUploadAssets}
                    helperText={
                      usesSafetyProxy
                        ? '현재는 Vercel 프록시 경유 업로드라 4.5MB를 넘으면 실패할 수 있습니다. direct upload origin 설정을 확인해 주세요.'
                        : undefined
                    }
                    label={activeTypeMeta.fileLabels?.[0] || '파일 1'}
                    mode="file"
                    readOnly={!canUploadAssets}
                    value={form.file_url_1}
                    fileName={form.file_name_1}
                    onChange={({ value, fileName }) =>
                      setForm({ ...form, file_url_1: value, file_name_1: fileName })
                    }
                    onClear={() => setForm({ ...form, file_url_1: '', file_name_1: '' })}
                    resolveFile={uploadFileAsset}
                    validateFile={validateLargeFile}
                  />
                  <ContentAssetField
                    accept=".pdf,.doc,.docx,.hwp,.png,.jpg,.jpeg,.gif,.webp"
                    disabled={busy || !canUploadAssets}
                    helperText={
                      usesSafetyProxy
                        ? '현재는 Vercel 프록시 경유 업로드라 4.5MB를 넘으면 실패할 수 있습니다. direct upload origin 설정을 확인해 주세요.'
                        : undefined
                    }
                    label={activeTypeMeta.fileLabels?.[1] || '파일 2'}
                    mode="file"
                    readOnly={!canUploadAssets}
                    value={form.file_url_2}
                    fileName={form.file_name_2}
                    onChange={({ value, fileName }) =>
                      setForm({ ...form, file_url_2: value, file_name_2: fileName })
                    }
                    onClear={() => setForm({ ...form, file_url_2: '', file_name_2: '' })}
                    resolveFile={uploadFileAsset}
                    validateFile={validateLargeFile}
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
