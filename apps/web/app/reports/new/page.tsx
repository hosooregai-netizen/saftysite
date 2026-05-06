'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { GuidedPhotoStepUploadInput } from '@saftysite/contracts';
import {
  GuidedImageDropzone,
  type GuidedUploadFileItem,
} from '@/components/GuidedImageDropzone';
import styles from '@/components/GuidedUploadFlow.module.css';
import { HeadquarterEditorModal } from '@/features/admin/sections/headquarters/HeadquarterEditorModal';
import type { HeadquarterFormState } from '@/features/admin/sections/headquarters/useHeadquartersSectionState';
import { SiteEditorModal } from '@/features/admin/sections/sites/SiteEditorModal';
import {
  EMPTY_FORM as EMPTY_SITE_FORM,
  buildSitePayload,
  isCreateReady as isSiteCreateReady,
  type SiteFormState,
} from '@/features/admin/sections/sites/siteSectionHelpers';
import {
  createSafetyHeadquarter,
  createSafetySite,
  fetchSafetyHeadquarters,
  fetchSafetySitesAdmin,
} from '@/lib/safetyApi/adminEndpoints';
import {
  bootstrapReportSession,
  canUseReportServerApis,
  createReportRecord,
  generateDraftFromGuidedPhotos,
  generateDraftFromPhotos,
  uploadGuidedStepPhotos,
  writeGeneratedReportSnapshot,
  type DemoSession,
} from '@/lib/reportApi';
import {
  deletePersistedValue,
  readPersistedValue,
  writePersistedValue,
} from '@/lib/clientPersistence';
import {
  readGuestWorkspaceCache,
  setGuestDirectoryCache,
} from '@/lib/guestWorkspaceCache';
import { prepareUploadImage } from '@/lib/reportImages';
import type { SafetySite } from '@/types/backend';
import type { SafetyHeadquarter, SafetyHeadquarterInput, SafetySiteInput } from '@/types/controller';

type GuidedStepId = 'meta' | 'overview' | 'hazard';

type ReportMetaFormState = {
  customerName: string;
  drafterName: string;
  processSummary: string;
  progressRate: string;
  siteName: string;
  visitDate: string;
  workerCount: string;
};

const MIN_GENERATION_ANIMATION_MS = 5000;
const DRAFT_STORAGE_KEY = 'saftysite-web-new-report-draft-v2';

const DISPLAY_STEPS = [
  { key: 'meta', number: '1', title: '사업장/현장 선택', helper: '디렉터리 선택과 기본값 확인' },
  { key: 'overview', number: '2', title: '전경·공정 사진', helper: '현장 전경과 진행 공정' },
  { key: 'hazard', number: '3', title: '위험요인 사진', helper: '지적사항 후보가 될 위험 요소' },
] as const;

const EMPTY_HEADQUARTER_FORM: HeadquarterFormState = {
  address: '',
  business_registration_no: '',
  contact_name: '',
  contact_phone: '',
  corporate_registration_no: '',
  is_active: true,
  license_no: '',
  management_number: '',
  memo: '',
  name: '',
  opening_number: '',
};

function createDefaultMetaFields(): ReportMetaFormState {
  return {
    customerName: '',
    drafterName: '',
    processSummary: '',
    progressRate: '',
    siteName: '',
    visitDate: new Date().toISOString().slice(0, 10),
    workerCount: '',
  };
}

function createUploadId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCategory(kind: string | undefined): GuidedPhotoStepUploadInput['photos'][number]['category'] {
  if (kind === 'site_overview') return 'site_overview';
  if (kind === 'process') return 'process';
  if (kind === 'followup') return 'followup';
  if (kind === 'education') return 'education';
  return 'hazard';
}

function buildGuidedPhotoPayload(files: GuidedUploadFileItem[]): GuidedPhotoStepUploadInput {
  return {
    photos: files.map((file) => ({
      filename: file.name,
      category: normalizeCategory(file.kind),
      data_url: file.previewUrl,
      location_hint: file.isRepresentative ? `${file.kind ?? 'image'} 대표사진` : file.kind ?? 'image',
    })),
  };
}

function toUserFacingErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return '문안 초안을 작성하지 못했습니다.';
  }

  if (error.message.includes('Report SaaS API is not running')) {
    return '현재 보고서 생성 서비스를 준비 중입니다. 잠시 후 다시 시도해 주세요.';
  }

  return error.message;
}

function buildMinimumPhotoWarning(step1Count: number, step2Count: number): string {
  if (step1Count === 0 && step2Count === 0) {
    return '사진 2장만으로 초안을 시작할 수 있습니다. 현재 공정 또는 현장 전경 1장과 현재 위험요인 1장을 함께 올려 주세요.';
  }
  if (step1Count === 0) {
    return '현재 공정 또는 현장 전경 사진 1장을 함께 올리면 초안 정확도가 높아집니다.';
  }
  if (step2Count === 0) {
    return '현재 위험요인 사진 1장을 함께 올리면 초안 정확도가 높아집니다.';
  }
  return '';
}

function buildHeadquarterPayload(form: HeadquarterFormState): SafetyHeadquarterInput {
  const asNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

  return {
    address: asNullable(form.address),
    business_registration_no: asNullable(form.business_registration_no),
    contact_name: asNullable(form.contact_name),
    contact_phone: asNullable(form.contact_phone),
    corporate_registration_no: asNullable(form.corporate_registration_no),
    is_active: form.is_active,
    license_no: asNullable(form.license_no),
    management_number: asNullable(form.management_number),
    memo: asNullable(form.memo),
    name: form.name.trim(),
    opening_number: asNullable(form.opening_number),
  };
}

function formatProjectAmount(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return '-';
  }
  return `${amount.toLocaleString('ko-KR')}원`;
}

function formatContactLine(parts: Array<string | null | undefined>): string {
  const normalized = parts.map((item) => (item ?? '').trim()).filter(Boolean);
  return normalized.length > 0 ? normalized.join(' / ') : '-';
}

function buildLocalDirectory() {
  const now = new Date().toISOString();
  const headquarters: SafetyHeadquarter[] = [
    {
      id: 'local-hq-1',
      name: '로컬 성수개발',
      management_number: 'HQ-LOCAL-001',
      opening_number: 'OPEN-LOCAL-001',
      business_registration_no: '104-81-33211',
      corporate_registration_no: '110111-2233445',
      license_no: '건설업-로컬-2044',
      contact_name: '이도현',
      contact_phone: '02-412-1100',
      address: '서울특별시 성동구 성수이로 55',
      memo: '오프라인 임시 작성용 샘플 사업장',
      is_active: true,
      lifecycle_status: 'active',
      site_count: 1,
      created_at: now,
      updated_at: now,
    },
  ];
  const sites: SafetySite[] = [
    {
      id: 'local-site-1',
      headquarter_id: 'local-hq-1',
      headquarter: { id: 'local-hq-1', name: '로컬 성수개발' },
      headquarter_detail: headquarters[0],
      assigned_user: null,
      assigned_users: [],
      active_assignment_count: 0,
      site_name: '로컬 복합시설 신축공사',
      site_code: 'LOCAL-SITE-001',
      management_number: 'TG-LOCAL-0512',
      labor_office: '서울동부지청',
      guidance_officer_name: '로컬 작성자',
      project_start_date: '2026-01-03',
      project_end_date: '2026-11-28',
      project_amount: 18400000000,
      project_scale: '지하 3층 / 지상 18층',
      project_kind: '복합시설 신축',
      client_management_number: 'CL-LOCAL-3344',
      client_business_name: '로컬 성수개발',
      client_representative_name: '최수혁',
      client_corporate_registration_no: '110111-2233445',
      client_business_registration_no: '104-81-33211',
      order_type_division: '민간',
      technical_guidance_kind: '표준 기술지도',
      manager_name: '박성민',
      inspector_name: '로컬 작성자',
      contract_contact_name: '이도현',
      manager_phone: '010-2481-3370',
      site_contact_email: 'local-site@example.com',
      site_managers: [],
      primary_site_manager: null,
      client_contacts: [],
      site_address: '서울특별시 성동구 아차산로 00 일대',
      status: 'active',
      lifecycle_status: 'active',
      is_active: true,
      memo: '오프라인 임시 작성용 샘플 현장',
      contract_date: null,
      contract_start_date: '2026-01-03',
      contract_end_date: '2026-11-28',
      contract_signed_date: null,
      contract_type: 'private',
      contract_status: 'active',
      total_rounds: 7,
      guidance_max_visit_round: 3,
      per_visit_amount: 3000000,
      total_contract_amount: 21000000,
      last_visit_date: '2026-05-02',
      required_completion_fields: [],
      dispatch_policy: null,
      created_at: now,
      updated_at: now,
    },
  ];
  return { headquarters, sites };
}

async function loadDirectory(token: string) {
  const [headquarters, sites] = await Promise.all([
    fetchSafetyHeadquarters(token),
    fetchSafetySitesAdmin(token),
  ]);
  return {
    headquarters: headquarters.filter((item) => item.is_active !== false),
    sites: sites.filter((item) => item.status !== 'deleted' && item.is_active !== false),
  };
}

async function loadGuestDirectory() {
  const cache = await readGuestWorkspaceCache();
  if (cache.directory.headquarters.length > 0 || cache.directory.sites.length > 0) {
    return {
      headquarters: cache.directory.headquarters,
      sites: cache.directory.sites,
    };
  }
  return buildLocalDirectory();
}

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [currentStep, setCurrentStep] = useState<GuidedStepId>('meta');
  const [headquarters, setHeadquarters] = useState<SafetyHeadquarter[]>([]);
  const [sites, setSites] = useState<SafetySite[]>([]);
  const [selectedHeadquarterId, setSelectedHeadquarterId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [metaFields, setMetaFields] = useState<ReportMetaFormState>(createDefaultMetaFields);
  const [step2Files, setStep2Files] = useState<GuidedUploadFileItem[]>([]);
  const [step3Files, setStep3Files] = useState<GuidedUploadFileItem[]>([]);
  const [step4Files, setStep4Files] = useState<GuidedUploadFileItem[]>([]);
  const [step5Files, setStep5Files] = useState<GuidedUploadFileItem[]>([]);
  const [step6Files, setStep6Files] = useState<GuidedUploadFileItem[]>([]);
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'generating'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [submitWarning, setSubmitWarning] = useState('');
  const [isHeadquarterModalOpen, setIsHeadquarterModalOpen] = useState(false);
  const [headquarterForm, setHeadquarterForm] = useState<HeadquarterFormState>(EMPTY_HEADQUARTER_FORM);
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [siteForm, setSiteForm] = useState<SiteFormState>(EMPTY_SITE_FORM);
  const [isMutatingDirectory, setIsMutatingDirectory] = useState(false);
  const [stepValidationError, setStepValidationError] = useState('');
  const headquarterFieldRef = useRef<HTMLSelectElement | null>(null);
  const siteFieldRef = useRef<HTMLSelectElement | null>(null);
  const siteNameFieldRef = useRef<HTMLInputElement | null>(null);
  const customerNameFieldRef = useRef<HTMLInputElement | null>(null);
  const visitDateFieldRef = useRef<HTMLInputElement | null>(null);
  const drafterFieldRef = useRef<HTMLInputElement | null>(null);

  const filteredSites = useMemo(
    () =>
      selectedHeadquarterId
        ? sites.filter((site) => site.headquarter_id === selectedHeadquarterId)
        : sites,
    [selectedHeadquarterId, sites],
  );
  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? null,
    [selectedSiteId, sites],
  );
  const selectedHeadquarter = useMemo(() => {
    if (selectedSite?.headquarter_detail) {
      return selectedSite.headquarter_detail;
    }
    return headquarters.find((item) => item.id === selectedHeadquarterId) ?? null;
  }, [headquarters, selectedHeadquarterId, selectedSite]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const stored = await readPersistedValue<{
        currentStep: GuidedStepId;
        metaFields: ReportMetaFormState;
        selectedHeadquarterId: string;
        selectedSiteId: string;
        step2Files: GuidedUploadFileItem[];
        step3Files: GuidedUploadFileItem[];
        step4Files: GuidedUploadFileItem[];
        step5Files: GuidedUploadFileItem[];
        step6Files: GuidedUploadFileItem[];
      }>(DRAFT_STORAGE_KEY);
      if (!stored || cancelled) {
        return;
      }
      setCurrentStep(stored.currentStep);
      setMetaFields(stored.metaFields);
      setSelectedHeadquarterId(stored.selectedHeadquarterId);
      setSelectedSiteId(stored.selectedSiteId);
      setStep2Files(stored.step2Files);
      setStep3Files(stored.step3Files);
      setStep4Files(stored.step4Files ?? []);
      setStep5Files(stored.step5Files ?? []);
      setStep6Files(stored.step6Files ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionChecked) {
      return;
    }

    void writePersistedValue(DRAFT_STORAGE_KEY, {
      currentStep,
      metaFields,
      selectedHeadquarterId,
      selectedSiteId,
      step2Files,
      step3Files,
      step4Files,
      step5Files,
      step6Files,
    });
  }, [
    currentStep,
    metaFields,
    selectedHeadquarterId,
    selectedSiteId,
    sessionChecked,
    step2Files,
    step3Files,
    step4Files,
    step5Files,
    step6Files,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      try {
        const nextSession = await bootstrapReportSession();
        const directory = !canUseReportServerApis(nextSession)
          ? await loadGuestDirectory()
          : await loadDirectory(nextSession.token);
        if (cancelled) {
          return;
        }
        setSession(nextSession);
        setHeadquarters(directory.headquarters);
        setSites(directory.sites);
        setMetaFields((current) => ({
          ...current,
          drafterName: current.drafterName || nextSession.userName,
        }));
        const queryHeadquarterId = searchParams.get('headquarterId') || '';
        const querySiteId = searchParams.get('siteId') || '';
        if (queryHeadquarterId) {
          setSelectedHeadquarterId((current) => current || queryHeadquarterId);
        }
        if (querySiteId) {
          setSelectedSiteId((current) => current || querySiteId);
        }
        setSubmitError('');
        setSubmitWarning('');
      } catch (error) {
        if (!cancelled) {
          setSubmitError(toUserFacingErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setSessionChecked(true);
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!selectedHeadquarterId) {
      return;
    }
    if (!headquarters.some((item) => item.id === selectedHeadquarterId)) {
      setSelectedHeadquarterId('');
    }
  }, [headquarters, selectedHeadquarterId]);

  useEffect(() => {
    if (!selectedSiteId) {
      return;
    }
    const matchedSite = sites.find((item) => item.id === selectedSiteId) ?? null;
    if (!matchedSite) {
      setSelectedSiteId('');
      return;
    }
    if (selectedHeadquarterId && matchedSite.headquarter_id !== selectedHeadquarterId) {
      setSelectedSiteId('');
    }
  }, [selectedHeadquarterId, selectedSiteId, sites]);

  useEffect(() => {
    if (!selectedSite) {
      return;
    }
    setSelectedHeadquarterId(selectedSite.headquarter_id);
    setMetaFields((current) => ({
      ...current,
      customerName:
        selectedSite.client_business_name ??
        selectedSite.headquarter_detail?.name ??
        current.customerName,
      processSummary: current.processSummary || selectedSite.project_kind || '',
      siteName: selectedSite.site_name,
    }));
  }, [selectedSite]);

  const refreshDirectory = async (token: string) => {
    if (session && !canUseReportServerApis(session)) {
      const directory = await loadGuestDirectory();
      setHeadquarters(directory.headquarters);
      setSites(directory.sites);
      return;
    }
    const directory = await loadDirectory(token);
    setHeadquarters(directory.headquarters);
    setSites(directory.sites);
  };

  const metaReady = Boolean(
    sessionChecked &&
      selectedSite &&
      metaFields.siteName.trim() &&
      metaFields.customerName.trim() &&
      metaFields.visitDate.trim() &&
      metaFields.drafterName.trim(),
  );
  const canAttemptGenerate = sessionChecked && Boolean(session) && generationPhase !== 'generating';
  const generationHelpText = !sessionChecked ? '보고서 작성 환경을 준비하고 있습니다.' : '';

  useEffect(() => {
    if (!stepValidationError) {
      return;
    }
    setStepValidationError('');
  }, [
    stepValidationError,
    selectedHeadquarterId,
    selectedSiteId,
    metaFields.customerName,
    metaFields.drafterName,
    metaFields.siteName,
    metaFields.visitDate,
  ]);

  const appendPreparedFiles = async (
    setter: Dispatch<SetStateAction<GuidedUploadFileItem[]>>,
    files: File[],
    defaultKind: string,
  ) => {
    const prepared = await Promise.all(files.map((file) => prepareUploadImage(file)));

    setGenerationPhase('idle');
    setSubmitError('');
    setSubmitWarning('');
    setter((current) => [
      ...current,
      ...prepared.map((item, index) => ({
        id: createUploadId(),
        isRepresentative: current.length === 0 && index === 0,
        kind: defaultKind,
        name: item.fileName,
        previewUrl: item.dataUrl,
      })),
    ]);
  };

  const deleteFile = (
    setter: Dispatch<SetStateAction<GuidedUploadFileItem[]>>,
    fileId: string,
  ) => {
    setGenerationPhase('idle');
    setSubmitError('');
    setSubmitWarning('');
    setter((current) => {
      const next = current.filter((file) => file.id !== fileId);
      if (next.length > 0 && !next.some((file) => file.isRepresentative)) {
        next[0] = { ...next[0], isRepresentative: true };
      }
      return next;
    });
  };

  const setRepresentative = (
    setter: Dispatch<SetStateAction<GuidedUploadFileItem[]>>,
    fileId: string,
  ) => {
    setSubmitWarning('');
    setter((current) =>
      current.map((file) => ({
        ...file,
        isRepresentative: file.id === fileId,
      })),
    );
  };

  const canOpenStep = (stepId: GuidedStepId) => {
    if (stepId === 'meta') return true;
    return metaReady;
  };

  const getMetaValidationFailure = () => {
    if (!selectedHeadquarterId) {
      return {
        message: '사업장을 먼저 선택해 주세요.',
        target: headquarterFieldRef.current,
      };
    }
    if (!selectedSite) {
      return {
        message: '현장을 먼저 선택해 주세요.',
        target: siteFieldRef.current,
      };
    }
    if (!metaFields.siteName.trim()) {
      return {
        message: '보고서 현장명을 입력해 주세요.',
        target: siteNameFieldRef.current,
      };
    }
    if (!metaFields.customerName.trim()) {
      return {
        message: '고객사/건설사명을 입력해 주세요.',
        target: customerNameFieldRef.current,
      };
    }
    if (!metaFields.visitDate.trim()) {
      return {
        message: '지도일을 입력해 주세요.',
        target: visitDateFieldRef.current,
      };
    }
    if (!metaFields.drafterName.trim()) {
      return {
        message: '작성자를 입력해 주세요.',
        target: drafterFieldRef.current,
      };
    }
    return null;
  };

  const moveStep = (direction: 'prev' | 'next') => {
    const stepOrder: GuidedStepId[] = ['meta', 'overview', 'hazard'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const nextIndex =
      direction === 'next'
        ? Math.min(stepOrder.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);
    const nextStep = stepOrder[nextIndex];
    if (direction === 'next' && currentStep === 'meta') {
      const failure = getMetaValidationFailure();
      if (failure) {
        setStepValidationError(failure.message);
        failure.target?.focus();
        return;
      }
    }
    if (canOpenStep(nextStep)) {
      setCurrentStep(nextStep);
    }
  };

  const openHeadquarterCreate = () => {
    setHeadquarterForm(EMPTY_HEADQUARTER_FORM);
    setIsHeadquarterModalOpen(true);
  };

  const openSiteCreate = () => {
    setSiteForm({
      ...EMPTY_SITE_FORM,
      headquarter_id: selectedHeadquarterId,
      client_business_name: selectedHeadquarter?.name ?? '',
      client_business_registration_no: selectedHeadquarter?.business_registration_no ?? '',
      client_corporate_registration_no: selectedHeadquarter?.corporate_registration_no ?? '',
      contract_contact_name: selectedHeadquarter?.contact_name ?? '',
      guidance_officer_name: session?.userName ?? '',
      inspector_name: session?.userName ?? '',
      management_number: selectedHeadquarter?.management_number ?? '',
    });
    setIsSiteModalOpen(true);
  };

  const submitHeadquarterCreate = async () => {
    if (!session || !headquarterForm.name.trim()) {
      return;
    }

    setIsMutatingDirectory(true);
    try {
      if (!canUseReportServerApis(session)) {
        const timestamp = new Date().toISOString();
        const created: SafetyHeadquarter = {
          id: `local-hq-${Date.now()}`,
          name: headquarterForm.name.trim(),
          management_number: headquarterForm.management_number.trim() || null,
          opening_number: headquarterForm.opening_number.trim() || null,
          business_registration_no: headquarterForm.business_registration_no.trim() || null,
          corporate_registration_no: headquarterForm.corporate_registration_no.trim() || null,
          license_no: headquarterForm.license_no.trim() || null,
          contact_name: headquarterForm.contact_name.trim() || null,
          contact_phone: headquarterForm.contact_phone.trim() || null,
          address: headquarterForm.address.trim() || null,
          memo: headquarterForm.memo.trim() || null,
          is_active: true,
          lifecycle_status: 'active',
          site_count: 0,
          created_at: timestamp,
          updated_at: timestamp,
        };
        const nextHeadquarters = [created, ...headquarters];
        await setGuestDirectoryCache({
          headquarters: nextHeadquarters,
          sites,
        });
        setHeadquarters(nextHeadquarters);
        setSelectedHeadquarterId(created.id);
        setHeadquarterForm(EMPTY_HEADQUARTER_FORM);
        setIsHeadquarterModalOpen(false);
        return;
      }
      const created = await createSafetyHeadquarter(session.token, buildHeadquarterPayload(headquarterForm));
      await refreshDirectory(session.token);
      setSelectedHeadquarterId(created.id);
      setHeadquarterForm(EMPTY_HEADQUARTER_FORM);
      setIsHeadquarterModalOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '사업장 추가에 실패했습니다.');
    } finally {
      setIsMutatingDirectory(false);
    }
  };

  const submitSiteCreate = async () => {
    if (!session) {
      return;
    }

    setIsMutatingDirectory(true);
    try {
      const payload = buildSitePayload(siteForm, selectedHeadquarterId || null) as SafetySiteInput;
      if (!canUseReportServerApis(session)) {
        const timestamp = new Date().toISOString();
        const headquarter =
          headquarters.find((item) => item.id === payload.headquarter_id) ?? selectedHeadquarter;
        const normalizedTotalRounds =
          typeof payload.total_rounds === 'number' && payload.total_rounds > 0
            ? payload.total_rounds
            : 1;
        const created: SafetySite = {
          id: `local-site-${Date.now()}`,
          headquarter_id: payload.headquarter_id,
          headquarter: headquarter ? { id: headquarter.id, name: headquarter.name } : null,
          headquarter_detail: headquarter,
          assigned_user: null,
          assigned_users: [],
          active_assignment_count: 0,
          site_name: payload.site_name,
          site_code: payload.site_code ?? null,
          management_number: payload.management_number ?? null,
          labor_office: payload.labor_office ?? null,
          guidance_officer_name: payload.guidance_officer_name ?? null,
          project_start_date: payload.project_start_date ?? null,
          project_end_date: payload.project_end_date ?? null,
          project_amount: payload.project_amount ?? null,
          project_scale: payload.project_scale ?? null,
          project_kind: payload.project_kind ?? null,
          client_management_number: payload.client_management_number ?? null,
          client_business_name: payload.client_business_name ?? null,
          client_representative_name: payload.client_representative_name ?? null,
          client_corporate_registration_no: payload.client_corporate_registration_no ?? null,
          client_business_registration_no: payload.client_business_registration_no ?? null,
          order_type_division: payload.order_type_division ?? null,
          technical_guidance_kind: payload.technical_guidance_kind ?? null,
          manager_name: payload.manager_name ?? null,
          inspector_name: payload.inspector_name ?? null,
          contract_contact_name: payload.contract_contact_name ?? null,
          manager_phone: payload.manager_phone ?? null,
          site_contact_email: payload.site_contact_email ?? null,
          site_managers: payload.site_managers ?? [],
          primary_site_manager: payload.site_managers?.[0] ?? null,
          client_contacts: payload.client_contacts ?? [],
          site_address: payload.site_address ?? null,
          status: payload.status ?? 'active',
          pause_start_date: payload.pause_start_date ?? null,
          lifecycle_status: payload.lifecycle_status ?? 'active',
          is_active: payload.status !== 'deleted',
          memo: payload.memo ?? null,
          contract_date: payload.contract_date ?? null,
          contract_start_date: payload.contract_start_date ?? null,
          contract_end_date: payload.contract_end_date ?? null,
          contract_signed_date: payload.contract_signed_date ?? null,
          contract_type: payload.contract_type ?? null,
          contract_status: payload.contract_status ?? null,
          total_rounds: normalizedTotalRounds,
          guidance_max_visit_round: null,
          per_visit_amount: payload.per_visit_amount ?? null,
          total_contract_amount: payload.total_contract_amount ?? null,
          last_visit_date: null,
          required_completion_fields: payload.required_completion_fields ?? [],
          dispatch_policy: payload.dispatch_policy ?? null,
          created_at: timestamp,
          updated_at: timestamp,
        };
        const nextSites = [created, ...sites];
        const nextHeadquarters = headquarters.map((item) =>
          item.id === created.headquarter_id
            ? { ...item, site_count: (item.site_count ?? 0) + 1, updated_at: timestamp }
            : item,
        );
        await setGuestDirectoryCache({
          headquarters: nextHeadquarters,
          sites: nextSites,
        });
        setHeadquarters(nextHeadquarters);
        setSites(nextSites);
        setSelectedHeadquarterId(created.headquarter_id);
        setSelectedSiteId(created.id);
        setSiteForm(EMPTY_SITE_FORM);
        setIsSiteModalOpen(false);
        return;
      }
      const created = await createSafetySite(session.token, payload);
      await refreshDirectory(session.token);
      setSelectedHeadquarterId(created.headquarter_id);
      setSelectedSiteId(created.id);
      setSiteForm(EMPTY_SITE_FORM);
      setIsSiteModalOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '현장 추가에 실패했습니다.');
    } finally {
      setIsMutatingDirectory(false);
    }
  };

  const handleGenerate = async () => {
    if (!sessionChecked || !session) {
      setSubmitError('보고서 작성 환경을 준비하고 있습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const failure = getMetaValidationFailure();
    if (failure) {
      setCurrentStep('meta');
      setStepValidationError(failure.message);
      failure.target?.focus();
      return;
    }

    if (!selectedSite) {
      setCurrentStep('meta');
      setStepValidationError('현장을 먼저 선택해 주세요.');
      siteFieldRef.current?.focus();
      return;
    }

    const startedAt = Date.now();
    setGenerationPhase('generating');
    setSubmitError('');
    const minimumPhotoWarning = buildMinimumPhotoWarning(step2Files.length, step3Files.length);
    setSubmitWarning(minimumPhotoWarning);

    try {
      const created = await createReportRecord(session, {
        customer_name: metaFields.customerName,
        drafter_name: metaFields.drafterName,
        process_summary: metaFields.processSummary,
        progress_rate: metaFields.progressRate,
        site_id: selectedSite.id,
        site_name: metaFields.siteName,
        visit_date: metaFields.visitDate,
        worker_count: metaFields.workerCount,
      });

      const step1Payload = buildGuidedPhotoPayload(step2Files);
      const step2Payload = buildGuidedPhotoPayload(step3Files);
      let currentReport = created;

      if (step1Payload.photos.length > 0) {
        currentReport = await uploadGuidedStepPhotos(session, created.id, 'step-1', step1Payload);
      }

      if (step2Payload.photos.length > 0) {
        currentReport = await uploadGuidedStepPhotos(session, created.id, 'step-2', step2Payload);
      }

      const step3Payload = buildGuidedPhotoPayload(step4Files);
      const step4Payload = buildGuidedPhotoPayload(step5Files);
      const step5Payload = buildGuidedPhotoPayload(step6Files);

      if (step3Payload.photos.length > 0) {
        currentReport = await uploadGuidedStepPhotos(session, created.id, 'step-3', step3Payload);
      }
      if (step4Payload.photos.length > 0) {
        currentReport = await uploadGuidedStepPhotos(session, created.id, 'step-4', step4Payload);
      }
      if (step5Payload.photos.length > 0) {
        currentReport = await uploadGuidedStepPhotos(session, created.id, 'step-5', step5Payload);
      }

      const step1Ids =
        currentReport.payload.photoStepBuckets.find((bucket) => bucket.step === 'step1_overview')
          ?.uploadedPhotoIds ?? [];
      const step2Ids =
        currentReport.payload.photoStepBuckets.find((bucket) => bucket.step === 'step2_hazard')
          ?.uploadedPhotoIds ?? [];

      if (step1Ids.length > 0 && step2Ids.length > 0) {
        currentReport = await generateDraftFromGuidedPhotos(session, created.id, {
          doc3_photo_ids: step1Ids,
          doc7_photo_ids: step2Ids,
        });
      } else if (step1Ids.length > 0 || step2Ids.length > 0) {
        currentReport = await generateDraftFromPhotos(session, created.id, {
          photo_asset_ids: [...step1Ids, ...step2Ids],
        });
      }

      const remaining = Math.max(0, MIN_GENERATION_ANIMATION_MS - (Date.now() - startedAt));
      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining));
      }

      writeGeneratedReportSnapshot(currentReport.id, session, currentReport);
      await deletePersistedValue(DRAFT_STORAGE_KEY);
      router.replace(`/reports/${currentReport.id}?entry=generated`);
    } catch (error) {
      setGenerationPhase('idle');
      setSubmitError(toUserFacingErrorMessage(error));
    }
  };

  const snapshotItems = selectedSite
    ? [
        ['사업장', selectedHeadquarter?.name ?? '-'],
        ['현장명', selectedSite.site_name],
        ['사업장관리번호', selectedHeadquarter?.management_number ?? selectedSite.management_number ?? '-'],
        ['사업개시번호', selectedHeadquarter?.opening_number ?? selectedSite.client_management_number ?? '-'],
        [
          '공사기간',
          selectedSite.project_start_date || selectedSite.project_end_date
            ? `${selectedSite.project_start_date ?? '-'} ~ ${selectedSite.project_end_date ?? '-'}`
            : '-',
        ],
        ['공사금액', formatProjectAmount(selectedSite.project_amount)],
        ['현장 책임자', selectedSite.manager_name ?? '-'],
        [
          '현장 연락처',
          formatContactLine([
            selectedSite.manager_phone,
            selectedSite.site_contact_email ?? '',
          ]),
        ],
        ['현장 주소', selectedSite.site_address ?? '-'],
        [
          '법인등록번호',
          selectedSite.client_corporate_registration_no ??
            selectedHeadquarter?.corporate_registration_no ??
            '-',
        ],
        [
          '사업자등록번호',
          selectedSite.client_business_registration_no ??
            selectedHeadquarter?.business_registration_no ??
            '-',
        ],
        ['면허번호', selectedHeadquarter?.license_no ?? '-'],
        [
          '본사 연락처',
          formatContactLine([
            selectedHeadquarter?.contact_name ?? '',
            selectedHeadquarter?.contact_phone ?? '',
          ]),
        ],
        ['본사 주소', selectedHeadquarter?.address ?? '-'],
        ['총 회차', selectedSite.total_rounds ? `${selectedSite.total_rounds}회` : '-'],
        [
          '현재 회차 기본값',
          selectedSite.guidance_max_visit_round ? `${selectedSite.guidance_max_visit_round}회차` : '1회차',
        ],
      ]
    : [];

  const renderCurrentStep = () => {
    if (currentStep === 'meta') {
      return (
        <section className="erp-panel">
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Step 1</span>
              <h2 className={styles.panelTitle}>사업장/현장과 기본정보</h2>
              <p className={styles.panelDescription}>
                기존 ERP와 같은 기준정보를 먼저 선택하고, 보고서에 반영될 기본값을 확인합니다.
              </p>
            </div>
            <span
              className={`${styles.statusPill} ${
                metaReady ? styles.statusPillReady : styles.statusPillPending
              }`}
            >
              {metaReady ? '작성 준비 완료' : '필수값 확인 필요'}
            </span>
          </div>

          <div className="workspace-header-actions" style={{ marginBottom: 16 }}>
            <button type="button" className="erp-button erp-button-secondary" onClick={openHeadquarterCreate}>
              사업장 추가
            </button>
            <button type="button" className="erp-button erp-button-secondary" onClick={openSiteCreate}>
              현장 추가
            </button>
          </div>

          <div className={styles.metaGrid}>
            <label className={styles.metaField}>
              <span className={styles.metaLabelRow}>
                <span className={styles.metaLabel}>사업장</span>
                <span className={styles.requiredMark}>필수</span>
              </span>
              <select
                ref={headquarterFieldRef}
                className="erp-select"
                value={selectedHeadquarterId}
                onChange={(event) => {
                  setSelectedHeadquarterId(event.target.value);
                  setSelectedSiteId('');
                }}
              >
                <option value="">사업장을 선택하세요</option>
                {headquarters.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.metaField}>
              <span className={styles.metaLabelRow}>
                <span className={styles.metaLabel}>현장</span>
                <span className={styles.requiredMark}>필수</span>
              </span>
              <select
                ref={siteFieldRef}
                className="erp-select"
                value={selectedSiteId}
                onChange={(event) => setSelectedSiteId(event.target.value)}
              >
                <option value="">현장을 선택하세요</option>
                {filteredSites.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.site_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedSite ? (
            <div className={styles.dropzoneCard} style={{ marginTop: 18 }}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Directory Snapshot</span>
                  <h3 className={styles.panelTitle} style={{ fontSize: '1.2rem' }}>
                    보고서에 반영될 현장 기본값
                  </h3>
                </div>
                <span className={styles.statusPill}>원본 디렉터리와 분리 저장</span>
              </div>
              <dl className="detail-grid">
                {snapshotItems.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className={styles.metaGrid} style={{ marginTop: 18 }}>
            <label className={styles.metaField}>
              <span className={styles.metaLabelRow}>
                <span className={styles.metaLabel}>보고서 현장명</span>
                <span className={styles.requiredMark}>필수</span>
              </span>
              <input
                ref={siteNameFieldRef}
                className="erp-input"
                value={metaFields.siteName}
                onChange={(event) =>
                  setMetaFields((current) => ({ ...current, siteName: event.target.value }))
                }
              />
            </label>

            <label className={styles.metaField}>
              <span className={styles.metaLabelRow}>
                <span className={styles.metaLabel}>고객사/건설사명</span>
                <span className={styles.requiredMark}>필수</span>
              </span>
              <input
                ref={customerNameFieldRef}
                className="erp-input"
                value={metaFields.customerName}
                onChange={(event) =>
                  setMetaFields((current) => ({ ...current, customerName: event.target.value }))
                }
              />
            </label>

            <label className={styles.metaField}>
              <span className={styles.metaLabelRow}>
                <span className={styles.metaLabel}>지도일</span>
                <span className={styles.requiredMark}>필수</span>
              </span>
              <input
                ref={visitDateFieldRef}
                className="erp-input"
                type="date"
                value={metaFields.visitDate}
                onChange={(event) =>
                  setMetaFields((current) => ({ ...current, visitDate: event.target.value }))
                }
              />
            </label>

            <label className={styles.metaField}>
              <span className={styles.metaLabelRow}>
                <span className={styles.metaLabel}>작성자</span>
                <span className={styles.requiredMark}>필수</span>
              </span>
              <input
                ref={drafterFieldRef}
                className="erp-input"
                value={metaFields.drafterName}
                onChange={(event) =>
                  setMetaFields((current) => ({ ...current, drafterName: event.target.value }))
                }
              />
            </label>

            <label className={styles.metaField}>
              <span className={styles.metaLabel}>공정률</span>
              <input
                className="erp-input"
                placeholder="예: 65%"
                value={metaFields.progressRate}
                onChange={(event) =>
                  setMetaFields((current) => ({ ...current, progressRate: event.target.value }))
                }
              />
            </label>

            <label className={styles.metaField}>
              <span className={styles.metaLabel}>작업 인원</span>
              <input
                className="erp-input"
                placeholder="예: 24명"
                value={metaFields.workerCount}
                onChange={(event) =>
                  setMetaFields((current) => ({ ...current, workerCount: event.target.value }))
                }
              />
            </label>

            <label className={styles.metaField} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.metaLabel}>공정 개요</span>
              <textarea
                className="erp-input"
                rows={3}
                value={metaFields.processSummary}
                onChange={(event) =>
                  setMetaFields((current) => ({ ...current, processSummary: event.target.value }))
                }
              />
            </label>
          </div>
        </section>
      );
    }

    if (currentStep === 'overview') {
      return (
        <section className="erp-panel">
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Step 2</span>
              <h2 className={styles.panelTitle}>현재 공정 또는 현장 전경 사진</h2>
              <p className={styles.panelDescription}>
                사진 2장만으로 초안을 시작할 수 있습니다. 이 단계에서는 현재 공정 또는 현장 전경 사진 1장을 올려 주세요.
              </p>
            </div>
            <span
              className={`${styles.statusPill} ${
                step2Files.length > 0 ? styles.statusPillReady : styles.statusPillPending
              }`}
            >
              {step2Files.length > 0 ? `${step2Files.length}장 업로드` : '사진 선택 전'}
            </span>
          </div>

          <GuidedImageDropzone
            label="현재 공정 또는 현장 전경 사진"
            files={step2Files}
            helper="현재 공정, 작업 동선, 현장 전경을 보여주는 필수 사진입니다."
            onDelete={(fileId) => deleteFile(setStep2Files, fileId)}
            onFilesSelected={(files) => void appendPreparedFiles(setStep2Files, files, 'site_overview')}
            onRepresentativeChange={(fileId) => setRepresentative(setStep2Files, fileId)}
          />
        </section>
      );
    }

    return (
      <section className="erp-panel">
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Step 3</span>
            <h2 className={styles.panelTitle}>현재 위험요인 사진</h2>
            <p className={styles.panelDescription}>
              현재 위험요인 사진 1장을 올려 주세요. 선택 사진이 있으면 아래에서 함께 보강할 수 있습니다.
            </p>
          </div>
          <span
            className={`${styles.statusPill} ${
              step3Files.length > 0 ? styles.statusPillReady : styles.statusPillPending
            }`}
          >
            {step3Files.length > 0 ? `${step3Files.length}장 업로드` : '사진 선택 전'}
          </span>
        </div>

        <GuidedImageDropzone
          label="현재 위험요인 사진"
          files={step3Files}
          helper="난간, 개구부, 추락·전도·협착 위험, 보호구 미착용 등의 필수 사진입니다."
          onDelete={(fileId) => deleteFile(setStep3Files, fileId)}
          onFilesSelected={(files) => void appendPreparedFiles(setStep3Files, files, 'hazard')}
          onRepresentativeChange={(fileId) => setRepresentative(setStep3Files, fileId)}
        />

        <div className={styles.dropzoneCard} style={{ marginTop: 18 }}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Optional</span>
              <h3 className={styles.panelTitle} style={{ fontSize: '1.2rem' }}>
                선택 사진
              </h3>
              <p className={styles.panelDescription}>
                선택 사진은 필수는 아니지만, 이후 검토 품질을 높이는 데 도움이 됩니다.
              </p>
            </div>
            <span className={styles.statusPill}>선택</span>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <GuidedImageDropzone
              label="이전 지적사항 확인 사진"
              files={step4Files}
              helper="이전 회차 지적사항의 이행 여부를 보여주는 선택 사진입니다."
              onDelete={(fileId) => deleteFile(setStep4Files, fileId)}
              onFilesSelected={(files) => void appendPreparedFiles(setStep4Files, files, 'followup')}
              onRepresentativeChange={(fileId) => setRepresentative(setStep4Files, fileId)}
            />
            <GuidedImageDropzone
              label="교육 및 지원활동 사진"
              files={step5Files}
              helper="교육, 자료보급, 현장 지원활동이 있으면 선택 사진으로 추가합니다."
              onDelete={(fileId) => deleteFile(setStep5Files, fileId)}
              onFilesSelected={(files) => void appendPreparedFiles(setStep5Files, files, 'education')}
              onRepresentativeChange={(fileId) => setRepresentative(setStep5Files, fileId)}
            />
            <GuidedImageDropzone
              label="추가 현장 전경 사진"
              files={step6Files}
              helper="현장 전경을 더 보강하고 싶을 때 추가 선택 사진으로 올립니다."
              onDelete={(fileId) => deleteFile(setStep6Files, fileId)}
              onFilesSelected={(files) => void appendPreparedFiles(setStep6Files, files, 'site_overview')}
              onRepresentativeChange={(fileId) => setRepresentative(setStep6Files, fileId)}
            />
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="erp-page">
      <section className="page-header-card">
        <div>
          <span className="page-kicker">새 보고서 작성</span>
          <h1 className="page-title">기술지도 보고서 생성</h1>
          <p className="page-meta-line">
            사업장과 현장을 먼저 선택한 뒤 사진 2장만 올려도 기술지도 보고서 초안을 시작할 수 있습니다.
          </p>
        </div>
        <div className="workspace-header-actions">
          <button type="button" className="erp-button erp-button-secondary" onClick={() => router.push('/reports')}>
            목록으로
          </button>
        </div>
      </section>

      <section className={styles.flowShell}>
        <div className={styles.stepRail}>
          {DISPLAY_STEPS.map((step) => {
            const isActive = currentStep === step.key;
            const isLocked = !canOpenStep(step.key);
            return (
              <button
                key={step.key}
                type="button"
                className={`${styles.stepCard} ${isActive ? styles.stepCardActive : ''}`}
                disabled={isLocked}
                onClick={() => setCurrentStep(step.key)}
              >
                <span className={styles.stepBadge}>{step.number}</span>
                <strong className={styles.stepTitle}>{step.title}</strong>
                <span className={styles.stepHelper}>{step.helper}</span>
              </button>
            );
          })}
        </div>

        {submitError ? <div className="row-meta">{submitError}</div> : null}
        {submitWarning ? <div className="row-meta">{submitWarning}</div> : null}
        {stepValidationError ? <div className="row-meta">{stepValidationError}</div> : null}
        {generationHelpText ? <div className="row-meta">{generationHelpText}</div> : null}

        {renderCurrentStep()}

        <section className="erp-panel">
          <div className="workspace-header-actions">
            <button
              type="button"
              className="erp-button erp-button-secondary"
              onClick={() => moveStep('prev')}
              disabled={currentStep === 'meta'}
            >
              이전 단계
            </button>
            {currentStep === 'hazard' ? (
              <button
                type="button"
                className="erp-button erp-button-primary"
                onClick={() => void handleGenerate()}
                disabled={!canAttemptGenerate}
              >
                {generationPhase === 'generating' ? '초안 생성 중...' : '보고서 생성'}
              </button>
            ) : (
              <button
                type="button"
                className="erp-button erp-button-secondary"
                onClick={() => moveStep('next')}
              >
                다음 단계
              </button>
            )}
          </div>
        </section>
      </section>

      <HeadquarterEditorModal
        busy={isMutatingDirectory}
        canSubmit={Boolean(headquarterForm.name.trim())}
        editingId="create"
        form={headquarterForm}
        onClose={() => {
          if (!isMutatingDirectory) {
            setIsHeadquarterModalOpen(false);
          }
        }}
        onFormChange={setHeadquarterForm}
        onSubmit={submitHeadquarterCreate}
        open={isHeadquarterModalOpen}
      />

      <SiteEditorModal
        busy={isMutatingDirectory}
        editingId={isSiteModalOpen ? 'create' : null}
        form={siteForm}
        headquarters={headquarters.map((item) => ({ id: item.id, name: item.name }))}
        isCreateReady={isSiteCreateReady(siteForm, selectedHeadquarterId || null)}
        lockedHeadquarterId={selectedHeadquarterId || null}
        onClose={() => {
          if (!isMutatingDirectory) {
            setIsSiteModalOpen(false);
          }
        }}
        onCreateHeadquarter={
          session
            ? async (input) => {
                if (!canUseReportServerApis(session)) {
                  const timestamp = new Date().toISOString();
                  const created: SafetyHeadquarter = {
                    id: `local-hq-${Date.now()}`,
                    name: input.name,
                    management_number: input.management_number ?? null,
                    opening_number: input.opening_number ?? null,
                    business_registration_no: input.business_registration_no ?? null,
                    corporate_registration_no: input.corporate_registration_no ?? null,
                    license_no: input.license_no ?? null,
                    contact_name: input.contact_name ?? null,
                    contact_phone: input.contact_phone ?? null,
                    address: input.address ?? null,
                    memo: input.memo ?? null,
                    is_active: input.is_active ?? true,
                    lifecycle_status: input.lifecycle_status ?? 'active',
                    site_count: 0,
                    created_at: timestamp,
                    updated_at: timestamp,
                  };
                  const nextHeadquarters = [created, ...headquarters];
                  await setGuestDirectoryCache({
                    headquarters: nextHeadquarters,
                    sites,
                  });
                  setHeadquarters(nextHeadquarters);
                  setSelectedHeadquarterId(created.id);
                  return created;
                }
                const created = await createSafetyHeadquarter(session.token, input);
                await refreshDirectory(session.token);
                return created;
              }
            : undefined
        }
        onSubmit={submitSiteCreate}
        setForm={setSiteForm}
      />
    </div>
  );
}
