'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { GuidedPhotoStepUploadInput } from '@saftysite/contracts';
import { GuidedImageSlot } from '@/components/GuidedImageSlot';
import styles from '@/components/GuidedUploadFlow.module.css';
import {
  createReportRecord,
  generateDraftFromGuidedPhotos,
  generateDraftFromPhotos,
  uploadGuidedStepPhotos,
  bootstrapDemoSession,
} from '@/lib/reportApi';
import { prepareUploadImage } from '@/lib/reportImages';
import {
  creationDialogFields,
  guidedUploadStep2Slots,
  guidedUploadStep3Slots,
  guidedUploadSteps,
  type GuidedUploadSlot,
  type GuidedUploadStepId,
} from '@/lib/demoData';

type GuidedUploadSlotState = GuidedUploadSlot & {
  fileName: string;
  source: 'local' | 'empty';
};

const STEP_ORDER: GuidedUploadStepId[] = ['meta', 'overview', 'hazard', 'generate'];

function toInitialSlotState(slot: GuidedUploadSlot): GuidedUploadSlotState {
  return {
    ...slot,
    previewAlt: '',
    previewUrl: '',
    fileName: '',
    source: 'empty',
  };
}

function buildGuidedPhotoPayload(slots: GuidedUploadSlotState[]): GuidedPhotoStepUploadInput {
  return {
    photos: slots
      .filter((slot) => Boolean(slot.previewUrl))
      .map((slot) => {
        const category: GuidedPhotoStepUploadInput['photos'][number]['category'] =
          slot.id.startsWith('overview')
            ? slot.id === 'overview-hero'
              ? 'site_overview'
              : 'process'
            : 'hazard';

        return {
          filename: slot.fileName || `${slot.id}.jpg`,
          category,
          data_url: slot.previewUrl,
          location_hint: slot.label,
        };
      }),
  };
}

export default function NewReportPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<GuidedUploadStepId>('meta');
  const [metaFields, setMetaFields] = useState(() =>
    Object.fromEntries(
      creationDialogFields.map((field) => [field.id, field.value]),
    ) as Record<(typeof creationDialogFields)[number]['id'], string>,
  );
  const [step2Slots, setStep2Slots] = useState<GuidedUploadSlotState[]>(() =>
    guidedUploadStep2Slots.map(toInitialSlotState),
  );
  const [step3Slots, setStep3Slots] = useState<GuidedUploadSlotState[]>(() =>
    guidedUploadStep3Slots.map(toInitialSlotState),
  );
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'generating' | 'complete'>('idle');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    void bootstrapDemoSession().catch(() => {
      // The actual error will be surfaced when the user starts generation.
    });
  }, []);

  const metaReady = creationDialogFields.every((field) =>
    field.required ? Boolean(metaFields[field.id]?.trim()) : true,
  );
  const hasStep2Images = step2Slots.some((slot) => Boolean(slot.previewUrl));
  const hasStep3Images = step3Slots.some((slot) => Boolean(slot.previewUrl));
  const canGenerateFinalDraft = metaReady && generationPhase !== 'generating';
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const stepStates = {
    meta: metaReady,
    overview: hasStep2Images,
    hazard: hasStep3Images,
    generate: generationPhase === 'complete',
  };

  const updateSlotCollection = (
    setter: Dispatch<SetStateAction<GuidedUploadSlotState[]>>,
    slotId: string,
    updater: (slot: GuidedUploadSlotState) => GuidedUploadSlotState,
  ) => {
    setGenerationPhase('idle');
    setSubmitError('');
    setter((current) =>
      current.map((slot) => {
        if (slot.id !== slotId) return slot;
        return updater(slot);
      }),
    );
  };

  const replaceSlotWithFile = async (
    setter: Dispatch<SetStateAction<GuidedUploadSlotState[]>>,
    slotId: string,
    file: File,
  ) => {
    const prepared = await prepareUploadImage(file);
    updateSlotCollection(setter, slotId, (slot) => ({
      ...slot,
      previewAlt: prepared.fileName,
      previewUrl: prepared.dataUrl,
      fileName: prepared.fileName,
      source: 'local',
    }));
  };

  const clearSlot = (
    setter: Dispatch<SetStateAction<GuidedUploadSlotState[]>>,
    slotId: string,
  ) => {
    updateSlotCollection(setter, slotId, (slot) => ({
      ...slot,
      previewAlt: '',
      previewUrl: '',
      fileName: '',
      source: 'empty',
    }));
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

      const step1Payload = buildGuidedPhotoPayload(step2Slots);
      const step2Payload = buildGuidedPhotoPayload(step3Slots);
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
      setSubmitError(error instanceof Error ? error.message : '보고서를 생성하지 못했습니다.');
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
      const completedCount = step2Slots.filter((slot) => Boolean(slot.previewUrl)).length;

      return (
        <section className="erp-panel">
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Step 2</span>
              <h2 className={styles.panelTitle}>공정 및 전경 이미지</h2>
            </div>
            <span className={`${styles.statusPill} ${completedCount > 0 ? styles.statusPillReady : styles.statusPillPending}`}>
              {completedCount} / {step2Slots.length}
            </span>
          </div>

          <div className={styles.slotGrid}>
            {step2Slots.map((slot) => (
              <GuidedImageSlot
                key={slot.id}
                fileName={slot.fileName}
                helper={slot.helper}
                label={slot.label}
                previewAlt={slot.previewAlt}
                previewUrl={slot.previewUrl}
                onSelect={(file) => {
                  void replaceSlotWithFile(setStep2Slots, slot.id, file);
                }}
                onClear={() => clearSlot(setStep2Slots, slot.id)}
              />
            ))}
          </div>
        </section>
      );
    }

    if (currentStep === 'hazard') {
      const completedCount = step3Slots.filter((slot) => Boolean(slot.previewUrl)).length;

      return (
        <section className="erp-panel">
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Step 3</span>
              <h2 className={styles.panelTitle}>위험 및 기인물 이미지</h2>
            </div>
            <span className={`${styles.statusPill} ${completedCount > 0 ? styles.statusPillReady : styles.statusPillPending}`}>
              {completedCount} / {step3Slots.length}
            </span>
          </div>

          <div className={styles.slotGrid}>
            {step3Slots.map((slot) => (
              <GuidedImageSlot
                key={slot.id}
                fileName={slot.fileName}
                helper={slot.helper}
                label={slot.label}
                previewAlt={slot.previewAlt}
                previewUrl={slot.previewUrl}
                onSelect={(file) => {
                  void replaceSlotWithFile(setStep3Slots, slot.id, file);
                }}
                onClear={() => clearSlot(setStep3Slots, slot.id)}
              />
            ))}
          </div>
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
              <strong>{step2Slots.filter((slot) => slot.previewUrl).length}건</strong>
            </article>
            <article className={styles.generateSummaryCard}>
              <span>위험/기인물</span>
              <strong>{step3Slots.filter((slot) => slot.previewUrl).length}건</strong>
            </article>
          </div>

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
          const stateKey = step.id;
          const isDone = stepStates[stateKey];
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
          disabled={currentStepIndex === 0}
        >
          이전
        </button>
        <button
          type="button"
          className="erp-button erp-button-primary"
          onClick={() => moveStep('next')}
          disabled={currentStepIndex === STEP_ORDER.length - 1}
        >
          다음
        </button>
      </section>
    </div>
  );
}
