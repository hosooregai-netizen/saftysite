const fs = require('node:fs/promises');
const path = require('node:path');
const JSZip = require('jszip');

type NotificationMethod = 'direct' | 'registered_mail' | 'email' | 'mobile' | 'other' | '';
type PreviousImplementationStatus = 'implemented' | 'partial' | 'not_implemented' | '';
type AccidentOccurrence = 'yes' | 'no' | '';
type ChecklistRating = 'good' | 'average' | 'poor' | '';
type WorkPlanCheckStatus = 'written' | 'not_written' | 'not_applicable';
type WorkPlanCheckKey =
  | 'towerCrane'
  | 'tunnelExcavation'
  | 'vehicleLoadingMachine'
  | 'bridgeWork'
  | 'constructionMachine'
  | 'quarryWork'
  | 'chemicalFacility'
  | 'buildingDemolition'
  | 'electricalWork'
  | 'heavyMaterialHandling'
  | 'earthwork'
  | 'railwayFacilityMaintenance'
  | 'otherHighRiskWork';
type RepeatBlockPath = 'sec7.findings' | 'sec8.plans' | 'sec11.education' | 'sec12.activities';

interface ExistingWebReportData {
  meta: {
    siteName: string;
    reportDate: string;
    drafter: string;
    reviewer: string;
    approver: string;
  };
  adminSiteSnapshot: {
    customerName: string;
    siteName: string;
    assigneeName: string;
    siteManagementNumber: string;
    businessStartNumber: string;
    constructionPeriod: string;
    constructionAmount: string;
    siteManagerName: string;
    siteContactEmail: string;
    siteAddress: string;
    companyName: string;
    corporationRegistrationNumber: string;
    businessRegistrationNumber: string;
    licenseNumber: string;
    headquartersContact: string;
    headquartersAddress: string;
  };
  document2Overview: {
    guidanceAgencyName: string;
    guidanceDate: string;
    constructionType: string;
    progressRate: string;
    visitCount: string;
    totalVisitCount: string;
    assignee: string;
    previousImplementationStatus: PreviousImplementationStatus;
    contact: string;
    notificationMethod: NotificationMethod;
    notificationRecipientName: string;
    notificationRecipientSignature: string;
    otherNotificationMethod: string;
    workPlanChecks: Record<WorkPlanCheckKey, WorkPlanCheckStatus>;
    accidentOccurred: AccidentOccurrence;
    recentAccidentDate: string;
    accidentType: string;
    accidentSummary: string;
    processAndNotes: string;
  };
  document3Scenes: Array<{
    id?: string;
    title: string;
    photoUrl: string;
    description: string;
  }>;
  document4FollowUps: Array<{
    id?: string;
    location: string;
    guidanceDate: string;
    confirmationDate: string;
    beforePhotoUrl: string;
    afterPhotoUrl: string;
    result: string;
  }>;
  document5Summary: {
    summaryText: string;
  };
  document6Measures: Array<{
    key?: string;
    number: number;
    label: string;
    guidance: string;
    checked: boolean;
  }>;
  document7Findings: Array<{
    id?: string;
    photoUrl: string;
    location: string;
    likelihood: string;
    severity: string;
    riskLevel: string;
    accidentType: string;
    causativeAgentKey: string;
    inspector: string;
    emphasis: string;
    improvementPlan: string;
    legalReferenceTitle: string;
    referenceMaterial1: string;
    referenceMaterial2: string;
  }>;
  document8Plans: Array<{
    id?: string;
    processName: string;
    hazard: string;
    countermeasure: string;
    note: string;
  }>;
  document9SafetyChecks: {
    tbm: Array<{ prompt: string; rating: ChecklistRating; note: string }>;
    riskAssessment: Array<{ prompt: string; rating: ChecklistRating; note: string }>;
  };
  document10Measurements: Array<{
    id?: string;
    instrumentType: string;
    measurementLocation: string;
    measuredValue: string;
    safetyCriteria: string;
    actionTaken: string;
  }>;
  document11EducationRecords: Array<{
    id?: string;
    photoUrl: string;
    materialUrl: string;
    materialName: string;
    attendeeCount: string;
    content: string;
  }>;
  document12Activities: Array<{
    id?: string;
    photoUrl: string;
    activityType: string;
    content: string;
  }>;
  document13Cases: Array<{
    id?: string;
    title: string;
    summary: string;
    imageUrl: string;
  }>;
  document14SafetyInfos: Array<{
    id?: string;
    title: string;
    body: string;
    imageUrl: string;
  }>;
}

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

interface TemplateSectionContract {
  key: string;
  name: string;
  static: boolean;
  deferred: boolean;
  repeatBlockPath: RepeatBlockPath | null;
  textPlaceholders: string[];
  imagePlaceholders: string[];
  note?: string;
}

interface TemplateContract {
  convention: {
    text: string;
    repeatStart: string;
    repeatEnd: string;
    checkboxText: string;
    image: string;
  };
  textPlaceholders: string[];
  repeatBlocks: RepeatBlockPath[];
  deferred: string[];
  textOnlyImageFallbackPlaceholders: string[];
  sections: TemplateSectionContract[];
  imagePlaceholders: TemplateImagePlaceholder[];
}

interface ResolvedImageAsset {
  buffer: Buffer;
  extension: string;
  mediaType: string;
}

interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
}

const DEFAULT_TEMPLATE_FILENAME = '기술지도 수동보고서 앱 - 서식_4.raw-annotated.hwpx';
const DEFAULT_TEMPLATE_PATH = path.resolve(process.cwd(), '..', DEFAULT_TEMPLATE_FILENAME);
const DEFAULT_INPUT_PATH = path.resolve(process.cwd(), 'scripts', 'examples', 'sample-inspection-session.json');
const DEFAULT_OUTPUT_PATH = path.resolve(process.cwd(), '.tmp-ui', 'generated', 'inspection-report.generated.hwpx');

const BLANK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5cH7QAAAAASUVORK5CYII=';

const WORK_PLAN_PLACEHOLDERS: Array<{
  sourceKey: WorkPlanCheckKey;
  placeholderPath: string;
}> = [
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
];

const REPEAT_BLOCKS: RepeatBlockPath[] = ['sec7.findings', 'sec8.plans', 'sec11.education', 'sec12.activities'];
const TEXT_ONLY_IMAGE_FALLBACK_PLACEHOLDERS = [
  'sec2.notification_recipient_signature',
  'sec4.follow_ups[0].before_image_note',
  'sec4.follow_ups[0].after_image_note',
  'sec4.follow_ups[1].before_image_note',
  'sec4.follow_ups[1].after_image_note',
  'sec4.follow_ups[2].before_image_note',
  'sec4.follow_ups[2].after_image_note',
];

const COVER_TEXT_PLACEHOLDERS = [
  'cover.site_name',
  'cover.report_date',
  'cover.drafter',
  'cover.reviewer',
  'cover.approver',
  'cover.company_name',
  'cover.headquarters_address',
  'cover.headquarters_contact',
];

const SEC1_TEXT_PLACEHOLDERS = [
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
];

const SEC2_TEXT_PLACEHOLDERS = [
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
];

const SEC3_TEXT_PLACEHOLDERS = [
  'sec3.fixed[0].description',
  'sec3.fixed[1].description',
  'sec3.extra[0].title',
  'sec3.extra[0].description',
  'sec3.extra[1].title',
  'sec3.extra[1].description',
];

const SEC4_TEXT_PLACEHOLDERS = Array.from({ length: 3 }, (_, index) => [
  `sec4.follow_ups[${index}].location`,
  `sec4.follow_ups[${index}].guidance_date`,
  `sec4.follow_ups[${index}].confirmation_date`,
  `sec4.follow_ups[${index}].before_image_note`,
  `sec4.follow_ups[${index}].after_image_note`,
  `sec4.follow_ups[${index}].result`,
]).flat();

const SEC6_TEXT_PLACEHOLDERS = Array.from({ length: 14 }, (_, index) => `sec6.measures[${index}].checked_box`);
const SEC7_TEXT_PLACEHOLDERS = [
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
];
const SEC8_TEXT_PLACEHOLDERS = [
  'sec8.plans[0].process_name',
  'sec8.plans[0].hazard',
  'sec8.plans[0].countermeasure',
  'sec8.plans[0].note',
];
const SEC9_TEXT_PLACEHOLDERS = [
  ...Array.from({ length: 5 }, (_, index) => [
    `sec9.tbm[${index}].good_box`,
    `sec9.tbm[${index}].average_box`,
    `sec9.tbm[${index}].poor_box`,
    `sec9.tbm[${index}].note`,
  ]).flat(),
  ...Array.from({ length: 5 }, (_, index) => [
    `sec9.risk_assessment[${index}].good_box`,
    `sec9.risk_assessment[${index}].average_box`,
    `sec9.risk_assessment[${index}].poor_box`,
    `sec9.risk_assessment[${index}].note`,
  ]).flat(),
];
const SEC10_TEXT_PLACEHOLDERS = Array.from({ length: 3 }, (_, index) => [
  `sec10.measurements[${index}].instrument_type`,
  `sec10.measurements[${index}].measurement_location`,
  `sec10.measurements[${index}].measured_value`,
  `sec10.measurements[${index}].safety_criteria`,
  `sec10.measurements[${index}].action_taken`,
]).flat();
const SEC11_TEXT_PLACEHOLDERS = ['sec11.education[0].attendee_count', 'sec11.education[0].content'];
const SEC12_TEXT_PLACEHOLDERS = ['sec12.activities[0].activity_type', 'sec12.activities[0].content'];
const SEC13_TEXT_PLACEHOLDERS = Array.from({ length: 4 }, (_, index) => [
  `sec13.cases[${index}].title`,
  `sec13.cases[${index}].summary`,
]).flat();
const SEC14_TEXT_PLACEHOLDERS = ['sec14.title', 'sec14.body'];

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

const TEMPLATE_SECTIONS: TemplateSectionContract[] = [
  {
    key: 'cover',
    name: 'Cover',
    static: false,
    deferred: false,
    repeatBlockPath: null,
    textPlaceholders: COVER_TEXT_PLACEHOLDERS,
    imagePlaceholders: [],
  },
  {
    key: 'sec1',
    name: '1. 기술지도 대상사업장',
    static: false,
    deferred: false,
    repeatBlockPath: null,
    textPlaceholders: SEC1_TEXT_PLACEHOLDERS,
    imagePlaceholders: [],
  },
  {
    key: 'sec2',
    name: '2. 기술지도 개요',
    static: false,
    deferred: false,
    repeatBlockPath: null,
    textPlaceholders: SEC2_TEXT_PLACEHOLDERS,
    imagePlaceholders: [],
    note: 'notification_recipient_signature is currently a text placeholder, not an image slot.',
  },
  {
    key: 'sec3',
    name: '3. 현장 전경 및 주요 진행공정',
    static: false,
    deferred: false,
    repeatBlockPath: null,
    textPlaceholders: SEC3_TEXT_PLACEHOLDERS,
    imagePlaceholders: TEMPLATE_IMAGE_PLACEHOLDERS.filter((item) => item.placeholderPath.startsWith('sec3.')).map(
      (item) => item.placeholderPath,
    ),
  },
  {
    key: 'sec4',
    name: '4. 이전 기술지도 사항 이행여부',
    static: false,
    deferred: false,
    repeatBlockPath: null,
    textPlaceholders: SEC4_TEXT_PLACEHOLDERS,
    imagePlaceholders: [],
    note: 'before/after photo placeholders are text-only in the current template-ready HWPX.',
  },
  {
    key: 'sec5',
    name: '5. 현재 공정내 현존하는 유해·위험요인 분류',
    static: false,
    deferred: true,
    repeatBlockPath: null,
    textPlaceholders: [],
    imagePlaceholders: [],
    note: 'Deferred. The template keeps the manual section with [DEFERRED_AUTO_AGG].',
  },
  {
    key: 'sec6',
    name: '6. 12대 사망사고 기인물 핵심 안전조치',
    static: false,
    deferred: false,
    repeatBlockPath: null,
    textPlaceholders: SEC6_TEXT_PLACEHOLDERS,
    imagePlaceholders: [],
  },
  {
    key: 'sec7',
    name: '7. 현재 공정내 현존하는 유해·위험요인',
    static: false,
    deferred: false,
    repeatBlockPath: 'sec7.findings',
    textPlaceholders: SEC7_TEXT_PLACEHOLDERS,
    imagePlaceholders: TEMPLATE_IMAGE_PLACEHOLDERS.filter((item) => item.placeholderPath.startsWith('sec7.')).map(
      (item) => item.placeholderPath,
    ),
  },
  {
    key: 'sec8',
    name: '8. 향후 진행공정 유해·위험요인 및 안전대책',
    static: false,
    deferred: false,
    repeatBlockPath: 'sec8.plans',
    textPlaceholders: SEC8_TEXT_PLACEHOLDERS,
    imagePlaceholders: [],
  },
  {
    key: 'sec9',
    name: '9. 위험성평가 및 TBM 활성화 지도',
    static: false,
    deferred: false,
    repeatBlockPath: null,
    textPlaceholders: SEC9_TEXT_PLACEHOLDERS,
    imagePlaceholders: [],
  },
  {
    key: 'sec10',
    name: '10. 계측점검 결과',
    static: false,
    deferred: false,
    repeatBlockPath: null,
    textPlaceholders: SEC10_TEXT_PLACEHOLDERS,
    imagePlaceholders: TEMPLATE_IMAGE_PLACEHOLDERS.filter((item) => item.placeholderPath.startsWith('sec10.')).map(
      (item) => item.placeholderPath,
    ),
    note: 'Measurement photo slots are deferred because current web data has no matching image field.',
  },
  {
    key: 'sec11',
    name: '11. 안전교육 실적',
    static: false,
    deferred: false,
    repeatBlockPath: 'sec11.education',
    textPlaceholders: SEC11_TEXT_PLACEHOLDERS,
    imagePlaceholders: TEMPLATE_IMAGE_PLACEHOLDERS.filter((item) => item.placeholderPath.startsWith('sec11.')).map(
      (item) => item.placeholderPath,
    ),
    note: 'material_image_or_file is image-only in the current template-ready HWPX.',
  },
  {
    key: 'sec12',
    name: '12. 안전보건 활동실적',
    static: false,
    deferred: false,
    repeatBlockPath: 'sec12.activities',
    textPlaceholders: SEC12_TEXT_PLACEHOLDERS,
    imagePlaceholders: TEMPLATE_IMAGE_PLACEHOLDERS.filter((item) => item.placeholderPath.startsWith('sec12.')).map(
      (item) => item.placeholderPath,
    ),
  },
  {
    key: 'sec13',
    name: '13. 최근 건설업 재해사례',
    static: true,
    deferred: false,
    repeatBlockPath: null,
    textPlaceholders: SEC13_TEXT_PLACEHOLDERS,
    imagePlaceholders: TEMPLATE_IMAGE_PLACEHOLDERS.filter((item) => item.placeholderPath.startsWith('sec13.')).map(
      (item) => item.placeholderPath,
    ),
  },
  {
    key: 'sec14',
    name: '14. 안전정보 소식',
    static: true,
    deferred: false,
    repeatBlockPath: null,
    textPlaceholders: SEC14_TEXT_PLACEHOLDERS,
    imagePlaceholders: TEMPLATE_IMAGE_PLACEHOLDERS.filter((item) => item.placeholderPath.startsWith('sec14.')).map(
      (item) => item.placeholderPath,
    ),
  },
];

const TEMPLATE_CONTRACT: TemplateContract = {
  convention: {
    text: '{full.path}',
    repeatStart: '{#full.array.path}',
    repeatEnd: '{/full.array.path}',
    checkboxText: '☑ / ☐',
    image: 'original image slot preserved; mapped by binaryItemIDRef',
  },
  textPlaceholders: [
    ...COVER_TEXT_PLACEHOLDERS,
    ...SEC1_TEXT_PLACEHOLDERS,
    ...SEC2_TEXT_PLACEHOLDERS,
    ...SEC3_TEXT_PLACEHOLDERS,
    ...SEC4_TEXT_PLACEHOLDERS,
    ...SEC6_TEXT_PLACEHOLDERS,
    ...SEC7_TEXT_PLACEHOLDERS,
    ...SEC8_TEXT_PLACEHOLDERS,
    ...SEC9_TEXT_PLACEHOLDERS,
    ...SEC10_TEXT_PLACEHOLDERS,
    ...SEC11_TEXT_PLACEHOLDERS,
    ...SEC12_TEXT_PLACEHOLDERS,
    ...SEC13_TEXT_PLACEHOLDERS,
    ...SEC14_TEXT_PLACEHOLDERS,
  ],
  repeatBlocks: REPEAT_BLOCKS,
  deferred: ['sec5', 'section15_removed_from_binding', 'sec10.measurements[*].photo_image'],
  textOnlyImageFallbackPlaceholders: TEXT_ONLY_IMAGE_FALLBACK_PLACEHOLDERS,
  sections: TEMPLATE_SECTIONS,
  imagePlaceholders: TEMPLATE_IMAGE_PLACEHOLDERS,
};

const BLANK_PNG_ASSET: ResolvedImageAsset = {
  buffer: Buffer.from(BLANK_PNG_BASE64, 'base64'),
  extension: 'png',
  mediaType: 'image/png',
};

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

function valueOrBlank(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function valueOrDash(value: unknown): string {
  const normalized = valueOrBlank(value);
  return normalized || '-';
}

function checkbox(checked: boolean): string {
  return checked ? '☑' : '☐';
}

function formatDateText(value: string): string {
  const normalized = valueOrBlank(value);
  if (!normalized) {
    return '';
  }

  const directMatch = normalized.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (directMatch) {
    const [, year, month, day] = directMatch;
    return `${year}.${month.padStart(2, '0')}.${day.padStart(2, '0')}`;
  }

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(
      parsed.getDate(),
    ).padStart(2, '0')}`;
  }

  return normalized;
}

function mapPreviousImplementationStatus(value: PreviousImplementationStatus): string {
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

function mapAccidentOccurrence(value: AccidentOccurrence): string {
  switch (value) {
    case 'yes':
      return '발생';
    case 'no':
      return '미발생';
    default:
      return '';
  }
}

function mapWorkPlanStatus(value: WorkPlanCheckStatus): string {
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

function mapNotificationMethodText(method: NotificationMethod): string {
  const options: Array<{ value: Exclude<NotificationMethod, ''>; label: string }> = [
    { value: 'direct', label: '직접전달' },
    { value: 'registered_mail', label: '등기우편' },
    { value: 'email', label: '이메일' },
    { value: 'mobile', label: '모바일' },
    { value: 'other', label: '기타' },
  ];

  return options.map((item) => `${checkbox(method === item.value)} ${item.label}`).join(' ');
}

function mapRiskText(finding: ExistingWebReportData['document7Findings'][number]): string {
  const riskLevel = valueOrBlank(finding.riskLevel);
  if (riskLevel) {
    return riskLevel;
  }

  const parts = [valueOrBlank(finding.likelihood), valueOrBlank(finding.severity)].filter(Boolean);
  return parts.join(' / ');
}

function isFilledObject<T extends Record<string, unknown>>(value: T): boolean {
  return Object.values(value).some((item) => valueOrBlank(item) !== '');
}

function toCausativeLabel(key: string, measureLabelMap: Map<string, string>): string {
  const normalized = valueOrBlank(key);
  if (!normalized) {
    return '';
  }

  const mapped = measureLabelMap.get(normalized);
  if (mapped) {
    return mapped;
  }

  return normalized.replace(/_/g, ' ');
}

function looksLikeImageSource(source: string): boolean {
  const normalized = valueOrBlank(source);
  if (!normalized) {
    return false;
  }

  if (normalized.startsWith('data:image/')) {
    return true;
  }

  if (normalized.startsWith('blob:')) {
    return false;
  }

  const withoutQuery = normalized.split(/[?#]/)[0];
  const extension = path.extname(withoutQuery).replace('.', '').toLowerCase();
  return extension in IMAGE_EXTENSION_TO_MEDIA_TYPE;
}

function assetTextFallback(source: string): string {
  const normalized = valueOrBlank(source);
  if (!normalized) {
    return '';
  }

  if (normalized.startsWith('data:')) {
    return 'image';
  }

  const withoutQuery = normalized.split(/[?#]/)[0];
  const basename = withoutQuery.split(/[\\/]/).pop();
  return basename || normalized;
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
    photoUrl: '',
    location: '',
    likelihood: '',
    severity: '',
    riskLevel: '',
    accidentType: '',
    causativeAgentKey: '',
    inspector: '',
    emphasis: '',
    improvementPlan: '',
    legalReferenceTitle: '',
    referenceMaterial1: '',
    referenceMaterial2: '',
  };
}

function createEmptyPlan() {
  return { processName: '', hazard: '', countermeasure: '', note: '' };
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
    photoUrl: '',
    materialUrl: '',
    materialName: '',
    attendeeCount: '',
    content: '',
  };
}

function createEmptyActivity() {
  return { photoUrl: '', activityType: '', content: '' };
}

function createEmptyCase() {
  return { title: '', summary: '', imageUrl: '' };
}

function createEmptySafetyInfo() {
  return { title: '', body: '', imageUrl: '' };
}

function createEmptyMeasure(index: number) {
  return { number: index + 1, label: '', guidance: '', checked: false };
}

function createEmptyCheckRow() {
  return { prompt: '', rating: '' as ChecklistRating, note: '' };
}

function mapWebDataToTemplateBinding(data: ExistingWebReportData): TemplateBindingData {
  const text = Object.fromEntries(TEMPLATE_CONTRACT.textPlaceholders.map((placeholder) => [placeholder, '']));
  const images: Record<string, string> = {};
  const warnings: string[] = [];
  const truncated: Record<string, number> = {};
  const repeatCounts: Record<RepeatBlockPath, number> = {
    'sec7.findings': 1,
    'sec8.plans': 1,
    'sec11.education': 1,
    'sec12.activities': 1,
  };

  const measureLabelMap = new Map<string, string>(
    data.document6Measures
      .map((item) => [valueOrBlank(item.key ?? ''), valueOrBlank(item.label)] as const)
      .filter(([key, label]) => key && label),
  );

  const site = data.adminSiteSnapshot;
  const overview = data.document2Overview;

  text['cover.site_name'] = valueOrDash(data.meta.siteName || site.siteName);
  text['cover.report_date'] = valueOrDash(formatDateText(data.meta.reportDate));
  text['cover.drafter'] = valueOrDash(data.meta.drafter);
  text['cover.reviewer'] = valueOrDash(data.meta.reviewer);
  text['cover.approver'] = valueOrDash(data.meta.approver);
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
  text['sec2.assignee'] = valueOrDash(overview.assignee || data.meta.drafter);
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
    warnings.push(
      'Section 2 signature placeholder is text-only in the current template-ready HWPX. The binding writes a short asset label instead of embedding the signature image.',
    );
  }
  if (valueOrBlank(overview.workPlanChecks.otherHighRiskWork)) {
    warnings.push(
      'document2Overview.workPlanChecks.otherHighRiskWork exists in web data but the current template-ready HWPX has no matching placeholder, so it is skipped.',
    );
  }

  const fixedScenes = padFixedSlots(data.document3Scenes.slice(0, 2), 2, createEmptyScene);
  const extraScenes = padFixedSlots(data.document3Scenes.slice(2, 6), 4, createEmptyScene);
  if (data.document3Scenes.length > 6) {
    truncated.document3Scenes = data.document3Scenes.length - 6;
    warnings.push(`Section 3 only has 6 visual slots in the current template. ${truncated.document3Scenes} scene(s) were not rendered.`);
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

  const followUps = padFixedSlots(data.document4FollowUps.slice(0, 3), 3, createEmptyFollowUp);
  if (data.document4FollowUps.length > 3) {
    truncated.document4FollowUps = data.document4FollowUps.length - 3;
    warnings.push(
      `Section 4 currently renders 3 fixed follow-up slots. ${truncated.document4FollowUps} follow-up item(s) were not rendered.`,
    );
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
  if (
    data.document4FollowUps.some(
      (item) => valueOrBlank(item.beforePhotoUrl) || valueOrBlank(item.afterPhotoUrl),
    )
  ) {
    warnings.push(
      'Section 4 before/after photo placeholders are text-only in the current template-ready HWPX. The binding writes short asset labels instead of embedding images.',
    );
  }

  const measures = padFixedSlots(
    data.document6Measures.slice(0, 14),
    14,
    () => createEmptyMeasure(0),
  ).map((item, index) => item || createEmptyMeasure(index));
  for (let index = 0; index < measures.length; index += 1) {
    const current = measures[index] || createEmptyMeasure(index);
    text[`sec6.measures[${index}].checked_box`] = checkbox(Boolean(current.checked));
  }

  const findings = ensureRepeatItems(
    data.document7Findings.filter((item) => isFilledObject(item)),
    createEmptyFinding,
  );
  repeatCounts['sec7.findings'] = findings.length;
  findings.forEach((item, index) => {
    text[`sec7.findings[${index}].location`] = valueOrDash(item.location);
    text[`sec7.findings[${index}].risk_text`] = valueOrDash(mapRiskText(item));
    text[`sec7.findings[${index}].accident_type`] = valueOrDash(item.accidentType);
    text[`sec7.findings[${index}].causative_agent`] = valueOrDash(
      toCausativeLabel(item.causativeAgentKey, measureLabelMap),
    );
    text[`sec7.findings[${index}].inspector`] = valueOrDash(item.inspector || data.meta.drafter);
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

  const plans = ensureRepeatItems(
    data.document8Plans.filter((item) => isFilledObject(item)),
    createEmptyPlan,
  );
  repeatCounts['sec8.plans'] = plans.length;
  plans.forEach((item, index) => {
    text[`sec8.plans[${index}].process_name`] = valueOrDash(item.processName);
    text[`sec8.plans[${index}].hazard`] = valueOrDash(item.hazard);
    text[`sec8.plans[${index}].countermeasure`] = valueOrDash(item.countermeasure);
    text[`sec8.plans[${index}].note`] = valueOrBlank(item.note);
  });

  const tbmRows = padFixedSlots(data.document9SafetyChecks.tbm.slice(0, 5), 5, createEmptyCheckRow);
  const riskRows = padFixedSlots(data.document9SafetyChecks.riskAssessment.slice(0, 5), 5, createEmptyCheckRow);
  if (data.document9SafetyChecks.tbm.length > 5) {
    warnings.push('Section 9 TBM rows beyond the first 5 are ignored because the template has 5 fixed rows.');
  }
  if (data.document9SafetyChecks.riskAssessment.length > 5) {
    warnings.push('Section 9 risk-assessment rows beyond the first 5 are ignored because the template has 5 fixed rows.');
  }
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

  const measurements = padFixedSlots(data.document10Measurements.slice(0, 3), 3, createEmptyMeasurement);
  if (data.document10Measurements.length > 3) {
    truncated.document10Measurements = data.document10Measurements.length - 3;
    warnings.push(
      `Section 10 currently renders 3 fixed measurement slots. ${truncated.document10Measurements} measurement item(s) were not rendered.`,
    );
  }
  measurements.forEach((item, index) => {
    text[`sec10.measurements[${index}].instrument_type`] = valueOrDash(item.instrumentType);
    text[`sec10.measurements[${index}].measurement_location`] = valueOrDash(item.measurementLocation);
    text[`sec10.measurements[${index}].measured_value`] = valueOrDash(item.measuredValue);
    text[`sec10.measurements[${index}].safety_criteria`] = valueOrDash(item.safetyCriteria);
    text[`sec10.measurements[${index}].action_taken`] = valueOrDash(item.actionTaken);
  });

  const educationRecords = ensureRepeatItems(
    data.document11EducationRecords.filter((item) => isFilledObject(item)),
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
      warnings.push(
        'Section 11 material_image_or_file is image-only in the current template-ready HWPX. Non-image materialUrl values are left blank in the document.',
      );
    }
  });

  const activities = ensureRepeatItems(
    data.document12Activities.filter((item) => isFilledObject(item)),
    createEmptyActivity,
  );
  repeatCounts['sec12.activities'] = activities.length;
  activities.forEach((item, index) => {
    text[`sec12.activities[${index}].activity_type`] = valueOrDash(item.activityType);
    text[`sec12.activities[${index}].content`] = valueOrDash(item.content);
    images[`sec12.activities[${index}].photo_image`] = valueOrBlank(item.photoUrl);
  });

  const cases = padFixedSlots(data.document13Cases.slice(0, 4), 4, createEmptyCase);
  if (data.document13Cases.length > 4) {
    truncated.document13Cases = data.document13Cases.length - 4;
    warnings.push(`Section 13 only has 4 fixed cards in the current template. ${truncated.document13Cases} case item(s) were not rendered.`);
  }
  cases.forEach((item, index) => {
    text[`sec13.cases[${index}].title`] = valueOrDash(item.title);
    text[`sec13.cases[${index}].summary`] = valueOrDash(item.summary);
    images[`sec13.cases[${index}].image`] = valueOrBlank(item.imageUrl);
  });

  const safetyInfo = data.document14SafetyInfos[0] ?? createEmptySafetyInfo();
  if (data.document14SafetyInfos.length > 1) {
    warnings.push('Section 14 currently uses only the first safety-info item because the template has a single fixed notice slot.');
  }
  text['sec14.title'] = valueOrDash(safetyInfo.title);
  text['sec14.body'] = valueOrDash(safetyInfo.body);
  images['sec14.image'] = valueOrBlank(safetyInfo.imageUrl);

  return {
    text,
    images,
    repeatCounts,
    deferred: [...TEMPLATE_CONTRACT.deferred],
    warnings: Array.from(new Set(warnings)),
    truncated,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n');
}

function expandRepeatBlocks(
  xml: string,
  repeatCounts: Record<RepeatBlockPath, number>,
): { xml: string; imagePlaceholders: TemplateImagePlaceholder[] } {
  let currentXml = xml;
  const expandedImagePlaceholders: TemplateImagePlaceholder[] = TEMPLATE_IMAGE_PLACEHOLDERS.filter(
    (item) => !item.repeatBlockPath,
  ).map((item) => ({ ...item }));

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
    const repeatImagePlaceholders = TEMPLATE_IMAGE_PLACEHOLDERS.filter(
      (item) => item.repeatBlockPath === repeatBlockPath,
    );

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
  return xml.replace(/\{(?![#/])([^{}]+)\}/g, (_match: string, rawPath: string) => {
    const placeholderPath = rawPath.trim();
    return escapeXmlText(textBindings[placeholderPath] ?? '');
  });
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
    if (normalized.startsWith('blob:')) {
      warnings.push(`Blob URL images are not supported in the current Node-side generator: ${normalized}`);
      return null;
    }

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
        buffer: Buffer.from(base64, 'base64'),
        extension,
        mediaType: mediaType.toLowerCase(),
      };
    }

    if (/^https?:\/\//i.test(normalized)) {
      const response = await fetch(normalized);
      if (!response.ok) {
        warnings.push(`Failed to fetch image URL: ${normalized} (${response.status})`);
        return null;
      }

      const contentType = response.headers.get('content-type')?.split(';')[0].toLowerCase() ?? '';
      const extension =
        IMAGE_MEDIA_TYPE_TO_EXTENSION[contentType] ||
        path.extname(normalized.split(/[?#]/)[0]).replace('.', '').toLowerCase();
      const mediaType = IMAGE_EXTENSION_TO_MEDIA_TYPE[extension] || contentType;
      if (!mediaType || !IMAGE_EXTENSION_TO_MEDIA_TYPE[extension]) {
        warnings.push(`Unsupported remote image content type for HWPX embedding: ${normalized}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        extension,
        mediaType,
      };
    }

    const candidatePaths = [normalized, path.resolve(process.cwd(), normalized)];
    for (const candidatePath of candidatePaths) {
      try {
        const stat = await fs.stat(candidatePath);
        if (!stat.isFile()) {
          continue;
        }
        const extension = path.extname(candidatePath).replace('.', '').toLowerCase();
        const mediaType = IMAGE_EXTENSION_TO_MEDIA_TYPE[extension];
        if (!mediaType) {
          warnings.push(`Unsupported local image extension for HWPX embedding: ${candidatePath}`);
          return null;
        }
        const buffer = await fs.readFile(candidatePath);
        return {
          buffer,
          extension,
          mediaType,
        };
      } catch {
        continue;
      }
    }

    return null;
  })();

  cache.set(normalized, pending);
  return pending;
}

function upsertManifestItem(contentHpf: string, itemId: string, href: string, mediaType: string): string {
  const manifestItem = `<opf:item id="${itemId}" href="${href}" media-type="${mediaType}" isEmbeded="1" />`;
  const itemPattern = new RegExp(`<opf:item\\b[^>]*\\bid="${escapeRegExp(itemId)}"[^>]*/>`, 'g');
  const withoutExisting = contentHpf.replace(itemPattern, '');
  return withoutExisting.replace('</opf:manifest>', `${manifestItem}</opf:manifest>`);
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
  zip: any,
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
      throw new Error(
        `Manifest item "${replaced.sourceBinaryItemId}" not found while normalizing ${descriptor.placeholderPath}.`,
      );
    }

    const sourceEntry = zip.file(sourceManifestItem.href);
    if (!sourceEntry) {
      throw new Error(
        `Template image asset "${sourceManifestItem.href}" not found while normalizing ${descriptor.placeholderPath}.`,
      );
    }

    const extension = path.extname(sourceManifestItem.href) || '.bin';
    const normalizedHref = `BinData/${descriptor.binaryItemId}${extension}`;
    zip.file(normalizedHref, await sourceEntry.async('nodebuffer'));
    nextContentHpf = upsertManifestItem(
      nextContentHpf,
      descriptor.binaryItemId,
      normalizedHref,
      sourceManifestItem.mediaType,
    );
  }

  return {
    sectionXml: nextSectionXml,
    contentHpf: nextContentHpf,
  };
}

async function bindImagesIntoZip(
  zip: any,
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
    nextContentHpf = upsertManifestItem(
      nextContentHpf,
      imagePlaceholder.binaryItemId,
      href,
      finalAsset.mediaType,
    );
  }

  return nextContentHpf;
}

async function generateHwpxReport(options: {
  templatePath: string;
  outputPath: string;
  binding: TemplateBindingData;
}): Promise<{ outputPath: string; warnings: string[] }> {
  const templateBuffer = await fs.readFile(options.templatePath);
  const zip = await JSZip.loadAsync(templateBuffer);
  const warnings: string[] = [];

  const sectionEntry = zip.file('Contents/section0.xml');
  const contentEntry = zip.file('Contents/content.hpf');
  if (!sectionEntry || !contentEntry) {
    throw new Error('The template-ready HWPX does not contain Contents/section0.xml or Contents/content.hpf.');
  }

  const sectionXml = await sectionEntry.async('string');
  const contentHpf = await contentEntry.async('string');
  const normalized = await normalizeTemplateImageSlots(zip, sectionXml, contentHpf);
  const expanded = expandRepeatBlocks(normalized.sectionXml, options.binding.repeatCounts);
  const boundSectionXml = replaceTextPlaceholders(expanded.xml, options.binding.text);
  const boundContentHpf = await bindImagesIntoZip(
    zip,
    normalized.contentHpf,
    expanded.imagePlaceholders,
    options.binding,
    warnings,
  );

  zip.file('Contents/section0.xml', boundSectionXml);
  zip.file('Contents/content.hpf', boundContentHpf);

  const generatedBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  await fs.mkdir(path.dirname(options.outputPath), { recursive: true });
  await fs.writeFile(options.outputPath, generatedBuffer);

  return {
    outputPath: options.outputPath,
    warnings: Array.from(new Set(warnings)),
  };
}

async function generateHwpxReportFromData(options: {
  data: ExistingWebReportData;
  outputPath: string;
  templatePath?: string;
}) {
  const binding = mapWebDataToTemplateBinding(options.data);
  const generation = await generateHwpxReport({
    templatePath: path.resolve(options.templatePath ?? DEFAULT_TEMPLATE_PATH),
    outputPath: path.resolve(options.outputPath),
    binding,
  });

  return {
    outputPath: generation.outputPath,
    deferred: binding.deferred,
    warnings: Array.from(new Set([...binding.warnings, ...generation.warnings])),
    repeatCounts: binding.repeatCounts,
    truncated: binding.truncated,
  };
}

function parseArgs(argv: string[]) {
  const result: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      result[key] = 'true';
      continue;
    }

    result[key] = next;
    index += 1;
  }
  return result;
}

async function writeJsonFile(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(args.input ?? DEFAULT_INPUT_PATH);
  const templatePath = path.resolve(args.template ?? DEFAULT_TEMPLATE_PATH);
  const outputPath = path.resolve(args.output ?? DEFAULT_OUTPUT_PATH);
  const bindingOutPath = args['binding-out'] ? path.resolve(args['binding-out']) : '';
  const contractOutPath = args['contract-out'] ? path.resolve(args['contract-out']) : '';

  const rawInput = await fs.readFile(inputPath, 'utf8');
  const inputData = JSON.parse(rawInput) as ExistingWebReportData;
  const binding = mapWebDataToTemplateBinding(inputData);
  if (bindingOutPath) {
    await writeJsonFile(bindingOutPath, binding);
  }
  if (contractOutPath) {
    await writeJsonFile(contractOutPath, TEMPLATE_CONTRACT);
  }

  const generation = await generateHwpxReportFromData({
    data: inputData,
    templatePath,
    outputPath,
  });

  const summary = {
    inputPath,
    templatePath,
    outputPath: path.resolve(generation.outputPath),
    bindingOutPath: bindingOutPath || null,
    contractOutPath: contractOutPath || null,
    deferred: generation.deferred,
    warnings: generation.warnings,
    repeatCounts: generation.repeatCounts,
    truncated: generation.truncated,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

module.exports = {
  TEMPLATE_CONTRACT,
  mapWebDataToTemplateBinding,
  generateHwpxReport,
  generateHwpxReportFromData,
};
