'use client';

import { FOLLOW_UP_RESULT_OPTIONS } from '@/constants/inspectionSession';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import styles from '@/features/mobile/components/MobileShell.module.css';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep4Props {
  openPhotoSourcePicker: (target: MobilePhotoSourceTarget) => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
}

export function MobileInspectionSessionStep4({
  openPhotoSourcePicker,
  screen,
  session,
}: MobileInspectionSessionStep4Props) {
  const updateFollowUp = (
    followUpId: string,
    patch: Partial<InspectionSessionDraft['document4FollowUps'][number]>,
  ) => {
    screen.applyDocumentUpdate('doc4', 'manual', (current) => ({
      ...current,
      document4FollowUps: current.document4FollowUps.map((item) =>
        item.id === followUpId ? { ...item, ...patch } : item,
      ),
    }));
  };

  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>이전 기술지도 사항 이행여부</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        {screen.isRelationHydrating ? (
          <p className={styles.inlineNotice} style={{ marginBottom: '12px' }}>
            이전 보고서의 이행 항목을 불러오는 중입니다.
          </p>
        ) : null}
        {screen.relationStatus === 'error' ? (
          <p className={styles.errorNotice} style={{ marginBottom: '12px' }}>
            이전 보고서 데이터를 아직 불러오지 못했습니다.
          </p>
        ) : null}
        {session.document4FollowUps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {session.document4FollowUps.map((item) => (
              <article
                key={item.id}
                style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}
              >
                <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  {item.location || '위치 미지정'}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>시정조치 결과</span>
                    <select
                      className="app-select"
                      value={item.result}
                      onChange={(event) => updateFollowUp(item.id, { result: event.target.value })}
                    >
                      {FOLLOW_UP_RESULT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>지도일자</span>
                    <input className="app-input" value={item.guidanceDate || '미기록'} readOnly />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                      이전 지적 사진
                    </div>
                    {item.beforePhotoUrl ? (
                      <img
                        src={item.beforePhotoUrl}
                        alt="지적 사진"
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          backgroundColor: '#f8fafc',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '120px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid rgba(215, 224, 235, 0.88)',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: '#94a3b8',
                        }}
                      >
                        사진 없음
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                      개선 후 사진
                    </div>
                    <button
                      type="button"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '120px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid rgba(215, 224, 235, 0.88)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        openPhotoSourcePicker({
                          fieldLabel: '개선 후',
                          onAlbumSelected: (albumItem) => updateFollowUp(item.id, { afterPhotoUrl: albumItem.previewUrl }),
                          onFileSelected: async (file) => {
                            await screen.withFileData(file, (value) => updateFollowUp(item.id, { afterPhotoUrl: value }));
                          },
                        })
                      }
                    >
                      {item.afterPhotoUrl ? (
                        <img
                          src={item.afterPhotoUrl}
                          alt="개선 사진"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            fontSize: '12px',
                          }}
                        >
                          사진 선택
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.inlineNotice}>이전 기술지도 사항이 없습니다.</p>
        )}
      </div>
    </section>
  );
}
