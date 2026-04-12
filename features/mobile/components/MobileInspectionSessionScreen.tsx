'use client';

import { useDeferredValue, useEffect, useRef, useState } from 'react';
import type { FocusEvent, ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import LoginPanel from '@/components/auth/LoginPanel';
import AppModal from '@/components/ui/AppModal';
import SignaturePad from '@/components/ui/SignaturePad';
import {
  FOLLOW_UP_RESULT_OPTIONS,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { FIXED_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import {
  ACCIDENT_OCCURRENCE_OPTIONS,
  CHECKLIST_RATING_OPTIONS,
  FUTURE_PROCESS_LIBRARY,
  NOTIFICATION_METHOD_OPTIONS,
  PREVIOUS_IMPLEMENTATION_OPTIONS,
  RISK_TRI_LEVEL_OPTIONS,
} from '@/components/session/workspace/constants';
import {
  ACCIDENT_TYPE_OPTIONS,
  CAUSATIVE_AGENT_LABELS,
  CAUSATIVE_AGENT_OPTIONS,
} from '@/constants/inspectionSession/doc7Catalog';
import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import {
  assetUrlToFile,
  buildHazardFindingAutoFill,
} from '@/components/session/workspace/doc7Ai';
import {
  createCurrentHazardFinding,
  createFutureProcessRiskPlan,
  createMeasurementCheckItem,
} from '@/constants/inspectionSession/itemFactory';
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
import { ChartCard } from '@/components/session/workspace/widgets';
import {
  buildMobileHomeHref,
  buildMobileSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { buildSiteTabs } from '../lib/buildSiteTabs';
import styles from './MobileShell.module.css';
import tabStyles from './MobileStepTabs.module.css';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';

interface MobileInspectionSessionScreenProps {
  sessionId: string;
}

const STEPS = [
  { id: 'step2', label: '개요' },
  { id: 'step3', label: '현장 전경' },
  { id: 'step4', label: '이전 기술지도' },
  { id: 'step5', label: '총평' },
  { id: 'step6', label: '사망 기인물' },
  { id: 'step7', label: '위험요인 지적' },
  { id: 'step8', label: '향후 진행공정' },
  { id: 'step9', label: '위험성평가 / TBM' },
  { id: 'step10', label: '계측점검' },
  { id: 'step11', label: '안전교육' },
  { id: 'step12', label: '활동 실적' },
];

interface Doc2ProcessNotesResponse {
  riskLines?: string[];
  error?: string;
}

interface MobilePhotoSourceTarget {
  fieldLabel: string;
  onAlbumSelected?: (item: PhotoAlbumItem) => Promise<void> | void;
  onFileSelected: (file: File) => Promise<void> | void;
}

const MAX_DOC8_RECOMMENDATIONS = 6;

function getMobileDoc3SlotLabel(index: number) {
  return index < FIXED_SCENE_COUNT
    ? `현장 ${index + 1}`
    : `공정 ${index - FIXED_SCENE_COUNT + 1}`;
}

function getMobileDoc3DisplayTitle(index: number, title: string | null | undefined) {
  const trimmed = title?.trim() ?? '';
  if (!trimmed) {
    return getMobileDoc3SlotLabel(index);
  }

  const legacyTitle =
    index < FIXED_SCENE_COUNT ? getFixedSceneTitle(index) : getExtraSceneTitle(index);

  return trimmed === legacyTitle ? getMobileDoc3SlotLabel(index) : trimmed;
}

function parsePositiveRound(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildAutoReportTitle(reportDate: string, reportNumber: number) {
  return reportDate ? `${reportDate} 보고서 ${reportNumber}` : `보고서 ${reportNumber}`;
}

function formatMobilePhotoAlbumDate(value: string) {
  if (!value?.trim()) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

async function generateDoc2RiskLines(input: {
  processWorkContent: string;
  processWorkerCount: string;
  processEquipment: string;
  processTools: string;
  processHazardousMaterials: string;
}) {
  const response = await fetch('/api/ai/doc2-process-notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as Doc2ProcessNotesResponse;
  if (!response.ok) {
    throw new Error(payload.error || 'AI 위험요인 생성에 실패했습니다.');
  }

  return Array.isArray(payload.riskLines) ? payload.riskLines.filter(Boolean).slice(0, 2) : [];
}

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

  const payload = (await response.json().catch(() => ({}))) as { title?: string };
  return payload.title?.trim() || '';
}

async function generateStructuredDoc5Summary(
  payload: ReturnType<typeof buildDoc5StructuredSummaryPayload>,
) {
  const response = await fetch('/api/ai/doc5-structured-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };

  if (!response.ok || !result.text?.trim()) {
    throw new Error(result.error?.trim() || '총평 AI 생성에 실패했습니다.');
  }

  return result.text.trim();
}

function normalizeDoc8ProcessName(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

function findDoc8ProcessMatch(value: string) {
  const normalizedValue = normalizeDoc8ProcessName(value);
  if (!normalizedValue) {
    return null;
  }

  return (
    FUTURE_PROCESS_LIBRARY.find(
      (libraryItem) => normalizeDoc8ProcessName(libraryItem.processName) === normalizedValue,
    ) ?? null
  );
}

function getDoc8ProcessRecommendations(value: string) {
  const normalizedValue = normalizeDoc8ProcessName(value);
  const matchingItems = normalizedValue
    ? FUTURE_PROCESS_LIBRARY.filter((libraryItem) =>
        normalizeDoc8ProcessName(libraryItem.processName).includes(normalizedValue),
      )
    : FUTURE_PROCESS_LIBRARY;

  return matchingItems.slice(0, MAX_DOC8_RECOMMENDATIONS);
}

function StandaloneState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <main className="app-page">
      <div className={styles.pageShell}>
        <div className={styles.content}>
          <section className={styles.stateCard}>
            <div className={styles.sectionTitleWrap}>
              <span className={styles.sectionEyebrow}>모바일 보고서</span>
              <h1 className={styles.sectionTitle}>{title}</h1>
            </div>
            {description ? <p className={styles.inlineNotice}>{description}</p> : null}
            {action}
          </section>
        </div>
      </div>
    </main>
  );
}

export function MobileInspectionSessionScreen({
  sessionId,
}: MobileInspectionSessionScreenProps) {
  const searchParams = useSearchParams();
  const screen = useInspectionSessionScreen(sessionId);
  const displaySession = screen.displaySession;
  const session = screen.sectionSession;
  const [activeStep, setActiveStep] = useState(STEPS[0].id);
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
    return <StandaloneState title="보고서를 준비하는 중입니다." />;
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
    return <StandaloneState title="보고서를 불러오는 중입니다." />;
  }

  if (!displaySession || !screen.displayProgress) {
    return (
      <StandaloneState
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

  const handleDoc3SceneUpload = async (sceneId: string, index: number, file: File) => {
    const dataUrl = await screen.withFileData(file);
    if (!dataUrl) {
      return;
    }

    await applyDoc3ScenePhoto(sceneId, index, dataUrl, file);
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
            {STEPS.map((step) => (
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
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>현장 전경 및 진행공정</h2>
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
                                    s.id === scene.id ? { ...s, photoUrl: '' } : s
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
                        >
                          {scene.photoUrl ? (
                            <img src={scene.photoUrl} alt="현장 사진" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px' }}>
                              터치하여 사진 선택
                            </div>
                          )}
                        </button>
                        {index >= FIXED_SCENE_COUNT ? (
                          <input
                            className="app-input"
                            value={getMobileDoc3DisplayTitle(index, scene.title)}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
                                ...current,
                                document3Scenes: current.document3Scenes.map((s) =>
                                  s.id === scene.id ? { ...s, title: value } : s
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
            )}

            {/* 4단계: 이전 기술지도 사항 */}
            {activeStep === 'step4' && (
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
                        <article key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>{item.location || '위치 미지정'}</div>
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
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc4', 'manual', (current) => ({
                                    ...current,
                                    document4FollowUps: current.document4FollowUps.map((f) =>
                                      f.id === item.id ? { ...f, result: value } : f
                                    ),
                                  }));
                                }}
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
                              <input
                                className="app-input"
                                value={item.guidanceDate || '미기록'}
                                readOnly
                              />
                            </label>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>이전 지적 사진</div>
                              {item.beforePhotoUrl ? (
                                <img src={item.beforePhotoUrl} alt="지적 사진" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f8fafc' }} />
                              ) : (
                                <div style={{ width: '100%', height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#94a3b8' }}>사진 없음</div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>개선 후 사진</div>
                              <button
                                type="button"
                                style={{ display: 'block', width: '100%', height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                                onClick={() =>
                                  openPhotoSourcePicker({
                                    fieldLabel: '개선 후',
                                    onAlbumSelected: (albumItem) => {
                                      screen.applyDocumentUpdate('doc4', 'manual', (current) => ({
                                        ...current,
                                        document4FollowUps: current.document4FollowUps.map((f) =>
                                          f.id === item.id ? { ...f, afterPhotoUrl: albumItem.previewUrl } : f,
                                        ),
                                      }));
                                    },
                                    onFileSelected: async (file) => {
                                      await screen.withFileData(file, (value) => {
                                        screen.applyDocumentUpdate('doc4', 'manual', (current) => ({
                                          ...current,
                                          document4FollowUps: current.document4FollowUps.map((f) =>
                                            f.id === item.id ? { ...f, afterPhotoUrl: value } : f,
                                          ),
                                        }));
                                      });
                                    },
                                  })
                                }
                              >
                                {item.afterPhotoUrl ? (
                                  <img src={item.afterPhotoUrl} alt="개선 사진" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
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
            )}

            {/* 5단계: 총평 */}
            {activeStep === 'step5' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>기술지도 총평</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div className={workspaceStyles.doc5StatsGrid} style={{ marginBottom: '12px' }}>
                    <ChartCard
                      title="사고유형 통계"
                      entries={screen.derivedData.currentAccidentEntries}
                      variant="erp"
                    />
                    <ChartCard
                      title="기인물 통계"
                      entries={screen.derivedData.currentAgentEntries}
                      variant="erp"
                    />
                    {screen.isRelationReady ? (
                      <>
                        <ChartCard
                          title="사고유형 누적"
                          entries={screen.derivedData.cumulativeAccidentEntries}
                          variant="erp"
                        />
                        <ChartCard
                          title="기인물 누적"
                          entries={screen.derivedData.cumulativeAgentEntries}
                          variant="erp"
                        />
                      </>
                    ) : (
                      <>
                        <article className={workspaceStyles.doc5ChartPanel}>
                          <h3 className={workspaceStyles.doc5ChartPanelTitle}>사고유형 누적</h3>
                          <div className={workspaceStyles.doc5ChartPanelBody}>
                            <div className={styles.inlineNotice} style={{ margin: 0, textAlign: 'center' }}>
                              {screen.isRelationHydrating
                                ? '누적 통계를 계산하는 중입니다.'
                                : screen.relationStatus === 'error'
                                  ? '누적 통계를 아직 불러오지 못했습니다.'
                                  : '이전 보고서가 없어 누적 통계가 없습니다.'}
                            </div>
                          </div>
                        </article>
                        <article className={workspaceStyles.doc5ChartPanel}>
                          <h3 className={workspaceStyles.doc5ChartPanelTitle}>기인물 누적</h3>
                          <div className={workspaceStyles.doc5ChartPanelBody}>
                            <div className={styles.inlineNotice} style={{ margin: 0, textAlign: 'center' }}>
                              {screen.isRelationHydrating
                                ? '누적 통계를 계산하는 중입니다.'
                                : screen.relationStatus === 'error'
                                  ? '누적 통계를 아직 불러오지 못했습니다.'
                                  : '이전 보고서가 없어 누적 통계가 없습니다.'}
                            </div>
                          </div>
                        </article>
                      </>
                    )}
                  </div>
                  <div className={styles.mobileEditorFieldStack}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                        총평 본문
                      </div>
                      <button
                        type="button"
                        className={workspaceStyles.doc5SummaryDraftBtn}
                        disabled={doc5DraftLoading}
                        onClick={() => void handleGenerateDoc5Draft()}
                      >
                        총평 AI 생성
                      </button>
                    </div>
                    {doc5DraftLoading ? (
                      <span className={styles.inlineNotice} role="status" aria-live="polite">
                        AI가 총평을 정리하고 있습니다.
                      </span>
                    ) : null}
                    {doc5DraftError ? (
                      <p className={styles.errorNotice} style={{ margin: 0 }}>
                        {doc5DraftError}
                      </p>
                    ) : null}
                    {doc5DraftNotice ? (
                      <p className={styles.inlineNotice} style={{ margin: 0 }}>
                        {doc5DraftNotice}
                      </p>
                    ) : null}
                    {screen.isRelationHydrating ? (
                      <p className={styles.inlineNotice} style={{ margin: 0 }}>
                        누적 통계를 계산하는 중입니다. 지금 생성하면 현재 보고서 기준으로 먼저 작성합니다.
                      </p>
                    ) : null}
                    {screen.relationStatus === 'error' ? (
                      <p className={styles.errorNotice} style={{ margin: 0 }}>
                        누적 통계를 아직 불러오지 못했습니다. 총평은 현재 보고서 기준으로만 생성됩니다.
                      </p>
                    ) : null}
                    <textarea
                      className="app-input"
                      value={session.document5Summary.summaryText}
                      onChange={(e) => {
                        const value = e.target.value;
                        screen.applyDocumentUpdate('doc5', 'manual', (current) => ({
                          ...current,
                          document5Summary: {
                            ...current.document5Summary,
                            summaryText: value,
                          },
                        }));
                      }}
                      placeholder="총평을 입력하세요"
                      style={{ width: '100%', minHeight: '200px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* 6단계: 12대 사망사고 기인물 */}
            {activeStep === 'step6' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>12대 사망사고 기인물</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div className={styles.doc6FlatList}>
                    {CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
                      section.rows.flatMap((row) => [row.left, row.right]),
                    ).map((measure) => {
                      const currentMeasure = session.document6Measures.find(
                        (item) => item.key === measure.key,
                      );

                      return (
                        <label key={measure.key} className={styles.doc6FlatItem}>
                          <span className={styles.doc6FlatLabel}>
                            {measure.number}. {measure.label}
                          </span>
                          <span className={styles.doc6FlatCheck}>
                            <input
                              type="checkbox"
                              className="app-checkbox"
                              checked={currentMeasure?.checked ?? false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                screen.applyDocumentUpdate('doc6', 'manual', (current) => ({
                                  ...current,
                                  document6Measures: current.document6Measures.map((m) =>
                                    m.key === measure.key ? { ...m, checked } : m,
                                  ),
                                }));
                              }}
                              aria-label={`${measure.label} 해당`}
                            />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* 7단계: 현존 유해·위험요인 세부 지적 */}
            {activeStep === 'step7' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>현존 유해·위험요인 세부 지적</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document7Findings.map((finding, index) => (
                      <article key={finding.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>
                              지적 사항 {index + 1}
                            </span>
                            <button
                              type="button"
                              className={workspaceStyles.doc5SummaryDraftBtn}
                              disabled={!finding.photoUrl || doc7AiLoadingId === finding.id}
                              onClick={() => void handleDoc7AiRefill(finding.id, finding.photoUrl || '')}
                            >
                              {doc7AiLoadingId === finding.id ? 'AI 채우는 중' : 'AI 다시 채우기'}
                            </button>
                          </div>
                          <button
                            type="button"
                            className={styles.mobileEditorCardAction}
                            onClick={() => {
                              screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                ...current,
                                document7Findings: current.document7Findings.filter((f) => f.id !== finding.id),
                              }));
                            }}
                          >
                            삭제
                          </button>
                        </div>
                        <div className={styles.mobileEditorFieldStack}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              style={{ flex: 1, height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                              onClick={() =>
                                openPhotoSourcePicker({
                                  fieldLabel: '지적 사진 1',
                                  onAlbumSelected: (albumItem) => {
                                    screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                      ...current,
                                      document7Findings: current.document7Findings.map((f) =>
                                        f.id === finding.id ? { ...f, photoUrl: albumItem.previewUrl } : f,
                                      ),
                                    }));
                                  },
                                  onFileSelected: async (file) => {
                                    await screen.withFileData(file, (value) => {
                                      screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                        ...current,
                                        document7Findings: current.document7Findings.map((f) =>
                                          f.id === finding.id ? { ...f, photoUrl: value } : f,
                                        ),
                                      }));
                                    });
                                  },
                                })
                              }
                            >
                              {finding.photoUrl ? (
                                <img src={finding.photoUrl} alt="지적 사진 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                                  사진 1 추가
                                </div>
                              )}
                            </button>
                            <button
                              type="button"
                              style={{ flex: 1, height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                              onClick={() =>
                                openPhotoSourcePicker({
                                  fieldLabel: '지적 사진 2',
                                  onAlbumSelected: (albumItem) => {
                                    screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                      ...current,
                                      document7Findings: current.document7Findings.map((f) =>
                                        f.id === finding.id ? { ...f, photoUrl2: albumItem.previewUrl } : f,
                                      ),
                                    }));
                                  },
                                  onFileSelected: async (file) => {
                                    await screen.withFileData(file, (value) => {
                                      screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                        ...current,
                                        document7Findings: current.document7Findings.map((f) =>
                                          f.id === finding.id ? { ...f, photoUrl2: value } : f,
                                        ),
                                      }));
                                    });
                                  },
                                })
                              }
                            >
                              {finding.photoUrl2 ? (
                                <img src={finding.photoUrl2} alt="지적 사진 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                                  사진 2 추가
                                </div>
                              )}
                            </button>
                          </div>
                          {doc7AiErrors[finding.id] ? (
                            <p className={styles.errorNotice} style={{ margin: 0 }}>
                              {doc7AiErrors[finding.id]}
                            </p>
                          ) : null}
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"\uc704\uce58"}</span>
                            <input
                              className="app-input"
                              value={finding.location}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id ? { ...f, location: value } : f
                                  ),
                                }));
                              }}
                              placeholder={"\uc704\uce58 (\uc608: A\ub3d9 2\uce35)"}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: '8px',
                            }}
                          >
                            <div className={styles.mobileEditorFieldGroup}>
                              <span className={styles.mobileEditorFieldLabel}>{"\uc0ac\uace0\uc720\ud615"}</span>
                              <select
                                className="app-select"
                                value={finding.accidentType}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                    ...current,
                                    document7Findings: current.document7Findings.map((f) =>
                                      f.id === finding.id ? { ...f, accidentType: value } : f
                                    ),
                                  }));
                                }}
                              >
                                <option value="">{"\uc120\ud0dd"}</option>
                                {ACCIDENT_TYPE_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className={styles.mobileEditorFieldGroup}>
                              <span className={styles.mobileEditorFieldLabel}>{"\uc704\ud5d8\ub3c4"}</span>
                              <select
                                className="app-select"
                                value={finding.riskLevel}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                    ...current,
                                    document7Findings: current.document7Findings.map((f) =>
                                      f.id === finding.id ? { ...f, riskLevel: value } : f
                                    ),
                                  }));
                                }}
                              >
                                {RISK_TRI_LEVEL_OPTIONS.map((option) => (
                                  <option key={option.value || 'empty'} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"\uae30\uc778\ubb3c"}</span>
                            <select
                              className="app-select"
                              value={finding.causativeAgentKey}
                              onChange={(e) => {
                                const value = e.target.value as typeof finding.causativeAgentKey;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id ? { ...f, causativeAgentKey: value } : f
                                  ),
                                }));
                              }}
                            >
                              <option value="">{"\uc120\ud0dd"}</option>
                              {CAUSATIVE_AGENT_OPTIONS.map((option) => (
                                <option key={option.key} value={option.key}>
                                  {CAUSATIVE_AGENT_LABELS[option.key] ?? option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"\uc720\ud574\uc704\ud5d8\uc694\uc778"}</span>
                            <textarea
                              className={`app-input ${styles.mobileEditorTextareaCompact}`}
                              value={finding.hazardDescription || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id ? { ...f, hazardDescription: value } : f
                                  ),
                                }));
                              }}
                              placeholder={"\uc720\ud574\uc704\ud5d8\uc694\uc778 \uc124\uba85"}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"\uac1c\uc120\uc694\uccad\uc0ac\ud56d"}</span>
                            <textarea
                              className={`app-input ${styles.mobileEditorTextareaCompact}`}
                              value={finding.improvementRequest || finding.improvementPlan || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id
                                      ? {
                                          ...f,
                                          improvementPlan: value,
                                          improvementRequest: value,
                                        }
                                      : f
                                  ),
                                }));
                              }}
                              placeholder={"\uac1c\uc120\uc694\uccad\uc0ac\ud56d"}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>
                              {"\uc911\uc810\uad00\ub9ac \uc704\ud5d8\uc694\uc778 \ubc0f \uad00\ub9ac\ubc29\uc548"}
                            </span>
                            <textarea
                              className={`app-input ${styles.mobileEditorTextareaCompact}`}
                              value={finding.emphasis}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id ? { ...f, emphasis: value } : f
                                  ),
                                }));
                              }}
                              placeholder={"\uc911\uc810\uad00\ub9ac \uc704\ud5d8\uc694\uc778 \ubc0f \uad00\ub9ac\ubc29\uc548"}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"\uad00\ub828 \ubc95\ub839"}</span>
                            <input
                              className="app-input"
                              value={finding.legalReferenceTitle}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id
                                      ? {
                                          ...f,
                                          legalReferenceId: '',
                                          legalReferenceTitle: value,
                                          referenceLawTitles: value
                                            .split(/[\n,]+/)
                                            .map((entry) => entry.trim())
                                            .filter(Boolean),
                                        }
                                      : f
                                  ),
                                }));
                              }}
                              placeholder={"\uad00\ub828 \ubc95\ub839"}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                          ...current,
                          document7Findings: [
                            ...current.document7Findings,
                            createCurrentHazardFinding({ inspector: current.meta.drafter }),
                          ],
                        }));
                      }}
                    >
                      + 지적 사항 추가
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 8단계: 향후 진행공정 */}
            {activeStep === 'step8' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>향후 진행공정 위험요인</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document8Plans.map((plan, index) => (
                      <article key={plan.id} className={styles.mobileEditorCard}>
                        <div className={styles.mobileEditorCardHeader}>
                          <span className={styles.mobileEditorCardTitle}>{"진행공정"} {index + 1}</span>
                          <button
                            type="button"
                            className={styles.mobileEditorCardAction}
                            onClick={() => {
                              screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                                ...current,
                                document8Plans: current.document8Plans.filter((p) => p.id !== plan.id),
                              }));
                            }}
                          >
                            {"삭제"}
                          </button>
                        </div>
                        <div className={styles.mobileEditorFieldStack}>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"공정명"}</span>
                            <div
                              className={styles.mobileDoc8ProcessStack}
                              onBlur={(event) => handleDoc8ProcessBlur(plan.id, event)}
                            >
                              <input
                                autoComplete="off"
                                role="combobox"
                                aria-autocomplete="list"
                                aria-controls={`mobile-doc8-recommendations-${plan.id}`}
                                aria-expanded={activeDoc8PlanId === plan.id}
                                aria-haspopup="listbox"
                                className="app-input"
                                value={plan.processName}
                                onFocus={() => setActiveDoc8PlanId(plan.id)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Escape') {
                                    setActiveDoc8PlanId((current) =>
                                      current === plan.id ? null : current,
                                    );
                                  }
                                }}
                                onChange={(e) => {
                                  setActiveDoc8PlanId(plan.id);
                                  updateDoc8ProcessPlan(plan.id, e.target.value);
                                }}
                                placeholder={"공정명 (예: 철골 자재 반입)"}
                                style={{ width: '100%' }}
                              />
                              {activeDoc8PlanId === plan.id &&
                              getDoc8ProcessRecommendations(plan.processName).length > 0 ? (
                                <div
                                  id={`mobile-doc8-recommendations-${plan.id}`}
                                  className={workspaceStyles.doc8RecommendationList}
                                  role="listbox"
                                >
                                  {getDoc8ProcessRecommendations(plan.processName).map((libraryItem) => {
                                    const isSelected = libraryItem.processName === plan.processName;

                                    return (
                                      <button
                                        key={libraryItem.processName}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        className={`${workspaceStyles.doc8RecommendationButton} ${
                                          isSelected
                                            ? workspaceStyles.doc8RecommendationButtonActive
                                            : ''
                                        }`}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => {
                                          updateDoc8ProcessPlan(plan.id, libraryItem.processName);
                                          setActiveDoc8PlanId(null);
                                        }}
                                      >
                                        {libraryItem.processName}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"위험요인"}</span>
                            <textarea
                              className={`app-input ${styles.mobileEditorTextareaCompact}`}
                              value={plan.hazard}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                                  ...current,
                                  document8Plans: current.document8Plans.map((p) =>
                                    p.id === plan.id ? { ...p, hazard: value } : p
                                  ),
                                }));
                              }}
                              placeholder={"위험요인"}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"안전대책"}</span>
                            <textarea
                              className={`app-input ${styles.mobileEditorTextareaCompact}`}
                              value={plan.countermeasure}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                                  ...current,
                                  document8Plans: current.document8Plans.map((p) =>
                                    p.id === plan.id ? { ...p, countermeasure: value } : p
                                  ),
                                }));
                              }}
                              placeholder={"안전대책"}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                          ...current,
                          document8Plans: [
                            ...current.document8Plans,
                            createFutureProcessRiskPlan(),
                          ],
                        }));
                      }}
                    >
                      + 공정 추가
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 9단계: 위험성평가 / TBM */}
            {activeStep === 'step9' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>위험성평가 / TBM</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* TBM */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>TBM 체크리스트</div>
                      {session.document9SafetyChecks.tbm.map((item) => (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', borderBottom: '1px solid rgba(215, 224, 235, 0.72)' }}>
                          <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#0f172a' }}>{item.prompt}</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 88px', gap: '8px', alignItems: 'center' }}>
                            <input
                              className="app-input"
                              value={item.note}
                              onChange={(e) => {
                                const note = e.target.value;
                                screen.applyDocumentUpdate('doc9', 'manual', (current) => ({
                                  ...current,
                                  document9SafetyChecks: {
                                    ...current.document9SafetyChecks,
                                    tbm: current.document9SafetyChecks.tbm.map((q) =>
                                      q.id === item.id ? { ...q, note } : q
                                    ),
                                  },
                                }));
                              }}
                              placeholder="메모"
                            />
                            <select
                              className="app-select"
                              value={item.rating}
                              onChange={(e) => {
                                const rating = e.target.value as 'good' | 'average' | 'poor' | '';
                                screen.applyDocumentUpdate('doc9', 'manual', (current) => ({
                                  ...current,
                                  document9SafetyChecks: {
                                    ...current.document9SafetyChecks,
                                    tbm: current.document9SafetyChecks.tbm.map((q) =>
                                      q.id === item.id ? { ...q, rating } : q
                                    ),
                                  },
                                }));
                              }}
                              style={{ width: '100%', padding: '4px 8px', fontSize: '13px', height: '38px' }}
                            >
                              {CHECKLIST_RATING_OPTIONS.map((option) => (
                                <option key={option.value || 'empty'} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 위험성평가 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>위험성평가 체크리스트</div>
                      {session.document9SafetyChecks.riskAssessment.map((item) => (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', borderBottom: '1px solid rgba(215, 224, 235, 0.72)' }}>
                          <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#0f172a' }}>{item.prompt}</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 88px', gap: '8px', alignItems: 'center' }}>
                            <input
                              className="app-input"
                              value={item.note}
                              onChange={(e) => {
                                const note = e.target.value;
                                screen.applyDocumentUpdate('doc9', 'manual', (current) => ({
                                  ...current,
                                  document9SafetyChecks: {
                                    ...current.document9SafetyChecks,
                                    riskAssessment: current.document9SafetyChecks.riskAssessment.map((q) =>
                                      q.id === item.id ? { ...q, note } : q
                                    ),
                                  },
                                }));
                              }}
                              placeholder="메모"
                            />
                            <select
                              className="app-select"
                              value={item.rating}
                              onChange={(e) => {
                                const rating = e.target.value as 'good' | 'average' | 'poor' | '';
                                screen.applyDocumentUpdate('doc9', 'manual', (current) => ({
                                  ...current,
                                  document9SafetyChecks: {
                                    ...current.document9SafetyChecks,
                                    riskAssessment: current.document9SafetyChecks.riskAssessment.map((q) =>
                                      q.id === item.id ? { ...q, rating } : q
                                    ),
                                  },
                                }));
                              }}
                              style={{ width: '100%', padding: '4px 8px', fontSize: '13px', height: '38px' }}
                            >
                              {CHECKLIST_RATING_OPTIONS.map((option) => (
                                <option key={option.value || 'empty'} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 10단계: 계측점검 */}
            {activeStep === 'step10' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>계측점검</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document10Measurements.map((measurement, index) => (
                      <article key={measurement.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>계측기 {index + 1}</span>
                          <button
                            type="button"
                            style={{ color: '#ef4444', fontSize: '13px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            onClick={() => {
                              screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                ...current,
                                document10Measurements: current.document10Measurements.filter((m) => m.id !== measurement.id),
                              }));
                            }}
                          >
                            삭제
                          </button>
                        </div>
                        <div className={styles.mobileEditorFieldStack}>
                          <button
                            type="button"
                            style={{ display: 'block', width: '100%', height: '160px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                            onClick={() =>
                              openPhotoSourcePicker({
                                fieldLabel: '계측 사진',
                                onAlbumSelected: async (albumItem) => {
                                  const file = await assetUrlToFile(
                                    albumItem.previewUrl,
                                    albumItem.fileName || `${measurement.id}.jpg`,
                                  );
                                  await applyDoc10MeasurementPhoto(
                                    measurement.id,
                                    albumItem.previewUrl,
                                    file,
                                  );
                                },
                                onFileSelected: async (file) => {
                                  await handleDoc10PhotoSelect(measurement.id, file);
                                },
                              })
                            }
                          >
                            {measurement.photoUrl ? (
                              <img src={measurement.photoUrl} alt="계측 사진" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                                사진 업로드
                              </div>
                            )}
                          </button>
                          {doc10MatchingMeasurementId === measurement.id ? (
                            <p className={styles.inlineNotice} style={{ margin: 0 }}>
                              AI가 계측기 종류를 분석하는 중입니다.
                            </p>
                          ) : null}
                          {doc10MatchErrors[measurement.id] ? (
                            <p className={styles.errorNotice} style={{ margin: 0 }}>
                              {doc10MatchErrors[measurement.id]}
                            </p>
                          ) : null}
                          <div className={styles.mobileCompactFieldGrid}>
                            <select
                              className="app-select"
                              value={measurement.instrumentType}
                              onChange={(e) => {
                                const value = e.target.value;
                                const matchedTemplate =
                                  measurementTemplateOptions.find(
                                    (template) =>
                                      template.instrumentName.trim().toLowerCase() ===
                                      value.trim().toLowerCase(),
                                  ) ?? null;
                                screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                  ...current,
                                  document10Measurements: current.document10Measurements.map((m) =>
                                    m.id === measurement.id
                                      ? {
                                          ...m,
                                          instrumentType: value,
                                          safetyCriteria:
                                            matchedTemplate?.safetyCriteria ?? m.safetyCriteria,
                                        }
                                      : m
                                  ),
                                }));
                              }}
                              style={{ width: '100%' }}
                            >
                              <option value="">장비 선택</option>
                              {measurement.instrumentType &&
                              !measurementTemplateOptions.some(
                                (template) => template.instrumentName === measurement.instrumentType,
                              ) ? (
                                <option value={measurement.instrumentType}>
                                  {measurement.instrumentType}
                                </option>
                              ) : null}
                              {measurementTemplateOptions.map((template) => (
                                <option key={template.id} value={template.instrumentName}>
                                  {template.instrumentName}
                                </option>
                              ))}
                            </select>
                            <input
                              className="app-input"
                              value={measurement.measuredValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                  ...current,
                                  document10Measurements: current.document10Measurements.map((m) =>
                                    m.id === measurement.id ? { ...m, measuredValue: value } : m
                                  ),
                                }));
                              }}
                              placeholder="측정값"
                              style={{ width: '100%' }}
                            />
                            <input
                              className="app-input"
                              value={measurement.measurementLocation}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                  ...current,
                                  document10Measurements: current.document10Measurements.map((m) =>
                                    m.id === measurement.id ? { ...m, measurementLocation: value } : m
                                  ),
                                }));
                              }}
                              placeholder="측정 위치"
                              style={{ width: '100%' }}
                            />
                            <input
                              className="app-input"
                              value={measurement.actionTaken}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                  ...current,
                                  document10Measurements: current.document10Measurements.map((m) =>
                                    m.id === measurement.id ? { ...m, actionTaken: value } : m
                                  ),
                                }));
                              }}
                              placeholder="조치 여부"
                              style={{ width: '100%' }}
                            />
                          </div>
                          <textarea
                            className="app-input"
                            value={measurement.safetyCriteria}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                ...current,
                                document10Measurements: current.document10Measurements.map((m) =>
                                  m.id === measurement.id ? { ...m, safetyCriteria: value } : m
                                ),
                              }));
                            }}
                            placeholder="안전기준"
                            style={{ width: '100%', minHeight: '72px', resize: 'vertical' }}
                          />
                        </div>
                      </article>
                    ))}
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                          ...current,
                          document10Measurements: [
                            ...current.document10Measurements,
                            createMeasurementCheckItem(),
                          ],
                        }));
                      }}
                    >
                      + 계측점검 추가
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 11단계: 안전교육 */}
            {activeStep === 'step11' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>안전교육</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document11EducationRecords.map((record, index) => (
                      <article
                        key={record.id}
                        style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>
                            {`교육 기록 ${index + 1}`}
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(0, 1fr) 120px',
                              gap: '10px',
                            }}
                          >
                            <label
                              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>교육 주제</span>
                              <input
                                className="app-input"
                                value={record.topic}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                    ...current,
                                    document11EducationRecords:
                                      current.document11EducationRecords.map((item) =>
                                        item.id === record.id ? { ...item, topic: value } : item,
                                      ),
                                  }));
                                }}
                                placeholder="예: 추락주의"
                              />
                            </label>
                            <label
                              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                참석 인원 (명)
                              </span>
                              <input
                                className="app-input"
                                type="number"
                                value={record.attendeeCount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                    ...current,
                                    document11EducationRecords:
                                      current.document11EducationRecords.map((item) =>
                                        item.id === record.id
                                          ? { ...item, attendeeCount: value }
                                          : item,
                                      ),
                                  }));
                                }}
                                placeholder="0"
                              />
                            </label>
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                  교육 현장 사진
                                </span>
                                {record.photoUrl ? (
                                  <button
                                    type="button"
                                    className={workspaceStyles.doc5SummaryDraftBtn}
                                    onClick={() => {
                                      screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                        ...current,
                                        document11EducationRecords:
                                          current.document11EducationRecords.map((item) =>
                                            item.id === record.id
                                              ? { ...item, photoUrl: '' }
                                              : item,
                                          ),
                                      }));
                                    }}
                                  >
                                    사진 삭제
                                  </button>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  height: '156px',
                                  backgroundColor: '#f1f5f9',
                                  border: '1px solid rgba(215, 224, 235, 0.88)',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  openPhotoSourcePicker({
                                    fieldLabel: '안전교육 사진',
                                    onAlbumSelected: (albumItem) => {
                                      screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                        ...current,
                                        document11EducationRecords:
                                          current.document11EducationRecords.map((item) =>
                                            item.id === record.id
                                              ? { ...item, photoUrl: albumItem.previewUrl }
                                              : item,
                                          ),
                                      }));
                                    },
                                    onFileSelected: async (file) => {
                                      await screen.withFileData(file, (value) => {
                                        screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                          ...current,
                                          document11EducationRecords:
                                            current.document11EducationRecords.map((item) =>
                                              item.id === record.id
                                                ? { ...item, photoUrl: value }
                                                : item,
                                            ),
                                        }));
                                      });
                                    },
                                  })
                                }
                              >
                                {record.photoUrl ? (
                                  <img
                                    src={record.photoUrl}
                                    alt="안전교육 사진"
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
                                      fontSize: '13px',
                                    }}
                                  >
                                    사진 업로드
                                  </div>
                                )}
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>교육 자료</span>
                                {record.materialUrl ? (
                                  <button
                                    type="button"
                                    className={workspaceStyles.doc5SummaryDraftBtn}
                                    onClick={() => {
                                      screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                        ...current,
                                        document11EducationRecords:
                                          current.document11EducationRecords.map((item) =>
                                            item.id === record.id
                                              ? { ...item, materialUrl: '', materialName: '' }
                                              : item,
                                          ),
                                      }));
                                    }}
                                  >
                                    자료 삭제
                                  </button>
                                ) : null}
                              </div>
                              <label
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  height: '156px',
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid rgba(215, 224, 235, 0.88)',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                  cursor: 'pointer',
                                }}
                              >
                                {record.materialUrl &&
                                (record.materialUrl.startsWith('data:image/') ||
                                  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(record.materialName)) ? (
                                  <img
                                    src={record.materialUrl}
                                    alt={record.materialName || '교육 자료'}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                ) : record.materialUrl ? (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#475569',
                                      fontSize: '12px',
                                      textAlign: 'center',
                                      padding: '12px',
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {record.materialName || '업로드된 자료'}
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#64748b',
                                      fontSize: '13px',
                                      textAlign: 'center',
                                      padding: '12px',
                                    }}
                                  >
                                    자료 업로드
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*,.pdf,.hwp,.hwpx,.ppt,.pptx,.doc,.docx"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      void screen.withFileData(file, (value, selectedFile) => {
                                        screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                          ...current,
                                          document11EducationRecords:
                                            current.document11EducationRecords.map((item) =>
                                              item.id === record.id
                                                ? {
                                                    ...item,
                                                    materialUrl: value,
                                                    materialName: selectedFile.name,
                                                  }
                                                : item,
                                            ),
                                        }));
                                      });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>교육 내용</span>
                              <button
                                type="button"
                                className={workspaceStyles.doc5SummaryDraftBtn}
                                disabled={doc11GeneratingId === record.id}
                                onClick={() => void handleGenerateDoc11Content(record.id)}
                              >
                                {doc11GeneratingId === record.id ? 'AI 생성 중' : '내용 자동 생성'}
                              </button>
                            </div>
                            {doc11ContentError?.id === record.id ? (
                              <p className={styles.errorNotice} style={{ margin: 0 }}>
                                {doc11ContentError.message}
                              </p>
                            ) : null}
                            {doc11ContentNotice?.id === record.id ? (
                              <p className={styles.inlineNotice} style={{ margin: 0 }}>
                                {doc11ContentNotice.message}
                              </p>
                            ) : null}
                            <textarea
                              className="app-input"
                              value={record.content}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                  ...current,
                                  document11EducationRecords:
                                    current.document11EducationRecords.map((item) =>
                                      item.id === record.id ? { ...item, content: value } : item,
                                    ),
                                }));
                              }}
                              placeholder="교육 내용을 입력하세요."
                              style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 12단계: 활동 실적 */}
            {activeStep === 'step12' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>안전보건 활동 실적</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  {session.document12Activities[0] ? (
                    <article
                      style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: '12px',
                          }}
                          onClick={() =>
                            openPhotoSourcePicker({
                              fieldLabel: getMobileDoc3SlotLabel(index),
                              onAlbumSelected: async (item) => {
                                const file = await assetUrlToFile(
                                  item.previewUrl,
                                  item.fileName || `${scene.id}.jpg`,
                                );
                                await applyDoc3ScenePhoto(scene.id, index, item.previewUrl, file);
                              },
                              onFileSelected: async (file) => {
                                await handleDoc3SceneUpload(scene.id, index, file);
                              },
                            })
                          }
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>활동 1 사진</div>
                            <div
                              role="button"
                              tabIndex={0}
                              style={{
                                display: 'block',
                                width: '100%',
                                height: '180px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid rgba(215, 224, 235, 0.88)',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                              }}
                              onClick={() =>
                                openPhotoSourcePicker({
                                  fieldLabel: '활동 1 사진',
                                  onAlbumSelected: (albumItem) => {
                                    screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                      ...current,
                                      document12Activities: current.document12Activities.map((item, itemIndex) =>
                                        itemIndex === 0 ? { ...item, photoUrl: albumItem.previewUrl } : item,
                                      ),
                                    }));
                                  },
                                  onFileSelected: async (file) => {
                                    await screen.withFileData(file, (value) => {
                                      screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                        ...current,
                                        document12Activities: current.document12Activities.map((item, itemIndex) =>
                                          itemIndex === 0 ? { ...item, photoUrl: value } : item,
                                        ),
                                      }));
                                    });
                                  },
                                })
                              }
                              onKeyDown={(event) =>
                                handlePhotoSlotKeyDown(event, () =>
                                  openPhotoSourcePicker({
                                    fieldLabel: '활동 1 사진',
                                    onAlbumSelected: (albumItem) => {
                                      screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                        ...current,
                                        document12Activities: current.document12Activities.map((item, itemIndex) =>
                                          itemIndex === 0 ? { ...item, photoUrl: albumItem.previewUrl } : item,
                                        ),
                                      }));
                                    },
                                    onFileSelected: async (file) => {
                                      await screen.withFileData(file, (value) => {
                                        screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                          ...current,
                                          document12Activities: current.document12Activities.map((item, itemIndex) =>
                                            itemIndex === 0 ? { ...item, photoUrl: value } : item,
                                          ),
                                        }));
                                      });
                                    },
                                  }),
                                )
                              }
                            >
                              {session.document12Activities[0].photoUrl ? (
                                <button
                                  type="button"
                                  className={workspaceStyles.doc5SummaryDraftBtn}
                                  style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                      ...current,
                                      document12Activities: current.document12Activities.map((item, itemIndex) =>
                                        itemIndex === 0 ? { ...item, photoUrl: '' } : item,
                                      ),
                                    }));
                                  }}
                                >
                                  사진 삭제
                                </button>
                              ) : null}
                              {session.document12Activities[0].photoUrl ? (
                                <img
                                  src={session.document12Activities[0].photoUrl}
                                  alt="활동 1 사진"
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
                                    fontSize: '13px',
                                  }}
                                >
                                  사진 업로드
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>활동 2 사진</div>
                            <div
                              role="button"
                              tabIndex={0}
                              style={{
                                display: 'block',
                                width: '100%',
                                height: '180px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid rgba(215, 224, 235, 0.88)',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                              }}
                              onClick={() =>
                                openPhotoSourcePicker({
                                  fieldLabel: '활동 2 사진',
                                  onAlbumSelected: (albumItem) => {
                                    screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                      ...current,
                                      document12Activities: current.document12Activities.map((item, itemIndex) =>
                                        itemIndex === 0 ? { ...item, photoUrl2: albumItem.previewUrl } : item,
                                      ),
                                    }));
                                  },
                                  onFileSelected: async (file) => {
                                    await screen.withFileData(file, (value) => {
                                      screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                        ...current,
                                        document12Activities: current.document12Activities.map((item, itemIndex) =>
                                          itemIndex === 0 ? { ...item, photoUrl2: value } : item,
                                        ),
                                      }));
                                    });
                                  },
                                })
                              }
                              onKeyDown={(event) =>
                                handlePhotoSlotKeyDown(event, () =>
                                  openPhotoSourcePicker({
                                    fieldLabel: '활동 2 사진',
                                    onAlbumSelected: (albumItem) => {
                                      screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                        ...current,
                                        document12Activities: current.document12Activities.map((item, itemIndex) =>
                                          itemIndex === 0 ? { ...item, photoUrl2: albumItem.previewUrl } : item,
                                        ),
                                      }));
                                    },
                                    onFileSelected: async (file) => {
                                      await screen.withFileData(file, (value) => {
                                        screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                          ...current,
                                          document12Activities: current.document12Activities.map((item, itemIndex) =>
                                            itemIndex === 0 ? { ...item, photoUrl2: value } : item,
                                          ),
                                        }));
                                      });
                                    },
                                  }),
                                )
                              }
                            >
                              {session.document12Activities[0].photoUrl2 ? (
                                <button
                                  type="button"
                                  className={workspaceStyles.doc5SummaryDraftBtn}
                                  style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                      ...current,
                                      document12Activities: current.document12Activities.map((item, itemIndex) =>
                                        itemIndex === 0 ? { ...item, photoUrl2: '' } : item,
                                      ),
                                    }));
                                  }}
                                >
                                  사진 삭제
                                </button>
                              ) : null}
                              {session.document12Activities[0].photoUrl2 ? (
                                <img
                                  src={session.document12Activities[0].photoUrl2}
                                  alt="활동 2 사진"
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
                                    fontSize: '13px',
                                  }}
                                >
                                  사진 업로드
                                </div>
                              )}
                            </div>
                          </div>
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
                              value={session.document12Activities[0].activityType}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                  ...current,
                                  document12Activities: current.document12Activities.map((item, itemIndex) =>
                                    itemIndex === 0 ? { ...item, activityType: value } : item,
                                  ),
                                }));
                              }}
                              placeholder="예: 안전보건 캠페인"
                            />
                          </label>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                              활동 2 내용
                            </span>
                            <input
                              className="app-input"
                              value={session.document12Activities[0].content}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                  ...current,
                                  document12Activities: current.document12Activities.map((item, itemIndex) =>
                                    itemIndex === 0 ? { ...item, content: value } : item,
                                  ),
                                }));
                              }}
                              placeholder="활동 요약 및 비고"
                            />
                          </label>
                        </div>
                      </div>
                    </article>
                  ) : (
                    <p className={styles.inlineNotice}>활동 실적 항목이 없습니다.</p>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      ) : (
        <p className={styles.inlineNotice} style={{ margin: '16px' }}>보고서 본문을 동기화하는 중입니다.</p>
      )}

      <input
        ref={photoPickerGalleryInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        hidden
        onChange={(event) => {
          void handlePhotoSourceInputChange(event.target.files, event.currentTarget);
        }}
      />
      <input
        ref={photoPickerCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => {
          void handlePhotoSourceInputChange(event.target.files, event.currentTarget);
        }}
      />

      <AppModal
        open={isPhotoSourceModalOpen}
        title={photoSourceTitle}
        onClose={() => {
          closePhotoSourceModal();
          resetPhotoSourceTarget();
        }}
        verticalAlign="center"
        mobileActionsLayout="row"
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={openPhotoSourceCamera}
            >
              카메라
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={openPhotoAlbumPicker}
            >
              사진첩
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={openPhotoSourceGallery}
            >
              파일 선택
            </button>
          </>
        }
      >
        <p className={styles.inlineNotice} style={{ margin: 0 }}>
          사진을 가져올 방법을 선택하세요.
        </p>
      </AppModal>

      <AppModal
        open={isPhotoAlbumModalOpen}
        title="사진첩에서 선택"
        onClose={closePhotoAlbumModal}
        size="large"
        actions={
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={closePhotoAlbumModal}
          >
            닫기
          </button>
        }
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          <input
            className="app-input"
            value={photoAlbumQuery}
            onChange={(event) => setPhotoAlbumQuery(event.target.value)}
            placeholder="파일명, 현장명, 보고서명, 업로더 검색"
          />
          {photoAlbumError ? (
            <p className={styles.errorNotice} style={{ margin: 0 }}>
              {photoAlbumError}
            </p>
          ) : null}
          {photoAlbumLoading ? (
            <div
              style={{
                minHeight: '220px',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '14px',
              }}
            >
              사진첩을 불러오는 중입니다.
            </div>
          ) : photoAlbumRows.length === 0 ? (
            <div
              style={{
                minHeight: '220px',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '14px',
                textAlign: 'center',
                padding: '16px',
              }}
            >
              선택할 사진이 없습니다.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '10px',
              }}
            >
              {photoAlbumRows.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={photoAlbumSelectingId === item.id}
                  onClick={() => {
                    void handlePhotoAlbumSelect(item);
                  }}
                  style={{
                    display: 'grid',
                    gap: '6px',
                    padding: '6px',
                    border: '1px solid #d7e0eb',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    textAlign: 'left',
                    cursor: photoAlbumSelectingId === item.id ? 'wait' : 'pointer',
                    opacity: photoAlbumSelectingId === item.id ? 0.68 : 1,
                  }}
                >
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.fileName}
                      style={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        backgroundColor: '#e2e8f0',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                      }}
                    >
                      미리보기 없음
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={item.fileName}
                  >
                    {item.fileName}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    {formatMobilePhotoAlbumDate(item.capturedAt || item.createdAt)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </AppModal>

      {hasLoadedSessionPayload && session ? (
        <AppModal
          open={documentInfoOpen}
          title="문서정보 확인"
          onClose={() => setDocumentInfoOpen(false)}
          actions={
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setDocumentInfoOpen(false)}
            >
              닫기
            </button>
          }
        >
          <div style={{ display: 'grid', gap: '12px' }}>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>현장명</span>
              <input
                className="app-input"
                value={session.meta.siteName}
                placeholder="현장명"
                onChange={(event) => screen.changeMetaField('siteName', event.target.value)}
              />
            </label>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>작성일</span>
              <input
                type="date"
                className="app-input"
                value={session.meta.reportDate}
                onChange={(event) => screen.changeMetaField('reportDate', event.target.value)}
              />
            </label>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>담당</span>
              <input
                className="app-input"
                value={session.meta.drafter}
                placeholder="담당"
                onChange={(event) => screen.changeMetaField('drafter', event.target.value)}
              />
            </label>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>검토</span>
              <input
                className="app-input"
                value={session.meta.reviewer}
                placeholder="검토"
                onChange={(event) => screen.changeMetaField('reviewer', event.target.value)}
              />
            </label>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>확인</span>
              <input
                className="app-input"
                value={session.meta.approver}
                placeholder="확인"
                onChange={(event) => screen.changeMetaField('approver', event.target.value)}
              />
            </label>
          </div>
        </AppModal>
      ) : null}

      {hasLoadedSessionPayload && session ? (
        <AppModal
          open={isDoc2ProcessModalOpen}
          title="진행공정 및 특이사항 자동생성"
          onClose={() => setIsDoc2ProcessModalOpen(false)}
          size="large"
          verticalAlign="center"
          actions={
            <>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setIsDoc2ProcessModalOpen(false)}
              >
                닫기
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => void handleGenerateDoc2ProcessNotes()}
                disabled={isGeneratingDoc2ProcessNotes}
              >
                {isGeneratingDoc2ProcessNotes ? 'AI 생성 중' : 'AI 생성'}
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={applyDoc2ProcessNotesDraft}
                disabled={isGeneratingDoc2ProcessNotes}
              >
                본문에 반영
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p className={styles.inlineNotice} style={{ margin: 0 }}>
              공사개요에 필요한 5개 항목을 입력하면, 개요 2줄은 즉시 정리되고 주요 위험 요인
              2줄은 AI로 생성합니다.
            </p>
            {doc2ProcessError ? (
              <p className={styles.errorNotice} style={{ margin: 0 }}>
                {doc2ProcessError}
              </p>
            ) : null}
            {doc2ProcessNotice ? (
              <p className={styles.inlineNotice} style={{ margin: 0 }}>
                {doc2ProcessNotice}
              </p>
            ) : null}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  작업현재 공정
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processWorkContent}
                  onChange={(event) =>
                    handleDoc2ProcessFieldChange('processWorkContent', event.target.value)
                  }
                  placeholder="예: 철거작업, 금속작업"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  작업 인원
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processWorkerCount}
                  onChange={(event) =>
                    handleDoc2ProcessFieldChange('processWorkerCount', event.target.value)
                  }
                  placeholder="예: 6"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  건설기계 장비
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processEquipment}
                  onChange={(event) =>
                    handleDoc2ProcessFieldChange('processEquipment', event.target.value)
                  }
                  placeholder="예: 트럭, 굴착기"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  유해위험기구
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processTools}
                  onChange={(event) =>
                    handleDoc2ProcessFieldChange('processTools', event.target.value)
                  }
                  placeholder="예: 핸드브레이커, 용접기"
                />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                유해위험물질
              </span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.processHazardousMaterials}
                onChange={(event) =>
                  handleDoc2ProcessFieldChange('processHazardousMaterials', event.target.value)
                }
                placeholder="예: 페인트, LPG, 용접봉"
              />
            </label>
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                padding: '12px',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#334155' }}>
                4줄 미리보기
              </strong>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: '#475569',
                }}
              >
                {doc2ProcessNoteDraft}
              </pre>
            </div>
          </div>
        </AppModal>
      ) : null}

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
