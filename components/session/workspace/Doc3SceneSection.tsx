'use client';

import { createSiteScenePhoto } from '@/constants/inspectionSession/itemFactory';
import { FIXED_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import { getFixedSceneTitle } from '@/constants/inspectionSession/scenePhotos';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { analyzeHazardPhotos } from '@/lib/api';
import { normalizeHazardResponse } from '@/lib/normalizeHazardResponse';
import type { HazardReportItem } from '@/types/hazard';
import type { SiteScenePhoto } from '@/types/inspectionSession';
import type { OverviewSectionProps } from './types';
import { UploadBox } from './widgets';

function compactSceneTitle(report?: HazardReportItem) {
  const candidates = [
    report?.metadata,
    report?.locationDetail,
    report?.objects?.slice(0, 2).join(' '),
  ];

  for (const candidate of candidates) {
    const value = candidate
      ?.replace(/[.!?。]+$/g, '')
      .replace(/^(사진|이미지)\s*(은|는)?\s*/g, '')
      .replace(/\b현장\b/g, '')
      .replace(/\b전경\b/g, '')
      .replace(/\b모습\b/g, '')
      .replace(/\b상태\b/g, '')
      .replace(/\b입니다\b/g, '')
      .replace(/[,:/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (value) return value.slice(0, 24);
  }

  return '';
}

async function inferSceneTitles(files: File[]) {
  try {
    const reports = await normalizeHazardResponse(await analyzeHazardPhotos(files), files);
    return files.map((_, index) => compactSceneTitle(reports[index]));
  } catch {
    return files.map(() => '');
  }
}

function patchScene(
  scenes: SiteScenePhoto[],
  sceneId: string,
  patch: Partial<SiteScenePhoto>
) {
  return scenes.map((scene) => (scene.id === sceneId ? { ...scene, ...patch } : scene));
}

export function Doc3SceneSection({
  applyDocumentUpdate,
  session,
  withFileData,
}: OverviewSectionProps) {
  const fixedScenes = session.document3Scenes.slice(0, FIXED_SCENE_COUNT);
  const extraScenes = session.document3Scenes.slice(FIXED_SCENE_COUNT);

  const updateScene = (sceneId: string, patch: Partial<SiteScenePhoto>) =>
    applyDocumentUpdate('doc3', 'manual', (current) => ({
      ...current,
      document3Scenes: patchScene(current.document3Scenes, sceneId, patch),
    }));

  const removeScene = (sceneId: string) =>
    applyDocumentUpdate('doc3', 'manual', (current) => ({
      ...current,
      document3Scenes: current.document3Scenes.filter((scene) => scene.id !== sceneId),
    }));

  const handleFixedUpload = async (sceneId: string, file: File) => {
    const dataUrl = await withFileData(file);
    if (!dataUrl) return;
    updateScene(sceneId, { photoUrl: dataUrl });
  };

  const handleExtraUpload = async (sceneId: string, file: File) => {
    const [dataUrl, [title]] = await Promise.all([withFileData(file), inferSceneTitles([file])]);
    if (!dataUrl) return;
    updateScene(sceneId, { photoUrl: dataUrl, title });
  };

  const handleExtraFiles = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) return;

    const [dataUrls, titles] = await Promise.all([
      Promise.all(selectedFiles.map((file) => withFileData(file))),
      inferSceneTitles(selectedFiles),
    ]);

    const nextScenes = dataUrls.flatMap((dataUrl, index) =>
      dataUrl
        ? [createSiteScenePhoto('', { photoUrl: dataUrl, title: titles[index] || '' })]
        : []
    );

    if (nextScenes.length === 0) return;
    applyDocumentUpdate('doc3', 'manual', (current) => ({
      ...current,
      document3Scenes: [...current.document3Scenes, ...nextScenes],
    }));
  };

  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">필수 2장</span>
        <span className="app-chip">추가 이미지는 여러 장 업로드 가능</span>
      </div>
      <div className={styles.dualUploadGrid}>
        {fixedScenes.map((item, index) => (
          <article key={item.id} className={styles.card}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{getFixedSceneTitle(index)}</h3></div>
            <UploadBox id={`scene-photo-${item.id}`} label="사진" value={item.photoUrl} onClear={() => updateScene(item.id, { photoUrl: '', description: '' })} onSelect={async (file) => handleFixedUpload(item.id, file)} />
            <label className={styles.field}>
              <span className={styles.fieldLabel}>사진 설명</span>
              <input type="text" className="app-input" value={item.description} onChange={(event) => updateScene(item.id, { description: event.target.value })} />
            </label>
          </article>
        ))}
        {extraScenes.map((item, index) => (
          <article key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{`추가 이미지 ${index + 1}`}</h3>
              <button type="button" className={styles.inlineDangerButton} onClick={() => removeScene(item.id)}>
                항목 삭제
              </button>
            </div>
            <UploadBox id={`scene-extra-photo-${item.id}`} label="사진" value={item.photoUrl} onClear={() => updateScene(item.id, { photoUrl: '', title: '', description: '' })} onSelect={async (file) => handleExtraUpload(item.id, file)} />
            <label className={styles.field}>
              <span className={styles.fieldLabel}>이미지 제목</span>
              <input type="text" className="app-input" placeholder="AI가 자동으로 채우고, 필요하면 수정할 수 있습니다." value={item.title} onChange={(event) => updateScene(item.id, { title: event.target.value })} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>사진 설명</span>
              <input type="text" className="app-input" value={item.description} onChange={(event) => updateScene(item.id, { description: event.target.value })} />
            </label>
          </article>
        ))}
      </div>
      <label htmlFor="scene-extra-upload" className={styles.sceneAddPanel}>
        <strong className={styles.sceneAddTitle}>추가 이미지 업로드</strong>
        <span className={styles.sceneAddDescription}>
          한 장만 추가해도 되고 여러 장을 한 번에 선택해도 됩니다. 업로드 뒤 AI가 제목을 짧게 제안합니다.
        </span>
        <span className="app-button app-button-secondary">이미지 추가</span>
      </label>
      <input id="scene-extra-upload" type="file" accept="image/*" multiple className={styles.hiddenInput} onChange={(event) => { void handleExtraFiles(event.currentTarget.files); event.currentTarget.value = ''; }} />
    </div>
  );
}
