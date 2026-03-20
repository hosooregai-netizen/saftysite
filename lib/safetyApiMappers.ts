import {
  DEFAULT_CASE_FEED,
  DEFAULT_SAFETY_INFOS,
  LEGAL_REFERENCE_LIBRARY,
  createInspectionSession,
  finalizeInspectionSession,
  getSessionTitle,
  normalizeInspectionSession,
} from '@/constants/inspectionSession';
import type {
  SafetyContentItem,
  SafetyLegalReference,
  SafetyMasterData,
  SafetyReport,
  SafetySite,
  SafetyUpsertReportInput,
  SafetyUser,
} from '@/types/backend';
import type {
  AdminSiteSnapshot,
  CaseFeedItem,
  InspectionSession,
  InspectionSite,
  SafetyInfoItem,
} from '@/types/inspectionSession';

const ADMIN_ROLES = new Set(['super_admin', 'admin', 'controller']);

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function formatDateRange(start: string | null, end: string | null): string {
  if (start && end) return `${start} ~ ${end}`;
  return start || end || '';
}

function formatProjectAmount(value: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return `${value.toLocaleString('ko-KR')}원`;
}

function buildHeadquarterContact(site: SafetySite): string {
  const contactName = normalizeText(site.headquarter_detail?.contact_name);
  const contactPhone = normalizeText(site.headquarter_detail?.contact_phone);

  if (contactName && contactPhone) return `${contactName} / ${contactPhone}`;
  return contactPhone || contactName;
}

export function mapSafetySiteToAdminSnapshot(site: SafetySite): AdminSiteSnapshot {
  const headquarterName =
    normalizeText(site.headquarter_detail?.name) || normalizeText(site.headquarter?.name);

  return {
    customerName: headquarterName,
    siteName: normalizeText(site.site_name),
    assigneeName: normalizeText(site.assigned_user?.name),
    siteManagementNumber: normalizeText(site.management_number),
    businessStartNumber: normalizeText(site.site_code),
    constructionPeriod: formatDateRange(site.project_start_date, site.project_end_date),
    constructionAmount: formatProjectAmount(site.project_amount),
    siteManagerName: normalizeText(site.manager_name),
    siteContactEmail: normalizeText(site.manager_phone),
    siteAddress: normalizeText(site.site_address),
    companyName: headquarterName,
    corporationRegistrationNumber: normalizeText(
      site.headquarter_detail?.corporate_registration_no
    ),
    businessRegistrationNumber: normalizeText(
      site.headquarter_detail?.business_registration_no
    ),
    licenseNumber: normalizeText(site.headquarter_detail?.license_no),
    headquartersContact: buildHeadquarterContact(site),
    headquartersAddress: normalizeText(site.headquarter_detail?.address),
  };
}

export function mapSafetySiteToInspectionSite(site: SafetySite): InspectionSite {
  const adminSiteSnapshot = mapSafetySiteToAdminSnapshot(site);

  return {
    id: site.id,
    title: adminSiteSnapshot.siteName || adminSiteSnapshot.customerName || '현장',
    customerName: adminSiteSnapshot.customerName,
    siteName: adminSiteSnapshot.siteName,
    assigneeName: adminSiteSnapshot.assigneeName,
    adminSiteSnapshot,
    createdAt: site.created_at,
    updatedAt: site.updated_at,
  };
}

function contentBodyToText(body: unknown): string {
  if (typeof body === 'string') return body.trim();

  const record = asRecord(body);
  return (
    normalizeText(record.body) ||
    normalizeText(record.summary) ||
    normalizeText(record.description) ||
    normalizeText(record.content) ||
    normalizeText(record.text)
  );
}

function contentBodyToImageUrl(body: unknown): string {
  const record = asRecord(body);
  return (
    normalizeText(record.image_url) ||
    normalizeText(record.imageUrl) ||
    normalizeText(record.thumbnail_url) ||
    normalizeText(record.thumbnailUrl)
  );
}

function mapDisasterCaseItem(
  item: SafetyContentItem,
  fallback?: CaseFeedItem
): CaseFeedItem {
  return {
    id: item.id,
    title: normalizeText(item.title) || fallback?.title || '재해 사례',
    summary: contentBodyToText(item.body) || fallback?.summary || '',
    imageUrl: contentBodyToImageUrl(item.body) || fallback?.imageUrl || '',
  };
}

function mapSafetyInfoItem(
  item: SafetyContentItem,
  fallback?: SafetyInfoItem
): SafetyInfoItem {
  return {
    id: item.id,
    title: normalizeText(item.title) || fallback?.title || '안전 정보',
    body: contentBodyToText(item.body) || fallback?.body || '',
    imageUrl: contentBodyToImageUrl(item.body) || fallback?.imageUrl || '',
  };
}

function mapLegalReferenceItem(item: SafetyContentItem): SafetyLegalReference {
  const body = asRecord(item.body);

  return {
    id: item.id,
    title: normalizeText(item.title),
    body: contentBodyToText(item.body),
    referenceMaterial1:
      normalizeText(body.referenceMaterial1) ||
      normalizeText(body.reference_material_1) ||
      normalizeText(body.material1),
    referenceMaterial2:
      normalizeText(body.referenceMaterial2) ||
      normalizeText(body.reference_material_2) ||
      normalizeText(body.material2),
  };
}

export function buildSafetyMasterData(items: SafetyContentItem[]): SafetyMasterData {
  const disasterCases = items
    .filter((item) => item.content_type === 'disaster_case')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item, index) => mapDisasterCaseItem(item, DEFAULT_CASE_FEED[index]));

  const safetyInfos = items
    .filter((item) => item.content_type === 'safety_news')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item, index) => mapSafetyInfoItem(item, DEFAULT_SAFETY_INFOS[index]));

  const legalReferences = items
    .filter((item) => item.content_type === 'legal_reference')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map(mapLegalReferenceItem)
    .filter((item) => item.title || item.body);

  const correctionResultOptions = items
    .filter((item) => item.content_type === 'correction_result_option')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item) => normalizeText(item.title))
    .filter(Boolean);

  const measurementTemplates = items
    .filter((item) => item.content_type === 'measurement_template')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item) => contentBodyToText(item.body) || normalizeText(item.title))
    .filter(Boolean);

  return {
    caseFeed:
      disasterCases.length > 0 ? disasterCases : DEFAULT_CASE_FEED.map((item) => ({ ...item })),
    safetyInfos:
      safetyInfos.length > 0 ? safetyInfos : DEFAULT_SAFETY_INFOS.map((item) => ({ ...item })),
    legalReferences:
      legalReferences.length > 0
        ? legalReferences
        : LEGAL_REFERENCE_LIBRARY.map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body,
            referenceMaterial1: item.referenceMaterial1,
            referenceMaterial2: item.referenceMaterial2,
          })),
    correctionResultOptions,
    measurementTemplates,
  };
}

export function mergeMasterDataIntoSession(
  session: InspectionSession,
  masterData: SafetyMasterData
): InspectionSession {
  return finalizeInspectionSession({
    ...session,
    document13Cases: masterData.caseFeed.map((item) => ({ ...item })),
    document14SafetyInfos: masterData.safetyInfos.map((item) => ({ ...item })),
  });
}

export function mapSafetyReportToInspectionSession(
  report: SafetyReport,
  site: InspectionSite,
  masterData: SafetyMasterData
): InspectionSession {
  const payload = asRecord(report.payload);
  const payloadMeta = asRecord(payload.meta);
  const reportMeta = asRecord(report.meta);

  const normalized = normalizeInspectionSession({
    ...payload,
    id: report.report_key,
    siteKey: report.site_id,
    reportNumber:
      typeof report.visit_round === 'number' ? report.visit_round : payload.reportNumber,
    createdAt: normalizeText(payload.createdAt) || report.created_at,
    updatedAt: normalizeText(payload.updatedAt) || report.updated_at,
    lastSavedAt:
      report.last_autosaved_at ||
      normalizeText(payload.lastSavedAt) ||
      report.updated_at,
    adminSiteSnapshot: payload.adminSiteSnapshot || site.adminSiteSnapshot,
    meta: {
      ...payloadMeta,
      siteName:
        normalizeText(payloadMeta.siteName) ||
        normalizeText(reportMeta.siteName) ||
        site.siteName,
      reportDate:
        normalizeText(payloadMeta.reportDate) ||
        normalizeText(report.visit_date) ||
        '',
      drafter:
        normalizeText(payloadMeta.drafter) ||
        normalizeText(reportMeta.drafter) ||
        site.assigneeName,
      reviewer:
        normalizeText(payloadMeta.reviewer) || normalizeText(reportMeta.reviewer),
      approver:
        normalizeText(payloadMeta.approver) || normalizeText(reportMeta.approver),
    },
  });

  return mergeMasterDataIntoSession(normalized, masterData);
}

function parseProgressRate(value: string): number | null {
  const normalized = value.replace(/[%\s]/g, '');
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function parsePositiveInteger(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export function buildSafetyReportUpsertInput(
  session: InspectionSession,
  site: InspectionSite
): SafetyUpsertReportInput {
  return {
    report_key: session.id,
    report_title: getSessionTitle(session),
    site_id: site.id,
    visit_date: session.meta.reportDate || null,
    visit_round: session.reportNumber || null,
    total_round: parsePositiveInteger(session.document2Overview.totalVisitCount),
    progress_rate: parseProgressRate(session.document2Overview.progressRate),
    payload: {
      ...session,
      siteKey: site.id,
      adminSiteSnapshot: site.adminSiteSnapshot,
    },
    meta: {
      siteName: session.meta.siteName,
      drafter: session.meta.drafter,
      reviewer: session.meta.reviewer,
      approver: session.meta.approver,
      currentSection: session.currentSection,
      reportNumber: session.reportNumber,
    },
    status: 'draft',
    create_revision: false,
    revision_reason: 'autosave',
  };
}

export function createNewSafetySession(
  site: InspectionSite,
  reportNumber: number,
  masterData: SafetyMasterData,
  initial?: {
    meta?: Partial<InspectionSession['meta']>;
  }
): InspectionSession {
  return mergeMasterDataIntoSession(
    createInspectionSession(
      {
        adminSiteSnapshot: site.adminSiteSnapshot,
        meta: {
          siteName: site.siteName,
          drafter: site.assigneeName,
          ...initial?.meta,
        },
        document13Cases: masterData.caseFeed,
        document14SafetyInfos: masterData.safetyInfos,
      },
      site.id,
      reportNumber
    ),
    masterData
  );
}

export function isSafetyAdmin(user: Pick<SafetyUser, 'role'> | null): boolean {
  return Boolean(user && ADMIN_ROLES.has(user.role));
}
