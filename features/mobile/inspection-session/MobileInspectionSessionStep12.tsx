'use client';

import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';
import styles from '@/features/mobile/components/MobileShell.module.css';
import { MobileInspectionSessionActivityPhotoField } from './MobileInspectionSessionActivityPhotoField';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep12Props {
  handlePhotoSlotKeyDown: (event: React.KeyboardEvent<HTMLElement>, action: () => void) => void;
  openPhotoSourcePicker: (target: MobilePhotoSourceTarget) => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
}

export function MobileInspectionSessionStep12({
  handlePhotoSlotKeyDown,
  openPhotoSourcePicker,
  screen,
  session,
}: MobileInspectionSessionStep12Props) {
  const activity = session.document12Activities[0];

  const updateActivity = (
    patch:
      | Partial<InspectionSessionDraft['document12Activities'][number]>
      | ((current: InspectionSessionDraft['document12Activities'][number]) => InspectionSessionDraft['document12Activities'][number]),
  ) => {
    screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
      ...current,
      document12Activities: current.document12Activities.map((item, itemIndex) =>
        itemIndex === 0 ? (typeof patch === 'function' ? patch(item) : { ...item, ...patch }) : item,
      ),
    }));
  };

  const createPhotoPickerTarget = (
    fieldLabel: string,
    key: 'photoUrl' | 'photoUrl2',
  ): MobilePhotoSourceTarget => ({
    fieldLabel,
    onAlbumSelected: (albumItem) => {
      updateActivity({ [key]: albumItem.previewUrl });
    },
    onFileSelected: async (file) => {
      await screen.withFileData(file, (value) => {
        updateActivity({ [key]: value });
      });
    },
  });

  if (!activity) {
    return (
      <section style={{ padding: '16px' }}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>안전보건 활동 실적</h2>
          </div>
        </div>
        <div className={styles.editorBody}>
          <p className={styles.inlineNotice}>활동 실적 항목이 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>안전보건 활동 실적</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        <article style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '12px',
              }}
            >
              <MobileInspectionSessionActivityPhotoField
                alt="활동 1 사진"
                fieldLabel="활동 1 사진"
                handlePhotoSlotKeyDown={handlePhotoSlotKeyDown}
                onOpen={() => openPhotoSourcePicker(createPhotoPickerTarget('활동 1 사진', 'photoUrl'))}
                onRemove={() => updateActivity({ photoUrl: '' })}
                photoUrl={activity.photoUrl}
              />
              <MobileInspectionSessionActivityPhotoField
                alt="활동 2 사진"
                fieldLabel="활동 2 사진"
                handlePhotoSlotKeyDown={handlePhotoSlotKeyDown}
                onOpen={() =>
                  openPhotoSourcePicker(createPhotoPickerTarget('활동 2 사진', 'photoUrl2'))
                }
                onRemove={() => updateActivity({ photoUrl2: '' })}
                photoUrl={activity.photoUrl2}
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '12px',
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  활동 1 내용
                </span>
                <input
                  className="app-input"
                  value={activity.activityType}
                  onChange={(event) => updateActivity({ activityType: event.target.value })}
                  placeholder="예: 안전보건 캠페인"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  활동 2 내용
                </span>
                <input
                  className="app-input"
                  value={activity.content}
                  onChange={(event) => updateActivity({ content: event.target.value })}
                  placeholder="활동 요약 및 비고"
                />
              </label>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
