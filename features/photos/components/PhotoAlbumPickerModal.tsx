'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import { fetchPhotoAlbum } from '@/lib/photos/apiClient';
import type { PhotoAlbumItem } from '@/types/photos';
import styles from './PhotoAlbumPickerModal.module.css';

interface PhotoAlbumPickerModalProps {
  onClose: () => void;
  onSelect: (item: PhotoAlbumItem) => Promise<void> | void;
  open: boolean;
  siteId?: string | null;
  title?: string;
}

function getPhotoAlbumItemUrl(item: PhotoAlbumItem) {
  return item.originalUrl || item.previewUrl;
}

function formatPhotoAlbumDate(value: string) {
  if (!value?.trim()) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
  }).format(parsed);
}

export function PhotoAlbumPickerModal({
  onClose,
  onSelect,
  open,
  siteId,
  title = '사진첩에서 선택',
}: PhotoAlbumPickerModalProps) {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<PhotoAlbumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const deferredQuery = useDeferredValue(query.trim());

  useEffect(() => {
    if (!open) {
      setQuery('');
      setRows([]);
      setError(null);
      setSelectingId(null);
      return;
    }

    if (!siteId) {
      setRows([]);
      setError('사진첩을 불러올 현장 정보가 없습니다.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchPhotoAlbum({
      all: true,
      query: deferredQuery,
      siteId,
      sortBy: 'capturedAt',
      sortDir: 'desc',
      source: 'all',
    })
      .then((response) => {
        if (!cancelled) {
          setRows(response.rows);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setRows([]);
          setError(
            nextError instanceof Error
              ? nextError.message
              : '사진첩을 불러오지 못했습니다.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deferredQuery, open, retryKey, siteId]);

  const handleSelect = async (item: PhotoAlbumItem) => {
    if (selectingId) {
      return;
    }

    if (!getPhotoAlbumItemUrl(item)) {
      setError('선택한 사진에 사용할 수 있는 URL이 없습니다.');
      return;
    }

    try {
      setSelectingId(item.id);
      setError(null);
      await Promise.resolve(onSelect(item));
      onClose();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : '사진을 반영하지 못했습니다.',
      );
    } finally {
      setSelectingId(null);
    }
  };

  const hasRows = rows.length > 0;

  return (
    <AppModal
      open={open}
      title={title}
      onClose={onClose}
      size="large"
      actions={
        <>
          <button type="button" className="app-button app-button-secondary" onClick={onClose}>
            닫기
          </button>
          {error ? (
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setRetryKey((current) => current + 1)}
              disabled={loading || !siteId}
            >
              재시도
            </button>
          ) : null}
        </>
      }
    >
      <div className={styles.body}>
        <input
          className="app-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="파일명, 현장명, 보고서명 검색"
        />
        {error ? <p className={styles.error}>{error}</p> : null}
        {loading ? (
          <div className={styles.stateBox}>사진첩을 불러오는 중입니다.</div>
        ) : !hasRows ? (
          <div className={styles.stateBox}>선택할 사진이 없습니다.</div>
        ) : (
          <div className={styles.grid}>
            {rows.map((item) => {
              const itemUrl = getPhotoAlbumItemUrl(item);
              const previewUrl = item.previewUrl || item.originalUrl;
              const disabled = Boolean(selectingId) || !itemUrl;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={styles.itemButton}
                  disabled={disabled}
                  onClick={() => {
                    void handleSelect(item);
                  }}
                  title={itemUrl ? item.fileName : '사용할 수 있는 사진 URL이 없습니다.'}
                >
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt={item.fileName} className={styles.thumb} />
                  ) : (
                    <div className={styles.thumbFallback}>미리보기 없음</div>
                  )}
                  <div className={styles.itemTitle}>
                    {selectingId === item.id ? '선택 중...' : item.fileName || '사진'}
                  </div>
                  <div className={styles.itemMeta}>
                    {formatPhotoAlbumDate(item.capturedAt || item.createdAt)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppModal>
  );
}

export { getPhotoAlbumItemUrl };
