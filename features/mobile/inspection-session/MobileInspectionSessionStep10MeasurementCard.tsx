'use client';

import { assetUrlToFile } from '@/components/session/workspace/doc7Ai';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import styles from '@/features/mobile/components/MobileShell.module.css';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;
type MeasurementTemplateOption =
  InspectionScreenController['derivedData']['measurementTemplates'][number];

interface MobileInspectionSessionStep10MeasurementCardProps {
  applyDoc10MeasurementPhoto: (
    measurementId: string,
    photoUrl: string,
    fileForMatch?: File | null,
  ) => Promise<void>;
  doc10MatchError?: string;
  handleDoc10PhotoSelect: (measurementId: string, file: File) => Promise<void>;
  index: number;
  isMatching: boolean;
  measurement: InspectionSessionDraft['document10Measurements'][number];
  measurementTemplateOptions: MeasurementTemplateOption[];
  openPhotoSourcePicker: (target: MobilePhotoSourceTarget) => void;
  screen: InspectionScreenController;
}

export function MobileInspectionSessionStep10MeasurementCard({
  applyDoc10MeasurementPhoto,
  doc10MatchError,
  handleDoc10PhotoSelect,
  index,
  isMatching,
  measurement,
  measurementTemplateOptions,
  openPhotoSourcePicker,
  screen,
}: MobileInspectionSessionStep10MeasurementCardProps) {
  const updateMeasurement = (
    patch: Partial<InspectionSessionDraft['document10Measurements'][number]>,
  ) => {
    screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
      ...current,
      document10Measurements: current.document10Measurements.map((item) =>
        item.id === measurement.id ? { ...item, ...patch } : item,
      ),
    }));
  };

  return (
    <article style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>계측기 {index + 1}</span>
        <button
          type="button"
          style={{ color: '#ef4444', fontSize: '13px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          onClick={() => {
            screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
              ...current,
              document10Measurements: current.document10Measurements.filter((item) => item.id !== measurement.id),
            }));
          }}
        >
          삭제
        </button>
      </div>
      <div className={styles.mobileEditorFieldStack}>
        <button
          type="button"
          style={{
            display: 'block',
            width: '100%',
            height: '160px',
            backgroundColor: '#f8fafc',
            border: '1px solid rgba(215, 224, 235, 0.88)',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
            cursor: 'pointer',
          }}
          onClick={() =>
            openPhotoSourcePicker({
              fieldLabel: '계측 사진',
              onAlbumSelected: async (albumItem) => {
                const file = await assetUrlToFile(
                  albumItem.previewUrl,
                  albumItem.fileName || `${measurement.id}.jpg`,
                );
                await applyDoc10MeasurementPhoto(measurement.id, albumItem.previewUrl, file);
              },
              onFileSelected: async (file) => {
                await handleDoc10PhotoSelect(measurement.id, file);
              },
            })
          }
        >
          {measurement.photoUrl ? (
            <img src={measurement.photoUrl} alt="계측 사진" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
              사진 업로드
            </div>
          )}
        </button>
        {isMatching ? (
          <p className={styles.inlineNotice} style={{ margin: 0 }}>
            AI가 계측기 종류를 분석하는 중입니다.
          </p>
        ) : null}
        {doc10MatchError ? <p className={styles.errorNotice} style={{ margin: 0 }}>{doc10MatchError}</p> : null}
        <div className={styles.mobileCompactFieldGrid}>
          <select
            className="app-select"
            value={measurement.instrumentType}
            onChange={(event) => {
              const nextType = event.target.value;
              const matchedTemplate = measurementTemplateOptions.find(
                (template) =>
                  template.instrumentName.trim().toLowerCase() === nextType.trim().toLowerCase(),
              );
              updateMeasurement({
                instrumentType: nextType,
                safetyCriteria: matchedTemplate?.safetyCriteria ?? measurement.safetyCriteria,
              });
            }}
            style={{ width: '100%' }}
          >
            <option value="">장비 선택</option>
            {measurement.instrumentType &&
            !measurementTemplateOptions.some(
              (template) => template.instrumentName === measurement.instrumentType,
            ) ? (
              <option value={measurement.instrumentType}>{measurement.instrumentType}</option>
            ) : null}
            {measurementTemplateOptions.map((template) => (
              <option key={template.id} value={template.instrumentName}>
                {template.instrumentName}
              </option>
            ))}
          </select>
          <input className="app-input" value={measurement.measuredValue} onChange={(event) => updateMeasurement({ measuredValue: event.target.value })} placeholder="측정값" style={{ width: '100%' }} />
          <input className="app-input" value={measurement.measurementLocation} onChange={(event) => updateMeasurement({ measurementLocation: event.target.value })} placeholder="측정 위치" style={{ width: '100%' }} />
          <input className="app-input" value={measurement.actionTaken} onChange={(event) => updateMeasurement({ actionTaken: event.target.value })} placeholder="조치 여부" style={{ width: '100%' }} />
        </div>
        <textarea className="app-input" value={measurement.safetyCriteria} onChange={(event) => updateMeasurement({ safetyCriteria: event.target.value })} placeholder="안전기준" style={{ width: '100%', minHeight: '72px', resize: 'vertical' }} />
      </div>
    </article>
  );
}
