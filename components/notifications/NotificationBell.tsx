'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AppModal from '@/components/ui/AppModal';
import {
  acknowledgeAllNotifications,
  acknowledgeNotification,
  fetchNotifications,
} from '@/lib/notifications/apiClient';
import type { NotificationItem } from '@/types/notifications';
import styles from './NotificationBell.module.css';

const IMPORTANT_MODAL_STORAGE_KEY = 'safety-important-notification-modal';

function formatDateTime(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationBell() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const hasUserInteractedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<{ rows: NotificationItem[]; unreadCount: number; unreadImportantCount: number }>({
    rows: [],
    unreadCount: 0,
    unreadImportantCount: 0,
  });
  const [importantModalOpen, setImportantModalOpen] = useState(false);
  const adminSection = searchParams.get('section') || 'overview';
  const shouldShowImportantModal =
    pathname === '/' || (pathname === '/admin' && adminSection === 'overview');
  const shouldSuppressImportantModal = !shouldShowImportantModal;

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      setFeed(await fetchNotifications());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '알림을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const markInteracted = () => {
      hasUserInteractedRef.current = true;
    };

    window.addEventListener('pointerdown', markInteracted, { passive: true });
    window.addEventListener('keydown', markInteracted);
    window.addEventListener('touchstart', markInteracted, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
      window.removeEventListener('touchstart', markInteracted);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const importantIds = feed.rows
      .filter((item) => item.isImportant && !item.isRead)
      .map((item) => item.id)
      .slice(0, 5);
    if (importantIds.length === 0 || shouldSuppressImportantModal) return;
    const marker = importantIds.join('|');
    const seenMarker = window.sessionStorage.getItem(IMPORTANT_MODAL_STORAGE_KEY);
    if (seenMarker === marker) return;
    const timer = window.setTimeout(() => {
      if (hasUserInteractedRef.current || open) {
        window.sessionStorage.setItem(IMPORTANT_MODAL_STORAGE_KEY, marker);
        return;
      }
      window.sessionStorage.setItem(IMPORTANT_MODAL_STORAGE_KEY, marker);
      setImportantModalOpen(true);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [feed.rows, open, shouldSuppressImportantModal]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const importantRows = useMemo(
    () => feed.rows.filter((item) => item.isImportant && !item.isRead).slice(0, 6),
    [feed.rows],
  );

  const handleNavigate = async (item: NotificationItem) => {
    try {
      if (!item.isRead) {
        await acknowledgeNotification(item.id);
        setFeed((current) => ({
          ...current,
          unreadCount: Math.max(0, current.unreadCount - 1),
          unreadImportantCount:
            item.isImportant && current.unreadImportantCount > 0
              ? current.unreadImportantCount - 1
              : current.unreadImportantCount,
          rows: current.rows.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)),
        }));
      }
    } catch {
      // keep navigation flowing even if ack fails
    }
    setOpen(false);
    setImportantModalOpen(false);
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleAckAll = async () => {
    await acknowledgeAllNotifications();
    await refresh();
    setImportantModalOpen(false);
  };

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={styles.bellButton}
        aria-label={
          feed.unreadImportantCount > 0
            ? `알림 열기, 읽지 않은 중요 알림 ${feed.unreadImportantCount}건`
            : '알림 열기'
        }
        title={
          feed.unreadImportantCount > 0
            ? `읽지 않은 중요 알림 ${feed.unreadImportantCount}건`
            : '알림 열기'
        }
        onClick={() => setOpen((current) => !current)}
      >
        <svg
          className={styles.bellIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6.5 9.5a5.5 5.5 0 1 1 11 0v4.1c0 .9.3 1.8.9 2.5l.6.8H5l.6-.8c.6-.7.9-1.6.9-2.5V9.5Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {feed.unreadImportantCount > 0 ? (
          <span className={styles.badge}>{feed.unreadImportantCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className={styles.dropdown} role="dialog" aria-label="알림 목록">
          <div className={styles.dropdownHeader}>
            <div>
              <strong className={styles.dropdownTitle}>중요 알림</strong>
              <p className={styles.dropdownMeta}>읽지 않은 알림 {feed.unreadCount}건</p>
            </div>
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => void handleAckAll()}
              disabled={loading || feed.rows.length === 0}
            >
              모두 확인
            </button>
          </div>
          {error ? <div className={styles.errorBox}>{error}</div> : null}
          <div className={styles.list}>
            {feed.rows.length === 0 ? (
              <div className={styles.emptyState}>{loading ? '알림을 불러오는 중입니다.' : '새 알림이 없습니다.'}</div>
            ) : (
              feed.rows.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.item} ${item.isRead ? styles.itemRead : ''} ${
                    item.isImportant ? styles.itemImportant : ''
                  }`}
                  onClick={() => void handleNavigate(item)}
                >
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemDescription}>{item.description}</span>
                  <span className={styles.itemMeta}>
                    {item.category.replace(/_/g, ' ')} · {formatDateTime(item.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      <AppModal
        open={importantModalOpen}
        title="중요 알림"
        onClose={() => setImportantModalOpen(false)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setImportantModalOpen(false)}
            >
              닫기
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleAckAll()}
            >
              모두 확인
            </button>
          </>
        }
      >
        <div className={styles.modalList}>
          {importantRows.length === 0 ? (
            <div className={styles.emptyState}>확인이 필요한 중요 알림이 없습니다.</div>
          ) : (
            importantRows.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.item} ${styles.modalItem}`}
                onClick={() => void handleNavigate(item)}
              >
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.itemDescription}>{item.description}</span>
                <span className={styles.itemMeta}>{formatDateTime(item.createdAt)}</span>
              </button>
            ))
          )}
        </div>
      </AppModal>
    </div>
  );
}

export default NotificationBell;
