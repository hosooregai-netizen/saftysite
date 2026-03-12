'use client';

import { type ChangeEvent, type ReactNode, useCallback, useRef } from 'react';
import type { HazardReportItem } from '@/types/hazard';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import styles from './HazardReportTable.module.css';

interface HazardReportTableProps {
  data: HazardReportItem;
  onChange: (data: HazardReportItem) => void;
  index: number;
  headerActions?: ReactNode;
}

export default function HazardReportTable({
  data,
  onChange,
  index,
  headerActions,
}: HazardReportTableProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { ref: hazardFactorsRef, resize: resizeHazard } =
    useAutoResizeTextarea(data.hazardFactors, 88);
  const { ref: improvementItemsRef, resize: resizeImprovement } =
    useAutoResizeTextarea(data.improvementItems, 88);
  const { ref: legalInfoRef, resize: resizeLegal } = useAutoResizeTextarea(
    data.legalInfo,
    128
  );

  const handleChange = useCallback(
    (field: keyof HazardReportItem, value: string) => {
      onChange({ ...data, [field]: value });
    },
    [data, onChange]
  );

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleChange('photoUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    handleChange('photoUrl', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <p className={styles.headerTitle}>위험성평가 보고서 #{index + 1}</p>
          {headerActions}
        </div>
      </div>

      {(data.metadata || data.objects?.length) && (
        <div className={styles.metadataSection}>
          <div>
            <p className={styles.metadataLabel}>분석 메모</p>
            <p className={`${styles.metadataValue} ${styles.metadataMultiline}`}>
              {data.metadata || '추가 메모 없음'}
            </p>
          </div>
          <div>
            <p className={styles.metadataLabel}>검출 객체</p>
            <p className={styles.metadataValue}>
              {data.objects && data.objects.length > 0
                ? data.objects.join(', ')
                : '확인된 객체 없음'}
            </p>
          </div>
        </div>
      )}

      <div className={styles.formShell}>
        <section className={styles.topCard}>
          <div className={styles.topGrid}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>{data.location || '유해·위험요소'}</label>
              <input
                type="text"
                value={data.locationDetail}
                onChange={(event) => handleChange('locationDetail', event.target.value)}
                className="app-input"
                placeholder="예: 3층 보수 구간"
              />
            </div>

            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>위험성 평가 결과</label>
              <input
                type="text"
                value={data.riskAssessmentResult}
                onChange={(event) =>
                  handleChange('riskAssessmentResult', event.target.value)
                }
                className="app-input"
                placeholder="예: 보통 (4)"
              />
            </div>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.photoCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>현장 사진</h3>
            </div>

            <div className={styles.photoFrame}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className={styles.hiddenInput}
                id={`hazard-photo-${index}`}
              />
              {data.photoUrl ? (
                <div className={styles.photoPreviewWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.photoUrl}
                    alt="위험요인 사진"
                    className={styles.photoPreview}
                  />
                  <div className={styles.photoActions}>
                    <label
                      htmlFor={`hazard-photo-${index}`}
                      className={styles.photoAction}
                    >
                      사진 변경
                    </label>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className={styles.photoRemoveButton}
                    >
                      사진 제거
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor={`hazard-photo-${index}`}
                  className={styles.photoPlaceholder}
                >
                  <span>이미지 선택</span>
                  <span className={styles.photoPlaceholderHint}>
                    클릭해서 사진을 추가하세요
                  </span>
                </label>
              )}
            </div>
          </section>

          <section className={styles.detailsCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>세부 내용</h3>
            </div>

            <div className={styles.detailStack}>
              <div className={styles.detailBlock}>
                <label className={styles.sectionLabel}>유해·위험요인</label>
                <textarea
                  ref={hazardFactorsRef}
                  value={data.hazardFactors}
                  onChange={(event) => {
                    handleChange('hazardFactors', event.target.value);
                    requestAnimationFrame(() => resizeHazard());
                  }}
                  className={`app-textarea ${styles.editorTextarea}`}
                  placeholder="예: 개구부 주변에서 작업 중 추락 위험이 확인됨"
                  rows={4}
                />
              </div>

              <div className={styles.detailDivider} aria-hidden="true" />

              <div className={styles.detailBlock}>
                <label className={styles.sectionLabel}>지도사항 및 개선대책</label>
                <textarea
                  ref={improvementItemsRef}
                  value={data.improvementItems}
                  onChange={(event) => {
                    handleChange('improvementItems', event.target.value);
                    requestAnimationFrame(() => resizeImprovement());
                  }}
                  className={`app-textarea ${styles.editorTextarea}`}
                  placeholder="예: 안전난간 설치, 출입통제, 작업 전 교육 재실시"
                  rows={4}
                />
              </div>

              <div className={styles.detailDivider} aria-hidden="true" />

              <div className={styles.detailBlock}>
                <label className={styles.sectionLabel}>관련 법령 / 참고사항</label>
                <textarea
                  ref={legalInfoRef}
                  value={data.legalInfo}
                  onChange={(event) => {
                    handleChange('legalInfo', event.target.value);
                    requestAnimationFrame(() => resizeLegal());
                  }}
                  className={`app-textarea ${styles.editorTextarea}`}
                  placeholder="관련 법령, 기준, 참고사항을 입력하세요"
                  rows={5}
                />
              </div>

              <div className={styles.detailDivider} aria-hidden="true" />

              <div className={styles.detailBlock}>
                <label className={styles.sectionLabel}>이행시기</label>
                <input
                  type="text"
                  value={data.implementationPeriod}
                  onChange={(event) =>
                    handleChange('implementationPeriod', event.target.value)
                  }
                  className="app-input"
                  placeholder="예: 즉시 이행"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
