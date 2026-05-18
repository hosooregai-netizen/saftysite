'use client';

import { padDocument12Activities } from '@/constants/inspectionSession/itemFactory';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';
import styles from '@/features/mobile/components/MobileShell.module.css';
import { MobileInspectionSessionActivityPhotoField } from './MobileInspectionSessionActivityPhotoField';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;
type ActivityDraft = InspectionSessionDraft['document12Activities'][number];

const VISIBLE_ACTIVITY_COUNT = 2;

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
  const activities = padDocument12Activities(session.document12Activities).slice(
    0,
    VISIBLE_ACTIVITY_COUNT,
  );

  const updateActivity = (
    activityIndex: number,
    patch: Partial<ActivityDraft> | ((current: ActivityDraft) => ActivityDraft),
  ) => {
    screen.applyDocumentUpdate('doc12', 'manual', (current) => {
      const nextActivities = padDocument12Activities(current.document12Activities);

      return {
        ...current,
        document12Activities: nextActivities.map((item, itemIndex) =>
          itemIndex === activityIndex
            ? (typeof patch === 'function' ? patch(item) : { ...item, ...patch })
            : item,
        ),
      };
    });
  };

  const createPhotoPickerTarget = (
    activityIndex: number,
    fieldLabel: string,
  ): MobilePhotoSourceTarget => ({
    fieldLabel,
    onAlbumSelected: (albumItem) => {
      updateActivity(activityIndex, { photoUrl: albumItem.originalUrl || albumItem.previewUrl });
    },
    onFileSelected: async (file) => {
      await screen.withFileData(file, (value) => {
        updateActivity(activityIndex, { photoUrl: value });
      });
    },
  });

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
              {activities.map((activity, index) => (
                <label
                  key={`title-${activity.id}`}
                  style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                    활동 {index + 1} 제목
                  </span>
                  <input
                    className="app-input"
                    value={activity.activityTitle}
                    onChange={(event) =>
                      updateActivity(index, { activityTitle: event.target.value })
                    }
                    placeholder="예: 정기 안전교육"
                  />
                </label>
              ))}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '12px',
              }}
            >
              {activities.map((activity, index) => (
                <MobileInspectionSessionActivityPhotoField
                  key={`photo-${activity.id}`}
                  alt={`활동 ${index + 1} 사진`}
                  fieldLabel={`활동 ${index + 1} 사진`}
                  handlePhotoSlotKeyDown={handlePhotoSlotKeyDown}
                  onOpen={() =>
                    openPhotoSourcePicker(
                      createPhotoPickerTarget(index, `활동 ${index + 1} 사진`),
                    )
                  }
                  onRemove={() => updateActivity(index, { photoUrl: '' })}
                  photoUrl={activity.photoUrl}
                />
              ))}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '12px',
              }}
            >
              {activities.map((activity, index) => (
                <label
                  key={`content-${activity.id}`}
                  style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                    활동 {index + 1} 내용
                  </span>
                  <input
                    type="text"
                    className="app-input"
                    value={activity.content}
                    onChange={(event) => updateActivity(index, { content: event.target.value })}
                    placeholder="활동 내용"
                  />
                </label>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
