import type {
  SafetyInspectionSchedule,
  SafetyInspectionScheduleStatus,
  SiteContractProfile,
  SiteContractStatus,
  SiteContractType,
} from '@/types/admin';
import type { SafetyPhotoAsset } from '@/types/photos';
import type { SafetySite } from '@/types/backend';

const SITE_META_MARKER = '[SAFETY_SITE_META]';

type SiteContractFieldSource = Pick<
  SafetySite,
  | 'contract_date'
  | 'contract_status'
  | 'contract_type'
  | 'per_visit_amount'
  | 'total_contract_amount'
  | 'total_rounds'
>;

type SiteMemoWithContractFields = Pick<SafetySite, 'memo'> & Partial<SiteContractFieldSource>;

interface StoredSiteMetaEnvelope {
  contractProfile?: Partial<SiteContractProfile>;
  photoAssets?: Array<Partial<SafetyPhotoAsset>>;
  requiredCompletionFields?: string[];
  schedules?: Array<Partial<SafetyInspectionSchedule>>;
  note?: string;
}

const EMPTY_CONTRACT_PROFILE: SiteContractProfile = {
  contractDate: '',
  contractStatus: '',
  contractType: '',
  perVisitAmount: null,
  totalContractAmount: null,
  totalRounds: null,
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizePositiveInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : 0;
}

function normalizeContractType(value: unknown): SiteContractType {
  switch (value) {
    case 'private':
    case 'negotiated':
    case 'bid':
    case 'maintenance':
    case 'other':
      return value;
    default:
      return '';
  }
}

function normalizeContractStatus(value: unknown): SiteContractStatus {
  switch (value) {
    case 'ready':
    case 'active':
    case 'paused':
    case 'completed':
      return value;
    default:
      return '';
  }
}

function normalizeScheduleStatus(value: unknown): SafetyInspectionScheduleStatus {
  switch (value) {
    case 'completed':
    case 'canceled':
      return value;
    default:
      return 'planned';
  }
}

function normalizePhotoAsset(
  value: Partial<SafetyPhotoAsset> | null | undefined,
): SafetyPhotoAsset | null {
  if (!value) return null;

  const id = normalizeText(value.id);
  const siteId = normalizeText(value.siteId);
  const headquarterId = normalizeText(value.headquarterId);
  const originalPath = normalizeText(value.originalPath);

  if (!id || !siteId || !headquarterId || !originalPath) {
    return null;
  }

  return {
    id,
    capturedAt: normalizeText(value.capturedAt),
    contentType: normalizeText(value.contentType),
    createdAt: normalizeText(value.createdAt),
    exifJson:
      value.exifJson && typeof value.exifJson === 'object'
        ? (value.exifJson as Record<string, unknown>)
        : null,
    fileName: normalizeText(value.fileName),
    gpsLatitude: normalizeNumber(value.gpsLatitude),
    gpsLongitude: normalizeNumber(value.gpsLongitude),
    headquarterId,
    originalPath,
    sizeBytes: normalizeNumber(value.sizeBytes) ?? 0,
    siteId,
    sourceKind: 'album_upload',
    thumbnailPath: normalizeText(value.thumbnailPath),
    uploadedByName: normalizeText(value.uploadedByName),
    uploadedByUserId: normalizeText(value.uploadedByUserId),
  };
}

function parseEnvelope(memo: string | null | undefined): StoredSiteMetaEnvelope | null {
  const normalized = memo?.trim() || '';
  if (!normalized.includes(SITE_META_MARKER)) {
    return null;
  }

  const markerIndex = normalized.lastIndexOf(SITE_META_MARKER);
  const jsonText = normalized.slice(markerIndex + SITE_META_MARKER.length).trim();
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as StoredSiteMetaEnvelope;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function normalizeSiteContractProfile(
  value: Partial<SiteContractProfile> | Partial<SiteContractFieldSource> | null | undefined,
): SiteContractProfile {
  const record = value && typeof value === 'object' ? value : null;
  const hasCamelKeys = Boolean(
    record &&
      ('contractDate' in record ||
        'contractStatus' in record ||
        'contractType' in record ||
        'perVisitAmount' in record ||
        'totalContractAmount' in record ||
        'totalRounds' in record),
  );

  return {
    contractDate:
      normalizeText(
        hasCamelKeys
          ? (record as Partial<SiteContractProfile>)?.contractDate
          : (record as Partial<SiteContractFieldSource> | null)?.contract_date,
      ),
    contractStatus: normalizeContractStatus(
      hasCamelKeys
        ? (record as Partial<SiteContractProfile>)?.contractStatus
        : (record as Partial<SiteContractFieldSource> | null)?.contract_status,
    ),
    contractType: normalizeContractType(
      hasCamelKeys
        ? (record as Partial<SiteContractProfile>)?.contractType
        : (record as Partial<SiteContractFieldSource> | null)?.contract_type,
    ),
    perVisitAmount: normalizeNumber(
      hasCamelKeys
        ? (record as Partial<SiteContractProfile>)?.perVisitAmount
        : (record as Partial<SiteContractFieldSource> | null)?.per_visit_amount,
    ),
    totalContractAmount: normalizeNumber(
      hasCamelKeys
        ? (record as Partial<SiteContractProfile>)?.totalContractAmount
        : (record as Partial<SiteContractFieldSource> | null)?.total_contract_amount,
    ),
    totalRounds: normalizeNumber(
      hasCamelKeys
        ? (record as Partial<SiteContractProfile>)?.totalRounds
        : (record as Partial<SiteContractFieldSource> | null)?.total_rounds,
    ),
  };
}

function normalizeSiteInspectionSchedule(
  value: Partial<SafetyInspectionSchedule> | null | undefined,
): SafetyInspectionSchedule | null {
  if (!value) return null;

  const id = normalizeText(value.id);
  const siteId = normalizeText(value.siteId);
  const roundNo = normalizePositiveInteger(value.roundNo);

  if (!id || !siteId || roundNo <= 0) {
    return null;
  }

  return {
    id,
    assigneeName: normalizeText(value.assigneeName),
    assigneeUserId: normalizeText(value.assigneeUserId),
    exceptionMemo: normalizeText(value.exceptionMemo),
    exceptionReasonCode: normalizeText(value.exceptionReasonCode),
    headquarterId: normalizeText(value.headquarterId),
    headquarterName: normalizeText(value.headquarterName),
    isConflicted: Boolean(value.isConflicted),
    isOutOfWindow: Boolean(value.isOutOfWindow),
    isOverdue: Boolean(value.isOverdue),
    linkedReportKey: normalizeText(value.linkedReportKey),
    plannedDate: normalizeText(value.plannedDate),
    roundNo,
    siteId,
    siteName: normalizeText(value.siteName),
    status: normalizeScheduleStatus(value.status),
    windowEnd: normalizeText(value.windowEnd),
    windowStart: normalizeText(value.windowStart),
  };
}

export function parseSiteMemoNote(memo: string | null | undefined): string {
  const normalized = memo?.trim() || '';
  if (!normalized.includes(SITE_META_MARKER)) {
    return normalized;
  }

  const markerIndex = normalized.lastIndexOf(SITE_META_MARKER);
  return normalized.slice(0, markerIndex).trim();
}

export function parseSiteContractProfile(
  siteOrMemo: SiteMemoWithContractFields | string | null | undefined,
): SiteContractProfile {
  if (siteOrMemo && typeof siteOrMemo !== 'string') {
    const directProfile = normalizeSiteContractProfile(siteOrMemo);
    if (hasSiteContractProfile(directProfile)) {
      return directProfile;
    }
  }

  const memo = typeof siteOrMemo === 'string' || siteOrMemo == null ? siteOrMemo : siteOrMemo.memo;
  const envelope = parseEnvelope(memo);
  return normalizeSiteContractProfile(envelope?.contractProfile ?? EMPTY_CONTRACT_PROFILE);
}

export function parseSiteInspectionSchedules(
  siteOrMemo: SiteMemoWithContractFields | string | null | undefined,
): SafetyInspectionSchedule[] {
  const memo = typeof siteOrMemo === 'string' || siteOrMemo == null ? siteOrMemo : siteOrMemo.memo;
  const envelope = parseEnvelope(memo);
  if (!Array.isArray(envelope?.schedules)) {
    return [];
  }

  return envelope.schedules
    .map((item) => normalizeSiteInspectionSchedule(item))
    .filter((item): item is SafetyInspectionSchedule => Boolean(item));
}

export function parseSitePhotoAssets(
  siteOrMemo: SiteMemoWithContractFields | string | null | undefined,
): SafetyPhotoAsset[] {
  const memo = typeof siteOrMemo === 'string' || siteOrMemo == null ? siteOrMemo : siteOrMemo.memo;
  const envelope = parseEnvelope(memo);
  if (!Array.isArray(envelope?.photoAssets)) {
    return [];
  }

  return envelope.photoAssets
    .map((item) => normalizePhotoAsset(item))
    .filter((item): item is SafetyPhotoAsset => Boolean(item));
}

export function parseSiteRequiredCompletionFields(
  siteOrMemo: SiteMemoWithContractFields | string | null | undefined,
): string[] {
  const memo = typeof siteOrMemo === 'string' || siteOrMemo == null ? siteOrMemo : siteOrMemo.memo;
  const envelope = parseEnvelope(memo);
  if (!Array.isArray(envelope?.requiredCompletionFields)) {
    return [];
  }

  return envelope.requiredCompletionFields.map((item) => normalizeText(item)).filter(Boolean);
}

export function hasSiteContractProfile(profile: SiteContractProfile | null | undefined): boolean {
  return Boolean(
    profile &&
      (profile.contractDate ||
        profile.contractStatus ||
        profile.contractType ||
        profile.perVisitAmount != null ||
        profile.totalContractAmount != null ||
        profile.totalRounds != null),
  );
}

export function buildSiteMemoWithContractProfile(
  note: string | null | undefined,
  profile: Partial<SiteContractProfile> | null | undefined,
  options?: {
    existingMemo?: string | null;
    photoAssets?: SafetyPhotoAsset[];
    requiredCompletionFields?: string[];
    schedules?: SafetyInspectionSchedule[];
  },
): string | null {
  const normalizedNote = note?.trim() || '';
  const normalizedProfile = normalizeSiteContractProfile(profile);
  const existingEnvelope = parseEnvelope(options?.existingMemo);
  const normalizedPhotoAssets = Array.isArray(options?.photoAssets)
    ? options.photoAssets
        .map((item) => normalizePhotoAsset(item))
        .filter((item): item is SafetyPhotoAsset => Boolean(item))
    : parseSitePhotoAssets(options?.existingMemo);
  const normalizedSchedules = Array.isArray(options?.schedules)
    ? options.schedules
        .map((item) => normalizeSiteInspectionSchedule(item))
        .filter((item): item is SafetyInspectionSchedule => Boolean(item))
    : parseSiteInspectionSchedules(options?.existingMemo);
  const normalizedRequiredCompletionFields = Array.isArray(options?.requiredCompletionFields)
    ? options.requiredCompletionFields.map((item) => normalizeText(item)).filter(Boolean)
    : parseSiteRequiredCompletionFields(options?.existingMemo);
  const hasProfile = hasSiteContractProfile(normalizedProfile);

  if (
    !normalizedNote &&
    !hasProfile &&
    normalizedSchedules.length === 0 &&
    normalizedPhotoAssets.length === 0 &&
    normalizedRequiredCompletionFields.length === 0
  ) {
    return null;
  }

  if (
    !hasProfile &&
    normalizedSchedules.length === 0 &&
    normalizedPhotoAssets.length === 0 &&
    normalizedRequiredCompletionFields.length === 0
  ) {
    return normalizedNote || null;
  }

  const envelope: StoredSiteMetaEnvelope = {
    ...existingEnvelope,
    contractProfile: hasProfile ? normalizedProfile : undefined,
    photoAssets: normalizedPhotoAssets.length > 0 ? normalizedPhotoAssets : undefined,
    requiredCompletionFields:
      normalizedRequiredCompletionFields.length > 0 ? normalizedRequiredCompletionFields : undefined,
    schedules: normalizedSchedules.length > 0 ? normalizedSchedules : undefined,
  };

  return `${normalizedNote ? `${normalizedNote}\n\n` : ''}${SITE_META_MARKER}${JSON.stringify(envelope)}`;
}

export function buildSiteMemoWithPhotoAssets(
  siteOrMemo: SiteMemoWithContractFields | string | null | undefined,
  photoAssets: SafetyPhotoAsset[],
): string | null {
  const existingMemo = typeof siteOrMemo === 'string' || siteOrMemo == null ? siteOrMemo : siteOrMemo.memo;
  return buildSiteMemoWithContractProfile(
    parseSiteMemoNote(existingMemo),
    parseSiteContractProfile(siteOrMemo),
    {
      existingMemo,
      photoAssets,
      requiredCompletionFields: parseSiteRequiredCompletionFields(siteOrMemo),
      schedules: parseSiteInspectionSchedules(siteOrMemo),
    },
  );
}

export function buildSiteMemoWithRequiredCompletionFields(
  siteOrMemo: SiteMemoWithContractFields | string | null | undefined,
  requiredCompletionFields: string[],
): string | null {
  const existingMemo = typeof siteOrMemo === 'string' || siteOrMemo == null ? siteOrMemo : siteOrMemo.memo;
  return buildSiteMemoWithContractProfile(
    parseSiteMemoNote(existingMemo),
    parseSiteContractProfile(siteOrMemo),
    {
      existingMemo,
      photoAssets: parseSitePhotoAssets(siteOrMemo),
      requiredCompletionFields,
      schedules: parseSiteInspectionSchedules(siteOrMemo),
    },
  );
}
