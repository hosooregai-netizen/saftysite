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
          <div>
            <p className={styles.headerTitle}>위험성평가 보고서 #{index + 1}</p>
            <p className={styles.headerDescription}>
              출력 전 내용을 직접 검토하고 수정합니다.
            </p>
          </div>
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

      <table className={styles.topTable}>
        <colgroup>
          <col className={styles.topColLabel} />
          <col className={styles.topColValue} />
          <col className={styles.topColLabel} />
          <col className={styles.topColValue} />
        </colgroup>
        <thead>
          <tr>
            <th className={styles.headingCell}>{data.location || '유해·위험요소'}</th>
            <th className={styles.inputCell}>
              <input
                type="text"
                value={data.locationDetail}
                onChange={(event) => handleChange('locationDetail', event.target.value)}
                className={styles.textInput}
                placeholder="예: 3층 보수 구간"
              />
            </th>
            <th className={styles.headingCell}>위험도 평가 결과</th>
            <th className={styles.inputCell}>
              <input
                type="text"
                value={data.riskAssessmentResult}
                onChange={(event) =>
                  handleChange('riskAssessmentResult', event.target.value)
                }
                className={styles.textInput}
                placeholder="예: 보통 (4)"
              />
            </th>
          </tr>
        </thead>
      </table>

      <table className={styles.mainTable}>
        <colgroup>
          <col className={styles.mainColNarrow} />
          <col className={styles.mainColMedium} />
          <col className={styles.mainColNarrow} />
          <col className={styles.mainColWide} />
        </colgroup>
        <tbody>
          <tr>
            <td className={styles.sectionHeadingCell} colSpan={2}>
              유해·위험요인
            </td>
            <td className={styles.sectionHeadingCell} colSpan={2}>
              지도사항 및 개선대책
            </td>
          </tr>
          <tr>
            <td className={styles.textareaCell} colSpan={2}>
              <textarea
                ref={hazardFactorsRef}
                value={data.hazardFactors}
                onChange={(event) => {
                  handleChange('hazardFactors', event.target.value);
                  requestAnimationFrame(() => resizeHazard());
                }}
                className={styles.textareaInput}
                placeholder="예: 개구부 주변에서 작업 중 추락 위험이 확인됨"
                rows={3}
              />
            </td>
            <td className={styles.textareaCell} colSpan={2}>
              <textarea
                ref={improvementItemsRef}
                value={data.improvementItems}
                onChange={(event) => {
                  handleChange('improvementItems', event.target.value);
                  requestAnimationFrame(() => resizeImprovement());
                }}
                className={styles.textareaInput}
                placeholder="예: 안전난간 설치, 출입통제, 작업 전 교육 재실시"
                rows={3}
              />
            </td>
          </tr>
          <tr>
            <td className={styles.photoCell} colSpan={2}>
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
            </td>
            <td className={styles.textareaCell} colSpan={2}>
              <textarea
                ref={legalInfoRef}
                value={data.legalInfo}
                onChange={(event) => {
                  handleChange('legalInfo', event.target.value);
                  requestAnimationFrame(() => resizeLegal());
                }}
                className={styles.textareaInput}
                placeholder="관련 법령, 기준, 참고사항을 입력하세요"
                rows={5}
              />
            </td>
          </tr>
          <tr>
            <td className={styles.sectionHeadingCell} colSpan={2}>
              이행시기
            </td>
            <td className={styles.inputCell} colSpan={2}>
              <input
                type="text"
                value={data.implementationPeriod}
                onChange={(event) =>
                  handleChange('implementationPeriod', event.target.value)
                }
                className={styles.textInput}
                placeholder="예: 즉시 이행"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
