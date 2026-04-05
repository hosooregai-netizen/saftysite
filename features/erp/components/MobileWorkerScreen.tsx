'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import SignaturePad from '@/components/ui/SignaturePad';
import {
  SafetyApiError,
  acknowledgeWorkerMobileTask,
  fetchWorkerMobileSession,
} from '@/lib/safetyApi';
import type { WorkerMobileSessionDetail, WorkerMobileTask } from '@/types/backend';
import { formatErpDateTime } from '@/features/erp/lib/shared';
import styles from './ErpScreen.module.css';

interface MobileAccessNotice {
  badgeToneClassName: string;
  badgeLabel: string;
  description: string;
  title: string;
}

function extractSafetyErrorDetail(message: string): string {
  const normalized = message.trim();
  const marker = '). ';
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex >= 0) {
    return normalized.slice(markerIndex + marker.length).trim();
  }
  return normalized;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof SafetyApiError) {
    return extractSafetyErrorDetail(error.message);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '모바일 작업을 처리하는 중 오류가 발생했습니다.';
}

function getMobileAccessNotice(message: string | null): MobileAccessNotice | null {
  if (!message) return null;

  if (message.includes('관리자에 의해 만료')) {
    return {
      badgeToneClassName: styles.badgeDanger,
      badgeLabel: '강제 만료',
      title: '이 링크는 더 이상 사용할 수 없습니다.',
      description: '현장 관리직이 기존 링크를 종료했습니다. 출입 전 새 링크나 QR 카드를 다시 받아 주세요.',
    };
  }

  if (message.includes('사용 시간이 종료')) {
    return {
      badgeToneClassName: styles.badgeWarning,
      badgeLabel: '사용 시간 종료',
      title: '모바일 링크 사용 시간이 끝났습니다.',
      description: '당일 사용 기한이 지나 더 이상 확인을 제출할 수 없습니다. 현장 관리직에게 재발급을 요청해 주세요.',
    };
  }

  if (message.includes('차단된 출입자')) {
    return {
      badgeToneClassName: styles.badgeDanger,
      badgeLabel: '접근 제한',
      title: '현재 이 모바일 링크에 접근할 수 없습니다.',
      description: '출입 제한 또는 인원 상태 변경으로 사용이 막혀 있습니다. 현장 관리직에게 상태를 확인해 주세요.',
    };
  }

  return {
    badgeToneClassName: styles.badgeDraft,
    badgeLabel: '확인 필요',
    title: '모바일 작업 정보를 불러오지 못했습니다.',
    description: message,
  };
}

function getTaskStatusLabel(task: WorkerMobileTask): string {
  if (task.status === 'completed') return '완료';
  if (task.status === 'pending') return '확인 필요';
  if (task.availability_reason === 'excluded') return '대상 제외';
  return '문서 없음';
}

function getTaskStatusBadgeClassName(task: WorkerMobileTask): string {
  if (task.status === 'completed') return styles.badgePublished;
  if (task.status === 'pending') return styles.badgeWarning;
  if (task.availability_reason === 'excluded') return styles.badgeWarning;
  return styles.badgeDraft;
}

interface MobileWorkerScreenProps {
  token: string;
}

export function MobileWorkerScreen({ token }: MobileWorkerScreenProps) {
  const [sessionDetail, setSessionDetail] = useState<WorkerMobileSessionDetail | null>(null);
  const [activeTaskKind, setActiveTaskKind] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWorkerMobileSession(token);
      setSessionDetail(response);
      setSignatureName((current) => current || response.worker.name);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const run = async () => {
      await load();
    };

    void run();
  }, [load]);

  const pendingCount = useMemo(
    () =>
      sessionDetail?.tasks.filter((task) => task.status === 'pending').length ?? 0,
    [sessionDetail?.tasks]
  );
  const completedCount = useMemo(
    () =>
      sessionDetail?.tasks.filter((task) => task.status === 'completed').length ?? 0,
    [sessionDetail?.tasks]
  );
  const accessNotice = useMemo(() => getMobileAccessNotice(error), [error]);

  const handleSubmit = async (task: WorkerMobileTask) => {
    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await acknowledgeWorkerMobileTask(token, {
        kind: task.kind,
        report_id: task.report_id,
        signature_name: signatureName.trim() || sessionDetail?.worker.name || null,
        signature_data: signatureData || null,
        note: note.trim() || null,
      });
      setNotice(`${task.label} 확인이 완료되었습니다.`);
      setSignatureData('');
      setNote('');
      setActiveTaskKind(null);
      await load();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.mobilePage}>
      <div className={styles.mobileContainer}>
        <section className={styles.mobileHero}>
          <span className={styles.heroEyebrow}>SI SAFER MOBILE</span>
          <h1 className={styles.heroTitle}>
            {sessionDetail?.site.site_name || '모바일 링크'} 안내
          </h1>
          {sessionDetail ? (
            <div className={styles.heroMeta}>
              <span className={styles.badge}>{sessionDetail.worker.name}</span>
              <span className={`${styles.badge} ${styles.badgePublished}`}>접속 가능</span>
              <span className={styles.badge}>
                만료 {formatErpDateTime(sessionDetail.session.expires_at)}
              </span>
              <span className={styles.badge}>완료 {completedCount}건</span>
              <span className={styles.badge}>남은 작업 {pendingCount}건</span>
            </div>
          ) : accessNotice ? (
            <div className={styles.heroMeta}>
              <span className={`${styles.badge} ${accessNotice.badgeToneClassName}`}>
                {accessNotice.badgeLabel}
              </span>
            </div>
          ) : null}
          {!sessionDetail && accessNotice ? (
            <p className={styles.heroDescription}>{accessNotice.title}</p>
          ) : null}
          {notice ? <p className={styles.heroDescription}>{notice}</p> : null}
        </section>

        {isLoading && !sessionDetail ? (
          <section className={styles.mobileTaskCard}>
            <p className={styles.mobileTaskDescription}>작업 목록을 불러오는 중입니다.</p>
          </section>
        ) : null}

        {!isLoading && !sessionDetail && accessNotice ? (
          <section className={styles.mobileStateCard}>
            <div className={styles.mobileTaskHeader}>
              <div>
                <h2 className={styles.mobileTaskTitle}>{accessNotice.title}</h2>
                <p className={styles.mobileTaskDescription}>{accessNotice.description}</p>
              </div>
              <span className={`${styles.badge} ${accessNotice.badgeToneClassName}`}>
                {accessNotice.badgeLabel}
              </span>
            </div>
            <div className={styles.textList}>
              <div className={styles.textListItem}>
                <span className={styles.textListBullet}>•</span>
                <span>링크를 다시 받았으면 새 주소나 QR 코드로 접속해 주세요.</span>
              </div>
              <div className={styles.textListItem}>
                <span className={styles.textListBullet}>•</span>
                <span>네트워크 문제가 의심되면 잠시 후 다시 불러오기를 눌러 주세요.</span>
              </div>
            </div>
            <div className={styles.sectionActions}>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => void load()}
                disabled={isLoading}
              >
                {isLoading ? '다시 확인 중...' : '다시 불러오기'}
              </button>
            </div>
          </section>
        ) : null}

        {!isLoading && sessionDetail ? (
          <div className={styles.mobileTaskList}>
            {sessionDetail.tasks.map((task) => (
              <section key={task.kind} className={styles.mobileTaskCard}>
                <div className={styles.mobileTaskHeader}>
                  <div>
                    <h2 className={styles.mobileTaskTitle}>{task.label}</h2>
                    <p className={styles.mobileTaskDescription}>
                      {task.report_title || '오늘 확인할 문서가 아직 없습니다.'}
                    </p>
                  </div>
                  <span
                    className={`${styles.badge} ${getTaskStatusBadgeClassName(task)}`}
                  >
                    {getTaskStatusLabel(task)}
                  </span>
                </div>

                <div className={styles.textList}>
                  <div className={styles.textListItem}>
                    <span className={styles.textListBullet}>•</span>
                    <span>최종 수정: {formatErpDateTime(task.report_updated_at)}</span>
                  </div>
                  {task.completed_at ? (
                    <div className={styles.textListItem}>
                      <span className={styles.textListBullet}>•</span>
                      <span>완료 시각: {formatErpDateTime(task.completed_at)}</span>
                    </div>
                  ) : null}
                  {task.note ? (
                    <div className={styles.textListItem}>
                      <span className={styles.textListBullet}>•</span>
                      <span>{task.note}</span>
                    </div>
                  ) : null}
                </div>

                {task.status === 'pending' ? (
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>서명자명</span>
                      <input
                        className="app-input"
                        value={signatureName}
                        onChange={(event) => setSignatureName(event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>메모</span>
                      <textarea
                        className="app-textarea"
                        value={activeTaskKind === task.kind ? note : ''}
                        onFocus={() => setActiveTaskKind(task.kind)}
                        onChange={(event) => {
                          setActiveTaskKind(task.kind);
                          setNote(event.target.value);
                        }}
                      />
                    </label>
                    <SignaturePad
                      label="서명"
                      value={activeTaskKind === task.kind ? signatureData : ''}
                      onChange={(value) => {
                        setActiveTaskKind(task.kind);
                        setSignatureData(value);
                      }}
                    />
                    <button
                      type="button"
                      className="app-button app-button-primary"
                      onClick={() => void handleSubmit(task)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '제출 중...' : '확인 및 서명 제출'}
                    </button>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
