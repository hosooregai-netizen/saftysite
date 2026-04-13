'use client';

import { assetUrlToFile } from '@/components/session/workspace/doc7Ai';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';
import {
  getMobileDoc3DisplayTitle,
  getMobileDoc3SlotLabel,
} from './mobileInspectionSessionHelpers';
import { FIXED_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import styles from '@/features/mobile/components/MobileShell.module.css';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep3Props {
  applyDoc3ScenePhoto: (
    sceneId: string,
    index: number,
    photoUrl: string,
    fileForAi?: File | null,
  ) => Promise<void>;
  doc3AnalyzingSceneIds: string[];
  openPhotoSourcePicker: (target: MobilePhotoSourceTarget) => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
}

export function MobileInspectionSessionStep3({
  applyDoc3ScenePhoto,
  doc3AnalyzingSceneIds,
  openPhotoSourcePicker,
  screen,
  session,
}: MobileInspectionSessionStep3Props) {
  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>현장 전경</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
          {session.document3Scenes.map((scene, index) => (
            <article
              key={scene.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {getMobileDoc3SlotLabel(index)}
                  </div>
                </div>
                {scene.photoUrl ? (
                  <button
                    type="button"
                    style={{ color: '#ef4444', fontSize: '12px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => {
                      screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
                        ...current,
                        document3Scenes: current.document3Scenes.map((s) =>
                          s.id === scene.id ? { ...s, photoUrl: '' } : s,
                        ),
                      }));
                    }}
                  >
                    비우기
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                style={{
                  display: 'block',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  backgroundColor: '#f8fafc',
                  border: '1px solid rgba(215, 224, 235, 0.88)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() =>
                  openPhotoSourcePicker({
                    fieldLabel: getMobileDoc3SlotLabel(index),
                    onAlbumSelected: async (albumItem) => {
                      const file = await assetUrlToFile(
                        albumItem.previewUrl,
                        albumItem.fileName || `${scene.id}.jpg`,
                      );
                      await applyDoc3ScenePhoto(scene.id, index, albumItem.previewUrl, file);
                    },
                    onFileSelected: async (file) => {
                      const dataUrl = await screen.withFileData(file);
                      if (!dataUrl) {
                        return;
                      }

                      await applyDoc3ScenePhoto(scene.id, index, dataUrl, file);
                    },
                  })
                }
              >
                {scene.photoUrl ? (
                  <img
                    src={scene.photoUrl}
                    alt="현장 사진"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
                      fontSize: '14px',
                    }}
                  >
                    터치하여 사진 선택
                  </div>
                )}
              </button>
              {index >= FIXED_SCENE_COUNT ? (
                <input
                  className="app-input"
                  value={getMobileDoc3DisplayTitle(index, scene.title)}
                  onChange={(event) => {
                    const value = event.target.value;
                    screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
                      ...current,
                      document3Scenes: current.document3Scenes.map((s) =>
                        s.id === scene.id ? { ...s, title: value } : s,
                      ),
                    }));
                  }}
                  placeholder={`${getMobileDoc3SlotLabel(index)} 예: 천장 배관 설치`}
                  style={{ width: '100%' }}
                />
              ) : (
                <div style={{ fontSize: '12px', color: '#64748b', minHeight: '18px' }}>
                  {doc3AnalyzingSceneIds.includes(scene.id)
                    ? 'AI 분석 중'
                    : getMobileDoc3DisplayTitle(index, scene.title)}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
