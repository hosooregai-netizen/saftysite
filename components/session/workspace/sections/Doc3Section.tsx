'use client';

import { useState } from 'react';
import { FIXED_SCENE_COUNT, TOTAL_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import { analyzeHazardPhotos } from '@/lib/api';
import { normalizeHazardResponse } from '@/lib/normalizeHazardResponse';
import type { HazardReportItem } from '@/types/hazard';
import type { SiteScenePhoto } from '@/types/inspectionSession';
import Doc3ExtraScenes from './Doc3ExtraScenes';
import Doc3FixedScenes from './Doc3FixedScenes';

function compactSceneTitle(report?: HazardReportItem) {
  const candidates = [report?.metadata, report?.locationDetail, report?.objects?.slice(0, 2).join(' ')];

  for (const candidate of candidates) {
    const value = candidate?.replace(/[.!?。]+$/g, '').replace(/^(사진|이미지)\s*(은|는)?\s*/g, '').replace(/\b현장\b/g, '').replace(/\b전경\b/g, '').replace(/\b모습\b/g, '').replace(/\b상태\b/g, '').replace(/\b입니다\b/g, '').replace(/[,:/]/g, ' ').replace(/\s+/g, ' ').trim();
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

function patchScene(scenes: SiteScenePhoto[], sceneId: string, patch: Partial<SiteScenePhoto>) {
  return scenes.map((scene) => (scene.id === sceneId ? { ...scene, ...patch } : scene));
}

export default function Doc3Section({
  applyDocumentUpdate,
  session,
  withFileData,
}: OverviewSectionProps) {
  const [analyzingSceneIds, setAnalyzingSceneIds] = useState<string[]>([]);
  const fixedScenes = session.document3Scenes.slice(0, FIXED_SCENE_COUNT);
  const extraScenes = session.document3Scenes.slice(FIXED_SCENE_COUNT, TOTAL_SCENE_COUNT);
  const uploadedCount = session.document3Scenes.slice(0, TOTAL_SCENE_COUNT).filter((item) => Boolean(item.photoUrl)).length;

  const updateScene = (sceneId: string, patch: Partial<SiteScenePhoto>) =>
    applyDocumentUpdate('doc3', 'manual', (current) => ({
      ...current,
      document3Scenes: patchScene(current.document3Scenes, sceneId, patch),
    }));

  const toggleAnalyzing = (sceneIds: string[], active: boolean) =>
    setAnalyzingSceneIds((current) =>
      active ? Array.from(new Set([...current, ...sceneIds])) : current.filter((sceneId) => !sceneIds.includes(sceneId))
    );

  const handleFixedUpload = async (sceneId: string, file: File) => {
    const dataUrl = await withFileData(file);
    if (dataUrl) updateScene(sceneId, { photoUrl: dataUrl });
  };

  const handleExtraUpload = async (sceneId: string, file: File, fallbackTitle: string) => {
    const dataUrl = await withFileData(file);
    if (!dataUrl) return;
    updateScene(sceneId, { photoUrl: dataUrl, title: fallbackTitle });
    toggleAnalyzing([sceneId], true);
    try {
      const [title] = await inferSceneTitles([file]);
      updateScene(sceneId, { title: title || fallbackTitle });
    } finally {
      toggleAnalyzing([sceneId], false);
    }
  };

  return (
    <div className={`${styles.sectionStack} ${styles.doc3SceneStack}`}>
      <section className={`${styles.card} ${styles.doc3SceneIntro} ${styles.doc3FullRow}`}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardEyebrow}>문서 배치 기준 입력</div>
            <h3 className={styles.cardTitle}>현장 전경 2장 + 주요 진행공정 4장</h3>
          </div>
          <span className="app-chip">{`${uploadedCount}/${TOTAL_SCENE_COUNT} 업로드`}</span>
        </div>
        <p className={styles.fieldAssist}>상단 2칸은 현장 전경, 하단 4칸은 주요 진행공정으로 문서에 그대로 배치됩니다. 사진만 먼저 올린 뒤 설명과 공정명을 보완해도 됩니다.</p>
      </section>

      {analyzingSceneIds.length > 0 ? (
        <p className={`${styles.fieldAssist} ${styles.doc3FullRow}`}>{`AI가 ${analyzingSceneIds.length}개 이미지 제목을 정리 중입니다.`}</p>
      ) : null}

      <Doc3FixedScenes items={fixedScenes} onClear={(sceneId) => updateScene(sceneId, { photoUrl: '', description: '' })} onDescriptionChange={(sceneId, value) => updateScene(sceneId, { description: value })} onUpload={handleFixedUpload} />
      <Doc3ExtraScenes items={extraScenes} isAnalyzing={(sceneId) => analyzingSceneIds.includes(sceneId)} onClear={(sceneId, defaultTitle) => updateScene(sceneId, { photoUrl: '', title: defaultTitle, description: '' })} onDescriptionChange={(sceneId, value) => updateScene(sceneId, { description: value })} onTitleChange={(sceneId, value) => updateScene(sceneId, { title: value })} onUpload={handleExtraUpload} />
    </div>
  );
}
