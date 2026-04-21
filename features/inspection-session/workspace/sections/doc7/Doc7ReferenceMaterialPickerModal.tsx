'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import {
  buildDoc7ReferenceMaterialLabel,
  buildDoc7ReferenceMaterialSearchText,
} from '@/lib/doc7ReferenceMaterials';
import type { SafetyDoc7ReferenceMaterialCatalogItem } from '@/types/backend';

const ALL_FILTER_VALUE = '__all__';

interface Doc7ReferenceMaterialPickerModalProps {
  items: SafetyDoc7ReferenceMaterialCatalogItem[];
  open: boolean;
  onClose: () => void;
  onSelect: (item: SafetyDoc7ReferenceMaterialCatalogItem) => void;
}

function buildExcerpt(value: string, limit = 120): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '예방대책 내용 없음';
  }

  return normalized.length <= limit
    ? normalized
    : `${normalized.slice(0, limit).trim()}…`;
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function Doc7ReferenceMaterialPickerModal({
  items,
  open,
  onClose,
  onSelect,
}: Doc7ReferenceMaterialPickerModalProps) {
  const [query, setQuery] = useState('');
  const [accidentTypeFilter, setAccidentTypeFilter] = useState(ALL_FILTER_VALUE);
  const [causativeFilter, setCausativeFilter] = useState(ALL_FILTER_VALUE);
  const deferredQuery = useDeferredValue(query);

  const resetFilters = () => {
    setQuery('');
    setAccidentTypeFilter(ALL_FILTER_VALUE);
    setCausativeFilter(ALL_FILTER_VALUE);
  };

  const handleClose = () => {
    resetFilters();
    onClose();
  };

  const accidentTypeOptions = useMemo(
    () => uniqueValues(items.map((item) => item.accidentType)),
    [items],
  );
  const causativeOptions = useMemo(
    () =>
      uniqueValues(
        items
          .filter((item) =>
            accidentTypeFilter === ALL_FILTER_VALUE
              ? true
              : item.accidentType === accidentTypeFilter,
          )
          .map((item) => item.causativeAgentKey),
      ),
    [accidentTypeFilter, items],
  );
  const effectiveCausativeFilter = causativeOptions.includes(causativeFilter)
    ? causativeFilter
    : ALL_FILTER_VALUE;

  const filteredItems = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return items.filter((item) => {
      if (
        accidentTypeFilter !== ALL_FILTER_VALUE &&
        item.accidentType !== accidentTypeFilter
      ) {
        return false;
      }

      if (
        effectiveCausativeFilter !== ALL_FILTER_VALUE &&
        item.causativeAgentKey !== effectiveCausativeFilter
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return buildDoc7ReferenceMaterialSearchText(item).includes(normalizedQuery);
    });
  }, [accidentTypeFilter, deferredQuery, effectiveCausativeFilter, items]);

  return (
    <AppModal
      open={open}
      title="참고자료 선택"
      size="large"
      onClose={handleClose}
      actions={
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={handleClose}
        >
          닫기
        </button>
      }
    >
      <div className={styles.doc7ReferencePickerLayout}>
        <div className={styles.doc7ReferencePickerFilters}>
          <label className={styles.doc7ReferencePickerField}>
            <span className={styles.label}>검색</span>
            <input
              className="app-input"
              value={query}
              placeholder="사고유형, 기인물, 예방대책 검색"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className={styles.doc7ReferencePickerField}>
            <span className={styles.label}>사고유형</span>
            <select
              className="app-select"
              value={accidentTypeFilter}
              onChange={(event) => setAccidentTypeFilter(event.target.value)}
            >
              <option value={ALL_FILTER_VALUE}>전체</option>
              {accidentTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.doc7ReferencePickerField}>
            <span className={styles.label}>기인물</span>
            <select
              className="app-select"
              value={effectiveCausativeFilter}
              onChange={(event) => setCausativeFilter(event.target.value)}
            >
              <option value={ALL_FILTER_VALUE}>전체</option>
              {causativeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredItems.length === 0 ? (
          <div className={styles.doc7ReferencePickerEmpty}>
            조건에 맞는 참고자료가 없습니다.
          </div>
        ) : (
          <div className={styles.doc7ReferencePickerList}>
            {filteredItems.map((item) => (
              <article key={item.id} className={styles.doc7ReferencePickerCard}>
                <div className={styles.doc7ReferencePickerThumb}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={buildDoc7ReferenceMaterialLabel(item)}
                      className={styles.doc7ReferencePickerThumbImage}
                    />
                  ) : (
                    <div className={styles.doc7ReferencePickerThumbEmpty}>
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className={styles.doc7ReferencePickerBody}>
                  <strong className={styles.doc7ReferencePickerTitle}>
                    {buildDoc7ReferenceMaterialLabel(item)}
                  </strong>
                  <p className={styles.doc7ReferencePickerExcerpt}>
                    {buildExcerpt(item.body)}
                  </p>
                </div>
                <div className={styles.doc7ReferencePickerActions}>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={() => {
                      onSelect(item);
                      handleClose();
                    }}
                  >
                    선택
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppModal>
  );
}
