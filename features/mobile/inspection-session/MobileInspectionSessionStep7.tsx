'use client';

import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { createCurrentHazardFinding } from '@/constants/inspectionSession/itemFactory';
import styles from '@/features/mobile/components/MobileShell.module.css';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';
import { MobileInspectionSessionStep7FindingCard } from './MobileInspectionSessionStep7FindingCard';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep7Props {
  doc7AiErrors: Record<string, string>;
  doc7AiLoadingId: string | null;
  handleDoc7AiRefill: (findingId: string, photoUrl: string) => Promise<void>;
  openPhotoSourcePicker: (target: MobilePhotoSourceTarget) => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
}

export function MobileInspectionSessionStep7({
  doc7AiErrors,
  doc7AiLoadingId,
  handleDoc7AiRefill,
  openPhotoSourcePicker,
  screen,
  session,
}: MobileInspectionSessionStep7Props) {
  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>현존 유해·위험요인 세부 지적</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {session.document7Findings.map((finding, index) => (
            <MobileInspectionSessionStep7FindingCard
              key={finding.id}
              doc7AiError={doc7AiErrors[finding.id]}
              finding={finding}
              index={index}
              isAiLoading={doc7AiLoadingId === finding.id}
              openPhotoSourcePicker={openPhotoSourcePicker}
              onRefill={handleDoc7AiRefill}
              screen={screen}
            />
          ))}
          <button
            type="button"
            className="app-button app-button-secondary"
            style={{ width: '100%' }}
            onClick={() => {
              screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                ...current,
                document7Findings: [
                  ...current.document7Findings,
                  createCurrentHazardFinding({ inspector: current.meta.drafter }),
                ],
              }));
            }}
          >
            + 지적 사항 추가
          </button>
        </div>
      </div>
    </section>
  );
}
