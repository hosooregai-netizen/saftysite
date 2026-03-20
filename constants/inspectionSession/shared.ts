import {
  DEFAULT_DOCUMENT_SOURCES,
  INSPECTION_SECTIONS,
  WORK_PLAN_ITEMS,
} from '@/constants/inspectionSession/catalog';
import type {
  AdminSiteSnapshot,
  ChecklistQuestion,
  InspectionDocumentMeta,
  InspectionDocumentSource,
  InspectionSectionKey,
  WorkPlanCheckKey,
  WorkPlanCheckStatus,
} from '@/types/inspectionSession';

export type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

export function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeTimestamp(value: unknown, fallback: string): string {
  return normalizeText(value) || fallback;
}

export function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'y', 'checked'].includes(value.trim().toLowerCase());
  }
  return false;
}

export function normalizeSectionKey(value: unknown): InspectionSectionKey {
  const normalized = normalizeText(value);
  if (INSPECTION_SECTIONS.some((section) => section.key === normalized)) {
    return normalized as InspectionSectionKey;
  }

  switch (normalized) {
    case 'cover':
      return 'doc2';
    case 'siteOverview':
      return 'doc3';
    case 'previousGuidance':
      return 'doc4';
    case 'currentHazards':
      return 'doc7';
    case 'futureRisks':
      return 'doc8';
    case 'support':
      return 'doc10';
    default:
      return 'doc1';
  }
}

export function normalizeReportNumber(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0;
}

export function generateId(prefix: string): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomPart}`;
}

export function createTimestamp(): string {
  return new Date().toISOString();
}

export function createDocumentMeta(source: InspectionDocumentSource): InspectionDocumentMeta {
  return {
    status: source === 'readonly' ? 'completed' : 'not_started',
    lastEditedAt: null,
    source,
  };
}

export function createDocumentMetaMap(): Record<
  InspectionSectionKey,
  InspectionDocumentMeta
> {
  return {
    doc1: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc1),
    doc2: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc2),
    doc3: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc3),
    doc4: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc4),
    doc5: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc5),
    doc6: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc6),
    doc7: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc7),
    doc8: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc8),
    doc9: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc9),
    doc10: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc10),
    doc11: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc11),
    doc12: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc12),
    doc13: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc13),
    doc14: createDocumentMeta(DEFAULT_DOCUMENT_SOURCES.doc14),
  };
}

export function createEmptyAdminSiteSnapshot(
  initial: Partial<AdminSiteSnapshot> = {}
): AdminSiteSnapshot {
  return {
    customerName: '',
    siteName: '',
    assigneeName: '',
    siteManagementNumber: '',
    businessStartNumber: '',
    constructionPeriod: '',
    constructionAmount: '',
    siteManagerName: '',
    siteContactEmail: '',
    siteAddress: '',
    companyName: '',
    corporationRegistrationNumber: '',
    businessRegistrationNumber: '',
    licenseNumber: '',
    headquartersContact: '',
    headquartersAddress: '',
    ...initial,
  };
}

export function createWorkPlanChecks(
  initial: Partial<Record<WorkPlanCheckKey, WorkPlanCheckStatus>> = {}
): Record<WorkPlanCheckKey, WorkPlanCheckStatus> {
  return WORK_PLAN_ITEMS.reduce<Record<WorkPlanCheckKey, WorkPlanCheckStatus>>(
    (accumulator, item) => {
      accumulator[item.key] = initial[item.key] ?? 'not_applicable';
      return accumulator;
    },
    {} as Record<WorkPlanCheckKey, WorkPlanCheckStatus>
  );
}

export function createChecklistQuestions(
  prompts: readonly string[],
  prefix: string,
  initial: Partial<ChecklistQuestion>[] = []
): ChecklistQuestion[] {
  return prompts.map((prompt, index) => ({
    id: initial[index]?.id ?? generateId(`${prefix}-${index + 1}`),
    prompt,
    rating: initial[index]?.rating ?? '',
    note: initial[index]?.note ?? '',
  }));
}
