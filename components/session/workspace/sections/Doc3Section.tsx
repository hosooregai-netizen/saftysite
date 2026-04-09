'use client';

import { useState } from 'react';
import { FIXED_SCENE_COUNT, TOTAL_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import { isExtraScenePlaceholderTitle } from '@/constants/inspectionSession/scenePhotos';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import type { SiteScenePhoto } from '@/types/inspectionSession';
import Doc3ExtraScenes from './Doc3ExtraScenes';
import Doc3FixedScenes from './Doc3FixedScenes';

async function inferSceneTitle(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/ai/doc3-scene-title', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('현장 전경 공정명 AI 생성에 실패했습니다.');
  }

  const payload = (await response.json()) as { title?: string };
  return payload.title?.trim() || '';
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

  const updateScene = (sceneId: string, patch: Partial<SiteScenePhoto>) =>
    applyDocumentUpdate('doc3', 'manual', (current) => ({
      ...current,
      document3Scenes: patchScene(current.document3Scenes, sceneId, patch),
    }));

  const toggleAnalyzing = (sceneIds: string[], active: boolean) =>
    setAnalyzingSceneIds((current) =>
      active
        ? Array.from(new Set([...current, ...sceneIds]))
        : current.filter((sceneId) => !sceneIds.includes(sceneId)),
    );

  const handleFixedUpload = async (sceneId: string, file: File) => {
    const dataUrl = await withFileData(file);
    if (dataUrl) updateScene(sceneId, { photoUrl: dataUrl });
  };

  const handleExtraUpload = async (sceneId: string, file: File, fallbackTitle: string) => {
    const priorTitle = session.document3Scenes.find((scene) => scene.id === sceneId)?.title;
    const useAutoTitle = isExtraScenePlaceholderTitle(priorTitle, fallbackTitle);

    const dataUrl = await withFileData(file);
    if (!dataUrl) return;

    if (!useAutoTitle) {
      updateScene(sceneId, { photoUrl: dataUrl });
      return;
    }

    updateScene(sceneId, { photoUrl: dataUrl, title: fallbackTitle });
    toggleAnalyzing([sceneId], true);
    try {
      const title = await inferSceneTitle(file);
      updateScene(sceneId, { title: title || fallbackTitle });
    } finally {
      toggleAnalyzing([sceneId], false);
    }
  };

  return (
    <div className={`${styles.sectionStack} ${styles.doc3SceneStack}`}>
      <Doc3FixedScenes
        items={fixedScenes}
        onClear={(sceneId) => updateScene(sceneId, { photoUrl: '', title: '' })}
        onUpload={handleFixedUpload}
      />
      <Doc3ExtraScenes
        items={extraScenes}
        isAnalyzing={(sceneId) => analyzingSceneIds.includes(sceneId)}
        onClear={(sceneId) => updateScene(sceneId, { photoUrl: '', title: '' })}
        onTitleChange={(sceneId, value) => updateScene(sceneId, { title: value })}
        onUpload={handleExtraUpload}
      />
    </div>
  );
}
