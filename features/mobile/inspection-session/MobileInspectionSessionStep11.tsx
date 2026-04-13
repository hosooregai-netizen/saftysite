'use client';

import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import styles from '@/features/mobile/components/MobileShell.module.css';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';
import { MobileInspectionSessionStep11EducationCard } from './MobileInspectionSessionStep11EducationCard';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep11Props {
  doc11ContentError: { id: string; message: string } | null;
  doc11ContentNotice: { id: string; message: string } | null;
  doc11GeneratingId: string | null;
  handleGenerateDoc11Content: (recordId: string) => Promise<void>;
  openPhotoSourcePicker: (target: MobilePhotoSourceTarget) => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
}

export function MobileInspectionSessionStep11({
  doc11ContentError,
  doc11ContentNotice,
  doc11GeneratingId,
  handleGenerateDoc11Content,
  openPhotoSourcePicker,
  screen,
  session,
}: MobileInspectionSessionStep11Props) {
  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>안전교육</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {session.document11EducationRecords.map((record, index) => (
            <MobileInspectionSessionStep11EducationCard
              key={record.id}
              doc11ContentError={doc11ContentError}
              doc11ContentNotice={doc11ContentNotice}
              doc11GeneratingId={doc11GeneratingId}
              handleGenerateDoc11Content={handleGenerateDoc11Content}
              index={index}
              openPhotoSourcePicker={openPhotoSourcePicker}
              record={record}
              screen={screen}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
