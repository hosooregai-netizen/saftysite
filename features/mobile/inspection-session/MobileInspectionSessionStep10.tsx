'use client';

import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { createMeasurementCheckItem } from '@/constants/inspectionSession/itemFactory';
import styles from '@/features/mobile/components/MobileShell.module.css';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';
import { MobileInspectionSessionStep10MeasurementCard } from './MobileInspectionSessionStep10MeasurementCard';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep10Props {
  applyDoc10MeasurementPhoto: (
    measurementId: string,
    photoUrl: string,
    fileForMatch?: File | null,
  ) => Promise<void>;
  doc10MatchErrors: Record<string, string>;
  doc10MatchingMeasurementId: string | null;
  handleDoc10PhotoSelect: (measurementId: string, file: File) => Promise<void>;
  measurementTemplateOptions: InspectionScreenController['derivedData']['measurementTemplates'];
  openPhotoSourcePicker: (target: MobilePhotoSourceTarget) => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
}

export function MobileInspectionSessionStep10({
  applyDoc10MeasurementPhoto,
  doc10MatchErrors,
  doc10MatchingMeasurementId,
  handleDoc10PhotoSelect,
  measurementTemplateOptions,
  openPhotoSourcePicker,
  screen,
  session,
}: MobileInspectionSessionStep10Props) {
  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>계측점검</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {session.document10Measurements.map((measurement, index) => (
            <MobileInspectionSessionStep10MeasurementCard
              key={measurement.id}
              applyDoc10MeasurementPhoto={applyDoc10MeasurementPhoto}
              doc10MatchError={doc10MatchErrors[measurement.id]}
              handleDoc10PhotoSelect={handleDoc10PhotoSelect}
              index={index}
              isMatching={doc10MatchingMeasurementId === measurement.id}
              measurement={measurement}
              measurementTemplateOptions={measurementTemplateOptions}
              openPhotoSourcePicker={openPhotoSourcePicker}
              screen={screen}
            />
          ))}
          <button
            type="button"
            className="app-button app-button-secondary"
            style={{ width: '100%' }}
            onClick={() => {
              screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                ...current,
                document10Measurements: [...current.document10Measurements, createMeasurementCheckItem()],
              }));
            }}
          >
            + 계측점검 추가
          </button>
        </div>
      </div>
    </section>
  );
}
