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
import { prepareUploadImage } from '@/lib/reportImages';
import {
  creationDialogFields,
  guidedUploadSteps,
  type GuidedUploadStepId,
} from '@/lib/demoData';

const STEP_ORDER: GuidedUploadStepId[] = ['meta', 'overview', 'hazard', 'generate'];

const STEP2_KINDS = [
  { value: 'site_overview', label: '대표 전경' },
  { value: 'process', label: '공정 사진' },
] as const;

const STEP3_KINDS = [
  { value: 'hazard', label: '위험요인' },
  { value: 'hazard_closeup', label: '근거리 보강' },
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
    return '보고서를 생성하지 못했습니다.';
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
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'generating' | 'complete'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [apiAvailable, setApiAvailable] = useState(false);
  const [apiChecked, setApiChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkApi() {
      try {
        await bootstrapDemoSession();
        if (!cancelled) {
          setApiAvailable(true);
          setSubmitError('');
        }
      } catch {
        if (!cancelled) {
          setApiAvailable(false);
        }
      } finally {
        if (!cancelled) {
          setApiChecked(true);
        }
      }
    }

    void checkApi();

    return () => {
      cancelled = true;
    };
  }, []);

  const metaReady = creationDialogFields.every((field) =>
    field.required ? Boolean(metaFields[field.id]?.trim()) : true,
  );
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const canGenerateFinalDraft = metaReady && apiAvailable && generationPhase !== 'generating';
  const stepStates = {
    meta: metaReady,
    overview: step2Files.length > 0,
    hazard: step3Files.length > 0,
    generate: generationPhase === 'complete',
  };

  const generationHelpText = useMemo(() => {
    if (!apiChecked) {
      return '보고서 생성 서비스 연결 상태를 확인하고 있습니다.';
    }
    if (!apiAvailable) {
      return '현재 보고서 생성 서비스를 준비 중입니다. 잠시 후 다시 시도해 주세요.';
    }
    return '';
  }, [apiAvailable, apiChecked]);

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

  const setKind = (
    setter: Dispatch<SetStateAction<GuidedUploadFileItem[]>>,
    fileId: string,
    kind: string,
  ) => {
    setter((current) =>
      current.map((file) => (file.id === fileId ? { ...file, kind } : file)),
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

    setGenerationPhase('generating');
    setSubmitError('');
    setCurrentStep('generate');

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

      setGenerationPhase('complete');
      router.replace(`/reports/${currentReport.id}`);
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
              <h2 className={styles.panelTitle}>공정 및 전경 이미지</h2>
              <p className={styles.panelDescription}>
                전경과 현재 공정 이미지를 한 번에 올리고, 대표사진과 간단한 분류만 지정합니다.
              </p>
            </div>
            <span
              className={`${styles.statusPill} ${
                step2Files.length > 0 ? styles.statusPillReady : styles.statusPillPending
              }`}
            >
              업로드 {step2Files.length}건
            </span>
          </div>

          <GuidedImageDropzone
            files={step2Files}
            helper="대표 전경과 현재 공정 사진을 여러 장 한 번에 올릴 수 있습니다."
            kinds={STEP2_KINDS.map((item) => ({ ...item }))}
            label="공정 및 전경 이미지 업로드"
            onDelete={(id) => deleteFile(setStep2Files, id)}
            onFilesSelected={(files) => {
              void appendPreparedFiles(setStep2Files, files, STEP2_KINDS[0].value);
            }}
            onKindChange={(id, kind) => setKind(setStep2Files, id, kind)}
            onRepresentativeChange={(id) => setRepresentative(setStep2Files, id)}
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
              <h2 className={styles.panelTitle}>위험 및 기인물 이미지</h2>
              <p className={styles.panelDescription}>
                위험요인과 기인물 이미지를 묶음으로 올리고, 대표사진과 이미지 목적만 정리합니다.
              </p>
            </div>
            <span
              className={`${styles.statusPill} ${
                step3Files.length > 0 ? styles.statusPillReady : styles.statusPillPending
              }`}
            >
              업로드 {step3Files.length}건
            </span>
          </div>

          <GuidedImageDropzone
            files={step3Files}
            helper="위험요인, 근거리 보강 사진 등을 한 영역에서 관리할 수 있습니다."
            kinds={STEP3_KINDS.map((item) => ({ ...item }))}
            label="위험 및 기인물 이미지 업로드"
            onDelete={(id) => deleteFile(setStep3Files, id)}
            onFilesSelected={(files) => {
              void appendPreparedFiles(setStep3Files, files, STEP3_KINDS[0].value);
            }}
            onKindChange={(id, kind) => setKind(setStep3Files, id, kind)}
            onRepresentativeChange={(id) => setRepresentative(setStep3Files, id)}
          />
        </section>
      );
    }

    return (
      <section className="erp-panel">
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Final</span>
            <h2 className={styles.panelTitle}>초안 생성</h2>
          </div>
          <span
            className={`${styles.statusPill} ${
              generationPhase === 'complete' ? styles.statusPillReady : styles.statusPillPending
            }`}
          >
            {generationPhase === 'generating'
              ? '생성 중'
              : generationPhase === 'complete'
                ? '완료'
                : '대기'}
          </span>
        </div>

        <div className={styles.generatePanel}>
          <div className={styles.generateSummaryGrid}>
            <article className={styles.generateSummaryCard}>
              <span>기본정보</span>
              <strong>{metaReady ? '확인 완료' : '확인 필요'}</strong>
            </article>
            <article className={styles.generateSummaryCard}>
              <span>전경/공정</span>
              <strong>{step2Files.length}건</strong>
            </article>
            <article className={styles.generateSummaryCard}>
              <span>위험/기인물</span>
              <strong>{step3Files.length}건</strong>
            </article>
          </div>

          {generationHelpText ? <div className={styles.inlineNotice}>{generationHelpText}</div> : null}
          {submitError ? <div className={styles.inlineNotice}>{submitError}</div> : null}

          <div className={styles.generateActionArea}>
            <button
              type="button"
              className="erp-button erp-button-primary"
              onClick={() => {
                void handleGenerate();
              }}
              disabled={!canGenerateFinalDraft}
            >
              {generationPhase === 'generating' ? '생성 중' : '보고서 생성'}
            </button>
          </div>
        </div>
      </section>
    );
  };

  const isFinalStep = currentStep === 'generate';

  return (
    <div className="erp-page">
      <section className="page-header-card">
        <div>
          <span className="page-kicker">Create</span>
          <h1 className="page-title">새 보고서</h1>
        </div>
      </section>

      <section className={styles.stepRail} aria-label="보고서 작성 단계">
        {guidedUploadSteps.map((step, index) => {
          const isDone = stepStates[step.id];
          const isActive = currentStep === step.id;
          const canOpen = canOpenStep(step.id);
          return (
            <button
              key={step.id}
              type="button"
              className={`${styles.stepCard} ${isActive ? styles.stepCardActive : ''}`}
              onClick={() => {
                if (canOpen) {
                  setCurrentStep(step.id);
                }
              }}
              disabled={!canOpen}
            >
              <span className={styles.stepBadge}>{index + 1}</span>
              <span className={styles.stepTitle}>{step.label}</span>
              <span className={styles.stepHelper}>{isDone ? '완료' : step.helper}</span>
            </button>
          );
        })}
      </section>

      {renderCurrentStep()}

      <section className={styles.footerBar}>
        <button
          type="button"
          className="erp-button erp-button-secondary"
          onClick={() => moveStep('prev')}
          disabled={currentStepIndex === 0 || generationPhase === 'generating'}
        >
          이전
        </button>
        {!isFinalStep ? (
          <button
            type="button"
            className="erp-button erp-button-primary"
            onClick={() => moveStep('next')}
            disabled={currentStepIndex === STEP_ORDER.length - 1}
          >
            {currentStep === 'hazard' ? '보고서 생성 단계로 이동' : '다음'}
          </button>
        ) : null}
      </section>
    </div>
  );
}
