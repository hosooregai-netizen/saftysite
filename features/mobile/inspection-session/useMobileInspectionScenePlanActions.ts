'use client';

import { useState } from 'react';
import type { FocusEvent } from 'react';
import { FIXED_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import {
  getExtraSceneTitle,
  getFixedSceneTitle,
  isExtraScenePlaceholderTitle,
} from '@/constants/inspectionSession/scenePhotos';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { clearHazardCountermeasureSelectionFromFuturePlan } from '@/lib/hazardCountermeasureCatalog';
import { inferSceneTitle } from './mobileInspectionSessionHelpers';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface UseMobileInspectionScenePlanActionsOptions {
  screen: InspectionScreenController;
  session: InspectionSessionDraft | null;
}

export function useMobileInspectionScenePlanActions({
  screen,
  session,
}: UseMobileInspectionScenePlanActionsOptions) {
  const [activeDoc8PlanId, setActiveDoc8PlanId] = useState<string | null>(null);
  const [doc3AnalyzingSceneIds, setDoc3AnalyzingSceneIds] = useState<string[]>([]);

  const toggleDoc3Analyzing = (sceneId: string, active: boolean) => {
    setDoc3AnalyzingSceneIds((current) =>
      active
        ? Array.from(new Set([...current, sceneId]))
        : current.filter((item) => item !== sceneId),
    );
  };

  const applyDoc3ScenePhoto = async (
    sceneId: string,
    index: number,
    photoUrl: string,
    fileForAi?: File | null,
  ) => {
    const fallbackTitle =
      index >= FIXED_SCENE_COUNT ? getExtraSceneTitle(index) : getFixedSceneTitle(index);
    const currentScene = session?.document3Scenes.find((scene) => scene.id === sceneId);
    const shouldRunAi =
      index >= FIXED_SCENE_COUNT &&
      isExtraScenePlaceholderTitle(currentScene?.title, getExtraSceneTitle(index));

    screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
      ...current,
      document3Scenes: current.document3Scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              photoUrl,
              ...(index >= FIXED_SCENE_COUNT && !(scene.title || '').trim()
                ? { title: fallbackTitle }
                : {}),
            }
          : scene,
      ),
    }));

    if (!shouldRunAi || !fileForAi) {
      return;
    }

    toggleDoc3Analyzing(sceneId, true);
    try {
      const title = await inferSceneTitle(fileForAi);
      screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
        ...current,
        document3Scenes: current.document3Scenes.map((scene) =>
          scene.id === sceneId ? { ...scene, title: title || fallbackTitle } : scene,
        ),
      }));
    } finally {
      toggleDoc3Analyzing(sceneId, false);
    }
  };

  const updateDoc8ProcessPlan = (planId: string, nextProcessName: string) => {
    screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
      ...current,
      document8Plans: current.document8Plans.map((plan) =>
        plan.id === planId
          ? {
              ...clearHazardCountermeasureSelectionFromFuturePlan(plan),
              processName: nextProcessName,
            }
          : plan,
      ),
    }));
  };

  const handleDoc8ProcessBlur = (planId: string, event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setActiveDoc8PlanId((current) => (current === planId ? null : current));
    }
  };

  return {
    activeDoc8PlanId,
    applyDoc3ScenePhoto,
    doc3AnalyzingSceneIds,
    handleDoc8ProcessBlur,
    setActiveDoc8PlanId,
    updateDoc8ProcessPlan,
  };
}
