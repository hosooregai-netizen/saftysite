'use client';

import { useDeferredValue, useEffect, useRef, useState } from 'react';
import type { FocusEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import LoginPanel from '@/components/auth/LoginPanel';
import SignaturePad from '@/components/ui/SignaturePad';
import { getSessionTitle } from '@/constants/inspectionSession';
import { FIXED_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import {
  ACCIDENT_OCCURRENCE_OPTIONS,
  NOTIFICATION_METHOD_OPTIONS,
  PREVIOUS_IMPLEMENTATION_OPTIONS,
} from '@/components/session/workspace/constants';
import {
  assetUrlToFile,
  buildHazardFindingAutoFill,
} from '@/components/session/workspace/doc7Ai';
import {
  getExtraSceneTitle,
  getFixedSceneTitle,
  isExtraScenePlaceholderTitle,
} from '@/constants/inspectionSession/scenePhotos';
import {
  buildDoc2ProcessNotesDraft,
  buildDoc2RiskFallback,
} from '@/features/inspection-session/workspace/sections/doc2/doc2ProcessNotes';
import { matchMeasurementTemplateByPhoto } from '@/features/inspection-session/workspace/sections/doc10/doc10Ai';
import { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { applyDoc7ReferenceMaterialMatch } from '@/lib/doc7ReferenceMaterials';
import {
  buildDoc5StructuredSummaryPayload,
  buildLocalDoc5SummaryDraft,
} from '@/lib/openai/doc5SummaryLocalDraft';
import { fetchPhotoAlbum } from '@/lib/photos/apiClient';
import {
  buildLocalDoc11EducationContent,
  generateStructuredDoc11EducationContent,
} from '@/lib/openai/generateDoc11EducationContent';
import type { PhotoAlbumItem } from '@/types/photos';
import {
  buildMobileHomeHref,
  buildMobileSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { buildSiteTabs } from '../lib/buildSiteTabs';
import { MobileInspectionSessionModals } from '../inspection-session/MobileInspectionSessionModals';
import { MobileInspectionSessionStandaloneState } from '../inspection-session/MobileInspectionSessionStandaloneState';
import { MobileInspectionSessionStep3 } from '../inspection-session/MobileInspectionSessionStep3';
import { MobileInspectionSessionStep4 } from '../inspection-session/MobileInspectionSessionStep4';
import { MobileInspectionSessionStep5 } from '../inspection-session/MobileInspectionSessionStep5';
import { MobileInspectionSessionStep6 } from '../inspection-session/MobileInspectionSessionStep6';
import { MobileInspectionSessionStep7 } from '../inspection-session/MobileInspectionSessionStep7';
import { MobileInspectionSessionStep8 } from '../inspection-session/MobileInspectionSessionStep8';
import { MobileInspectionSessionStep9 } from '../inspection-session/MobileInspectionSessionStep9';
import { MobileInspectionSessionStep10 } from '../inspection-session/MobileInspectionSessionStep10';
import { MobileInspectionSessionStep11 } from '../inspection-session/MobileInspectionSessionStep11';
import { MobileInspectionSessionStep12 } from '../inspection-session/MobileInspectionSessionStep12';
import {
  MOBILE_INSPECTION_STEPS,
  MobileInspectionStepId,
  MobilePhotoSourceTarget,
  buildAutoReportTitle,
  findDoc8ProcessMatch,
  generateDoc2RiskLines,
  generateStructuredDoc5Summary,
  inferSceneTitle,
  parsePositiveRound,
} from '../inspection-session/mobileInspectionSessionHelpers';
import styles from './MobileShell.module.css';
import tabStyles from './MobileStepTabs.module.css';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';

interface MobileInspectionSessionScreenProps {
  sessionId: string;
}

export function MobileInspectionSessionScreen({
  sessionId,
}: MobileInspectionSessionScreenProps) {
  const searchParams = useSearchParams();
  const screen = useInspectionSessionScreen(sessionId);
  const displaySession = screen.displaySession;
  const session = screen.sectionSession;
  const [activeStep, setActiveStep] = useState<MobileInspectionStepId>(
    MOBILE_INSPECTION_STEPS[0].id,
  );
  const directSignatureSectionRef = useRef<HTMLDivElement | null>(null);
  const handledDirectSignatureRef = useRef(false);
  const scrolledDirectSignatureRef = useRef(false);
  const [isDoc2ProcessModalOpen, setIsDoc2ProcessModalOpen] = useState(false);
  const [isGeneratingDoc2ProcessNotes, setIsGeneratingDoc2ProcessNotes] = useState(false);
  const [doc2ProcessRiskLines, setDoc2ProcessRiskLines] = useState<string[] | null>(null);
  const [doc2ProcessError, setDoc2ProcessError] = useState<string | null>(null);
  const [doc2ProcessNotice, setDoc2ProcessNotice] = useState<string | null>(null);
  const [doc3AnalyzingSceneIds, setDoc3AnalyzingSceneIds] = useState<string[]>([]);
  const [doc5DraftLoading, setDoc5DraftLoading] = useState(false);
  const [doc5DraftError, setDoc5DraftError] = useState<string | null>(null);
  const [doc5DraftNotice, setDoc5DraftNotice] = useState<string | null>(null);
  const [doc7AiLoadingId, setDoc7AiLoadingId] = useState<string | null>(null);
  const [doc7AiErrors, setDoc7AiErrors] = useState<Record<string, string>>({});
  const [activeDoc8PlanId, setActiveDoc8PlanId] = useState<string | null>(null);
  const [doc10MatchingMeasurementId, setDoc10MatchingMeasurementId] = useState<string | null>(null);
  const [doc10MatchErrors, setDoc10MatchErrors] = useState<Record<string, string>>({});
  const [doc11GeneratingId, setDoc11GeneratingId] = useState<string | null>(null);
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [doc11ContentNotice, setDoc11ContentNotice] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [doc11ContentError, setDoc11ContentError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const photoPickerGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const photoPickerCameraInputRef = useRef<HTMLInputElement | null>(null);
  const photoSourceTargetRef = useRef<MobilePhotoSourceTarget | null>(null);
  const [isPhotoSourceModalOpen, setIsPhotoSourceModalOpen] = useState(false);
  const [isPhotoAlbumModalOpen, setIsPhotoAlbumModalOpen] = useState(false);
  const [photoSourceTitle, setPhotoSourceTitle] = useState('사진 가져오기');
  const [photoAlbumQuery, setPhotoAlbumQuery] = useState('');
  const [photoAlbumRows, setPhotoAlbumRows] = useState<PhotoAlbumItem[]>([]);
  const [photoAlbumLoading, setPhotoAlbumLoading] = useState(false);
  const [photoAlbumError, setPhotoAlbumError] = useState<string | null>(null);
  const [photoAlbumSelectingId, setPhotoAlbumSelectingId] = useState<string | null>(null);
  const deferredPhotoAlbumQuery = useDeferredValue(photoAlbumQuery.trim());
  const isDirectSignatureAction = searchParams.get('action') === 'direct-signature';

  useEffect(() => {
    handledDirectSignatureRef.current = false;
    scrolledDirectSignatureRef.current = false;
  }, [isDirectSignatureAction, sessionId]);

  useEffect(() => {
    if (!isDirectSignatureAction || !session) {
      return;
    }

    if (handledDirectSignatureRef.current) {
      return;
    }

    handledDirectSignatureRef.current = true;
    setActiveStep('step2');

    if (session.document2Overview.notificationMethod !== 'direct') {
      screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
        ...current,
        document2Overview: {
          ...current.document2Overview,
          notificationMethod: 'direct',
        },
      }));
    }
  }, [isDirectSignatureAction, screen, session]);

  useEffect(() => {
    if (!isDirectSignatureAction || !session) {
      return;
    }

    if (scrolledDirectSignatureRef.current) {
      return;
    }

    if (
      activeStep !== 'step2' ||
      session.document2Overview.notificationMethod !== 'direct' ||
      !directSignatureSectionRef.current
    ) {
      return;
    }

    scrolledDirectSignatureRef.current = true;
    const timeoutId = window.setTimeout(() => {
      directSignatureSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeStep, isDirectSignatureAction, session]);

  useEffect(() => {
    if (!isPhotoAlbumModalOpen || !displaySession?.siteKey) {
      return;
    }

    let cancelled = false;
    setPhotoAlbumLoading(true);
    setPhotoAlbumError(null);

    void fetchPhotoAlbum({
      all: true,
      query: deferredPhotoAlbumQuery,
      siteId: displaySession.siteKey,
      sortBy: 'capturedAt',
      sortDir: 'desc',
    })
      .then((response) => {
        if (!cancelled) {
          setPhotoAlbumRows(response.rows);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPhotoAlbumRows([]);
          setPhotoAlbumError(
            error instanceof Error ? error.message : '사진첩을 불러오지 못했습니다.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPhotoAlbumLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deferredPhotoAlbumQuery, displaySession?.siteKey, isPhotoAlbumModalOpen]);

  if (!screen.isReady) {
    return <MobileInspectionSessionStandaloneState title="보고서를 준비하는 중입니다." />;
  }

  if (!screen.isAuthenticated) {
    return (
      <LoginPanel
        error={screen.authError}
        onSubmit={screen.login}
        title="모바일 보고서 로그인"
        description="핵심 섹션 중심으로 기술지도 보고서를 이어서 작성합니다."
      />
    );
  }

  if (screen.isLoadingSession && !displaySession) {
    return <MobileInspectionSessionStandaloneState title="보고서를 불러오는 중입니다." />;
  }

  if (!displaySession || !screen.displayProgress) {
    return (
      <MobileInspectionSessionStandaloneState
        title="보고서를 찾을 수 없습니다."
        description="보고서가 아직 동기화되지 않았거나 접근 가능한 범위를 벗어났습니다."
        action={
          <Link href={buildMobileHomeHref()} className="app-button app-button-secondary">
            현장 목록으로 돌아가기
          </Link>
        }
      />
    );
  }

  const hasLoadedSessionPayload = Boolean(session);
  const fallbackDoc2RiskLines = session ? buildDoc2RiskFallback(session.document2Overview) : [];
  const previewDoc2RiskLines = doc2ProcessRiskLines ?? fallbackDoc2RiskLines;
  const doc2ProcessNoteDraft = session
    ? buildDoc2ProcessNotesDraft(session.document2Overview, previewDoc2RiskLines)
    : '';
  const errors = [screen.uploadError, screen.syncError, screen.documentError].filter(
    (message): message is string => Boolean(message),
  );
  const measurementTemplateOptions = [...screen.derivedData.measurementTemplates].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const mobileReportsHref = buildMobileSiteReportsHref(displaySession.siteKey);

  const resetPhotoSourceTarget = () => {
    photoSourceTargetRef.current = null;
  };

  const closePhotoSourceModal = () => {
    setIsPhotoSourceModalOpen(false);
  };

  const closePhotoAlbumModal = () => {
    setIsPhotoAlbumModalOpen(false);
    setPhotoAlbumQuery('');
    setPhotoAlbumError(null);
    setPhotoAlbumSelectingId(null);
    resetPhotoSourceTarget();
  };

  const openPhotoSourcePicker = (target: MobilePhotoSourceTarget) => {
    photoSourceTargetRef.current = target;
    setPhotoSourceTitle(`${target.fieldLabel} 사진 가져오기`);
    setPhotoAlbumError(null);
    setPhotoAlbumQuery('');
    setIsPhotoSourceModalOpen(true);
  };

  const handlePhotoSourceInputChange = async (
    files: FileList | null,
    input: HTMLInputElement | null,
  ) => {
    const file = Array.from(files ?? []).find((item) => item.size > 0);
    if (!file) {
      if (input) {
        input.value = '';
      }
      resetPhotoSourceTarget();
      return;
    }

    const target = photoSourceTargetRef.current;
    if (!target) {
      if (input) {
        input.value = '';
      }
      return;
    }

    try {
      await Promise.resolve(target.onFileSelected(file));
    } finally {
      if (input) {
        input.value = '';
      }
      resetPhotoSourceTarget();
    }
  };

  const openPhotoSourceCamera = () => {
    setIsPhotoSourceModalOpen(false);
    requestAnimationFrame(() => photoPickerCameraInputRef.current?.click());
  };

  const openPhotoSourceGallery = () => {
    setIsPhotoSourceModalOpen(false);
    requestAnimationFrame(() => photoPickerGalleryInputRef.current?.click());
  };

  const openPhotoAlbumPicker = () => {
    setIsPhotoSourceModalOpen(false);
    setPhotoAlbumError(null);
    setPhotoAlbumQuery('');
    setIsPhotoAlbumModalOpen(true);
  };

  const handlePhotoSlotKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    action: () => void,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  /* useEffect(() => {
    if (!isPhotoAlbumModalOpen) {
      return;
    }

    let cancelled = false;
    setPhotoAlbumLoading(true);
    setPhotoAlbumError(null);

    void fetchPhotoAlbum({
      all: true,
      query: deferredPhotoAlbumQuery,
      siteId: displaySession.siteKey,
      sortBy: 'capturedAt',
      sortDir: 'desc',
    })
      .then((response) => {
        if (!cancelled) {
          setPhotoAlbumRows(response.rows);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPhotoAlbumRows([]);
          setPhotoAlbumError(
            error instanceof Error ? error.message : '사진첩을 불러오지 못했습니다.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPhotoAlbumLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deferredPhotoAlbumQuery, displaySession.siteKey, isPhotoAlbumModalOpen]); */

  const handlePhotoAlbumSelect = async (item: PhotoAlbumItem) => {
    const target = photoSourceTargetRef.current;
    if (!target) {
      return;
    }

    try {
      setPhotoAlbumSelectingId(item.id);
      setPhotoAlbumError(null);
      if (target.onAlbumSelected) {
        await Promise.resolve(target.onAlbumSelected(item));
      } else {
        const file = await assetUrlToFile(item.previewUrl, item.fileName || 'photo.jpg');
        await Promise.resolve(target.onFileSelected(file));
      }
      setIsPhotoAlbumModalOpen(false);
      setPhotoAlbumQuery('');
      setPhotoAlbumError(null);
      resetPhotoSourceTarget();
    } catch (error) {
      setPhotoAlbumError(
        error instanceof Error ? error.message : '사진을 반영하는 중 오류가 발생했습니다.',
      );
    } finally {
      setPhotoAlbumSelectingId(null);
    }
  };

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
    if (!session) {
      return;
    }

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
    } catch (error) {
      setDoc2ProcessRiskLines(null);
      setDoc2ProcessError(
        error instanceof Error ? error.message : 'AI 위험요인 생성에 실패했습니다.',
      );
      setDoc2ProcessNotice('AI 생성에 실패해 규칙 기반 위험 요인으로 미리보기를 유지합니다.');
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

  const handleGenerateDoc5Draft = async () => {
    if (!session) {
      return;
    }

    setDoc5DraftError(null);
    setDoc5DraftNotice(
      !screen.isRelationReady
        ? '누적 통계가 아직 준비되지 않아 현재 보고서 기준으로 먼저 총평을 생성합니다.'
        : null,
    );

    setDoc5DraftLoading(true);
    try {
      const text = await generateStructuredDoc5Summary(
        buildDoc5StructuredSummaryPayload(
          session,
          screen.derivedData.currentAccidentEntries,
          screen.derivedData.currentAgentEntries,
          screen.derivedData.cumulativeAccidentEntries,
          screen.derivedData.cumulativeAgentEntries,
        ),
      );

      screen.applyDocumentUpdate('doc5', 'derived', (current) => ({
        ...current,
        document5Summary: {
          ...current.document5Summary,
          summaryText: text,
        },
      }));
    } catch (error) {
      setDoc5DraftError(error instanceof Error ? error.message : '총평 AI 생성에 실패했습니다.');
      setDoc5DraftNotice('AI 생성이 실패해 로컬 규칙 기반 총평으로 대체했습니다.');

      screen.applyDocumentUpdate('doc5', 'derived', (current) => ({
        ...current,
        document5Summary: {
          ...current.document5Summary,
          summaryText: buildLocalDoc5SummaryDraft(
            current,
            screen.derivedData.currentAccidentEntries,
            screen.derivedData.currentAgentEntries,
            screen.derivedData.cumulativeAccidentEntries,
            screen.derivedData.cumulativeAgentEntries,
          ),
        },
      }));
    } finally {
      setDoc5DraftLoading(false);
    }
  };

  const handleDoc7AiRefill = async (findingId: string, photoUrl: string) => {
    if (!photoUrl.trim()) {
      return;
    }

    setDoc7AiLoadingId(findingId);
    setDoc7AiErrors((current) => ({ ...current, [findingId]: '' }));

    try {
      const file = await assetUrlToFile(photoUrl, `finding-${findingId}.jpg`);
      const patch = await buildHazardFindingAutoFill(file);

      screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
        ...current,
        document7Findings: current.document7Findings.map((finding) =>
          finding.id === findingId
            ? applyDoc7ReferenceMaterialMatch(
                {
                  ...finding,
                  ...patch,
                },
                screen.derivedData.doc7ReferenceMaterials,
              )
            : finding,
        ),
      }));
    } catch (error) {
      setDoc7AiErrors((current) => ({
        ...current,
        [findingId]:
          error instanceof Error
            ? error.message
            : 'AI 초안을 만드는 중 문제가 발생했습니다.',
      }));
    } finally {
      setDoc7AiLoadingId((current) => (current === findingId ? null : current));
    }
  };

  const patchDoc11RecordContent = (recordId: string, content: string) => {
    screen.applyDocumentUpdate('doc11', 'derived', (current) => ({
      ...current,
      document11EducationRecords: current.document11EducationRecords.map((record) =>
        record.id === recordId ? { ...record, content } : record,
      ),
    }));
  };

  const handleGenerateDoc11Content = async (recordId: string) => {
    const record = session?.document11EducationRecords.find((item) => item.id === recordId);
    if (!record) {
      return;
    }

    setDoc11ContentError(null);
    setDoc11ContentNotice(null);
    setDoc11GeneratingId(recordId);

    const input = {
      topic: record.topic,
      attendeeCount: record.attendeeCount,
      materialName: record.materialName,
      photoUrl: record.photoUrl,
    };

    try {
      const text = await generateStructuredDoc11EducationContent(input);
      patchDoc11RecordContent(recordId, text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDoc11ContentError({ id: recordId, message });
      patchDoc11RecordContent(recordId, buildLocalDoc11EducationContent(input));
      setDoc11ContentNotice({
        id: recordId,
        message: 'AI 생성이 실패해 규칙 기반 초안으로 대체했습니다.',
      });
    } finally {
      setDoc11GeneratingId(null);
    }
  };

  const updateDoc8ProcessPlan = (planId: string, nextProcessName: string) => {
    const matched = findDoc8ProcessMatch(nextProcessName);

    screen.applyDocumentUpdate('doc8', matched ? 'api' : 'manual', (current) => ({
      ...current,
      document8Plans: current.document8Plans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              processName: nextProcessName,
              hazard: matched?.hazard ?? plan.hazard,
              countermeasure: matched?.countermeasure ?? plan.countermeasure,
              source: matched ? 'api' : 'manual',
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

  const applyDoc10MeasurementPhoto = async (
    measurementId: string,
    photoUrl: string,
    fileForMatch?: File | null,
  ) => {
    setDoc10MatchErrors((current) => ({ ...current, [measurementId]: '' }));

    screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
      ...current,
      document10Measurements: current.document10Measurements.map((measurement) =>
        measurement.id === measurementId ? { ...measurement, photoUrl } : measurement,
      ),
    }));

    if (measurementTemplateOptions.length === 0 || !fileForMatch) {
      return;
    }

    setDoc10MatchingMeasurementId(measurementId);
    try {
      const matchedTemplate = await matchMeasurementTemplateByPhoto(
        fileForMatch,
        measurementTemplateOptions,
      );
      if (!matchedTemplate) {
        return;
      }

      screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
        ...current,
        document10Measurements: current.document10Measurements.map((measurement) =>
          measurement.id === measurementId
            ? {
                ...measurement,
                photoUrl,
                instrumentType: matchedTemplate.instrumentName,
                safetyCriteria: matchedTemplate.safetyCriteria || measurement.safetyCriteria,
              }
            : measurement,
        ),
      }));
    } catch (error) {
      setDoc10MatchErrors((current) => ({
        ...current,
        [measurementId]:
          error instanceof Error ? error.message : '怨꾩륫湲?AI 留ㅼ묶???ㅽ뙣?덉뒿?덈떎.',
      }));
    } finally {
      setDoc10MatchingMeasurementId((current) => (current === measurementId ? null : current));
    }
  };

  const handleDoc10PhotoSelect = async (measurementId: string, file: File) => {
    setDoc10MatchErrors((current) => ({ ...current, [measurementId]: '' }));

    const dataUrl = await screen.withFileData(file);
    if (!dataUrl) {
      return;
    }

    screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
      ...current,
      document10Measurements: current.document10Measurements.map((measurement) =>
        measurement.id === measurementId ? { ...measurement, photoUrl: dataUrl } : measurement,
      ),
    }));

    if (measurementTemplateOptions.length === 0) {
      return;
    }

    setDoc10MatchingMeasurementId(measurementId);
    try {
      const matchedTemplate = await matchMeasurementTemplateByPhoto(file, measurementTemplateOptions);
      if (!matchedTemplate) {
        return;
      }

      screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
        ...current,
        document10Measurements: current.document10Measurements.map((measurement) =>
          measurement.id === measurementId
            ? {
                ...measurement,
                photoUrl: dataUrl,
                instrumentType: matchedTemplate.instrumentName,
                safetyCriteria: matchedTemplate.safetyCriteria || measurement.safetyCriteria,
              }
            : measurement,
        ),
      }));
    } catch (error) {
      setDoc10MatchErrors((current) => ({
        ...current,
        [measurementId]:
          error instanceof Error ? error.message : '계측기 AI 매칭에 실패했습니다.',
      }));
    } finally {
      setDoc10MatchingMeasurementId((current) => (current === measurementId ? null : current));
    }
  };

  return (
    <MobileShell
      fullHeight={true}
      backHref={mobileReportsHref}
      backLabel="보고서 목록"
      currentUserName={screen.currentUserName}
      tabBar={<MobileTabBar tabs={buildSiteTabs(displaySession.siteKey, 'reports')} />}
      onLogout={screen.logout}
      title={getSessionTitle(displaySession)}
      webHref={`/sessions/${encodeURIComponent(sessionId)}`}
    >
      <section className={`${styles.sectionCard} ${styles.mobileSummarySection}`} style={{ marginBottom: 0, borderRadius: '0 0 8px 8px', borderBottom: 'none', flexShrink: 0 }}>
        <div className={`${styles.statGrid} ${hasLoadedSessionPayload ? styles.mobileInspectionSummaryGrid : ''}`}>
          <article className={`${styles.statCard} ${styles.mobileSummaryCard}`}>
            <span className={`${styles.statLabel} ${styles.mobileSummaryLabel}`}>진행률</span>
            <strong className={`${styles.statValue} ${styles.mobileSummaryValue}`}>{screen.displayProgress.percentage}%</strong>
          </article>
          {hasLoadedSessionPayload ? (
            <button
              type="button"
              className={`app-button app-button-secondary ${styles.mobileSummaryTallButton}`}
              onClick={() => setDocumentInfoOpen(true)}
            >
              문서정보
            </button>
          ) : null}
          {hasLoadedSessionPayload ? (
            <div className={styles.mobileSummaryExportStack} style={{ minWidth: 0 }}>
              <button
                type="button"
                className={`app-button app-button-secondary ${styles.mobileSummaryMiniButton}`}
                disabled={screen.isGeneratingHwpx || screen.isGeneratingPdf}
                onClick={() => void screen.generateHwpxDocument()}
              >
                {screen.isGeneratingHwpx ? '한글...' : '한글'}
              </button>
              <button
                type="button"
                className={`app-button app-button-secondary ${styles.mobileSummaryMiniButton}`}
                disabled={screen.isGeneratingHwpx || screen.isGeneratingPdf}
                onClick={() => void screen.generatePdfDocument()}
              >
                {screen.isGeneratingPdf ? 'PDF...' : 'PDF'}
              </button>
            </div>
          ) : null}
          {hasLoadedSessionPayload ? (
            <button
              type="button"
              className={`app-button app-button-secondary ${styles.mobileSummaryTallButton}`}
              disabled={screen.isSaving || screen.isGeneratingHwpx || screen.isGeneratingPdf}
              onClick={() => void screen.saveNow()}
            >
              {screen.isSaving ? '저장 중' : '저장'}
            </button>
          ) : null}
        </div>
      </section>

      {hasLoadedSessionPayload && session ? (
        <div className={tabStyles.layoutWrapper}>
          <div className={tabStyles.tabContainer}>
            {MOBILE_INSPECTION_STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                className={`${tabStyles.tabButton} ${activeStep === step.id ? tabStyles.tabButtonActive : ''}`}
                onClick={() => setActiveStep(step.id)}
              >
                {step.label}
              </button>
            ))}
          </div>

          <div className={tabStyles.stepContent}>
            {/* 2단계: 기술지도 개요 */}
            {activeStep === 'step2' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>기술지도 개요</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>지도일</span>
                        <input
                          className="app-input"
                          type="date"
                          value={session.document2Overview.guidanceDate}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                guidanceDate: value,
                              },
                            }));
                          }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>공정률 (%)</span>
                        <input
                          className="app-input"
                          type="number"
                          value={session.document2Overview.progressRate}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                progressRate: value,
                              },
                            }));
                          }}
                          placeholder="0"
                        />
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>회차</span>
                        <input
                          className="app-input"
                          type="number"
                          min={1}
                          step={1}
                          value={session.document2Overview.visitCount || String(session.reportNumber || '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => {
                              const nextRound = parsePositiveRound(value);
                              if (!nextRound) {
                                return {
                                  ...current,
                                  document2Overview: {
                                    ...current.document2Overview,
                                    visitCount: value,
                                  },
                                };
                              }

                              const preferredDate =
                                current.document2Overview.guidanceDate.trim() ||
                                current.meta.reportDate.trim();
                              const currentTitle = current.meta.reportTitle.trim();
                              const autoTitleCandidates = new Set([
                                buildAutoReportTitle(preferredDate, current.reportNumber),
                                buildAutoReportTitle(current.meta.reportDate.trim(), current.reportNumber),
                                `보고서 ${current.reportNumber}`,
                              ]);

                              return {
                                ...current,
                                reportNumber: nextRound,
                                meta: {
                                  ...current.meta,
                                  reportTitle: autoTitleCandidates.has(currentTitle)
                                    ? buildAutoReportTitle(preferredDate, nextRound)
                                    : current.meta.reportTitle,
                                },
                                document2Overview: {
                                  ...current.document2Overview,
                                  visitCount: String(nextRound),
                                },
                              };
                            });
                          }}
                          placeholder="1"
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>총회차</span>
                        <input
                          className="app-input"
                          value={session.document2Overview.totalVisitCount}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                totalVisitCount: value,
                              },
                            }));
                          }}
                          placeholder="예: 12"
                        />
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                          이전기술지도 이행
                        </span>
                        <select
                          className="app-select"
                          value={session.document2Overview.previousImplementationStatus}
                          onChange={(e) => {
                            const value =
                              e.target.value as typeof session.document2Overview.previousImplementationStatus;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                previousImplementationStatus: value,
                              },
                            }));
                          }}
                        >
                          {PREVIOUS_IMPLEMENTATION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>담당자</span>
                        <input
                          className="app-input"
                          value={session.document2Overview.assignee}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                assignee: value,
                              },
                            }));
                          }}
                          placeholder="담당자 이름"
                        />
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>연락처</span>
                        <input
                          className="app-input"
                          value={session.document2Overview.contact}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                contact: value,
                              },
                            }));
                          }}
                          placeholder="연락처를 입력하세요"
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>통지 방법</span>
                        <select
                          className="app-select"
                          value={session.document2Overview.notificationMethod}
                          onChange={(e) => {
                            const value = e.target.value as
                              | 'direct'
                              | 'registered_mail'
                              | 'email'
                              | 'mobile'
                              | 'other'
                              | '';
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                notificationMethod: value,
                              },
                            }));
                          }}
                        >
                          <option value="">선택</option>
                          {NOTIFICATION_METHOD_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {session.document2Overview.notificationMethod === 'other' ? (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                          기타 통보방법
                        </span>
                        <input
                          className="app-input"
                          value={session.document2Overview.otherNotificationMethod}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                otherNotificationMethod: value,
                              },
                            }));
                          }}
                          placeholder="기타 통보방법 입력"
                        />
                      </label>
                    ) : null}
                    {session.document2Overview.notificationMethod === 'direct' ? (
                      <div
                        ref={directSignatureSectionRef}
                        style={{
                          borderTop: '1px solid #e2e8f0',
                          paddingTop: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                            직접전달 수령자 성함
                          </span>
                          <input
                            className="app-input"
                            value={session.document2Overview.notificationRecipientName}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                                ...current,
                                document2Overview: {
                                  ...current.document2Overview,
                                  notificationRecipientName: value,
                                },
                              }));
                            }}
                            placeholder="수령자 성함 입력"
                          />
                        </label>
                        <SignaturePad
                          label="수령자 서명"
                          value={session.document2Overview.notificationRecipientSignature}
                          onChange={(value) => {
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                notificationRecipientSignature: value,
                              },
                            }));
                          }}
                        />
                      </div>
                    ) : null}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                        재해 및 공정 특이사항
                      </div>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                          최근 사고 발생 여부
                        </span>
                        <select
                          className="app-select"
                          value={session.document2Overview.accidentOccurred || 'no'}
                          onChange={(e) => {
                            const value = e.target.value as 'yes' | 'no';
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                accidentOccurred: value,
                              },
                            }));
                          }}
                        >
                          {ACCIDENT_OCCURRENCE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {session.document2Overview.accidentOccurred === 'yes' ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                최근 사고일
                              </span>
                              <input
                                className="app-input"
                                type="date"
                                value={session.document2Overview.recentAccidentDate}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                                    ...current,
                                    document2Overview: {
                                      ...current.document2Overview,
                                      recentAccidentDate: value,
                                    },
                                  }));
                                }}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                사고 유형
                              </span>
                              <input
                                className="app-input"
                                value={session.document2Overview.accidentType}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                                    ...current,
                                    document2Overview: {
                                      ...current.document2Overview,
                                      accidentType: value,
                                    },
                                  }));
                                }}
                                placeholder="예: 떨어짐"
                              />
                            </label>
                          </div>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                              사고 개요
                            </span>
                            <textarea
                              className="app-input"
                              value={session.document2Overview.accidentSummary}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                                  ...current,
                                  document2Overview: {
                                    ...current.document2Overview,
                                    accidentSummary: value,
                                  },
                                }));
                              }}
                              placeholder="사고 내용을 입력하세요"
                              style={{ width: '100%', minHeight: '72px', resize: 'vertical' }}
                            />
                          </label>
                        </>
                      ) : null}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                          진행공정 및 특이사항
                        </div>
                        <button
                          type="button"
                          className={workspaceStyles.doc5SummaryDraftBtn}
                          style={{ flexShrink: 0 }}
                          onClick={() => setIsDoc2ProcessModalOpen(true)}
                        >
                          자동생성
                        </button>
                      </div>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                          본문
                        </span>
                        <textarea
                          className="app-input"
                          value={session.document2Overview.processAndNotes}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                processAndNotes: value,
                              },
                            }));
                          }}
                          placeholder="공정 특이사항을 입력하세요"
                          style={{ width: '100%', minHeight: '96px', resize: 'vertical' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3단계: 현장 전경 */}
            {activeStep === 'step3' && (
              <MobileInspectionSessionStep3
                applyDoc3ScenePhoto={applyDoc3ScenePhoto}
                doc3AnalyzingSceneIds={doc3AnalyzingSceneIds}
                openPhotoSourcePicker={openPhotoSourcePicker}
                screen={screen}
                session={session}
              />
            )}

            {/* 4단계: 이전 기술지도 사항 */}
            {activeStep === 'step4' && (
              <MobileInspectionSessionStep4
                openPhotoSourcePicker={openPhotoSourcePicker}
                screen={screen}
                session={session}
              />
            )}

            {/* 5단계: 총평 */}
            {activeStep === 'step5' && (
              <MobileInspectionSessionStep5
                doc5DraftError={doc5DraftError}
                doc5DraftLoading={doc5DraftLoading}
                doc5DraftNotice={doc5DraftNotice}
                handleGenerateDoc5Draft={handleGenerateDoc5Draft}
                screen={screen}
                session={session}
              />
            )}

            {/* 6단계: 12대 사망사고 기인물 */}
            {activeStep === 'step6' && (
              <MobileInspectionSessionStep6 screen={screen} session={session} />
            )}

            {/* 7단계: 현존 유해·위험요인 세부 지적 */}
            {activeStep === 'step7' && (
              <MobileInspectionSessionStep7
                doc7AiErrors={doc7AiErrors}
                doc7AiLoadingId={doc7AiLoadingId}
                handleDoc7AiRefill={handleDoc7AiRefill}
                openPhotoSourcePicker={openPhotoSourcePicker}
                screen={screen}
                session={session}
              />
            )}

            {/* 8단계: 향후 진행공정 */}
            {activeStep === 'step8' && (
              <MobileInspectionSessionStep8
                activeDoc8PlanId={activeDoc8PlanId}
                handleDoc8ProcessBlur={handleDoc8ProcessBlur}
                screen={screen}
                session={session}
                setActiveDoc8PlanId={setActiveDoc8PlanId}
                updateDoc8ProcessPlan={updateDoc8ProcessPlan}
              />
            )}

            {/* 9단계: 위험성평가 / TBM */}
            {activeStep === 'step9' && (
              <MobileInspectionSessionStep9 screen={screen} session={session} />
            )}

            {/* 10단계: 계측점검 */}
            {activeStep === 'step10' && (
              <MobileInspectionSessionStep10
                applyDoc10MeasurementPhoto={applyDoc10MeasurementPhoto}
                doc10MatchErrors={doc10MatchErrors}
                doc10MatchingMeasurementId={doc10MatchingMeasurementId}
                handleDoc10PhotoSelect={handleDoc10PhotoSelect}
                measurementTemplateOptions={measurementTemplateOptions}
                openPhotoSourcePicker={openPhotoSourcePicker}
                screen={screen}
                session={session}
              />
            )}

            {/* 11단계: 안전교육 */}
            {activeStep === 'step11' && (
              <MobileInspectionSessionStep11
                doc11ContentError={doc11ContentError}
                doc11ContentNotice={doc11ContentNotice}
                doc11GeneratingId={doc11GeneratingId}
                handleGenerateDoc11Content={handleGenerateDoc11Content}
                openPhotoSourcePicker={openPhotoSourcePicker}
                screen={screen}
                session={session}
              />
            )}

            {/* 12단계: 활동 실적 */}
            {activeStep === 'step12' && (
              <MobileInspectionSessionStep12
                handlePhotoSlotKeyDown={handlePhotoSlotKeyDown}
                openPhotoSourcePicker={openPhotoSourcePicker}
                screen={screen}
                session={session}
              />
            )}
          </div>
        </div>
      ) : (
        <p className={styles.inlineNotice} style={{ margin: '16px' }}>보고서 본문을 동기화하는 중입니다.</p>
      )}

      <MobileInspectionSessionModals
        applyDoc2ProcessNotesDraft={applyDoc2ProcessNotesDraft}
        closePhotoAlbumModal={closePhotoAlbumModal}
        closePhotoSourceModal={closePhotoSourceModal}
        doc2ProcessError={doc2ProcessError}
        doc2ProcessNotice={doc2ProcessNotice}
        doc2ProcessNoteDraft={doc2ProcessNoteDraft}
        documentInfoOpen={documentInfoOpen}
        handleDoc2ProcessFieldChange={handleDoc2ProcessFieldChange}
        handleGenerateDoc2ProcessNotes={handleGenerateDoc2ProcessNotes}
        handlePhotoAlbumSelect={handlePhotoAlbumSelect}
        handlePhotoSourceInputChange={handlePhotoSourceInputChange}
        hasLoadedSessionPayload={hasLoadedSessionPayload}
        isDoc2ProcessModalOpen={isDoc2ProcessModalOpen}
        isGeneratingDoc2ProcessNotes={isGeneratingDoc2ProcessNotes}
        isPhotoAlbumModalOpen={isPhotoAlbumModalOpen}
        isPhotoSourceModalOpen={isPhotoSourceModalOpen}
        openPhotoAlbumPicker={openPhotoAlbumPicker}
        openPhotoSourceCamera={openPhotoSourceCamera}
        openPhotoSourceGallery={openPhotoSourceGallery}
        photoAlbumError={photoAlbumError}
        photoAlbumLoading={photoAlbumLoading}
        photoAlbumQuery={photoAlbumQuery}
        photoAlbumRows={photoAlbumRows}
        photoAlbumSelectingId={photoAlbumSelectingId}
        photoPickerCameraInputRef={photoPickerCameraInputRef}
        photoPickerGalleryInputRef={photoPickerGalleryInputRef}
        photoSourceTitle={photoSourceTitle}
        resetPhotoSourceTarget={resetPhotoSourceTarget}
        screen={screen}
        session={session}
        setDocumentInfoOpen={setDocumentInfoOpen}
        setIsDoc2ProcessModalOpen={setIsDoc2ProcessModalOpen}
        setPhotoAlbumQuery={setPhotoAlbumQuery}
      />

      {errors.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          {errors.map((message) => (
            <p key={message} className={styles.errorNotice}>
              {message}
            </p>
          ))}
        </div>
      )}
    </MobileShell>
  );
}
