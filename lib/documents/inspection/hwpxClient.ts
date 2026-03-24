'use client';

import JSZip from 'jszip';

import type { ChecklistRating, InspectionSession } from '@/types/inspectionSession';

type RepeatBlockPath = 'sec7.findings' | 'sec8.plans' | 'sec11.education' | 'sec12.activities';

interface TemplateBindingData {
  text: Record<string, string>;
  images: Record<string, string>;
  repeatCounts: Record<RepeatBlockPath, number>;
  deferred: string[];
  warnings: string[];
  truncated: Record<string, number>;
}

interface TemplateImagePlaceholder {
  table: number;
  row: number;
  col: number;
  placeholderPath: string;
  binaryItemId: string;
  repeatBlockPath?: RepeatBlockPath;
  deferred?: boolean;
}

interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
}

interface ResolvedImageAsset {
  buffer: Uint8Array;
  extension: string;
  mediaType: string;
}

const TEMPLATE_FILENAME = '기술지도 수동보고서 앱 - 서식_4.annotated.hwpx';
const TEMPLATE_URL = `/templates/inspection/${encodeURIComponent(TEMPLATE_FILENAME)}`;
const BLANK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5cH7QAAAAASUVORK5CYII=';

const WORK_PLAN_PLACEHOLDERS = [
  { sourceKey: 'towerCrane', placeholderPath: 'sec2.work_plan_checks.tower_crane' },
  { sourceKey: 'tunnelExcavation', placeholderPath: 'sec2.work_plan_checks.tunnel_excavation' },
  { sourceKey: 'vehicleLoadingMachine', placeholderPath: 'sec2.work_plan_checks.vehicle_loading_machine' },
  { sourceKey: 'bridgeWork', placeholderPath: 'sec2.work_plan_checks.bridge_work' },
  { sourceKey: 'constructionMachine', placeholderPath: 'sec2.work_plan_checks.construction_machine' },
  { sourceKey: 'quarryWork', placeholderPath: 'sec2.work_plan_checks.quarry_work' },
  { sourceKey: 'chemicalFacility', placeholderPath: 'sec2.work_plan_checks.chemical_facility' },
  { sourceKey: 'buildingDemolition', placeholderPath: 'sec2.work_plan_checks.building_demolition' },
  { sourceKey: 'electricalWork', placeholderPath: 'sec2.work_plan_checks.electrical_work' },
  { sourceKey: 'heavyMaterialHandling', placeholderPath: 'sec2.work_plan_checks.heavy_material_handling' },
  { sourceKey: 'earthwork', placeholderPath: 'sec2.work_plan_checks.earthwork' },
  {
    sourceKey: 'railwayFacilityMaintenance',
    placeholderPath: 'sec2.work_plan_checks.railway_facility_maintenance',
  },
] as const;

const REPEAT_BLOCKS: RepeatBlockPath[] = ['sec7.findings', 'sec8.plans', 'sec11.education', 'sec12.activities'];

const DEFERRED_SECTIONS = ['sec5', 'section15_removed_from_binding', 'sec10.measurements[*].photo_image'];

const IMAGE_EXTENSION_TO_MEDIA_TYPE: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
};

const IMAGE_MEDIA_TYPE_TO_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/webp': 'webp',
};

let templateBufferPromise: Promise<ArrayBuffer> | null = null;

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

const BLANK_PNG_ASSET: ResolvedImageAsset = {
  buffer: decodeBase64ToBytes(BLANK_PNG_BASE64),
  extension: 'png',
  mediaType: 'image/png',
};

const TEXT_PLACEHOLDERS = [
  'cover.site_name',
  'cover.report_date',
  'cover.drafter',
  'cover.reviewer',
  'cover.approver',
  'cover.company_name',
  'cover.headquarters_address',
  'cover.headquarters_contact',
  'sec1.site_name',
  'sec1.site_management_number',
  'sec1.business_start_number',
  'sec1.construction_period',
  'sec1.construction_amount',
  'sec1.site_manager_name',
  'sec1.site_contact',
  'sec1.site_address',
  'sec1.company_name',
  'sec1.corporation_registration_number',
  'sec1.business_registration_number',
  'sec1.license_number',
  'sec1.headquarters_contact',
  'sec1.headquarters_address',
  'sec2.guidance_agency_name',
  'sec2.guidance_date',
  'sec2.construction_type',
  'sec2.progress_rate',
  'sec2.visit_count',
  'sec2.total_visit_count',
  'sec2.assignee',
  'sec2.previous_implementation_status',
  'sec2.contact',
  'sec2.notification_method_text',
  'sec2.notification_recipient_name',
  'sec2.notification_recipient_signature',
  'sec2.other_notification_method',
  'sec2.accident_occurred',
  'sec2.recent_accident_date',
  'sec2.accident_type',
  'sec2.accident_summary',
  'sec2.process_and_notes',
  ...WORK_PLAN_PLACEHOLDERS.map((item) => item.placeholderPath),
  'sec3.fixed[0].description',
  'sec3.fixed[1].description',
  'sec3.extra[0].title',
  'sec3.extra[0].description',
  'sec3.extra[1].title',
  'sec3.extra[1].description',
  ...Array.from({ length: 3 }, (_, index) => [
    `sec4.follow_ups[${index}].location`,
    `sec4.follow_ups[${index}].guidance_date`,
    `sec4.follow_ups[${index}].confirmation_date`,
    `sec4.follow_ups[${index}].before_image_note`,
    `sec4.follow_ups[${index}].after_image_note`,
    `sec4.follow_ups[${index}].result`,
  ]).flat(),
  ...Array.from({ length: 14 }, (_, index) => `sec6.measures[${index}].checked_box`),
  'sec7.findings[0].location',
  'sec7.findings[0].risk_text',
  'sec7.findings[0].accident_type',
  'sec7.findings[0].causative_agent',
  'sec7.findings[0].inspector',
  'sec7.findings[0].emphasis',
  'sec7.findings[0].improvement_plan',
  'sec7.findings[0].legal_reference_title',
  'sec7.findings[0].reference_material_1',
  'sec7.findings[0].reference_material_2',
  'sec8.plans[0].process_name',
  'sec8.plans[0].hazard',
  'sec8.plans[0].countermeasure',
  'sec8.plans[0].note',
  ...Array.from({ length: 5 }, (_, index) => [
    `sec9.tbm[${index}].good_box`,
    `sec9.tbm[${index}].average_box`,
    `sec9.tbm[${index}].poor_box`,
    `sec9.tbm[${index}].note`,
    `sec9.risk_assessment[${index}].good_box`,
    `sec9.risk_assessment[${index}].average_box`,
    `sec9.risk_assessment[${index}].poor_box`,
    `sec9.risk_assessment[${index}].note`,
  ]).flat(),
  ...Array.from({ length: 3 }, (_, index) => [
    `sec10.measurements[${index}].instrument_type`,
    `sec10.measurements[${index}].measurement_location`,
    `sec10.measurements[${index}].measured_value`,
    `sec10.measurements[${index}].safety_criteria`,
    `sec10.measurements[${index}].action_taken`,
  ]).flat(),
  'sec11.education[0].attendee_count',
  'sec11.education[0].content',
  'sec12.activities[0].activity_type',
  'sec12.activities[0].content',
  ...Array.from({ length: 4 }, (_, index) => [
    `sec13.cases[${index}].title`,
    `sec13.cases[${index}].summary`,
  ]).flat(),
  'sec14.title',
  'sec14.body',
] as const;

const TEMPLATE_IMAGE_PLACEHOLDERS: TemplateImagePlaceholder[] = [
  { table: 2, row: 2, col: 0, placeholderPath: 'sec3.fixed[0].photo_image', binaryItemId: 'tplimg01' },
  { table: 2, row: 2, col: 1, placeholderPath: 'sec3.fixed[1].photo_image', binaryItemId: 'tplimg02' },
  { table: 2, row: 4, col: 0, placeholderPath: 'sec3.extra[0].photo_image', binaryItemId: 'tplimg03' },
  { table: 2, row: 4, col: 1, placeholderPath: 'sec3.extra[1].photo_image', binaryItemId: 'tplimg04' },
  { table: 2, row: 6, col: 0, placeholderPath: 'sec3.extra[2].photo_image', binaryItemId: 'tplimg05' },
  { table: 2, row: 6, col: 2, placeholderPath: 'sec3.extra[3].photo_image', binaryItemId: 'tplimg06' },
  {
    table: 5,
    row: 2,
    col: 0,
    placeholderPath: 'sec7.findings[0].photo_image',
    binaryItemId: 'tplimg07',
    repeatBlockPath: 'sec7.findings',
  },
  {
    table: 5,
    row: 2,
    col: 2,
    placeholderPath: 'sec7.findings[0].photo_image',
    binaryItemId: 'tplimg08',
    repeatBlockPath: 'sec7.findings',
  },
  {
    table: 5,
    row: 8,
    col: 0,
    placeholderPath: 'sec7.findings[0].reference_material_1_image',
    binaryItemId: 'tplimg09',
    repeatBlockPath: 'sec7.findings',
  },
  {
    table: 5,
    row: 8,
    col: 2,
    placeholderPath: 'sec7.findings[0].reference_material_2_image',
    binaryItemId: 'tplimg10',
    repeatBlockPath: 'sec7.findings',
  },
  {
    table: 8,
    row: 2,
    col: 0,
    placeholderPath: 'sec10.measurements[0].photo_image',
    binaryItemId: 'tplimg11',
    deferred: true,
  },
  {
    table: 8,
    row: 7,
    col: 0,
    placeholderPath: 'sec10.measurements[1].photo_image',
    binaryItemId: 'tplimg12',
    deferred: true,
  },
  {
    table: 8,
    row: 12,
    col: 0,
    placeholderPath: 'sec10.measurements[2].photo_image',
    binaryItemId: 'tplimg13',
    deferred: true,
  },
  {
    table: 9,
    row: 2,
    col: 0,
    placeholderPath: 'sec11.education[0].photo_image',
    binaryItemId: 'tplimg14',
    repeatBlockPath: 'sec11.education',
  },
  {
    table: 9,
    row: 2,
    col: 1,
    placeholderPath: 'sec11.education[0].material_image_or_file',
    binaryItemId: 'tplimg15',
    repeatBlockPath: 'sec11.education',
  },
  {
    table: 9,
    row: 6,
    col: 0,
    placeholderPath: 'sec12.activities[0].photo_image',
    binaryItemId: 'tplimg16',
    repeatBlockPath: 'sec12.activities',
  },
  { table: 10, row: 2, col: 0, placeholderPath: 'sec13.cases[0].image', binaryItemId: 'tplimg17' },
  { table: 10, row: 2, col: 1, placeholderPath: 'sec13.cases[1].image', binaryItemId: 'tplimg18' },
  { table: 10, row: 5, col: 0, placeholderPath: 'sec13.cases[2].image', binaryItemId: 'tplimg19' },
  { table: 10, row: 5, col: 1, placeholderPath: 'sec13.cases[3].image', binaryItemId: 'tplimg20' },
  { table: 11, row: 1, col: 0, placeholderPath: 'sec14.image', binaryItemId: 'tplimg21' },
];

function valueOrBlank(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function valueOrDash(value: unknown): string {
  const normalized = valueOrBlank(value);
  return normalized || '-';
}

function checkbox(checked: boolean): string {
  return checked ? '☑' : '☐';
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatDateText(value: string): string {
  const normalized = valueOrBlank(value);
  if (!normalized) return '';

  const directMatch = normalized.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (directMatch) {
    const [, year, month, day] = directMatch;
    return `${year}.${month.padStart(2, '0')}.${day.padStart(2, '0')}`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;

  return `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(
    parsed.getDate(),
  ).padStart(2, '0')}`;
}

function mapPreviousImplementationStatus(value: string): string {
  switch (value) {
    case 'implemented':
      return '이행';
    case 'partial':
      return '부분 이행';
    case 'not_implemented':
      return '미이행';
    default:
      return '';
  }
}

function mapAccidentOccurrence(value: string): string {
  switch (value) {
    case 'yes':
      return '발생';
    case 'no':
      return '미발생';
    default:
      return '';
  }
}

function mapWorkPlanStatus(value: string): string {
  switch (value) {
    case 'written':
      return '작성';
    case 'not_written':
      return '미작성';
    case 'not_applicable':
      return '해당없음';
    default:
      return '';
  }
}

function mapNotificationMethodText(method: string): string {
  const options = [
    { value: 'direct', label: '직접전달' },
    { value: 'registered_mail', label: '등기우편' },
    { value: 'email', label: '이메일' },
    { value: 'mobile', label: '모바일' },
    { value: 'other', label: '기타' },
  ] as const;

  return options.map((item) => `${checkbox(method === item.value)} ${item.label}`).join(' ');
}

function mapRiskText(finding: InspectionSession['document7Findings'][number]): string {
  const riskLevel = valueOrBlank(finding.riskLevel);
  if (riskLevel) return riskLevel;

  return [valueOrBlank(finding.likelihood), valueOrBlank(finding.severity)].filter(Boolean).join(' / ');
}

function isFilledObject(value: object): boolean {
  return Object.values(value).some((item) => valueOrBlank(item) !== '');
}

function toCausativeLabel(key: string, measureLabelMap: Map<string, string>): string {
  const normalized = valueOrBlank(key);
  if (!normalized) return '';
  return measureLabelMap.get(normalized) ?? normalized.replace(/_/g, ' ');
}

function looksLikeImageSource(source: string): boolean {
  const normalized = valueOrBlank(source);
  if (!normalized) return false;
  if (normalized.startsWith('data:image/')) return true;
  if (normalized.startsWith('blob:')) return true;
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('/')) return true;

  const withoutQuery = normalized.split(/[?#]/)[0];
  const extension = withoutQuery.split('.').pop()?.toLowerCase() ?? '';
  return extension in IMAGE_EXTENSION_TO_MEDIA_TYPE;
}

function assetTextFallback(source: string): string {
  const normalized = valueOrBlank(source);
  if (!normalized) return '';
  if (normalized.startsWith('data:')) return 'image';

  const withoutQuery = normalized.split(/[?#]/)[0];
  const basename = withoutQuery.split(/[\\/]/).pop();
  return basename || normalized;
}

function fileNameForSession(session: InspectionSession): string {
  const site = (session.meta.siteName || session.adminSiteSnapshot.siteName || 'inspection')
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim();
  const date = formatDateText(session.meta.reportDate).replace(/\./g, '') || 'report';
  return `${site || 'inspection'}-${date}-${session.reportNumber}.hwpx`;
}

function padFixedSlots<T>(items: T[], size: number, emptyFactory: () => T): T[] {
  const result = items.slice(0, size);
  while (result.length < size) {
    result.push(emptyFactory());
  }
  return result;
}

function ensureRepeatItems<T>(items: T[], emptyFactory: () => T): T[] {
  return items.length > 0 ? items : [emptyFactory()];
}

function createEmptyScene() {
  return { title: '', photoUrl: '', description: '' };
}

function createEmptyFollowUp() {
  return {
    location: '',
    guidanceDate: '',
    confirmationDate: '',
    beforePhotoUrl: '',
    afterPhotoUrl: '',
    result: '',
  };
}

function createEmptyFinding() {
  return {
    id: '',
    photoUrl: '',
    location: '',
    likelihood: '',
    severity: '',
    riskLevel: '',
    accidentType: '',
    causativeAgentKey: '' as const,
    inspector: '',
    emphasis: '',
    improvementPlan: '',
    legalReferenceId: '',
    legalReferenceTitle: '',
    referenceMaterial1: '',
    referenceMaterial2: '',
    carryForward: false,
  };
}

function createEmptyPlan() {
  return { id: '', processName: '', hazard: '', countermeasure: '', note: '', source: 'manual' as const };
}

function createEmptyMeasurement() {
  return {
    instrumentType: '',
    measurementLocation: '',
    measuredValue: '',
    safetyCriteria: '',
    actionTaken: '',
  };
}

function createEmptyEducationRecord() {
  return {
    id: '',
    photoUrl: '',
    materialUrl: '',
    materialName: '',
    attendeeCount: '',
    content: '',
  };
}

function createEmptyActivity() {
  return { id: '', photoUrl: '', activityType: '', content: '' };
}

function createEmptyCase() {
  return { title: '', summary: '', imageUrl: '' };
}

function createEmptySafetyInfo() {
  return { title: '', body: '', imageUrl: '' };
}

function createEmptyMeasure(index: number) {
  return { number: index + 1, label: '', guidance: '', checked: false, key: '' };
}

function createEmptyCheckRow() {
  return { id: '', prompt: '', rating: '' as ChecklistRating, note: '' };
}

function mapSessionToTemplateBinding(session: InspectionSession): TemplateBindingData {
  const text = Object.fromEntries(TEXT_PLACEHOLDERS.map((placeholder) => [placeholder, '']));
  const images: Record<string, string> = {};
  const warnings: string[] = [];
  const truncated: Record<string, number> = {};
  const repeatCounts: Record<RepeatBlockPath, number> = {
    'sec7.findings': 1,
    'sec8.plans': 1,
    'sec11.education': 1,
    'sec12.activities': 1,
  };

  const measureLabelMap = new Map(
    session.document6Measures
      .map((item) => [valueOrBlank(item.key), valueOrBlank(item.label)] as const)
      .filter(([key, label]) => key && label),
  );

  const site = session.adminSiteSnapshot;
  const overview = session.document2Overview;

  text['cover.site_name'] = valueOrDash(session.meta.siteName || site.siteName);
  text['cover.report_date'] = valueOrDash(formatDateText(session.meta.reportDate));
  text['cover.drafter'] = valueOrDash(session.meta.drafter);
  text['cover.reviewer'] = valueOrDash(session.meta.reviewer);
  text['cover.approver'] = valueOrDash(session.meta.approver);
  text['cover.company_name'] = valueOrDash(site.companyName);
  text['cover.headquarters_address'] = valueOrDash(site.headquartersAddress);
  text['cover.headquarters_contact'] = valueOrDash(site.headquartersContact);

  text['sec1.site_name'] = valueOrDash(site.siteName);
  text['sec1.site_management_number'] = valueOrDash(site.siteManagementNumber);
  text['sec1.business_start_number'] = valueOrDash(site.businessStartNumber);
  text['sec1.construction_period'] = valueOrDash(site.constructionPeriod);
  text['sec1.construction_amount'] = valueOrDash(site.constructionAmount);
  text['sec1.site_manager_name'] = valueOrDash(site.siteManagerName);
  text['sec1.site_contact'] = valueOrDash(site.siteContactEmail);
  text['sec1.site_address'] = valueOrDash(site.siteAddress);
  text['sec1.company_name'] = valueOrDash(site.companyName);
  text['sec1.corporation_registration_number'] = valueOrDash(site.corporationRegistrationNumber);
  text['sec1.business_registration_number'] = valueOrDash(site.businessRegistrationNumber);
  text['sec1.license_number'] = valueOrDash(site.licenseNumber);
  text['sec1.headquarters_contact'] = valueOrDash(site.headquartersContact);
  text['sec1.headquarters_address'] = valueOrDash(site.headquartersAddress);

  text['sec2.guidance_agency_name'] = valueOrDash(overview.guidanceAgencyName);
  text['sec2.guidance_date'] = valueOrDash(formatDateText(overview.guidanceDate));
  text['sec2.construction_type'] = valueOrDash(overview.constructionType);
  text['sec2.progress_rate'] = valueOrDash(overview.progressRate);
  text['sec2.visit_count'] = valueOrDash(overview.visitCount);
  text['sec2.total_visit_count'] = valueOrDash(overview.totalVisitCount);
  text['sec2.assignee'] = valueOrDash(overview.assignee || session.meta.drafter);
  text['sec2.previous_implementation_status'] = valueOrDash(
    mapPreviousImplementationStatus(overview.previousImplementationStatus),
  );
  text['sec2.contact'] = valueOrDash(overview.contact);
  text['sec2.notification_method_text'] = valueOrDash(mapNotificationMethodText(overview.notificationMethod));
  text['sec2.notification_recipient_name'] = valueOrDash(overview.notificationRecipientName);
  text['sec2.notification_recipient_signature'] = assetTextFallback(overview.notificationRecipientSignature);
  text['sec2.other_notification_method'] = valueOrBlank(overview.otherNotificationMethod);
  text['sec2.accident_occurred'] = valueOrDash(mapAccidentOccurrence(overview.accidentOccurred));
  text['sec2.recent_accident_date'] = valueOrDash(formatDateText(overview.recentAccidentDate));
  text['sec2.accident_type'] = valueOrDash(overview.accidentType);
  text['sec2.accident_summary'] = valueOrDash(overview.accidentSummary);
  text['sec2.process_and_notes'] = valueOrDash(overview.processAndNotes);
  for (const item of WORK_PLAN_PLACEHOLDERS) {
    text[item.placeholderPath] = valueOrDash(mapWorkPlanStatus(overview.workPlanChecks[item.sourceKey]));
  }

  if (valueOrBlank(overview.notificationRecipientSignature)) {
    warnings.push('Section 2 signature is text-only in the current template and is rendered as an asset label.');
  }

  const fixedScenes = padFixedSlots(session.document3Scenes.slice(0, 2), 2, createEmptyScene);
  const extraScenes = padFixedSlots(session.document3Scenes.slice(2, 6), 4, createEmptyScene);
  if (session.document3Scenes.length > 6) {
    truncated.document3Scenes = session.document3Scenes.length - 6;
    warnings.push(`Section 3 has only 6 visual slots. ${truncated.document3Scenes} extra scene(s) were skipped.`);
  }

  text['sec3.fixed[0].description'] = valueOrDash(fixedScenes[0].description);
  text['sec3.fixed[1].description'] = valueOrDash(fixedScenes[1].description);
  text['sec3.extra[0].title'] = valueOrDash(extraScenes[0].title);
  text['sec3.extra[0].description'] = valueOrDash(extraScenes[0].description);
  text['sec3.extra[1].title'] = valueOrDash(extraScenes[1].title);
  text['sec3.extra[1].description'] = valueOrDash(extraScenes[1].description);
  images['sec3.fixed[0].photo_image'] = valueOrBlank(fixedScenes[0].photoUrl);
  images['sec3.fixed[1].photo_image'] = valueOrBlank(fixedScenes[1].photoUrl);
  images['sec3.extra[0].photo_image'] = valueOrBlank(extraScenes[0].photoUrl);
  images['sec3.extra[1].photo_image'] = valueOrBlank(extraScenes[1].photoUrl);
  images['sec3.extra[2].photo_image'] = valueOrBlank(extraScenes[2].photoUrl);
  images['sec3.extra[3].photo_image'] = valueOrBlank(extraScenes[3].photoUrl);

  const followUps = padFixedSlots(session.document4FollowUps.slice(0, 3), 3, createEmptyFollowUp);
  if (session.document4FollowUps.length > 3) {
    truncated.document4FollowUps = session.document4FollowUps.length - 3;
    warnings.push(`Section 4 renders 3 fixed follow-up slots. ${truncated.document4FollowUps} extra item(s) were skipped.`);
  }
  for (let index = 0; index < followUps.length; index += 1) {
    const item = followUps[index];
    text[`sec4.follow_ups[${index}].location`] = valueOrDash(item.location);
    text[`sec4.follow_ups[${index}].guidance_date`] = valueOrDash(formatDateText(item.guidanceDate));
    text[`sec4.follow_ups[${index}].confirmation_date`] = valueOrDash(formatDateText(item.confirmationDate));
    text[`sec4.follow_ups[${index}].before_image_note`] = assetTextFallback(item.beforePhotoUrl);
    text[`sec4.follow_ups[${index}].after_image_note`] = assetTextFallback(item.afterPhotoUrl);
    text[`sec4.follow_ups[${index}].result`] = valueOrDash(item.result);
  }
  if (session.document4FollowUps.some((item) => valueOrBlank(item.beforePhotoUrl) || valueOrBlank(item.afterPhotoUrl))) {
    warnings.push('Section 4 before/after photo slots are text-only in the current template.');
  }

  const measures = padFixedSlots(session.document6Measures.slice(0, 14), 14, () => createEmptyMeasure(0)).map(
    (item, index) => item || createEmptyMeasure(index),
  );
  measures.forEach((item, index) => {
    text[`sec6.measures[${index}].checked_box`] = checkbox(Boolean(item.checked));
  });

  const findings = ensureRepeatItems(session.document7Findings.filter((item) => isFilledObject(item)), createEmptyFinding);
  repeatCounts['sec7.findings'] = findings.length;
  findings.forEach((item, index) => {
    text[`sec7.findings[${index}].location`] = valueOrDash(item.location);
    text[`sec7.findings[${index}].risk_text`] = valueOrDash(mapRiskText(item));
    text[`sec7.findings[${index}].accident_type`] = valueOrDash(item.accidentType);
    text[`sec7.findings[${index}].causative_agent`] = valueOrDash(toCausativeLabel(item.causativeAgentKey, measureLabelMap));
    text[`sec7.findings[${index}].inspector`] = valueOrDash(item.inspector || session.meta.drafter);
    text[`sec7.findings[${index}].emphasis`] = valueOrDash(item.emphasis);
    text[`sec7.findings[${index}].improvement_plan`] = valueOrDash(item.improvementPlan);
    text[`sec7.findings[${index}].legal_reference_title`] = valueOrDash(item.legalReferenceTitle);
    text[`sec7.findings[${index}].reference_material_1`] = looksLikeImageSource(item.referenceMaterial1)
      ? ''
      : valueOrBlank(item.referenceMaterial1);
    text[`sec7.findings[${index}].reference_material_2`] = looksLikeImageSource(item.referenceMaterial2)
      ? ''
      : valueOrBlank(item.referenceMaterial2);
    images[`sec7.findings[${index}].photo_image`] = valueOrBlank(item.photoUrl);
    images[`sec7.findings[${index}].reference_material_1_image`] = looksLikeImageSource(item.referenceMaterial1)
      ? valueOrBlank(item.referenceMaterial1)
      : '';
    images[`sec7.findings[${index}].reference_material_2_image`] = looksLikeImageSource(item.referenceMaterial2)
      ? valueOrBlank(item.referenceMaterial2)
      : '';
  });

  const plans = ensureRepeatItems(session.document8Plans.filter((item) => isFilledObject(item)), createEmptyPlan);
  repeatCounts['sec8.plans'] = plans.length;
  plans.forEach((item, index) => {
    text[`sec8.plans[${index}].process_name`] = valueOrDash(item.processName);
    text[`sec8.plans[${index}].hazard`] = valueOrDash(item.hazard);
    text[`sec8.plans[${index}].countermeasure`] = valueOrDash(item.countermeasure);
    text[`sec8.plans[${index}].note`] = valueOrBlank(item.note);
  });

  const tbmRows = padFixedSlots(session.document9SafetyChecks.tbm.slice(0, 5), 5, createEmptyCheckRow);
  const riskRows = padFixedSlots(session.document9SafetyChecks.riskAssessment.slice(0, 5), 5, createEmptyCheckRow);
  tbmRows.forEach((item, index) => {
    text[`sec9.tbm[${index}].good_box`] = checkbox(item.rating === 'good');
    text[`sec9.tbm[${index}].average_box`] = checkbox(item.rating === 'average');
    text[`sec9.tbm[${index}].poor_box`] = checkbox(item.rating === 'poor');
    text[`sec9.tbm[${index}].note`] = valueOrBlank(item.note);
  });
  riskRows.forEach((item, index) => {
    text[`sec9.risk_assessment[${index}].good_box`] = checkbox(item.rating === 'good');
    text[`sec9.risk_assessment[${index}].average_box`] = checkbox(item.rating === 'average');
    text[`sec9.risk_assessment[${index}].poor_box`] = checkbox(item.rating === 'poor');
    text[`sec9.risk_assessment[${index}].note`] = valueOrBlank(item.note);
  });

  const measurements = padFixedSlots(session.document10Measurements.slice(0, 3), 3, createEmptyMeasurement);
  if (session.document10Measurements.length > 3) {
    truncated.document10Measurements = session.document10Measurements.length - 3;
    warnings.push(`Section 10 renders 3 fixed measurement slots. ${truncated.document10Measurements} extra item(s) were skipped.`);
  }
  measurements.forEach((item, index) => {
    text[`sec10.measurements[${index}].instrument_type`] = valueOrDash(item.instrumentType);
    text[`sec10.measurements[${index}].measurement_location`] = valueOrDash(item.measurementLocation);
    text[`sec10.measurements[${index}].measured_value`] = valueOrDash(item.measuredValue);
    text[`sec10.measurements[${index}].safety_criteria`] = valueOrDash(item.safetyCriteria);
    text[`sec10.measurements[${index}].action_taken`] = valueOrDash(item.actionTaken);
  });

  const educationRecords = ensureRepeatItems(
    session.document11EducationRecords.filter((item) => isFilledObject(item)),
    createEmptyEducationRecord,
  );
  repeatCounts['sec11.education'] = educationRecords.length;
  educationRecords.forEach((item, index) => {
    text[`sec11.education[${index}].attendee_count`] = valueOrDash(item.attendeeCount);
    text[`sec11.education[${index}].content`] = valueOrDash(item.content);
    images[`sec11.education[${index}].photo_image`] = valueOrBlank(item.photoUrl);
    images[`sec11.education[${index}].material_image_or_file`] = looksLikeImageSource(item.materialUrl)
      ? valueOrBlank(item.materialUrl)
      : '';
    if (valueOrBlank(item.materialUrl) && !looksLikeImageSource(item.materialUrl)) {
      warnings.push('Section 11 non-image material files are left blank in the image slot.');
    }
  });

  const activities = ensureRepeatItems(
    session.document12Activities.filter((item) => isFilledObject(item)),
    createEmptyActivity,
  );
  repeatCounts['sec12.activities'] = activities.length;
  activities.forEach((item, index) => {
    text[`sec12.activities[${index}].activity_type`] = valueOrDash(item.activityType);
    text[`sec12.activities[${index}].content`] = valueOrDash(item.content);
    images[`sec12.activities[${index}].photo_image`] = valueOrBlank(item.photoUrl);
  });

  const cases = padFixedSlots(session.document13Cases.slice(0, 4), 4, createEmptyCase);
  cases.forEach((item, index) => {
    text[`sec13.cases[${index}].title`] = valueOrDash(item.title);
    text[`sec13.cases[${index}].summary`] = valueOrDash(item.summary);
    images[`sec13.cases[${index}].image`] = valueOrBlank(item.imageUrl);
  });

  const safetyInfo = session.document14SafetyInfos[0] ?? createEmptySafetyInfo();
  text['sec14.title'] = valueOrDash(safetyInfo.title);
  text['sec14.body'] = valueOrDash(safetyInfo.body);
  images['sec14.image'] = valueOrBlank(safetyInfo.imageUrl);

  return {
    text,
    images,
    repeatCounts,
    deferred: [...DEFERRED_SECTIONS],
    warnings: Array.from(new Set(warnings)),
    truncated,
  };
}

function expandRepeatBlocks(
  xml: string,
  repeatCounts: Record<RepeatBlockPath, number>,
): { xml: string; imagePlaceholders: TemplateImagePlaceholder[] } {
  let currentXml = xml;
  const expandedImagePlaceholders = TEMPLATE_IMAGE_PLACEHOLDERS.filter((item) => !item.repeatBlockPath).map((item) => ({ ...item }));

  for (const repeatBlockPath of REPEAT_BLOCKS) {
    const startMarker = `{#${repeatBlockPath}}`;
    const endMarker = `{/${repeatBlockPath}}`;
    const startIndex = currentXml.indexOf(startMarker);
    const endIndex = currentXml.indexOf(endMarker, startIndex >= 0 ? startIndex : 0);

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      continue;
    }

    const before = currentXml.slice(0, startIndex);
    const inner = currentXml.slice(startIndex + startMarker.length, endIndex);
    const after = currentXml.slice(endIndex + endMarker.length);
    const repeatCount = Math.max(1, repeatCounts[repeatBlockPath] ?? 1);
    const repeatImagePlaceholders = TEMPLATE_IMAGE_PLACEHOLDERS.filter((item) => item.repeatBlockPath === repeatBlockPath);

    const repeatedXml = Array.from({ length: repeatCount }, (_, index) => {
      let blockXml = inner.replaceAll(`${repeatBlockPath}[0].`, `${repeatBlockPath}[${index}].`);

      for (const imagePlaceholder of repeatImagePlaceholders) {
        const repeatedPlaceholderPath = imagePlaceholder.placeholderPath.replace(
          `${repeatBlockPath}[0].`,
          `${repeatBlockPath}[${index}].`,
        );
        const repeatedBinaryItemId =
          index === 0 ? imagePlaceholder.binaryItemId : `${imagePlaceholder.binaryItemId}__${index}`;

        if (index > 0) {
          blockXml = blockXml.replaceAll(
            `binaryItemIDRef="${imagePlaceholder.binaryItemId}"`,
            `binaryItemIDRef="${repeatedBinaryItemId}"`,
          );
        }

        expandedImagePlaceholders.push({
          ...imagePlaceholder,
          placeholderPath: repeatedPlaceholderPath,
          binaryItemId: repeatedBinaryItemId,
        });
      }

      return blockXml;
    }).join('');

    currentXml = `${before}${repeatedXml}${after}`;
  }

  return {
    xml: currentXml.replace(/\{#([^{}]+)\}|\{\/([^{}]+)\}/g, ''),
    imagePlaceholders: expandedImagePlaceholders,
  };
}

function replaceTextPlaceholders(xml: string, textBindings: Record<string, string>): string {
  return xml.replace(/\{(?![#/])([^{}]+)\}/g, (_match, rawPath: string) => {
    const placeholderPath = rawPath.trim();
    return escapeXmlText(textBindings[placeholderPath] ?? '');
  });
}

function parseManifestItems(contentHpf: string): Map<string, ManifestItem> {
  const items = new Map<string, ManifestItem>();
  for (const match of contentHpf.matchAll(
    /<opf:item\b[^>]*\bid="([^"]+)"[^>]*\bhref="([^"]+)"[^>]*\bmedia-type="([^"]+)"[^>]*/g,
  )) {
    items.set(match[1], {
      id: match[1],
      href: match[2],
      mediaType: match[3],
    });
  }
  return items;
}

function upsertManifestItem(contentHpf: string, itemId: string, href: string, mediaType: string): string {
  const manifestItem = `<opf:item id="${itemId}" href="${href}" media-type="${mediaType}" isEmbeded="1" />`;
  const itemPattern = new RegExp(`<opf:item\\b[^>]*\\bid="${escapeRegExp(itemId)}"[^>]*/>`, 'g');
  const withoutExisting = contentHpf.replace(itemPattern, '');
  return withoutExisting.replace('</opf:manifest>', `${manifestItem}</opf:manifest>`);
}

function tableSpans(xml: string): Array<{ start: number; end: number }> {
  return Array.from(xml.matchAll(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g)).map((match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}

function replaceCellImageBinaryRef(
  xml: string,
  descriptor: TemplateImagePlaceholder,
): { xml: string; sourceBinaryItemId: string | null } {
  const spans = tableSpans(xml);
  const tableSpan = spans[descriptor.table];
  if (!tableSpan) {
    throw new Error(`Template image table index not found: ${descriptor.table}`);
  }

  const tableXml = xml.slice(tableSpan.start, tableSpan.end);
  const cellPattern = /<hp:tc\b[\s\S]*?<\/hp:tc>/g;
  const marker = `<hp:cellAddr colAddr="${descriptor.col}" rowAddr="${descriptor.row}"`;
  let sourceBinaryItemId: string | null = null;
  let updated = false;

  const patchedTableXml = tableXml.replace(cellPattern, (cellXml) => {
    if (updated || !cellXml.includes(marker)) {
      return cellXml;
    }
    updated = true;
    return cellXml.replace(/binaryItemIDRef="([^"]+)"/, (_match, currentBinaryItemId) => {
      sourceBinaryItemId = currentBinaryItemId;
      return `binaryItemIDRef="${descriptor.binaryItemId}"`;
    });
  });

  if (!updated) {
    throw new Error(
      `Template image cell not found for ${descriptor.placeholderPath} at table=${descriptor.table}, row=${descriptor.row}, col=${descriptor.col}`,
    );
  }

  return {
    xml: `${xml.slice(0, tableSpan.start)}${patchedTableXml}${xml.slice(tableSpan.end)}`,
    sourceBinaryItemId,
  };
}

async function normalizeTemplateImageSlots(
  zip: JSZip,
  sectionXml: string,
  contentHpf: string,
): Promise<{ sectionXml: string; contentHpf: string }> {
  let nextSectionXml = sectionXml;
  let nextContentHpf = contentHpf;
  const manifestItems = parseManifestItems(contentHpf);

  for (const descriptor of TEMPLATE_IMAGE_PLACEHOLDERS) {
    const replaced = replaceCellImageBinaryRef(nextSectionXml, descriptor);
    nextSectionXml = replaced.xml;

    if (!replaced.sourceBinaryItemId) {
      continue;
    }

    const sourceManifestItem = manifestItems.get(replaced.sourceBinaryItemId);
    if (!sourceManifestItem) {
      throw new Error(`Manifest item "${replaced.sourceBinaryItemId}" not found for ${descriptor.placeholderPath}.`);
    }

    const sourceEntry = zip.file(sourceManifestItem.href);
    if (!sourceEntry) {
      throw new Error(`Template image asset "${sourceManifestItem.href}" not found for ${descriptor.placeholderPath}.`);
    }

    const extension = sourceManifestItem.href.split('.').pop() || 'bin';
    const normalizedHref = `BinData/${descriptor.binaryItemId}.${extension}`;
    zip.file(normalizedHref, await sourceEntry.async('uint8array'));
    nextContentHpf = upsertManifestItem(nextContentHpf, descriptor.binaryItemId, normalizedHref, sourceManifestItem.mediaType);
  }

  return {
    sectionXml: nextSectionXml,
    contentHpf: nextContentHpf,
  };
}

async function resolveImageAsset(
  source: string,
  cache: Map<string, Promise<ResolvedImageAsset | null>>,
  warnings: string[],
): Promise<ResolvedImageAsset | null> {
  const normalized = valueOrBlank(source);
  if (!normalized) {
    return null;
  }

  if (cache.has(normalized)) {
    return cache.get(normalized)!;
  }

  const pending = (async (): Promise<ResolvedImageAsset | null> => {
    if (normalized.startsWith('data:image/')) {
      const match = normalized.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        warnings.push(`Unsupported data URL image format: ${normalized.slice(0, 48)}...`);
        return null;
      }

      const [, mediaType, base64] = match;
      const extension = IMAGE_MEDIA_TYPE_TO_EXTENSION[mediaType.toLowerCase()];
      if (!extension) {
        warnings.push(`Unsupported image MIME type for HWPX embedding: ${mediaType}`);
        return null;
      }

      return {
        buffer: decodeBase64ToBytes(base64),
        extension,
        mediaType: mediaType.toLowerCase(),
      };
    }

    if (/^[a-zA-Z]:\\/.test(normalized)) {
      warnings.push(`Local file path images are not supported in browser generation: ${normalized}`);
      return null;
    }

    try {
      const response = await fetch(normalized);
      if (!response.ok) {
        warnings.push(`Failed to fetch image URL: ${normalized} (${response.status})`);
        return null;
      }

      const blob = await response.blob();
      const contentType = blob.type.split(';')[0].toLowerCase();
      const extension =
        IMAGE_MEDIA_TYPE_TO_EXTENSION[contentType] ||
        normalized.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ||
        '';
      const mediaType = IMAGE_EXTENSION_TO_MEDIA_TYPE[extension] || contentType;
      if (!mediaType || !IMAGE_EXTENSION_TO_MEDIA_TYPE[extension]) {
        warnings.push(`Unsupported fetched image content type for HWPX embedding: ${normalized}`);
        return null;
      }

      return {
        buffer: new Uint8Array(await blob.arrayBuffer()),
        extension,
        mediaType,
      };
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `Failed to fetch image URL: ${normalized}`);
      return null;
    }
  })();

  cache.set(normalized, pending);
  return pending;
}

async function bindImagesIntoZip(
  zip: JSZip,
  contentHpf: string,
  imagePlaceholders: TemplateImagePlaceholder[],
  binding: TemplateBindingData,
  warnings: string[],
): Promise<string> {
  const cache = new Map<string, Promise<ResolvedImageAsset | null>>();
  let nextContentHpf = contentHpf;

  for (const imagePlaceholder of imagePlaceholders) {
    const source = binding.images[imagePlaceholder.placeholderPath] ?? '';
    const resolvedAsset = await resolveImageAsset(source, cache, warnings);
    const finalAsset = resolvedAsset ?? (imagePlaceholder.deferred ? null : BLANK_PNG_ASSET);

    if (!finalAsset) {
      continue;
    }

    const href = `BinData/${imagePlaceholder.binaryItemId}.${finalAsset.extension}`;
    zip.file(href, finalAsset.buffer);
    nextContentHpf = upsertManifestItem(nextContentHpf, imagePlaceholder.binaryItemId, href, finalAsset.mediaType);
  }

  return nextContentHpf;
}

async function loadTemplateBuffer(): Promise<ArrayBuffer> {
  if (!templateBufferPromise) {
    templateBufferPromise = fetch(TEMPLATE_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error(`HWPX template download failed: ${response.status} ${response.statusText}`);
      }
      return response.arrayBuffer();
    });
  }

  const buffer = await templateBufferPromise;
  return buffer.slice(0);
}

export async function generateInspectionHwpxBlob(
  session: InspectionSession,
  _siteSessions: InspectionSession[] = [session],
): Promise<{ blob: Blob; filename: string; warnings: string[]; deferred: string[] }> {
  const binding = mapSessionToTemplateBinding(session);
  const templateBuffer = await loadTemplateBuffer();
  const zip = await JSZip.loadAsync(templateBuffer);
  const sectionEntry = zip.file('Contents/section0.xml');
  const contentEntry = zip.file('Contents/content.hpf');

  if (!sectionEntry || !contentEntry) {
    throw new Error('The HWPX template is missing Contents/section0.xml or Contents/content.hpf.');
  }

  const sectionXml = await sectionEntry.async('string');
  const contentHpf = await contentEntry.async('string');
  const normalized = await normalizeTemplateImageSlots(zip, sectionXml, contentHpf);
  const expanded = expandRepeatBlocks(normalized.sectionXml, binding.repeatCounts);
  const boundSectionXml = replaceTextPlaceholders(expanded.xml, binding.text);
  const boundContentHpf = await bindImagesIntoZip(
    zip,
    normalized.contentHpf,
    expanded.imagePlaceholders,
    binding,
    binding.warnings,
  );

  zip.file('Contents/section0.xml', boundSectionXml);
  zip.file('Contents/content.hpf', boundContentHpf);

  const generatedBuffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  const blobBuffer = generatedBuffer.buffer.slice(
    generatedBuffer.byteOffset,
    generatedBuffer.byteOffset + generatedBuffer.byteLength,
  ) as ArrayBuffer;
  return {
    blob: new Blob([blobBuffer], { type: 'application/haansofthwpx' }),
    filename: fileNameForSession(session),
    warnings: Array.from(new Set(binding.warnings)),
    deferred: binding.deferred,
  };
}
