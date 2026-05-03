'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { GuidedPhotoStepUploadInput } from '@saftysite/contracts';
import {
  GuidedImageDropzone,
  type GuidedUploadFileItem,
} from '@/components/GuidedImageDropzone';
import styles from '@/components/GuidedUploadFlow.module.css';
import {
  bootstrapDemoSession,
  createReportRecord,
  generateDraftFromGuidedPhotos,
  generateDraftFromPhotos,
  uploadGuidedStepPhotos,
} from '@/lib/reportApi';
import {
  deletePersistedValue,
  readPersistedValue,
  writePersistedValue,
} from '@/lib/clientPersistence';
import { prepareUploadImage } from '@/lib/reportImages';
import {
  creationDialogFields,
  type GuidedUploadStepId,
} from '@/lib/demoData';

const STEP_ORDER: GuidedUploadStepId[] = ['meta', 'overview', 'hazard'];
const MIN_GENERATION_ANIMATION_MS = 5000;
const DRAFT_STORAGE_KEY = 'saftysite-web-new-report-draft-v1';

const DISPLAY_STEPS = [
  { key: 'meta', number: '1', title: '기본정보' },
  { key: 'overview', number: '2', title: '전경·공정 사진' },
  { key: 'hazard', number: '3', title: '위험요인 사진' },
  { key: 'draft', number: '4', title: '문안 초안' },
  { key: 'review', number: '5', title: '검토 및 출력' },
] as const;

function createUploadId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCategory(kind: string | undefined): GuidedPhotoStepUploadInput['photos'][number]['category'] {
  if (kind === 'site_overview') return 'site_overview';
  if (kind === 'process') return 'process';
  return 'hazard';
}

function buildGuidedPhotoPayload(files: GuidedUploadFileItem[]): GuidedPhotoStepUploadInput {
  return {
    photos: files.map((file) => ({
      filename: file.name,
      category: normalizeCategory(file.kind),
      data_url: file.previewUrl,
      location_hint: file.isRepresentative ? `${file.kind ?? 'image'} 대표사진` : file.kind ?? 'image',
    })),
  };
}

function toUserFacingErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return '문안 초안을 작성하지 못했습니다.';
  }

  if (error.message.includes('Report SaaS API is not running')) {
    return '현재 보고서 생성 서비스를 준비 중입니다. 잠시 후 다시 시도해 주세요.';
  }

  return error.message;
}

export default function NewReportPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<GuidedUploadStepId>('meta');
  const [metaFields, setMetaFields] = useState(() =>
    Object.fromEntries(
      creationDialogFields.map((field) => [field.id, field.value]),
    ) as Record<(typeof creationDialogFields)[number]['id'], string>,
  );
  const [step2Files, setStep2Files] = useState<GuidedUploadFileItem[]>([]);
  const [step3Files, setStep3Files] = useState<GuidedUploadFileItem[]>([]);
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'generating'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const stored = await readPersistedValue<{
        metaFields: typeof metaFields;
        step2Files: GuidedUploadFileItem[];
        step3Files: GuidedUploadFileItem[];
        currentStep: GuidedUploadStepId;
      }>(DRAFT_STORAGE_KEY);
      if (!stored || cancelled) {
        return;
      }
      setMetaFields(stored.metaFields);
      setStep2Files(stored.step2Files);
      setStep3Files(stored.step3Files);
      setCurrentStep(stored.currentStep);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionChecked) {
      return;
    }

    void writePersistedValue(DRAFT_STORAGE_KEY, {
      metaFields,
      step2Files,
      step3Files,
      currentStep,
    });
  }, [currentStep, metaFields, sessionChecked, step2Files, step3Files]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      try {
        await bootstrapDemoSession();
        if (!cancelled) {
          setSubmitError('');
        }
      } catch (error) {
        if (!cancelled) {
          setSubmitError(toUserFacingErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setSessionChecked(true);
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const metaReady = creationDialogFields.every((field) =>
    field.required ? Boolean(metaFields[field.id]?.trim()) : true,
  );
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const canGenerateFinalDraft = metaReady && sessionChecked && generationPhase !== 'generating';

  const generationHelpText = useMemo(() => {
    if (!sessionChecked) {
      return '보고서 작성 환경을 준비하고 있습니다.';
    }
    return '';
  }, [sessionChecked]);

  const appendPreparedFiles = async (
    setter: Dispatch<SetStateAction<GuidedUploadFileItem[]>>,
    files: File[],
    defaultKind: string,
  ) => {
    const prepared = await Promise.all(files.map((file) => prepareUploadImage(file)));

    setGenerationPhase('idle');
    setSubmitError('');
    setter((current) => [
      ...current,
      ...prepared.map((item, index) => ({
        id: createUploadId(),
        name: item.fileName,
        previewUrl: item.dataUrl,
        kind: defaultKind,
        isRepresentative: current.length === 0 && index === 0,
      })),
    ]);
  };

  const deleteFile = (
    setter: Dispatch<SetStateAction<GuidedUploadFileItem[]>>,
    fileId: string,
  ) => {
    setGenerationPhase('idle');
    setSubmitError('');
    setter((current) => {
      const next = current.filter((file) => file.id !== fileId);
      if (next.length > 0 && !next.some((file) => file.isRepresentative)) {
        next[0] = { ...next[0], isRepresentative: true };
      }
      return next;
    });
  };

  const setRepresentative = (
    setter: Dispatch<SetStateAction<GuidedUploadFileItem[]>>,
    fileId: string,
  ) => {
    setter((current) =>
      current.map((file) => ({
        ...file,
        isRepresentative: file.id === fileId,
      })),
    );
  };

  const canOpenStep = (stepId: GuidedUploadStepId) => {
    if (stepId === 'meta') return true;
    return metaReady;
  };

  const moveStep = (direction: 'prev' | 'next') => {
    const nextIndex =
      direction === 'next'
        ? Math.min(STEP_ORDER.length - 1, currentStepIndex + 1)
        : Math.max(0, currentStepIndex - 1);
    const nextStep = STEP_ORDER[nextIndex];
    if (canOpenStep(nextStep)) {
      setCurrentStep(nextStep);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerateFinalDraft) {
      return;
    }

    const startedAt = Date.now();
    setGenerationPhase('generating');
    setSubmitError('');

    try {
      const session = await bootstrapDemoSession();
      const created = await createReportRecord(session, {
        site_name: metaFields.siteName,
        customer_name: metaFields.customerName,
        visit_date: metaFields.visitDate,
        drafter_name: metaFields.drafterName,
        progress_rate: metaFields.processSummary,
        process_summary: metaFields.processSummary,
        worker_count: metaFields.workerCount,
      });

      const step1Payload = buildGuidedPhotoPayload(step2Files);
      const step2Payload = buildGuidedPhotoPayload(step3Files);
      let currentReport = created;

      if (step1Payload.photos.length > 0) {
        currentReport = await uploadGuidedStepPhotos(session, created.id, 'step-1', step1Payload);
      }

      if (step2Payload.photos.length > 0) {
        currentReport = await uploadGuidedStepPhotos(session, created.id, 'step-2', step2Payload);
      }

      const step1Ids =
        currentReport.payload.photoStepBuckets.find((bucket) => bucket.step === 'step1_overview')
          ?.uploadedPhotoIds ?? [];
      const step2Ids =
        currentReport.payload.photoStepBuckets.find((bucket) => bucket.step === 'step2_hazard')
          ?.uploadedPhotoIds ?? [];

      if (step1Ids.length > 0 && step2Ids.length > 0) {
        currentReport = await generateDraftFromGuidedPhotos(session, created.id, {
          doc3_photo_ids: step1Ids,
          doc7_photo_ids: step2Ids,
        });
      } else if (step1Ids.length > 0 || step2Ids.length > 0) {
        currentReport = await generateDraftFromPhotos(session, created.id, {
          photo_asset_ids: [...step1Ids, ...step2Ids],
        });
      }

      const remaining = Math.max(0, MIN_GENERATION_ANIMATION_MS - (Date.now() - startedAt));
      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining));
      }
      await deletePersistedValue(DRAFT_STORAGE_KEY);
      router.replace(`/reports/${currentReport.id}?entry=generated`);
    } catch (error) {
      setGenerationPhase('idle');
      setSubmitError(toUserFacingErrorMessage(error));
    }
  };

  const renderCurrentStep = () => {
    if (currentStep === 'meta') {
      return (
        <section className="erp-panel">
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Step 1</span>
              <h2 className={styles.panelTitle}>기본정보</h2>
            </div>
            <span
              className={`${styles.statusPill} ${
                metaReady ? styles.statusPillReady : styles.statusPillPending
              }`}
            >
              {metaReady ? '확인 완료' : '필수값 확인'}
            </span>
          </div>

          <div className={styles.metaGrid}>
            {creationDialogFields.map((field) => (
              <label key={field.id} className={styles.metaField}>
                <span className={styles.metaLabelRow}>
                  <span className={styles.metaLabel}>{field.label}</span>
                  {field.required ? <span className={styles.requiredMark}>필수</span> : null}
                </span>
                <input
                  className={styles.metaInput}
                  value={metaFields[field.id]}
                  onChange={(event) => {
                    setMetaFields((current) => ({
                      ...current,
                      [field.id]: event.target.value,
                    }));
                  }}
                />
              </label>
            ))}
          </div>
        </section>
      );
    }

    if (currentStep === 'overview') {
      return (
        <section className="erp-panel">
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Step 2</span>
              <h2 className={styles.panelTitle}>전경·공정 사진 첨부</h2>
              <p className={styles.panelDescription}>현장 전경, 작업 공정, 주요 진행상황 사진을 첨부합니다.</p>
            </div>
            <span
              className={`${styles.statusPill} ${
                step2Files.length > 0 ? styles.statusPillReady : styles.statusPillPending
              }`}
            >
              {step2Files.length > 0 ? '첨부 완료' : '첨부 대기'}
            </span>
          </div>

          <GuidedImageDropzone
            files={step2Files}
            helper=""
            label=""
            onDelete={(id) => deleteFile(setStep2Files, id)}
            onFilesSelected={(files) => {
              void appendPreparedFiles(setStep2Files, files, 'site_overview');
            }}
            onRepresentativeChange={(id) => setRepresentative(setStep2Files, id)}
            uploadTitle="사진을 선택하거나 이곳에 끌어다 놓으세요."
            uploadHint="JPG, PNG 파일을 여러 장 첨부할 수 있습니다."
            emptyNote="아직 첨부된 사진이 없습니다."
          />
        </section>
      );
    }

    if (currentStep === 'hazard') {
      return (
        <section className="erp-panel">
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Step 3</span>
              <h2 className={styles.panelTitle}>위험요인 사진 첨부</h2>
              <p className={styles.panelDescription}>
                추락, 낙하, 협착, 개구부, 가설구조물 등 지도사항 작성에 참고할 사진을 첨부합니다.
              </p>
            </div>
            <span
              className={`${styles.statusPill} ${
                step3Files.length > 0 ? styles.statusPillReady : styles.statusPillPending
              }`}
            >
              {step3Files.length > 0 ? '첨부 완료' : '첨부 대기'}
            </span>
          </div>

          <GuidedImageDropzone
            files={step3Files}
            helper=""
            label=""
            onDelete={(id) => deleteFile(setStep3Files, id)}
            onFilesSelected={(files) => {
              void appendPreparedFiles(setStep3Files, files, 'hazard');
            }}
            onRepresentativeChange={(id) => setRepresentative(setStep3Files, id)}
            uploadTitle="위험요인 사진을 선택하거나 이곳에 끌어다 놓으세요."
            uploadHint="사진이 있으면 위험요인 및 지도사항 문안 작성에 참고할 수 있습니다."
            emptyNote="아직 첨부된 위험요인 사진이 없습니다. 사진 없이도 다음 단계로 진행할 수 있습니다."
          />
        </section>
      );
    }

    return null;
  };

  return (
    <div className="erp-page">
      <section className="page-header-card">
        <div>
          <span className="page-kicker">작성 업무</span>
          <h1 className="page-title">새 기술지도 보고서 작성</h1>
          <p className="page-meta-line">
            기본정보와 사진을 입력한 뒤, 문안 초안을 작성하고 검토할 수 있습니다.
          </p>
        </div>
        <div className="workspace-header-actions">
          <span className="workspace-chip workspace-chip-active">
            {generationPhase === 'generating' ? '작성 중' : '자동 저장됨'}
          </span>
        </div>
      </section>

      <section className={styles.stepRail} aria-label="보고서 작성 단계">
        {DISPLAY_STEPS.map((step) => {
          const isCurrentMeta = currentStep === 'meta' && step.key === 'meta';
          const isCurrentOverview = currentStep === 'overview' && step.key === 'overview';
          const isCurrentHazard = currentStep === 'hazard' && step.key === 'hazard';
          const isActive = isCurrentMeta || isCurrentOverview || isCurrentHazard;
          const isDone =
            (step.key === 'meta' && metaReady) ||
            (step.key === 'overview' && step2Files.length > 0) ||
            (step.key === 'hazard' && step3Files.length > 0);
          const canOpen =
            step.key === 'meta' ||
            step.key === 'overview' ||
            step.key === 'hazard';
          return (
            <button
              key={step.key}
              type="button"
              className={`${styles.stepCard} ${isActive ? styles.stepCardActive : ''}`}
              onClick={() => {
                if (generationPhase === 'generating') {
                  return;
                }
                if (step.key === 'meta' || step.key === 'overview' || step.key === 'hazard') {
                  if (canOpenStep(step.key)) {
                    setCurrentStep(step.key);
                  }
                }
              }}
              disabled={!canOpen || generationPhase === 'generating'}
            >
              <span className={styles.stepBadge}>{step.number}</span>
              <span className={styles.stepTitle}>{step.title}</span>
              <span className={styles.stepHelper}>
                {isDone
                  ? '완료'
                  : isActive
                    ? '진행 중'
                    : step.key === 'draft' || step.key === 'review'
                      ? '대기'
                      : '대기'}
              </span>
            </button>
          );
        })}
      </section>

      {renderCurrentStep()}

      <section className="erp-panel">
        <div className={styles.generatePanel}>
          <div className={styles.generateSummaryGrid}>
            <article className={styles.generateSummaryCard}>
              <span>기본정보</span>
              <strong>{metaReady ? '완료' : '확인 필요'}</strong>
            </article>
            <article className={styles.generateSummaryCard}>
              <span>전경·공정 사진</span>
              <strong>{step2Files.length}장</strong>
            </article>
            <article className={styles.generateSummaryCard}>
              <span>위험요인 사진</span>
              <strong>{step3Files.length}장</strong>
            </article>
            <article className={styles.generateSummaryCard}>
              <span>작성 상태</span>
              <strong>임시저장</strong>
            </article>
          </div>

          {generationHelpText ? <div className={`${styles.inlineNotice} ${styles.inlineNoticeMuted}`}>{generationHelpText}</div> : null}
          {submitError ? <div className={styles.inlineNotice}>{submitError}</div> : null}
          <div className={`${styles.inlineNotice} ${styles.inlineNoticeMuted}`}>
            입력한 내용은 작성 중인 보고서에 임시 저장됩니다. 문안 초안 작성 전 내용을 다시 확인할 수 있습니다.
          </div>
        </div>
      </section>

      <section className={styles.footerBar}>
        <button
          type="button"
          className="erp-button erp-button-secondary"
          onClick={() => moveStep('prev')}
          disabled={currentStepIndex === 0 || generationPhase === 'generating'}
        >
          이전
        </button>
        {currentStep !== 'hazard' ? (
          <button
            type="button"
            className="erp-button erp-button-primary"
            onClick={() => moveStep('next')}
            disabled={currentStepIndex === STEP_ORDER.length - 1}
          >
            다음
          </button>
        ) : (
          <>
            {step3Files.length === 0 ? (
              <button
                type="button"
                className="erp-button erp-button-secondary"
                onClick={() => setIsConfirmOpen(true)}
                disabled={!canGenerateFinalDraft}
              >
                사진 없이 진행
              </button>
            ) : null}
            <div className={styles.footerBarStack}>
              <button
                type="button"
                className="erp-button erp-button-primary"
                onClick={() => setIsConfirmOpen(true)}
                disabled={!canGenerateFinalDraft}
              >
                {generationPhase === 'generating' ? '문안 초안 작성 중' : '문안 초안 작성'}
              </button>
            </div>
          </>
        )}
      </section>

      {currentStep === 'hazard' ? (
        <p className={styles.pricingNotice}>문안 초안 작성 단계에서 이용요금이 안내됩니다.</p>
      ) : null}

      {generationPhase === 'generating' ? (
        <div className={styles.flowLoadingOverlay} role="status" aria-live="polite">
          <div className={styles.flowLoadingCard}>
            <span className={styles.flowLoadingSpinner} aria-hidden="true" />
            <strong>문안 초안을 작성하고 있습니다</strong>
            <p>초안을 정리한 뒤 보고서 검토 화면으로 자동 이동합니다.</p>
          </div>
        </div>
      ) : null}

      {isConfirmOpen ? (
        <div className="modal-scrim" role="presentation" onClick={() => setIsConfirmOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="page-kicker">요금 안내</span>
                <h2>문안 초안을 작성하시겠습니까?</h2>
              </div>
              <button type="button" className="erp-button erp-button-text" onClick={() => setIsConfirmOpen(false)}>
                닫기
              </button>
            </div>

            <div className={styles.generationModalBody}>
              <p>
                입력한 기본정보와 첨부한 사진을 바탕으로 보고서 문안 초안을 작성합니다. 초안 생성은 1건 기준 3,000원의
                이용요금이 적용됩니다.
              </p>
            </div>

            <div className="modal-actions">
              <button type="button" className="erp-button erp-button-secondary" onClick={() => setIsConfirmOpen(false)}>
                취소
              </button>
              <button
                type="button"
                className="erp-button erp-button-primary"
                onClick={() => {
                  setIsConfirmOpen(false);
                  void handleGenerate();
                }}
              >
                초안 작성
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
