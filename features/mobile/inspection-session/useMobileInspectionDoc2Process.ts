'use client';

import { useMemo, useState } from 'react';
import {
  buildDoc2ProcessNotesDraft,
  buildDoc2RiskFallback,
} from '@/features/inspection-session/workspace/sections/doc2/doc2ProcessNotes';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { generateDoc2RiskLines } from './mobileInspectionSessionHelpers';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface UseMobileInspectionDoc2ProcessParams {
  screen: InspectionScreenController;
  session: InspectionSessionDraft | null;
}

export function useMobileInspectionDoc2Process({
  screen,
  session,
}: UseMobileInspectionDoc2ProcessParams) {
  const [isDoc2ProcessModalOpen, setIsDoc2ProcessModalOpen] = useState(false);
  const [isGeneratingDoc2ProcessNotes, setIsGeneratingDoc2ProcessNotes] =
    useState(false);
  const [doc2ProcessRiskLines, setDoc2ProcessRiskLines] = useState<string[] | null>(null);
  const [doc2ProcessError, setDoc2ProcessError] = useState<string | null>(null);
  const [doc2ProcessNotice, setDoc2ProcessNotice] = useState<string | null>(null);

  const doc2ProcessNoteDraft = useMemo(() => {
    if (!session) return '';
    const fallbackDoc2RiskLines = buildDoc2RiskFallback(session.document2Overview);
    return buildDoc2ProcessNotesDraft(
      session.document2Overview,
      doc2ProcessRiskLines ?? fallbackDoc2RiskLines,
    );
  }, [doc2ProcessRiskLines, session]);

  const resetDoc2ProcessState = () => {
    setDoc2ProcessRiskLines(null);
    setDoc2ProcessError(null);
    setDoc2ProcessNotice(null);
  };

  const handleDoc2ProcessFieldChange = (
    key:
      | 'processWorkContent'
      | 'processWorkerCount'
      | 'processEquipment'
      | 'processTools'
      | 'processHazardousMaterials',
    value: string,
  ) => {
    resetDoc2ProcessState();
    screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
      ...current,
      document2Overview: {
        ...current.document2Overview,
        [key]: value,
      },
    }));
  };

  const handleGenerateDoc2ProcessNotes = async () => {
    if (!session) return;

    setIsGeneratingDoc2ProcessNotes(true);
    setDoc2ProcessError(null);
    setDoc2ProcessNotice(null);

    try {
      const generatedRiskLines = await generateDoc2RiskLines({
        processWorkContent: session.document2Overview.processWorkContent,
        processWorkerCount: session.document2Overview.processWorkerCount,
        processEquipment: session.document2Overview.processEquipment,
        processTools: session.document2Overview.processTools,
        processHazardousMaterials: session.document2Overview.processHazardousMaterials,
      });
      if (generatedRiskLines.length === 0) {
        throw new Error('AI 위험요인 생성 결과가 비어 있습니다.');
      }
      setDoc2ProcessRiskLines(generatedRiskLines);
      setDoc2ProcessNotice('AI가 주요 위험 요인 2줄을 생성했습니다.');
    } catch (errorValue) {
      setDoc2ProcessRiskLines(null);
      setDoc2ProcessError(
        errorValue instanceof Error
          ? errorValue.message
          : 'AI 위험요인 생성에 실패했습니다.',
      );
      setDoc2ProcessNotice(
        'AI 생성에 실패해 규칙 기반 위험 요인으로 미리보기를 유지합니다.',
      );
    } finally {
      setIsGeneratingDoc2ProcessNotes(false);
    }
  };

  const applyDoc2ProcessNotesDraft = () => {
    screen.applyDocumentUpdate('doc2', 'derived', (current) => ({
      ...current,
      document2Overview: {
        ...current.document2Overview,
        processAndNotes: buildDoc2ProcessNotesDraft(
          current.document2Overview,
          doc2ProcessRiskLines ?? buildDoc2RiskFallback(current.document2Overview),
        ),
      },
    }));
    setIsDoc2ProcessModalOpen(false);
  };

  return {
    applyDoc2ProcessNotesDraft,
    doc2ProcessError,
    doc2ProcessNoteDraft,
    doc2ProcessNotice,
    handleDoc2ProcessFieldChange,
    handleGenerateDoc2ProcessNotes,
    isDoc2ProcessModalOpen,
    isGeneratingDoc2ProcessNotes,
    setIsDoc2ProcessModalOpen,
  };
}
