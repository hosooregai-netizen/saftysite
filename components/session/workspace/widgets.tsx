'use client';
/* eslint-disable @next/next/no-img-element */

import { type ChangeEvent } from 'react';
import type { ChecklistQuestion, ChecklistRating } from '@/types/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { IMAGE_UPLOAD_LABEL_DESKTOP, IMAGE_UPLOAD_LABEL_MOBILE } from '@/constants/imageUploadLabels';
import { useImageSourcePicker } from '@/hooks/useImageSourcePicker';
import { buildDonutSlices } from './chartDonutUtils';
import { isImageValue, type ChartEntry } from './utils';

interface UploadBoxProps {
  accept?: string;
  fileName?: string;
  id: string;
  label: string;
  /** panel: 상단 라벨 바(기본). field: 일반 입력 필드와 동일하게 라벨 + 아래 업로드 영역 */
  labelLayout?: 'panel' | 'field';
  /** field일 때 삭제를 라벨 줄이 아니라 미리보기 영역 오른쪽 아래에 표시 */
  fieldClearOverlay?: boolean;
  mode?: 'image' | 'file';
  onClear?: () => void;
  onSelect: (file: File) => Promise<unknown> | void;
  value: string;
}

export function UploadBox({
  accept = 'image/*',
  fileName,
  id,
  label,
  labelLayout = 'panel',
  fieldClearOverlay = false,
  mode = 'image',
  onClear,
  onSelect,
  value,
}: UploadBoxProps) {
  const hasValue = Boolean(value);
  const isImage = mode === 'image' && isImageValue(value);

  const imagePicker = useImageSourcePicker({ title: '사진 불러오기' });

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) void Promise.resolve(onSelect(file));
    event.currentTarget.value = '';
  };

  const bodyInner =
    mode === 'image'
      ? hasValue
        ? isImage
          ? (
              <button
                type="button"
                className={styles.uploadPreviewHit}
                onClick={() => imagePicker.requestPick()}
                aria-label={`${label} 바꾸기`}
              >
                <img src={value} alt={label} className={styles.uploadPreview} />
              </button>
            )
          : (
              <label htmlFor={id} className={styles.uploadFileHit}>
                <div className={styles.filePreview}>
                  <strong className={styles.filePreviewTitle}>{fileName || '업로드된 자료'}</strong>
                  <p className={styles.filePreviewText}>자료 파일이 연결되어 있습니다.</p>
                  <a href={value} download={fileName || 'material'} className={styles.fileLink} onClick={(event) => event.stopPropagation()}>
                    파일 열기
                  </a>
                </div>
              </label>
            )
        : (
            <button type="button" className={styles.uploadPlaceholder} onClick={() => imagePicker.requestPick()} aria-label={`${label} 선택`}>
              <span className={styles.uploadPrimaryLabel}>
                <span className={styles.uploadLabelNarrow}>{IMAGE_UPLOAD_LABEL_MOBILE}</span>
                <span className={styles.uploadLabelWide}>{IMAGE_UPLOAD_LABEL_DESKTOP}</span>
              </span>
            </button>
          )
      : hasValue
        ? (
            <label htmlFor={id} className={styles.uploadFileHit}>
              <div className={styles.filePreview}>
                <strong className={styles.filePreviewTitle}>{fileName || '업로드된 자료'}</strong>
                <p className={styles.filePreviewText}>자료 파일이 연결되어 있습니다.</p>
                <a href={value} download={fileName || 'material'} className={styles.fileLink} onClick={(event) => event.stopPropagation()}>
                  파일 열기
                </a>
              </div>
            </label>
          )
        : (
            <label htmlFor={id} className={styles.uploadPlaceholder}>
              <span>자료 파일 업로드</span>
              <span className={styles.uploadHint}>PDF, 이미지 등 자료 파일을 연결할 수 있습니다.</span>
            </label>
          );

  const fileInputs =
    mode === 'image' ? (
      <>
        <input ref={imagePicker.galleryInputRef} type="file" accept={accept} className={styles.hiddenInput} onChange={handleFileInputChange} />
        <input
          ref={imagePicker.cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.hiddenInput}
          onChange={handleFileInputChange}
        />
        {imagePicker.pickerModal}
      </>
    ) : (
      <input id={id} type="file" accept={accept} className={styles.hiddenInput} onChange={handleFileInputChange} />
    );

  if (labelLayout === 'field') {
    const clearInLabel = Boolean(hasValue && onClear && !fieldClearOverlay);
    const clearOverlay = Boolean(hasValue && onClear && fieldClearOverlay);
    return (
      <div className={styles.field}>
        <div className={styles.uploadFieldLabelRow}>
          <span className={styles.fieldLabel}>{label}</span>
          {clearInLabel ? (
            <button type="button" className={styles.inlineDangerButton} onClick={onClear}>
              삭제
            </button>
          ) : null}
        </div>
        <div
          className={`${styles.uploadBody} ${styles.uploadBodyField} ${clearOverlay ? styles.uploadBodyFieldOverlayClear : ''}`}
        >
          {bodyInner}
          {clearOverlay ? (
            <button type="button" className={`${styles.inlineDangerButton} ${styles.uploadFieldClearOverlay}`} onClick={onClear}>
              삭제
            </button>
          ) : null}
        </div>
        {fileInputs}
      </div>
    );
  }

  return (
    <div className={styles.uploadBox}>
      <div className={styles.uploadHeader}>
        <span className={styles.uploadLabel}>{label}</span>
        {hasValue && onClear ? (
          <button type="button" className={styles.inlineDangerButton} onClick={onClear}>
            삭제
          </button>
        ) : null}
      </div>
      <div className={styles.uploadBody}>{bodyInner}</div>
      {fileInputs}
    </div>
  );
}

export function ChartCard({ entries, title }: { entries: ChartEntry[]; title: string }) {
  const total = entries.reduce((sum, item) => sum + item.count, 0);
  const slices = total > 0 ? buildDonutSlices(entries, total) : [];
  const summaryLabel = `${title}: 총 ${total}건`;

  return (
    <article className={styles.chartCard}>
      <h3 className={styles.chartTitle}>{title}</h3>
      {entries.length > 0 && total > 0 ? (
        <div className={styles.chartDonutBody}>
          <div className={styles.chartDonutFigure}>
            <svg
              className={styles.chartDonutSvg}
              viewBox="-50 -50 100 100"
              role="img"
              aria-label={summaryLabel}
            >
              <title>{summaryLabel}</title>
              {slices.map((slice) => (
                <path key={slice.label} d={slice.path} fill={slice.color} stroke="none" />
              ))}
            </svg>
          </div>
          <ul className={styles.chartDonutLegend}>
            {entries.map((item, index) => (
              <li key={item.label} className={styles.chartDonutLegendItem}>
                <span
                  className={styles.chartDonutSwatch}
                  style={{
                    backgroundColor: slices[index]?.color,
                  }}
                  aria-hidden="true"
                />
                <span className={styles.chartDonutLegendLabel}>{item.label}</span>
                <span className={styles.chartDonutLegendCount}>{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={styles.emptyInline}>집계할 위험요인 데이터가 없습니다.</div>
      )}
    </article>
  );
}

export function InfoTable({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <section className={styles.infoTable}>
      <div className={styles.infoTableHeader}>{title}</div>
      <div className={styles.infoTableBody}>
        {rows.map((row) => (
          <div key={row.label} className={styles.infoRow}>
            <div className={styles.infoLabel}>{row.label}</div>
            <div className={styles.infoValue}>{row.value || '미입력'}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ChecklistTable({
  items,
  onChange,
  ratingOptions,
  title,
}: {
  items: ChecklistQuestion[];
  onChange: (itemId: string, patch: Partial<ChecklistQuestion>) => void;
  ratingOptions: Array<{ label: string; value: ChecklistRating }>;
  title: string;
}) {
  return (
    <div className={styles.workPlanSection}>
      <table className={`${styles.workPlanTable} ${styles.doc9ChecklistTable}`}>
        <caption className={styles.workPlanCaption}>{title}</caption>
        <colgroup>
          <col className={styles.doc9ColPrompt} />
          {ratingOptions.map((option) => (
            <col key={option.value} className={styles.doc9ColRating} />
          ))}
          <col className={styles.doc9ColNote} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={styles.workPlanThTitle}>
              문항
            </th>
            {ratingOptions.map((option) => (
              <th key={option.value} scope="col" className={styles.workPlanThNarrow}>
                {option.label}
              </th>
            ))}
            <th scope="col" className={styles.workPlanThTitle}>
              비고
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className={styles.workPlanTdLabel}>{item.prompt}</td>
              {ratingOptions.map((option) => (
                <td key={option.value} className={styles.doc9TdRating}>
                  <input
                    type="radio"
                    className={styles.appRadio}
                    name={item.id}
                    checked={item.rating === option.value}
                    onChange={() => onChange(item.id, { rating: option.value })}
                    aria-label={`${item.prompt}: ${option.label}`}
                  />
                </td>
              ))}
              <td className={styles.workPlanTdSelect}>
                <input
                  type="text"
                  className={`app-input ${styles.doc9NoteInput}`}
                  value={item.note}
                  onChange={(event) => onChange(item.id, { note: event.target.value })}
                  aria-label={`${item.prompt} 비고`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
