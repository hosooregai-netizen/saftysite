'use client';

import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { useImageSourcePicker } from '@/hooks/useImageSourcePicker';
import { analyzeHazardPhotos } from '@/lib/api';
import { normalizeHazardResponse } from '@/lib/normalizeHazardResponse';
import { calculateRiskAssessmentResult } from '@/lib/riskAssessment';
import type { HazardReportItem } from '@/types/hazard';
import styles from './HazardReportTable.module.css';

type HazardFieldKey =
  | 'locationDetail'
  | 'likelihood'
  | 'severity'
  | 'riskAssessmentResult'
  | 'photoUrl'
  | 'improvementItems'
  | 'hazardFactors'
  | 'legalInfo'
  | 'implementationPeriod';

interface HazardReportTableText {
  locationDetailLabel?: string;
  locationDetailPlaceholder?: string;
  likelihoodLabel?: string;
  likelihoodPlaceholder?: string;
  severityLabel?: string;
  severityPlaceholder?: string;
  riskAssessmentResultLabel?: string;
  photoLabel?: string;
  photoAlt?: string;
  photoEmptyTitle?: string;
  photoEmptyHint?: string;
  photoChangeLabel?: string;
  photoRemoveLabel?: string;
  improvementItemsLabel?: string;
  improvementItemsPlaceholder?: string;
  hazardFactorsLabel?: string;
  hazardFactorsPlaceholder?: string;
  legalInfoLabel?: string;
  legalInfoPlaceholder?: string;
  implementationPeriodLabel?: string;
  implementationPeriodPlaceholder?: string;
}

interface HazardReportTableProps {
  data: HazardReportItem;
  onChange: (data: HazardReportItem) => void;
  index: number;
  headerActions?: ReactNode;
  text?: HazardReportTableText;
  readOnlyFields?: Partial<Record<HazardFieldKey, boolean>>;
  photoMode?: 'analyze' | 'upload' | 'readonly';
  extraContent?: ReactNode;
}

const DEFAULT_TEXT: Required<HazardReportTableText> = {
  locationDetailLabel: '유해위험 장소',
  locationDetailPlaceholder: '예: 3층 외벽 보수 구간',
  likelihoodLabel: '가능성',
  likelihoodPlaceholder: '1~3',
  severityLabel: '중대성',
  severityPlaceholder: '1~3',
  riskAssessmentResultLabel: '위험성 평가 결과',
  photoLabel: '유해위험요인 사진',
  photoAlt: '유해위험요인 사진',
  photoEmptyTitle: '이미지 선택',
  photoEmptyHint: '클릭해서 사진을 추가하세요.',
  photoChangeLabel: '사진 변경',
  photoRemoveLabel: '사진 제거',
  improvementItemsLabel: '개선대책',
  improvementItemsPlaceholder: '예: 안전난간 설치, 출입통제, 작업 전 교육 재실시',
  hazardFactorsLabel: '유해위험요인 데이터',
  hazardFactorsPlaceholder: '예: 개구부 주변 작업 중 추락 위험 확인',
  legalInfoLabel: '관련 법령',
  legalInfoPlaceholder: '예: 산업안전보건기준에 관한 규칙 관련 조항',
  implementationPeriodLabel: '이행시기',
  implementationPeriodPlaceholder: '예: 즉시 이행 / 조치 완료 / 2일 이내',
};

function syncRiskAssessmentResult(report: HazardReportItem): HazardReportItem {
  return {
    ...report,
    riskAssessmentResult: calculateRiskAssessmentResult(
      report.likelihood,
      report.severity
    ),
  };
}

function isReadOnly(
  readOnlyFields: Partial<Record<HazardFieldKey, boolean>> | undefined,
  key: HazardFieldKey
): boolean {
  return Boolean(readOnlyFields?.[key]);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
}

export default function HazardReportTable({
  data,
  onChange,
  index,
  headerActions,
  text,
  readOnlyFields,
  photoMode = 'analyze',
  extraContent,
}: HazardReportTableProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const { galleryInputRef, cameraInputRef, requestPick, pickerModal } =
    useImageSourcePicker({ title: '사진 추가' });
  const { ref: hazardFactorsRef, resize: resizeHazard } =
    useAutoResizeTextarea(data.hazardFactors, 72);
  const { ref: improvementItemsRef, resize: resizeImprovement } =
    useAutoResizeTextarea(data.improvementItems, 72);
  const { ref: legalInfoRef, resize: resizeLegal } = useAutoResizeTextarea(
    data.legalInfo,
    72
  );
  const mergedText = { ...DEFAULT_TEXT, ...text };

  const riskAssessmentResult = calculateRiskAssessmentResult(
    data.likelihood,
    data.severity
  );

  const syncPhotoMaxHeight = useCallback(() => {
    const container = containerRef.current;
    const improvementTextarea = improvementItemsRef.current;
    if (!container || !improvementTextarea) return;

    const nextHeight = Math.max(
      improvementTextarea.getBoundingClientRect().height,
      120
    );
    container.style.setProperty('--hazard-photo-max-height', `${nextHeight}px`);
  }, [improvementItemsRef]);

  const syncBottomPairHeight = useCallback(() => {
    const hazardTextarea = hazardFactorsRef.current;
    const legalTextarea = legalInfoRef.current;
    if (!hazardTextarea || !legalTextarea) return;

    const nextHeight = Math.max(
      hazardTextarea.getBoundingClientRect().height,
      legalTextarea.getBoundingClientRect().height,
      120
    );

    hazardTextarea.style.height = `${nextHeight}px`;
    legalTextarea.style.height = `${nextHeight}px`;
  }, [hazardFactorsRef, legalInfoRef]);

  useLayoutEffect(() => {
    syncPhotoMaxHeight();
    syncBottomPairHeight();
  }, [
    data.hazardFactors,
    data.improvementItems,
    data.legalInfo,
    syncBottomPairHeight,
    syncPhotoMaxHeight,
  ]);

  useEffect(() => {
    const improvementTextarea = improvementItemsRef.current;
    if (!improvementTextarea) return;

    syncPhotoMaxHeight();

    const observer = new ResizeObserver(() => {
      syncPhotoMaxHeight();
    });

    observer.observe(improvementTextarea);
    window.addEventListener('resize', syncPhotoMaxHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncPhotoMaxHeight);
    };
  }, [improvementItemsRef, syncPhotoMaxHeight]);

  useEffect(() => {
    const hazardTextarea = hazardFactorsRef.current;
    const legalTextarea = legalInfoRef.current;
    if (!hazardTextarea || !legalTextarea) return;

    syncBottomPairHeight();

    const observer = new ResizeObserver(() => {
      syncBottomPairHeight();
    });

    observer.observe(hazardTextarea);
    observer.observe(legalTextarea);
    window.addEventListener('resize', syncBottomPairHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncBottomPairHeight);
    };
  }, [hazardFactorsRef, legalInfoRef, syncBottomPairHeight]);

  const updateReport = useCallback(
    (patch: Partial<HazardReportItem>) => {
      setPhotoError(null);
      onChange(syncRiskAssessmentResult({ ...data, ...patch }));
    },
    [data, onChange]
  );

  const mergeAnalyzedReport = useCallback(
    (next: HazardReportItem): HazardReportItem =>
      syncRiskAssessmentResult({
        ...data,
        location: next.location || data.location,
        locationDetail: next.locationDetail || data.locationDetail,
        likelihood: next.likelihood || data.likelihood,
        severity: next.severity || data.severity,
        hazardFactors: next.hazardFactors || data.hazardFactors,
        improvementItems: next.improvementItems || data.improvementItems,
        photoUrl: next.photoUrl || data.photoUrl,
        legalInfo: next.legalInfo || data.legalInfo,
        implementationPeriod: next.implementationPeriod || data.implementationPeriod,
        metadata: next.metadata ?? data.metadata,
        objects:
          next.objects && next.objects.length > 0 ? next.objects : data.objects,
      }),
    [data]
  );

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || photoMode === 'readonly') return;

    setIsPhotoLoading(true);
    setPhotoError(null);

    try {
      if (photoMode === 'upload') {
        updateReport({
          photoUrl: await readFileAsDataUrl(file),
          metadata: undefined,
          objects: undefined,
        });
        return;
      }

      const raw = await analyzeHazardPhotos([file]);
      const reports = await normalizeHazardResponse(raw, [file]);
      const analyzedReport = reports[0];

      if (!analyzedReport) {
        throw new Error('분석 결과를 불러오지 못했습니다.');
      }

      onChange(mergeAnalyzedReport(analyzedReport));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    if (photoMode === 'readonly') return;

    setPhotoError(null);
    onChange(
      syncRiskAssessmentResult({
        ...data,
        photoUrl: '',
        metadata: undefined,
        objects: undefined,
      })
    );

    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const openPicker = () => {
    if (isPhotoLoading || photoMode === 'readonly') return;
    requestPick();
  };

  return (
    <section ref={containerRef} className={styles.container}>
      {isPhotoLoading ? (
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
          <div className={styles.loadingPanel}>
            <div className={styles.loadingSpinner} aria-hidden="true" />
            <p className={styles.loadingTitle}>이미지를 분석하고 있습니다.</p>
          </div>
        </div>
      ) : null}

      <div
        className={[
          styles.contentShell,
          isPhotoLoading ? styles.contentShellLoading : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {photoError ? <p className={styles.photoError}>{photoError}</p> : null}

        <div className={styles.layout}>
          <div className={styles.topGrid}>
            {headerActions ? (
              <div className={styles.topGridActions}>{headerActions}</div>
            ) : null}
            <div className={`${styles.formField} ${styles.locationField}`}>
              <label className={styles.fieldLabel} htmlFor={`hazard-location-${index}`}>
                {mergedText.locationDetailLabel}
              </label>
              <input
                id={`hazard-location-${index}`}
                type="text"
                value={data.locationDetail}
                onChange={(event) => updateReport({ locationDetail: event.target.value })}
                className="app-input"
                placeholder={mergedText.locationDetailPlaceholder}
                readOnly={isReadOnly(readOnlyFields, 'locationDetail')}
              />
            </div>

            <div className={`${styles.formField} ${styles.metricField}`}>
              <label className={styles.fieldLabel} htmlFor={`hazard-likelihood-${index}`}>
                {mergedText.likelihoodLabel}
              </label>
              <input
                id={`hazard-likelihood-${index}`}
                type="text"
                value={data.likelihood ?? ''}
                onChange={(event) => updateReport({ likelihood: event.target.value })}
                className="app-input"
                placeholder={mergedText.likelihoodPlaceholder}
                readOnly={isReadOnly(readOnlyFields, 'likelihood')}
              />
            </div>

            <div className={`${styles.formField} ${styles.metricField}`}>
              <label className={styles.fieldLabel} htmlFor={`hazard-severity-${index}`}>
                {mergedText.severityLabel}
              </label>
              <input
                id={`hazard-severity-${index}`}
                type="text"
                value={data.severity ?? ''}
                onChange={(event) => updateReport({ severity: event.target.value })}
                className="app-input"
                placeholder={mergedText.severityPlaceholder}
                readOnly={isReadOnly(readOnlyFields, 'severity')}
              />
            </div>

            <div className={`${styles.formField} ${styles.resultField}`}>
              <label className={styles.fieldLabel} htmlFor={`hazard-risk-result-${index}`}>
                {mergedText.riskAssessmentResultLabel}
              </label>
              <input
                id={`hazard-risk-result-${index}`}
                type="text"
                value={riskAssessmentResult}
                readOnly
                className="app-input"
              />
            </div>
          </div>

          <div className={styles.pairedGrid}>
            <div className={`${styles.formField} ${styles.photoColumn}`}>
              <label className={styles.fieldLabel} htmlFor={`hazard-photo-${index}`}>
                {mergedText.photoLabel}
              </label>
              <div className={styles.photoField}>
                {photoMode !== 'readonly' ? (
                  <>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        void handlePhotoChange(event);
                      }}
                      className={styles.hiddenInput}
                      id={`hazard-photo-gallery-${index}`}
                      disabled={isPhotoLoading}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => {
                        void handlePhotoChange(event);
                      }}
                      className={styles.hiddenInput}
                      id={`hazard-photo-camera-${index}`}
                      disabled={isPhotoLoading}
                    />
                  </>
                ) : null}
                {data.photoUrl ? (
                  <div className={styles.photoPreviewWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.photoUrl}
                      alt={mergedText.photoAlt}
                      className={styles.photoPreview}
                    />
                    {photoMode !== 'readonly' ? (
                      <div className={styles.photoActions}>
                        <button
                          type="button"
                          onClick={openPicker}
                          className={styles.photoAction}
                          disabled={isPhotoLoading}
                        >
                          {mergedText.photoChangeLabel}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className={styles.photoRemoveButton}
                          disabled={isPhotoLoading}
                        >
                          {mergedText.photoRemoveLabel}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : photoMode === 'readonly' ? (
                  <div className={styles.photoPlaceholder}>
                    <span>{mergedText.photoEmptyHint}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openPicker}
                    className={`${styles.photoPlaceholder} ${styles.photoPlaceholderButton}`}
                    disabled={isPhotoLoading}
                  >
                    <span>{mergedText.photoEmptyTitle}</span>
                    <span className={styles.photoPlaceholderHint}>
                      {mergedText.photoEmptyHint}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className={`${styles.formField} ${styles.textColumn}`}>
              <label className={styles.fieldLabel} htmlFor={`hazard-improvement-${index}`}>
                {mergedText.improvementItemsLabel}
              </label>
              <textarea
                id={`hazard-improvement-${index}`}
                ref={improvementItemsRef}
                value={data.improvementItems}
                onChange={(event) => {
                  updateReport({ improvementItems: event.target.value });
                  requestAnimationFrame(() => resizeImprovement());
                }}
                className={`app-textarea ${styles.editorTextarea}`}
                placeholder={mergedText.improvementItemsPlaceholder}
                rows={4}
                readOnly={isReadOnly(readOnlyFields, 'improvementItems')}
              />
            </div>
          </div>

          <div className={styles.pairedGrid}>
            <div className={`${styles.formField} ${styles.textColumn}`}>
              <label className={styles.fieldLabel} htmlFor={`hazard-factors-${index}`}>
                {mergedText.hazardFactorsLabel}
              </label>
              <textarea
                id={`hazard-factors-${index}`}
                ref={hazardFactorsRef}
                value={data.hazardFactors}
                onChange={(event) => {
                  updateReport({ hazardFactors: event.target.value });
                  requestAnimationFrame(() => resizeHazard());
                }}
                className={`app-textarea ${styles.editorTextarea}`}
                placeholder={mergedText.hazardFactorsPlaceholder}
                rows={4}
                readOnly={isReadOnly(readOnlyFields, 'hazardFactors')}
              />
            </div>

            <div className={`${styles.formField} ${styles.textColumn}`}>
              <label className={styles.fieldLabel} htmlFor={`hazard-legal-${index}`}>
                {mergedText.legalInfoLabel}
              </label>
              <textarea
                id={`hazard-legal-${index}`}
                ref={legalInfoRef}
                value={data.legalInfo}
                onChange={(event) => {
                  updateReport({ legalInfo: event.target.value });
                  requestAnimationFrame(() => resizeLegal());
                }}
                className={`app-textarea ${styles.editorTextarea}`}
                placeholder={mergedText.legalInfoPlaceholder}
                rows={4}
                readOnly={isReadOnly(readOnlyFields, 'legalInfo')}
              />
            </div>
          </div>

          <div className={styles.footerField}>
            <label className={styles.fieldLabel} htmlFor={`hazard-period-${index}`}>
              {mergedText.implementationPeriodLabel}
            </label>
            <input
              id={`hazard-period-${index}`}
              type="text"
              value={data.implementationPeriod}
              onChange={(event) =>
                updateReport({ implementationPeriod: event.target.value })
              }
              className="app-input"
              placeholder={mergedText.implementationPeriodPlaceholder}
              readOnly={isReadOnly(readOnlyFields, 'implementationPeriod')}
            />
          </div>

          {extraContent}
        </div>
      </div>
      {pickerModal}
    </section>
  );
}
