'use client';

import JSZip from 'jszip';

import { FIXED_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import { getExtraSceneTitle } from '@/constants/inspectionSession/scenePhotos';
import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import type { ChecklistRating, InspectionSession } from '@/types/inspectionSession';

type RepeatBlockPath =
  | 'sec4.follow_ups'
  | 'sec7.findings'
  | 'sec8.plans'
  | 'sec10.measurements'
  | 'sec11.education'
  | 'sec12.activities';

interface RepeatBlockConfig {
  pageSize: number;
  prototypeIndices: number[];
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
  optional?: boolean;
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

interface InjectedImageBinding {
  placeholderPath: string;
  binaryItemId: string;
}

interface Doc5ChartEntry {
  label: string;
  count: number;
}

const HWPX_GENERATION_MODE: 'template_native' | 'advanced' = 'advanced';
const IMAGE_BINDING_MODE: 'embedded' | 'text_only' = 'embedded';
const TEMPLATE_FILENAME = '\uAE30\uC220\uC9C0\uB3C4 \uC218\uB3D9\uBCF4\uACE0\uC11C \uC571 - \uC11C\uC2DD_4.annotated.v7.hwpx';
const TEMPLATE_URL = `/templates/inspection/${encodeURIComponent(TEMPLATE_FILENAME)}`;
const TEMPLATE_IMAGE_DONOR_FILENAME = '\uAE30\uC220\uC9C0\uB3C4 \uC218\uB3D9\uBCF4\uACE0\uC11C \uC571 - \uC11C\uC2DD_4.annotated.v6.hwpx';
const TEMPLATE_IMAGE_DONOR_URL = `/templates/inspection/${encodeURIComponent(TEMPLATE_IMAGE_DONOR_FILENAME)}`;
const BLANK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5cH7QAAAAASUVORK5CYII=';
const BLANK_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';
const ZIP_STORED_ENTRY_NAMES = ['mimetype', 'version.xml', 'Preview/PrvImage.png'] as const;
const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_VERSION_MADE_BY = 0x0b17;
const ZIP_VERSION_NEEDED = 20;
const ZIP_DEFAULT_EXTERNAL_ATTR = 0x81800020;
const ZIP_OLE_EXTERNAL_ATTR = 0x81000021;
const HWPX_UNITCHAR_NAMESPACE = 'xmlns:hwpunitchar="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar"';
const HWPX_LASTSAVEBY_META = '<opf:meta name="lastsaveby" content="text">\uC7A5\uC815\uADDC</opf:meta>';
const DOC5_CHART_SEGMENT_COLORS = [
  '#4f8ae8',
  '#1aa8c8',
  '#2aa899',
  '#38b05a',
  '#d9b020',
  '#e88228',
  '#9b6ae8',
  '#e05a9a',
  '#6b6ee8',
  '#4cb0e8',
] as const;
const DOC5_CAUSATIVE_AGENT_LABELS = new Map(
  CAUSATIVE_AGENT_SECTIONS.flatMap((section) => section.rows.flatMap((row) => [row.left, row.right])).map((item) => [
    item.key,
    item.label,
  ]),
);
const DOC5_INJECTED_IMAGE_BINDINGS: InjectedImageBinding[] = [
  { placeholderPath: 'sec5.current_accident_chart_image', binaryItemId: 'tplimg23' },
  { placeholderPath: 'sec5.cumulative_accident_chart_image', binaryItemId: 'tplimg24' },
  { placeholderPath: 'sec5.current_agent_chart_image', binaryItemId: 'tplimg25' },
  { placeholderPath: 'sec5.cumulative_agent_chart_image', binaryItemId: 'tplimg26' },
];
const DOC5_SECTION_TITLE_CANDIDATES = [
  '5.현재 공정내 현존하는 유해·위험요인 분류',
  '5.현재 공정내 존재하는 유해·위험요인 분류',
] as const;
const DOC5_SUMMARY_DEFERRED_MARKERS = [
  '[[DEFERRED:auto_aggregation_required}',
  '[[DEFERRED:auto_aggregation_required]]',
  '[[DEFERRED:auto_aggregation_required]',
  '[[DEFERRED:auto_aggregation_required',
] as const;
const DOC5_CHART_TABLE_CELLS = [
  { row: 2, col: 0, binaryItemId: 'tplimg23' },
  { row: 2, col: 3, binaryItemId: 'tplimg24' },
  { row: 4, col: 0, binaryItemId: 'tplimg25' },
  { row: 4, col: 4, binaryItemId: 'tplimg26' },
] as const;

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

const REPEAT_BLOCK_CONFIG: Record<RepeatBlockPath, RepeatBlockConfig> = {
  'sec4.follow_ups': { pageSize: 3, prototypeIndices: [0, 1, 2] },
  'sec7.findings': { pageSize: 1, prototypeIndices: [0] },
  'sec8.plans': { pageSize: 6, prototypeIndices: [0, 1, 2, 3, 4, 5] },
  'sec10.measurements': { pageSize: 3, prototypeIndices: [0, 1, 2] },
  'sec11.education': { pageSize: 1, prototypeIndices: [0] },
  'sec12.activities': { pageSize: 1, prototypeIndices: [0] },
};

const REPEAT_BLOCKS = Object.keys(REPEAT_BLOCK_CONFIG) as RepeatBlockPath[];

const DEFERRED_SECTIONS = ['section15_removed_from_binding'];

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
const INVALID_XML_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/g;
const HWPX_BALANCE_TAGS = ['hp:subList', 'hp:p', 'hp:tbl', 'hp:tr', 'hp:tc', 'hp:t'] as const;

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

const BLANK_JPEG_ASSET: ResolvedImageAsset = {
  buffer: decodeBase64ToBytes(BLANK_JPEG_BASE64),
  extension: 'jpg',
  mediaType: 'image/jpg',
};

const LEGACY_TEMPLATE_IMAGE_REPAIRS = [
  {
    binaryItemId: 'image8',
    href: 'BinData/image8.jpg',
    asset: BLANK_JPEG_ASSET,
  },
  {
    binaryItemId: 'image9',
    href: 'BinData/image9.jpg',
    asset: BLANK_JPEG_ASSET,
  },
  {
    binaryItemId: 'image10',
    href: 'BinData/image10.png',
    asset: BLANK_PNG_ASSET,
  },
  {
    binaryItemId: 'image22',
    href: 'BinData/image22.png',
    asset: BLANK_PNG_ASSET,
  },
] as const;

const TEXT_PLACEHOLDERS = [
  'cover.site_name',
  'cover.report_date',
  'cover.drafter',
  'cover.reviewer',
  'cover.approver',
  'sec1.site_name',
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
  'sec2.guidance_date',
  'sec2.construction_type',
  'sec2.progress_rate',
  'sec2.assignee',
  'sec2.previous_implementation_status',
  'sec2.contact',
  'sec2.notification_method_text',
  'sec2.notification_direct_box',
  'sec2.notification_registered_mail_box',
  'sec2.notification_email_box',
  'sec2.notification_mobile_box',
  'sec2.notification_other_box',
  'sec2.notification_recipient_name',
  'sec2.notification_recipient_signature',
  'sec2.other_notification_method',
  'sec2.recent_accident_date',
  'sec2.accident_type',
  'sec2.accident_summary',
  'sec2.process_and_notes',
  ...WORK_PLAN_PLACEHOLDERS.map((item) => item.placeholderPath),
  'sec3.extra[0].title',
  'sec3.extra[1].title',
  'sec3.extra[2].title',
  'sec3.extra[3].title',
  ...Array.from({ length: 3 }, (_, index) => [
    `sec4.follow_ups[${index}].location`,
    `sec4.follow_ups[${index}].guidance_date`,
    `sec4.follow_ups[${index}].confirmation_date`,
    `sec4.follow_ups[${index}].result`,
  ]).flat(),
  'sec5.summary_text',
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
  ...Array.from({ length: 6 }, (_, index) => [
    `sec8.plans[${index}].process_name`,
    `sec8.plans[${index}].hazard`,
    `sec8.plans[${index}].countermeasure`,
  ]).flat(),
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
  ...Array.from({ length: 4 }, (_, index) => `sec13.cases[${index}].title`),
] as const;
const TEMPLATE_TEXT_TOKEN_SET = new Set<string>(TEXT_PLACEHOLDERS);
const TEMPLATE_REPEAT_TOKEN_SET = new Set<string>(REPEAT_BLOCKS);

const TEMPLATE_IMAGE_PLACEHOLDERS: TemplateImagePlaceholder[] = [
  { table: 2, row: 2, col: 0, placeholderPath: 'sec3.fixed[0].photo_image', binaryItemId: 'tplimg01' },
  { table: 2, row: 2, col: 1, placeholderPath: 'sec3.fixed[1].photo_image', binaryItemId: 'tplimg02' },
  { table: 2, row: 4, col: 0, placeholderPath: 'sec3.extra[0].photo_image', binaryItemId: 'tplimg03' },
  { table: 2, row: 4, col: 1, placeholderPath: 'sec3.extra[1].photo_image', binaryItemId: 'tplimg04' },
  { table: 2, row: 6, col: 0, placeholderPath: 'sec3.extra[2].photo_image', binaryItemId: 'tplimg05' },
  { table: 2, row: 6, col: 2, placeholderPath: 'sec3.extra[3].photo_image', binaryItemId: 'tplimg06' },
  {
    table: 3,
    row: 2,
    col: 1,
    placeholderPath: 'sec4.follow_ups[0].before_image',
    binaryItemId: 'tplimg27',
    repeatBlockPath: 'sec4.follow_ups',
  },
  {
    table: 3,
    row: 2,
    col: 4,
    placeholderPath: 'sec4.follow_ups[0].after_image',
    binaryItemId: 'tplimg28',
    repeatBlockPath: 'sec4.follow_ups',
  },
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
    placeholderPath: 'sec7.findings[0].photo_image_2',
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
    repeatBlockPath: 'sec10.measurements',
  },
  {
    table: 8,
    row: 7,
    col: 0,
    placeholderPath: 'sec10.measurements[1].photo_image',
    binaryItemId: 'tplimg12',
    repeatBlockPath: 'sec10.measurements',
  },
  {
    table: 8,
    row: 12,
    col: 0,
    placeholderPath: 'sec10.measurements[2].photo_image',
    binaryItemId: 'tplimg13',
    repeatBlockPath: 'sec10.measurements',
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
  {
    table: 1,
    row: 14,
    col: 2,
    placeholderPath: 'sec2.notification_recipient_signature_image',
    binaryItemId: 'tplimg22',
    optional: true,
  },
];

function valueOrBlank(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function valueOrDash(value: unknown): string {
  const normalized = valueOrBlank(value);
  return normalized || '-';
}

function documentContactValue(value: unknown): string {
  const normalized = valueOrBlank(value);
  if (!normalized) {
    return '';
  }

  const parts = normalized
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.length >= 2 ? parts[parts.length - 1] : normalized;
}

function checkbox(checked: boolean): string {
  return checked ? '\u2611' : '\u2610';
}

function escapeXmlText(value: string): string {
  return value
    .replace(INVALID_XML_CHAR_PATTERN, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeHwpxPlainText(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function estimateHwpxMaxCharsPerLine(horzSize: number, textHeight: number): number {
  const safeHeight = Math.max(textHeight, 900);
  return Math.max(8, Math.floor(horzSize / (safeHeight * 1.05)));
}

function charWidthUnits(char: string): number {
  return /[ -~]/.test(char) ? 0.6 : 1;
}

function wrapHwpxLine(text: string, maxCharsPerLine: number): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return [' '];
  }

  const lines: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let width = 0;
    let end = start;
    let lastWhitespace = -1;

    while (end < normalized.length) {
      const nextWidth = width + charWidthUnits(normalized[end]);
      if (nextWidth > maxCharsPerLine) {
        break;
      }
      width = nextWidth;
      if (/\s/.test(normalized[end])) {
        lastWhitespace = end;
      }
      end += 1;
    }

    if (end === normalized.length) {
      lines.push(normalized.slice(start));
      break;
    }

    if (lastWhitespace >= start) {
      lines.push(normalized.slice(start, lastWhitespace).trimEnd());
      start = lastWhitespace + 1;
      while (start < normalized.length && /\s/.test(normalized[start])) {
        start += 1;
      }
      continue;
    }

    lines.push(normalized.slice(start, end));
    start = end;
  }

  return lines.length ? lines : [' '];
}

function replaceInlineTextPlaceholders(text: string, textBindings: Record<string, string>): string {
  return text.replace(/\{(?![#/])([^{}]+)\}/g, (_match, rawPath: string) =>
    normalizeHwpxPlainText(textBindings[rawPath.trim()] ?? ''),
  );
}

function extractFirstLineSegMetric(paragraphXml: string, name: string): number | null {
  const match = paragraphXml.match(new RegExp(`<hp:lineseg\\b[^>]*\\b${name}="(\\d+)"`));
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

function isHwpxBlankParagraph(paragraphXml: string): boolean {
  const textMatch = paragraphXml.match(/<hp:t>([\s\S]*?)<\/hp:t>/);
  if (!textMatch) {
    return true;
  }

  const text = textMatch[1]
    .replace(/<hp:lineBreak\s*\/>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return !text;
}

function replaceStructuredTextPlaceholders(xml: string, textBindings: Record<string, string>): string {
  return xml.replace(/<hp:subList\b[\s\S]*?<\/hp:subList>/g, (subListXml) => {
    const openTagMatch = subListXml.match(/^<hp:subList\b[^>]*>/);
    if (!openTagMatch) {
      return subListXml;
    }

    const openTag = openTagMatch[0];
    const innerXml = subListXml.slice(openTag.length, -'</hp:subList>'.length);
    const paragraphs = innerXml.match(/<hp:p\b[\s\S]*?<\/hp:p>/g);
    if (!paragraphs?.length) {
      return subListXml;
    }

    let changed = false;
    const rebuilt: string[] = [];

    for (let index = 0; index < paragraphs.length; index += 1) {
      const paragraphXml = paragraphs[index];
      const paragraphMatch = paragraphXml.match(
        /^(<hp:p\b[^>]*>)([\s\S]*?)(<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>)<\/hp:p>$/,
      );
      if (!paragraphMatch) {
        rebuilt.push(paragraphXml);
        continue;
      }

      const [, paragraphOpen, paragraphBody, lineSegArrayXml] = paragraphMatch;
      const textRunMatch = paragraphBody.match(/^([\s\S]*?<hp:t>)([\s\S]*?)(<\/hp:t>[\s\S]*)$/);
      if (!textRunMatch) {
        rebuilt.push(paragraphXml);
        continue;
      }

      const [, textPrefix, rawTextTemplate, textSuffix] = textRunMatch;
      if (!/\{(?![#/])[^{}]+\}/.test(rawTextTemplate)) {
        rebuilt.push(paragraphXml);
        continue;
      }

      const lineSegMatch = lineSegArrayXml.match(
        /^(<hp:linesegarray>\s*)(<hp:lineseg\b[^>]*\bvertpos="(\d+)"[^>]*\bvertsize="(\d+)"[^>]*\btextheight="(\d+)"[^>]*\bspacing="(\d+)"[^>]*\bhorzsize="(\d+)"[^>]*\/>)([\s\S]*<\/hp:linesegarray>)$/,
      );
      if (!lineSegMatch) {
        rebuilt.push(paragraphXml);
        continue;
      }

      const [
        ,
        lineSegArrayOpen,
        lineSegTemplate,
        baseVertPosText,
        vertSizeText,
        textHeightText,
        spacingText,
        horzSizeText,
        lineSegArrayClose,
      ] = lineSegMatch;

      const consumedParagraphs = [paragraphXml];
      let lookaheadIndex = index + 1;
      while (lookaheadIndex < paragraphs.length && isHwpxBlankParagraph(paragraphs[lookaheadIndex])) {
        consumedParagraphs.push(paragraphs[lookaheadIndex]);
        lookaheadIndex += 1;
      }

      const baseVertPos = Number.parseInt(baseVertPosText, 10);
      const vertSize = Number.parseInt(vertSizeText, 10);
      const textHeight = Number.parseInt(textHeightText, 10);
      const spacing = Number.parseInt(spacingText, 10);
      const horzSize = Number.parseInt(horzSizeText, 10);
      const reservedVertPositions = consumedParagraphs
        .map((item) => extractFirstLineSegMetric(item, 'vertpos'))
        .filter((value): value is number => value !== null);
      const reservedSteps = reservedVertPositions
        .slice(1)
        .map((value, reservedIndex) => value - reservedVertPositions[reservedIndex])
        .filter((value) => value > 0);
      const lineStep = reservedSteps[0] ?? vertSize + spacing;

      const renderedText = replaceInlineTextPlaceholders(rawTextTemplate, textBindings).replace(
        /<hp:lineBreak\s*\/>/g,
        '\n',
      );
      const logicalLines = normalizeHwpxPlainText(renderedText).split('\n');
      const wrappedLines = logicalLines.flatMap((line) =>
        wrapHwpxLine(line, estimateHwpxMaxCharsPerLine(horzSize, textHeight)),
      );
      const finalLines = wrappedLines.length ? wrappedLines : [' '];

      rebuilt.push(
        ...finalLines.map((line, lineIndex) => {
          const nextVertPos = baseVertPos + lineStep * lineIndex;
          const nextLineSeg = lineSegTemplate.replace(/\bvertpos="\d+"/, `vertpos="${nextVertPos}"`);
          return `${paragraphOpen}${textPrefix}${escapeXmlText(line)}${textSuffix}${lineSegArrayOpen}${nextLineSeg}${lineSegArrayClose}</hp:p>`;
        }),
      );
      changed = true;
      index = lookaheadIndex - 1;
    }

    if (!changed) {
      return subListXml;
    }

    return `${openTag}${rebuilt.join('')}</hp:subList>`;
  });
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
      return '\uC774\uD589';
    case 'partial':
      return '\uBD80\uBD84 \uC774\uD589';
    case 'not_implemented':
      return '\uBBF8\uC774\uD589';
    default:
      return '';
  }
}

function mapWorkPlanStatus(value: string): string {
  switch (value) {
    case 'written':
      return '\uC791\uC131';
    case 'not_written':
      return '\uBBF8\uC791\uC131';
    case 'not_applicable':
      return '-';
    default:
      return '';
  }
}

function mapNotificationMethodText(method: string): string {
  const options = [
    { value: 'direct', label: '\uC9C1\uC811\uC804\uB2EC' },
    { value: 'registered_mail', label: '\uB4F1\uAE30\uC6B0\uD3B8' },
    { value: 'email', label: '\uC804\uC790\uC6B0\uD3B8' },
    { value: 'mobile', label: '\uBAA8\uBC14\uC77C' },
    { value: 'other', label: '\uAE30\uD0C0' },
  ] as const;

  return options.map((item) => `${checkbox(method === item.value)} ${item.label}`).join(' ');
}

function buildNotificationMethodLayout(overview: InspectionSession['document2Overview']): string {
  const slot = (value: string, width: number): string => value || '\u00A0'.repeat(width);
  const directName = overview.notificationMethod === 'direct' ? valueOrBlank(overview.notificationRecipientName) : '';
  const directSignature =
    overview.notificationMethod === 'direct' && !looksLikeImageSource(overview.notificationRecipientSignature)
      ? valueOrBlank(overview.notificationRecipientSignature)
      : '';
  const otherMethod = overview.notificationMethod === 'other' ? valueOrBlank(overview.otherNotificationMethod) : '';

  return [
    `${checkbox(overview.notificationMethod === 'direct')}\uC9C1\uC811\uC804\uB2EC (\uC131\uD568 ${slot(directName, 10)} / \uC11C\uBA85 ${slot(directSignature, 10)})`,
    `${checkbox(overview.notificationMethod === 'registered_mail')}\uB4F1\uAE30\uC6B0\uD3B8`,
    `${checkbox(overview.notificationMethod === 'email')}\uC804\uC790\uC6B0\uD3B8`,
    `${checkbox(overview.notificationMethod === 'mobile')}\uBAA8\uBC14\uC77C`,
    `${checkbox(overview.notificationMethod === 'other')}\uAE30\uD0C0 (${slot(otherMethod, 10)})`,
  ].join('   ');
}

function normalizeCaseTitleForTemplate(title: string): string {
  const normalized = valueOrBlank(title);
  if (!normalized) {
    return '-';
  }

  return normalized.replace(/\s+/g, '') === '\uD574\uB2F9\uC5C6\uC74C' ? '-' : normalized;
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

function buildNotificationSignatureImageRun(charPrIDRef: string): string {
  return (
    `<hp:run charPrIDRef="${charPrIDRef}">` +
    '<hp:pic id="2110926222" zOrder="0" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="1037185222" reverse="0">' +
    '<hp:offset x="0" y="0"/>' +
    '<hp:orgSz width="3200" height="1500"/>' +
    '<hp:curSz width="3200" height="1500"/>' +
    '<hp:flip horizontal="0" vertical="0"/>' +
    '<hp:rotationInfo angle="0" centerX="1600" centerY="750" rotateimage="1"/>' +
    '<hp:renderingInfo>' +
    '<hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>' +
    '<hc:scaMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>' +
    '<hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>' +
    '</hp:renderingInfo>' +
    '<hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="3200" y="0"/><hc:pt2 x="3200" y="1500"/><hc:pt3 x="0" y="1500"/></hp:imgRect>' +
    '<hp:imgClip left="0" right="0" top="0" bottom="0"/>' +
    '<hp:inMargin left="0" right="0" top="0" bottom="0"/>' +
    '<hp:imgDim dimwidth="0" dimheight="0"/>' +
    '<hc:img binaryItemIDRef="image22" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/>' +
    '<hp:effects/>' +
    '<hp:sz width="3200" widthRelTo="ABSOLUTE" height="1500" heightRelTo="ABSOLUTE" protect="0"/>' +
    '<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>' +
    '<hp:outMargin left="0" right="0" top="0" bottom="0"/>' +
    '<hp:shapeComment>통보방법 서명 이미지</hp:shapeComment>' +
    '</hp:pic><hp:t/></hp:run>'
  );
}

function hasDoc5FindingContent(item: InspectionSession['document7Findings'][number]): boolean {
  return Boolean(
    valueOrBlank(item.photoUrl) ||
      valueOrBlank(item.photoUrl2) ||
      valueOrBlank(item.location) ||
      valueOrBlank(item.likelihood) ||
      valueOrBlank(item.severity) ||
      valueOrBlank(item.riskLevel) ||
      valueOrBlank(item.accidentType) ||
      valueOrBlank(item.causativeAgentKey) ||
      valueOrBlank(item.inspector) ||
      valueOrBlank(item.emphasis) ||
      valueOrBlank(item.improvementPlan) ||
      valueOrBlank(item.legalReferenceTitle),
  );
}

function buildDoc5ChartEntries(
  items: InspectionSession['document7Findings'],
  getLabel: (item: InspectionSession['document7Findings'][number]) => string,
): Doc5ChartEntry[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const label = valueOrBlank(getLabel(item));
    if (!label) {
      continue;
    }
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.label.localeCompare(right.label, 'ko-KR');
    });
}

function renderDoc5ChartCardDataUrl(
  titleOrEntries: string | Doc5ChartEntry[],
  maybeEntries?: Doc5ChartEntry[],
): string {
  if (typeof document === 'undefined') {
    return '';
  }

  const rawEntries = Array.isArray(titleOrEntries) ? titleOrEntries : maybeEntries ?? [];
  const entries: Doc5ChartEntry[] = Array.isArray(rawEntries) ? rawEntries : [];

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 720;
  const context = canvas.getContext('2d');
  if (!context) {
    return '';
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#dbe3ea';
  context.lineWidth = 2;
  context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  context.textBaseline = 'top';

  const total = entries.reduce((sum, item) => sum + item.count, 0);
  if (entries.length === 0 || total === 0) {
    context.fillStyle = '#6b7280';
    context.font = '400 34px "Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
    context.fillText('집계된 유해위험요인 데이터가 없습니다.', 42, 126);
    return canvas.toDataURL('image/png');
  }

  const centerX = 280;
  const centerY = 360;
  const outerRadius = 210;
  const innerRadius = 116;
  let angle = -Math.PI / 2;

  for (let index = 0; index < entries.length; index += 1) {
    const item = entries[index];
    const sliceAngle = (item.count / total) * Math.PI * 2;
    const nextAngle = angle + sliceAngle;

    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, outerRadius, angle, nextAngle);
    context.arc(centerX, centerY, innerRadius, nextAngle, angle, true);
    context.closePath();
    context.fillStyle = DOC5_CHART_SEGMENT_COLORS[index % DOC5_CHART_SEGMENT_COLORS.length];
    context.fill();

    angle = nextAngle;
  }

  context.beginPath();
  context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  context.fillStyle = '#ffffff';
  context.fill();

  const legendFontSize = entries.length >= 6 ? 28 : entries.length >= 4 ? 31 : 34;
  const markerSize = entries.length >= 6 ? 22 : 26;
  const legendX = 560;
  const countX = 1138;
  const lineHeight = legendFontSize + 22;
  const legendStartY = Math.max(110, 360 - ((entries.length - 1) * lineHeight) / 2);
  const legendTextMaxWidth = countX - legendX - 84;

  context.font = `500 ${legendFontSize}px "Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif`;
  for (let index = 0; index < entries.length; index += 1) {
    const item = entries[index];
    const y = legendStartY + index * lineHeight;

    context.fillStyle = DOC5_CHART_SEGMENT_COLORS[index % DOC5_CHART_SEGMENT_COLORS.length];
    context.fillRect(legendX, y + 8, markerSize, markerSize);

    context.fillStyle = '#1f2937';
    context.textAlign = 'left';
    context.fillText(item.label, legendX + markerSize + 22, y, legendTextMaxWidth);

    context.font = `600 ${legendFontSize}px "Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif`;
    context.textAlign = 'right';
    context.fillText(String(item.count), countX, y);
    context.font = `500 ${legendFontSize}px "Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif`;
  }

  context.textAlign = 'left';
  return canvas.toDataURL('image/png');
}

function buildDoc5ChartImages(
  session: InspectionSession,
  siteSessions: InspectionSession[],
): Record<string, string> {
  const relevantSiteSessions = siteSessions.length > 0 ? siteSessions : [session];
  const currentFindings = session.document7Findings.filter((item) => hasDoc5FindingContent(item));
  const cumulativeFindings = relevantSiteSessions
    .filter((item) => item.reportNumber <= session.reportNumber)
    .flatMap((item) => item.document7Findings.filter((finding) => hasDoc5FindingContent(finding)));

  const currentAccidentEntries = buildDoc5ChartEntries(currentFindings, (item) => item.accidentType);
  const cumulativeAccidentEntries = buildDoc5ChartEntries(cumulativeFindings, (item) => item.accidentType);
  const currentAgentEntries = buildDoc5ChartEntries(
    currentFindings,
    (item) => DOC5_CAUSATIVE_AGENT_LABELS.get(item.causativeAgentKey) ?? item.causativeAgentKey,
  );
  const cumulativeAgentEntries = buildDoc5ChartEntries(
    cumulativeFindings,
    (item) => DOC5_CAUSATIVE_AGENT_LABELS.get(item.causativeAgentKey) ?? item.causativeAgentKey,
  );

  return {
    'sec5.current_accident_chart_image': renderDoc5ChartCardDataUrl('지적유형별 금회', currentAccidentEntries),
    'sec5.cumulative_accident_chart_image': renderDoc5ChartCardDataUrl('지적유형별 누적', cumulativeAccidentEntries),
    'sec5.current_agent_chart_image': renderDoc5ChartCardDataUrl('기인물별 금회', currentAgentEntries),
    'sec5.cumulative_agent_chart_image': renderDoc5ChartCardDataUrl('기인물별 누적', cumulativeAgentEntries),
  };
}

function textOnlyPlaceholderPathForImage(placeholderPath: string): string {
  return `${placeholderPath}_text`;
}

function applyTextOnlyImageFallbacks(
  text: Record<string, string>,
  images: Record<string, string>,
  warnings: string[],
): void {
  for (const [placeholderPath, source] of Object.entries(images)) {
    text[textOnlyPlaceholderPathForImage(placeholderPath)] = assetTextFallback(source);
  }

  warnings.push('Image embedding is temporarily disabled. Image slots render as text labels only.');
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

function repeatBlockPageCount(repeatBlockPath: RepeatBlockPath, itemCount: number): number {
  const { pageSize } = REPEAT_BLOCK_CONFIG[repeatBlockPath];
  return Math.max(1, Math.ceil(Math.max(0, itemCount) / pageSize));
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
    photoUrl2: '',
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
    photoUrl: '',
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
    topic: '',
    content: '',
  };
}

function createEmptyActivity() {
  return { id: '', photoUrl: '', photoUrl2: '', activityType: '', content: '' };
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
    'sec4.follow_ups': 1,
    'sec7.findings': 1,
    'sec8.plans': 1,
    'sec10.measurements': 1,
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

  text['sec1.site_name'] = valueOrDash(site.siteName);
  text['sec1.construction_period'] = valueOrDash(site.constructionPeriod);
  text['sec1.construction_amount'] = valueOrDash(site.constructionAmount);
  text['sec1.site_manager_name'] = valueOrDash(site.siteManagerName);
  text['sec1.site_contact'] = valueOrDash(site.siteContactEmail);
  text['sec1.site_address'] = valueOrDash(site.siteAddress);
  text['sec1.company_name'] = valueOrDash(site.companyName);
  text['sec1.corporation_registration_number'] = valueOrDash(site.corporationRegistrationNumber);
  text['sec1.business_registration_number'] = valueOrDash(site.businessRegistrationNumber);
  text['sec1.license_number'] = valueOrDash(site.licenseNumber);
  text['sec1.headquarters_contact'] = valueOrDash(documentContactValue(site.headquartersContact));
  text['sec1.headquarters_address'] = valueOrDash(site.headquartersAddress);

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
  text['sec2.notification_method_layout'] = buildNotificationMethodLayout(overview);
  text['sec2.notification_direct_box'] = checkbox(overview.notificationMethod === 'direct');
  text['sec2.notification_registered_mail_box'] = checkbox(overview.notificationMethod === 'registered_mail');
  text['sec2.notification_email_box'] = checkbox(overview.notificationMethod === 'email');
  text['sec2.notification_mobile_box'] = checkbox(overview.notificationMethod === 'mobile');
  text['sec2.notification_other_box'] = checkbox(overview.notificationMethod === 'other');
  text['sec2.notification_recipient_name'] = valueOrDash(overview.notificationRecipientName);
  text['sec2.notification_recipient_signature'] = looksLikeImageSource(overview.notificationRecipientSignature)
    ? ''
    : assetTextFallback(overview.notificationRecipientSignature);
  text['sec2.other_notification_method'] = valueOrBlank(overview.otherNotificationMethod);
  text['sec2.recent_accident_date'] = valueOrDash(formatDateText(overview.recentAccidentDate));
  text['sec2.accident_type'] = valueOrDash(overview.accidentType);
  text['sec2.accident_summary'] = valueOrDash(overview.accidentSummary);
  text['sec2.process_and_notes'] = valueOrDash(overview.processAndNotes);
  for (const item of WORK_PLAN_PLACEHOLDERS) {
    text[item.placeholderPath] = valueOrDash(mapWorkPlanStatus(overview.workPlanChecks[item.sourceKey]));
  }

  const signatureSource = valueOrBlank(overview.notificationRecipientSignature);
  images['sec2.notification_recipient_signature_image'] =
    overview.notificationMethod === 'direct' && looksLikeImageSource(signatureSource) ? signatureSource : '';

  if (overview.notificationMethod === 'direct' && !looksLikeImageSource(signatureSource)) {
    warnings.push('嶺뚯쉳???熬곣뫀堉????ルㅎ臾???嶺???類ㅺ뎄 ????嶺뚯솘??띠럾? ??怨룹꽑 ???沅??꾩렮維뽬떋??곸궠梨????類ㅺ뎄 ?잙갭梨??????닷젆????곕????덈펲.');
  }

  const fixedScenes = padFixedSlots(session.document3Scenes.slice(0, 2), 2, createEmptyScene);
  const extraScenes = padFixedSlots(session.document3Scenes.slice(2, 6), 4, createEmptyScene);
  if (session.document3Scenes.length > 6) {
    truncated.document3Scenes = session.document3Scenes.length - 6;
    warnings.push(`Section 3 has only 6 visual slots. ${truncated.document3Scenes} extra scene(s) were skipped.`);
  }

  text['sec3.extra[0].title'] = valueOrDash(
    extraScenes[0].title?.trim() || getExtraSceneTitle(FIXED_SCENE_COUNT),
  );
  text['sec3.extra[1].title'] = valueOrDash(
    extraScenes[1].title?.trim() || getExtraSceneTitle(FIXED_SCENE_COUNT + 1),
  );
  text['sec3.extra[2].title'] = valueOrDash(
    extraScenes[2].title?.trim() || getExtraSceneTitle(FIXED_SCENE_COUNT + 2),
  );
  text['sec3.extra[3].title'] = valueOrDash(
    extraScenes[3].title?.trim() || getExtraSceneTitle(FIXED_SCENE_COUNT + 3),
  );
  images['sec3.fixed[0].photo_image'] = valueOrBlank(fixedScenes[0].photoUrl);
  images['sec3.fixed[1].photo_image'] = valueOrBlank(fixedScenes[1].photoUrl);
  images['sec3.extra[0].photo_image'] = valueOrBlank(extraScenes[0].photoUrl);
  images['sec3.extra[1].photo_image'] = valueOrBlank(extraScenes[1].photoUrl);
  images['sec3.extra[2].photo_image'] = valueOrBlank(extraScenes[2].photoUrl);
  images['sec3.extra[3].photo_image'] = valueOrBlank(extraScenes[3].photoUrl);

  const followUps = ensureRepeatItems(session.document4FollowUps, createEmptyFollowUp);
  repeatCounts['sec4.follow_ups'] = followUps.length;
  for (let index = 0; index < followUps.length; index += 1) {
    const item = followUps[index];
    text[`sec4.follow_ups[${index}].location`] = valueOrDash(item.location);
    text[`sec4.follow_ups[${index}].guidance_date`] = valueOrDash(formatDateText(item.guidanceDate));
    text[`sec4.follow_ups[${index}].confirmation_date`] = valueOrDash(formatDateText(item.confirmationDate));
    text[`sec4.follow_ups[${index}].result`] = valueOrDash(item.result);
    images[`sec4.follow_ups[${index}].before_image`] = valueOrBlank(item.beforePhotoUrl);
    images[`sec4.follow_ups[${index}].after_image`] = valueOrBlank(item.afterPhotoUrl);
  }

  text['sec5.summary_text'] = valueOrDash(session.document5Summary.summaryText);

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
    images[`sec7.findings[${index}].photo_image_2`] = valueOrBlank(item.photoUrl2);
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

  const measurements = ensureRepeatItems(session.document10Measurements, createEmptyMeasurement);
  repeatCounts['sec10.measurements'] = measurements.length;
  measurements.forEach((item, index) => {
    text[`sec10.measurements[${index}].instrument_type`] = valueOrDash(item.instrumentType);
    text[`sec10.measurements[${index}].measurement_location`] = valueOrDash(item.measurementLocation);
    text[`sec10.measurements[${index}].measured_value`] = valueOrDash(item.measuredValue);
    text[`sec10.measurements[${index}].safety_criteria`] = valueOrDash(item.safetyCriteria);
    text[`sec10.measurements[${index}].action_taken`] = valueOrDash(item.actionTaken);
    images[`sec10.measurements[${index}].photo_image`] = valueOrBlank(item.photoUrl);
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
    text[`sec12.activities[${index}].activity_type`] = valueOrDash(item.content || item.activityType);
    text[`sec12.activities[${index}].content`] = valueOrDash(item.content);
    images[`sec12.activities[${index}].photo_image`] = valueOrBlank(item.photoUrl);
    images[`sec12.activities[${index}].photo_image_2`] = valueOrBlank(item.photoUrl2);
  });

  const cases = padFixedSlots(session.document13Cases.slice(0, 4), 4, createEmptyCase);
  cases.forEach((item, index) => {
    text[`sec13.cases[${index}].title`] = normalizeCaseTitleForTemplate(item.title);
    images[`sec13.cases[${index}].image`] = valueOrBlank(item.imageUrl);
  });

  const safetyInfo = session.document14SafetyInfos[0] ?? createEmptySafetyInfo();
  images['sec14.image'] = valueOrBlank(safetyInfo.imageUrl);

  if (IMAGE_BINDING_MODE === 'text_only') {
    applyTextOnlyImageFallbacks(text, images, warnings);
  }

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
  sourceBinaryByPlaceholderPath: Record<string, string> = {},
): {
  xml: string;
  imagePlaceholders: TemplateImagePlaceholder[];
  sourceBinaryByPlaceholderPath: Record<string, string>;
} {
  let currentXml = xml;
  const expandedImagePlaceholders = TEMPLATE_IMAGE_PLACEHOLDERS.filter((item) => !item.repeatBlockPath).map((item) => ({ ...item }));
  const expandedSourceBinaryByPlaceholderPath: Record<string, string> = { ...sourceBinaryByPlaceholderPath };

  for (const repeatBlockPath of REPEAT_BLOCKS) {
    const startMarker = `{#${repeatBlockPath}}`;
    const endMarker = `{/${repeatBlockPath}}`;
    const startIndex = currentXml.indexOf(startMarker);
    const endIndex = currentXml.indexOf(endMarker, startIndex >= 0 ? startIndex : 0);

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      continue;
    }

    const blockSpan = repeatBlockSpan(currentXml, startIndex, endIndex + endMarker.length);
    const blockStart = blockSpan?.start ?? startIndex;
    const blockEnd = blockSpan?.end ?? endIndex + endMarker.length;
    const before = currentXml.slice(0, blockStart);
    const blockTemplateXml = blockSpan
      ? currentXml.slice(blockStart, blockEnd).replaceAll(startMarker, '').replaceAll(endMarker, '')
      : currentXml.slice(startIndex + startMarker.length, endIndex);
    const after = currentXml.slice(blockEnd);
    const config = REPEAT_BLOCK_CONFIG[repeatBlockPath];
    const repeatCount = repeatBlockPageCount(repeatBlockPath, repeatCounts[repeatBlockPath] ?? 1);
    const repeatImagePlaceholders = TEMPLATE_IMAGE_PLACEHOLDERS.filter((item) => item.repeatBlockPath === repeatBlockPath);

    const repeatedXml = Array.from({ length: repeatCount }, (_, pageIndex) => {
      const indexMap = new Map<number, number>(
        config.prototypeIndices.map((prototypeIndex) => [
          prototypeIndex,
          pageIndex * config.pageSize + prototypeIndex,
        ]),
      );
      let blockXml = blockTemplateXml;

      for (const [prototypeIndex, nextIndex] of indexMap) {
        blockXml = blockXml.replaceAll(
          `${repeatBlockPath}[${prototypeIndex}].`,
          `${repeatBlockPath}[${nextIndex}].`,
        );
      }

      for (const imagePlaceholder of repeatImagePlaceholders) {
        const placeholderIndexMatch = imagePlaceholder.placeholderPath.match(/\[(\d+)\]\./);
        const placeholderIndex = placeholderIndexMatch ? Number.parseInt(placeholderIndexMatch[1], 10) : 0;
        const nextPlaceholderIndex = indexMap.get(placeholderIndex);
        if (nextPlaceholderIndex == null) {
          continue;
        }
        const repeatedPlaceholderPath = imagePlaceholder.placeholderPath.replace(
          `${repeatBlockPath}[${placeholderIndex}].`,
          `${repeatBlockPath}[${nextPlaceholderIndex}].`,
        );
        const repeatedBinaryItemId =
          pageIndex === 0
            ? imagePlaceholder.binaryItemId
            : `${imagePlaceholder.binaryItemId}__${pageIndex}`;

        if (pageIndex > 0) {
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
        const sourceBinaryItemId = sourceBinaryByPlaceholderPath[imagePlaceholder.placeholderPath];
        if (sourceBinaryItemId) {
          expandedSourceBinaryByPlaceholderPath[repeatedPlaceholderPath] = sourceBinaryItemId;
        }
      }

      return blockXml;
    }).join('');

    currentXml = `${before}${repeatedXml}${after}`;
  }

  return {
    xml: currentXml.replace(/\{#([^{}]+)\}|\{\/([^{}]+)\}/g, ''),
    imagePlaceholders: expandedImagePlaceholders,
    sourceBinaryByPlaceholderPath: expandedSourceBinaryByPlaceholderPath,
  };
}

function replaceTextPlaceholders(xml: string, textBindings: Record<string, string>): string {
  return replaceStructuredTextPlaceholders(xml, textBindings).replace(/\{(?![#/])([^{}]+)\}/g, (_match, rawPath: string) => {
    const placeholderPath = rawPath.trim();
    return escapeXmlText(textBindings[placeholderPath] ?? '');
  });
}

function stripRepeatBlockMarkers(xml: string): string {
  return xml.replace(/\{#([^{}]+)\}|\{\/([^{}]+)\}/g, '');
}

function repeatBlockSpan(
  xml: string,
  startIndex: number,
  endIndexExclusive: number,
): { start: number; end: number } | null {
  const tables = tableSpans(xml);
  const paragraphs = paragraphSpans(xml);
  const tableIndex = tables.findIndex(
    (span) => startIndex >= span.start && endIndexExclusive <= span.end,
  );

  if (tableIndex === -1) {
    return null;
  }

  const containingTable = tables[tableIndex];
  const containingParagraph =
    paragraphs.find((span) => containingTable.start >= span.start && containingTable.end <= span.end) ?? containingTable;
  const nextTable = tables[tableIndex + 1];

  if (!nextTable) {
    return {
      start: containingParagraph.start,
      end: containingParagraph.end,
    };
  }

  const nextParagraph =
    paragraphs.find((span) => nextTable.start >= span.start && nextTable.end <= span.end) ?? nextTable;

  return {
    start: containingParagraph.start,
    end: nextParagraph.start,
  };
}

function injectPlaceholderIntoBlankParagraphRange(
  xml: string,
  startIndex: number,
  endIndexExclusive: number,
  placeholderPath: string,
): string {
  const slice = xml.slice(startIndex, endIndexExclusive);
  const paragraphMatches = Array.from(slice.matchAll(/<hp:p\b[\s\S]*?<\/hp:p>/g));
  if (!paragraphMatches.length) {
    return xml;
  }

  const pickParagraph = (minimumVertPos: number) =>
    paragraphMatches.find((match) => {
      const paragraphXml = match[0];
      const vertPos = extractFirstLineSegMetric(paragraphXml, 'vertpos') ?? -1;
      return isHwpxBlankParagraph(paragraphXml) && vertPos >= minimumVertPos;
    });

  const candidate = pickParagraph(48000) ?? pickParagraph(0);
  if (!candidate) {
    return xml;
  }

  const paragraphXml = candidate[0];
  const charPrIDRef = paragraphXml.match(/<hp:run\b[^>]*charPrIDRef="(\d+)"/)?.[1] ?? '0';
  const patchedParagraphXml = paragraphXml.replace(
    /<hp:run\b[^>]*\/>/,
    `<hp:run charPrIDRef="${charPrIDRef}"><hp:t>{${placeholderPath}}</hp:t></hp:run>`,
  );

  if (patchedParagraphXml === paragraphXml) {
    return xml;
  }

  const paragraphStart = startIndex + (candidate.index ?? 0);
  return `${xml.slice(0, paragraphStart)}${patchedParagraphXml}${xml.slice(paragraphStart + paragraphXml.length)}`;
}

function buildDoc5ChartPictureRun(
  charPrIDRef: string,
  binaryItemId: string,
  dimensions?: { width: number; height: number },
): string {
  const width = Math.max(6000, dimensions?.width ?? 23500);
  const height = Math.max(4800, dimensions?.height ?? 14100);
  const numericSuffix = Number.parseInt(binaryItemId.replace(/\D+/g, ''), 10) || 0;
  const pictureId = 2110926300 + numericSuffix;
  const instanceId = 1037185300 + numericSuffix;

  return (
    `<hp:run charPrIDRef="${charPrIDRef}">` +
    `<hp:pic id="${pictureId}" zOrder="0" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="${instanceId}" reverse="0">` +
    '<hp:offset x="0" y="0"/>' +
    `<hp:orgSz width="${width}" height="${height}"/>` +
    `<hp:curSz width="${width}" height="${height}"/>` +
    '<hp:flip horizontal="0" vertical="0"/>' +
    `<hp:rotationInfo angle="0" centerX="${Math.floor(width / 2)}" centerY="${Math.floor(height / 2)}" rotateimage="1"/>` +
    '<hp:renderingInfo>' +
    '<hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>' +
    '<hc:scaMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>' +
    '<hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>' +
    '</hp:renderingInfo>' +
    `<hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="${width}" y="0"/><hc:pt2 x="${width}" y="${height}"/><hc:pt3 x="0" y="${height}"/></hp:imgRect>` +
    '<hp:imgClip left="0" right="0" top="0" bottom="0"/>' +
    '<hp:inMargin left="0" right="0" top="0" bottom="0"/>' +
    '<hp:imgDim dimwidth="0" dimheight="0"/>' +
    `<hc:img binaryItemIDRef="${binaryItemId}" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/>` +
    '<hp:effects/>' +
    `<hp:sz width="${width}" widthRelTo="ABSOLUTE" height="${height}" heightRelTo="ABSOLUTE" protect="0"/>` +
    '<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>' +
    '<hp:outMargin left="0" right="0" top="0" bottom="0"/>' +
    `<hp:shapeComment>${binaryItemId}</hp:shapeComment>` +
    '</hp:pic><hp:t/></hp:run>'
  );
}

function buildDoc5ChartRowParagraph(paragraphXml: string, leftBinaryId: string, rightBinaryId: string): string {
  const paragraphMatch = paragraphXml.match(/^(<hp:p\b[^>]*>)([\s\S]*?)(<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>)<\/hp:p>$/);
  if (!paragraphMatch) {
    return paragraphXml;
  }

  const [, paragraphOpen, , lineSegArrayXml] = paragraphMatch;
  const charPrIDRef = paragraphXml.match(/<hp:run\b[^>]*charPrIDRef="(\d+)"/)?.[1] ?? '0';
  const rowBody =
    buildDoc5ChartPictureRun(charPrIDRef, leftBinaryId) +
    '<hp:run charPrIDRef="0"><hp:t> </hp:t></hp:run>' +
    buildDoc5ChartPictureRun(charPrIDRef, rightBinaryId);

  return `${paragraphOpen}${rowBody}${lineSegArrayXml}</hp:p>`;
}

function findDoc5TableIndex(sectionXml: string): number | null {
  const tables = tableSpans(sectionXml);
  const index = tables.findIndex((span) => {
    const tableXml = sectionXml.slice(span.start, span.end);
    return DOC5_SECTION_TITLE_CANDIDATES.some((title) => tableXml.includes(title));
  });

  return index === -1 ? null : index;
}

function locateDoc5TableCell(
  sectionXml: string,
  row: number,
  col: number,
): ReturnType<typeof locateTemplateCell> {
  const tableIndex = findDoc5TableIndex(sectionXml);
  if (tableIndex == null) {
    return null;
  }

  return locateTemplateCell(sectionXml, { table: tableIndex, row, col });
}

function extractCellSize(cellXml: string): { width: number; height: number } | null {
  const match = cellXml.match(/<hp:cellSz\b[^>]*\bwidth="(\d+)"[^>]*\bheight="(\d+)"/);
  if (!match) {
    return null;
  }

  return {
    width: Number.parseInt(match[1], 10),
    height: Number.parseInt(match[2], 10),
  };
}

function buildDoc5ChartCellParagraph(
  paragraphXml: string,
  binaryItemId: string,
  cellXml: string,
): string {
  const paragraphMatch = paragraphXml.match(
    /^(<hp:p\b[^>]*>)([\s\S]*?)(<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>)<\/hp:p>$/,
  );
  if (!paragraphMatch) {
    return paragraphXml;
  }

  const [, paragraphOpen, , lineSegArrayXml] = paragraphMatch;
  const charPrIDRef = paragraphXml.match(/<hp:run\b[^>]*charPrIDRef="(\d+)"/)?.[1] ?? '0';
  const cellSize = extractCellSize(cellXml);
  const dimensions = cellSize
    ? {
        width: Math.max(9000, cellSize.width - 2400),
        height: Math.max(6400, cellSize.height - 1200),
      }
    : undefined;
  const rowBody = buildDoc5ChartPictureRun(charPrIDRef, binaryItemId, dimensions);

  return `${paragraphOpen}${rowBody}${lineSegArrayXml}</hp:p>`;
}

function injectDoc5ChartIntoCell(cellXml: string, binaryItemId: string): string {
  if (cellXml.includes(`binaryItemIDRef="${binaryItemId}"`)) {
    return cellXml;
  }

  const subListXml = extractCellSubListXml(cellXml);
  if (!subListXml) {
    return cellXml;
  }

  const subListOpen = subListXml.match(/^<hp:subList\b[^>]*>/)?.[0];
  const paragraphs = subListXml.match(/<hp:p\b[\s\S]*?<\/hp:p>/g);
  if (!subListOpen || !paragraphs?.length) {
    return cellXml;
  }

  const templateParagraph = paragraphs.find((paragraphXml) => isHwpxBlankParagraph(paragraphXml)) ?? paragraphs[0];
  const chartParagraph = buildDoc5ChartCellParagraph(templateParagraph, binaryItemId, cellXml);
  const patchedSubListXml = `${subListOpen}${chartParagraph}</hp:subList>`;

  return cellXml.replace(subListXml, patchedSubListXml);
}

function ensureDoc5ChartImageRows(sectionXml: string): string {
  if (DOC5_INJECTED_IMAGE_BINDINGS.every((item) => sectionXml.includes(`binaryItemIDRef="${item.binaryItemId}"`))) {
    return sectionXml;
  }

  let nextXml = sectionXml;
  let patchedCellCount = 0;

  for (const descriptor of DOC5_CHART_TABLE_CELLS) {
    const located = locateDoc5TableCell(nextXml, descriptor.row, descriptor.col);
    if (!located) {
      continue;
    }

    const patchedCellXml = injectDoc5ChartIntoCell(located.cellXml, descriptor.binaryItemId);
    if (patchedCellXml === located.cellXml) {
      continue;
    }

    nextXml = replaceLocatedTemplateCell(nextXml, located, patchedCellXml);
    patchedCellCount += 1;
  }

  if (patchedCellCount > 0) {
    return nextXml;
  }

  const tables = tableSpans(sectionXml);
  const sec4Table = tables[3];
  const sec6Table = tables[4];
  if (!sec4Table || !sec6Table || sec4Table.end >= sec6Table.start) {
    return sectionXml;
  }

  const slice = sectionXml.slice(sec4Table.end, sec6Table.start);
  const blankParagraphs = Array.from(slice.matchAll(/<hp:p\b[\s\S]*?<\/hp:p>/g)).filter((match) =>
    isHwpxBlankParagraph(match[0]),
  );
  if (blankParagraphs.length < 3) {
    return sectionXml;
  }

  const rowParagraphs = [blankParagraphs[0], blankParagraphs[2]];
  const rowBindings: Array<[InjectedImageBinding, InjectedImageBinding]> = [
    [DOC5_INJECTED_IMAGE_BINDINGS[0], DOC5_INJECTED_IMAGE_BINDINGS[1]],
    [DOC5_INJECTED_IMAGE_BINDINGS[2], DOC5_INJECTED_IMAGE_BINDINGS[3]],
  ];

  nextXml = sectionXml;
  let offsetDelta = 0;

  rowParagraphs.forEach((match, index) => {
    const paragraphXml = match[0];
    const replacement = buildDoc5ChartRowParagraph(
      paragraphXml,
      rowBindings[index][0].binaryItemId,
      rowBindings[index][1].binaryItemId,
    );
    const paragraphStart = sec4Table.end + (match.index ?? 0) + offsetDelta;
    nextXml = `${nextXml.slice(0, paragraphStart)}${replacement}${nextXml.slice(paragraphStart + paragraphXml.length)}`;
    offsetDelta += replacement.length - paragraphXml.length;
  });

  return nextXml;
}

function ensureDoc5SummaryPlaceholder(sectionXml: string): string {
  if (sectionXml.includes('{sec5.summary_text}')) {
    return sectionXml;
  }

  let replacedMarkerXml = sectionXml;
  for (const marker of DOC5_SUMMARY_DEFERRED_MARKERS) {
    replacedMarkerXml = replacedMarkerXml.replaceAll(marker, '{sec5.summary_text}');
  }
  if (replacedMarkerXml !== sectionXml) {
    return replacedMarkerXml;
  }

  const tables = tableSpans(sectionXml);
  const sec4Table = tables[3];
  const sec6Table = tables[4];
  if (!sec4Table || !sec6Table || sec4Table.end >= sec6Table.start) {
    return sectionXml;
  }

  return injectPlaceholderIntoBlankParagraphRange(sectionXml, sec4Table.end, sec6Table.start, 'sec5.summary_text');
}

function applyTemplateTextQuirks(xml: string): string {
  return xml
    .replace(
      /\(\s*\{sec1\.corporation_registration_number\}\s*\)\s*회차\s*\/\s*총\(\s*\{sec1\.business_registration_number\}\s*\)\s*회/g,
      '(  {sec2.visit_count}  )회차 / 총(  {sec2.total_visit_count}  )회',
    )
    .replace(
      /\{sec2\.notification_method_text\}\s*\/\s*\{sec2\.notification_recipient_name\}\s*\/\s*\{sec2\.notification_recipient_signature\}\s*\/\s*\{sec2\.other_notification_method\}/g,
      '{sec2.notification_method_layout}',
    );
}

function stripLineSegArrays(xml: string): string {
  return xml.replace(/<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>/g, '');
}

function replaceTextPlaceholdersPlain(xml: string, textBindings: Record<string, string>): string {
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

function collectManifestItemIds(contentHpf: string): string[] {
  return Array.from(contentHpf.matchAll(/<opf:item\b[^>]*\bid="([^"]+)"/g), (match) => match[1]);
}

function collectBinaryItemRefs(sectionXml: string): Set<string> {
  return new Set(Array.from(sectionXml.matchAll(/binaryItemIDRef="([^"]+)"/g), (match) => match[1]));
}

function findUnresolvedTemplateTokens(sectionXml: string): string[] {
  const unresolved = new Set<string>();

  for (const match of sectionXml.matchAll(/\{(#|\/)?([^{}]+)\}/g)) {
    const prefix = match[1] ?? '';
    const token = match[2].trim();
    const isKnownTextToken = !prefix && TEMPLATE_TEXT_TOKEN_SET.has(token);
    const isKnownRepeatToken = Boolean(prefix) && TEMPLATE_REPEAT_TOKEN_SET.has(token);
    if (isKnownTextToken || isKnownRepeatToken) {
      unresolved.add(match[0]);
    }
  }

  return Array.from(unresolved);
}

function countTagOccurrences(xml: string, tagName: string, closing = false): number {
  const pattern = closing ? new RegExp(`</${tagName}>`, 'g') : new RegExp(`<${tagName}\\b`, 'g');
  return Array.from(xml.matchAll(pattern)).length;
}

function countSelfClosingTagOccurrences(xml: string, tagName: string): number {
  return Array.from(xml.matchAll(new RegExp(`<${tagName}\\b[^>]*\\/>`, 'g'))).length;
}

function validateGeneratedHwpxOrThrow(zip: JSZip, sectionXml: string, contentHpf: string): void {
  const issues: string[] = [];
  const unresolvedTokens = findUnresolvedTemplateTokens(sectionXml);
  if (unresolvedTokens.length > 0) {
    issues.push(`Unresolved template token(s): ${unresolvedTokens.slice(0, 5).join(', ')}`);
  }

  const manifestItems = parseManifestItems(contentHpf);
  const manifestIds = collectManifestItemIds(contentHpf);
  const duplicateManifestIds = manifestIds.filter((itemId, index) => manifestIds.indexOf(itemId) !== index);
  if (duplicateManifestIds.length > 0) {
    issues.push(`Duplicate manifest item id(s): ${Array.from(new Set(duplicateManifestIds)).slice(0, 5).join(', ')}`);
  }

  const binaryRefs = collectBinaryItemRefs(sectionXml);
  for (const binaryRef of binaryRefs) {
    const manifestItem = manifestItems.get(binaryRef);
    if (!manifestItem) {
      issues.push(`Missing manifest entry for binaryItemIDRef "${binaryRef}"`);
      continue;
    }
    if (!zip.files[manifestItem.href]) {
      issues.push(`Manifest item "${manifestItem.id}" points to missing zip entry "${manifestItem.href}"`);
    }
  }

  for (const tagName of HWPX_BALANCE_TAGS) {
    const openCount = countTagOccurrences(sectionXml, tagName);
    const closeCount = countTagOccurrences(sectionXml, tagName, true);
    const selfClosingCount = countSelfClosingTagOccurrences(sectionXml, tagName);
    if (openCount !== closeCount + selfClosingCount) {
      issues.push(
        `Unbalanced ${tagName} tags (${openCount} open / ${closeCount} close / ${selfClosingCount} self-closing)`,
      );
    }
  }

  if (issues.length > 0) {
    throw new Error(`Generated HWPX integrity check failed: ${issues.slice(0, 6).join(' | ')}`);
  }
}

function upsertManifestItem(contentHpf: string, itemId: string, href: string, mediaType: string): string {
  const manifestItem = `<opf:item id="${itemId}" href="${href}" media-type="${mediaType}" isEmbeded="1" />`;
  const itemPattern = new RegExp(`<opf:item\\b[^>]*\\bid="${escapeRegExp(itemId)}"[^>]*/>`, 'g');
  const withoutExisting = contentHpf.replace(itemPattern, '');
  return withoutExisting.replace('</opf:manifest>', `${manifestItem}</opf:manifest>`);
}

function normalizeHwpxMediaType(mediaType: string, href: string): string {
  const normalized = mediaType.toLowerCase();
  const extension = href.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';
  if (normalized === 'image/jpeg' || normalized === 'image/jpg' || extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpg';
  }
  return normalized;
}

function extensionForManifestItem(item: ManifestItem): string {
  const hrefExtension = item.href.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';
  if (hrefExtension) {
    return hrefExtension === 'jpeg' ? 'jpg' : hrefExtension;
  }

  const mediaType = normalizeHwpxMediaType(item.mediaType, item.href);
  return IMAGE_MEDIA_TYPE_TO_EXTENSION[mediaType] ?? 'bin';
}

async function cloneManifestBinaryAsset(
  zip: JSZip,
  item: ManifestItem,
  targetBinaryItemId: string,
): Promise<ManifestItem> {
  const sourceEntry = zip.file(item.href);
  if (!sourceEntry) {
    throw new Error(`Manifest item "${item.id}" points to missing zip entry "${item.href}"`);
  }

  const extension = extensionForManifestItem(item);
  const href = `BinData/${targetBinaryItemId}.${extension}`;
  const buffer = await sourceEntry.async('uint8array');
  zip.file(href, buffer, { compression: 'STORE' });

  return {
    id: targetBinaryItemId,
    href,
    mediaType: normalizeHwpxMediaType(item.mediaType, href),
  };
}

function tableSpans(xml: string): Array<{ start: number; end: number }> {
  return Array.from(xml.matchAll(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g)).map((match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}

function paragraphSpans(xml: string): Array<{ start: number; end: number }> {
  return balancedTagSpans(xml, 'hp:p');
}

function balancedTagSpans(xml: string, tagName: string): Array<{ start: number; end: number }> {
  const escapedTagName = escapeRegExp(tagName);
  const tokenPattern = new RegExp(`<${escapedTagName}\\b[^>]*\\/?>|<\\/${escapedTagName}>`, 'g');
  const spans: Array<{ start: number; end: number }> = [];
  const stack: number[] = [];

  for (const match of xml.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    const isClosing = token.startsWith(`</${tagName}`);
    const isSelfClosing = !isClosing && token.endsWith('/>');

    if (isClosing) {
      const start = stack.pop();
      if (start != null) {
        spans.push({ start, end: index + token.length });
      }
      continue;
    }

    if (isSelfClosing) {
      spans.push({ start: index, end: index + token.length });
      continue;
    }

    stack.push(index);
  }

  return spans.sort((left, right) => left.start - right.start);
}

function locateTemplateCell(
  xml: string,
  descriptor: Pick<TemplateImagePlaceholder, 'table' | 'row' | 'col'>,
): {
  tableSpan: { start: number; end: number };
  tableXml: string;
  cellXml: string;
  cellStart: number;
  cellEnd: number;
} | null {
  const spans = tableSpans(xml);
  const tableSpan = spans[descriptor.table];
  if (!tableSpan) {
    return null;
  }

  const tableXml = xml.slice(tableSpan.start, tableSpan.end);
  const cellPattern = /<hp:tc\b[\s\S]*?<\/hp:tc>/g;
  const marker = `<hp:cellAddr colAddr="${descriptor.col}" rowAddr="${descriptor.row}"`;

  for (const match of tableXml.matchAll(cellPattern)) {
    const cellXml = match[0];
    if (!cellXml.includes(marker)) {
      continue;
    }

    const cellStart = match.index ?? 0;
    return {
      tableSpan,
      tableXml,
      cellXml,
      cellStart,
      cellEnd: cellStart + cellXml.length,
    };
  }

  return null;
}

function replaceLocatedTemplateCell(
  xml: string,
  located: {
    tableSpan: { start: number; end: number };
    tableXml: string;
    cellStart: number;
    cellEnd: number;
  },
  nextCellXml: string,
): string {
  const patchedTableXml =
    `${located.tableXml.slice(0, located.cellStart)}${nextCellXml}${located.tableXml.slice(located.cellEnd)}`;
  return `${xml.slice(0, located.tableSpan.start)}${patchedTableXml}${xml.slice(located.tableSpan.end)}`;
}

function ensureNotificationSignatureImageSlot(sectionXml: string): string {
  const signatureCell = locateTemplateCell(sectionXml, { table: 1, row: 14, col: 2 });
  if (!signatureCell) {
    return sectionXml;
  }

  if (
    signatureCell.cellXml.includes('binaryItemIDRef="image22"') ||
    signatureCell.cellXml.includes('binaryItemIDRef="tplimg22"')
  ) {
    return sectionXml;
  }

  const patchedCellXml = signatureCell.cellXml.replace(
    /<hp:run\b[^>]*charPrIDRef="(\d+)"[^>]*><hp:t>\s*\{sec2\.notification_recipient_signature\}\s*<\/hp:t><\/hp:run>/,
    (_match, charPrIDRef: string) =>
      `${buildNotificationSignatureImageRun(charPrIDRef)}<hp:run charPrIDRef="${charPrIDRef}"><hp:t>{sec2.notification_recipient_signature}</hp:t></hp:run>`,
  );

  if (patchedCellXml === signatureCell.cellXml) {
    return sectionXml;
  }

  return replaceLocatedTemplateCell(sectionXml, signatureCell, patchedCellXml);
}

function extractCellSubListXml(cellXml: string): string | null {
  return cellXml.match(/<hp:subList\b[\s\S]*?<\/hp:subList>/)?.[0] ?? null;
}

function restoreTargetCellImageSlot(targetCellXml: string, donorCellXml: string): string | null {
  const targetSubListXml = extractCellSubListXml(targetCellXml);
  const donorSubListXml = extractCellSubListXml(donorCellXml);

  if (!targetSubListXml || !donorSubListXml) {
    return null;
  }

  return targetCellXml.replace(targetSubListXml, donorSubListXml);
}

function replaceCellImageBinaryRef(
  xml: string,
  descriptor: TemplateImagePlaceholder,
): { xml: string; sourceBinaryItemId: string | null; found: boolean } {
  const located = locateTemplateCell(xml, descriptor);
  if (!located) {
    if (descriptor.optional) {
      return { xml, sourceBinaryItemId: null, found: false };
    }
    throw new Error(`Template image table index not found: ${descriptor.table}`);
  }

  let sourceBinaryItemId: string | null = null;
  let updated = false;

  const patchedCellXml = located.cellXml.replace(/binaryItemIDRef="([^"]+)"/, (_match, currentBinaryItemId) => {
    updated = true;
    sourceBinaryItemId = currentBinaryItemId;
    return `binaryItemIDRef="${descriptor.binaryItemId}"`;
  });

  if (!updated) {
    if (descriptor.optional) {
      return { xml, sourceBinaryItemId: null, found: false };
    }
    throw new Error(
      `Template image cell not found for ${descriptor.placeholderPath} at table=${descriptor.table}, row=${descriptor.row}, col=${descriptor.col}`,
    );
  }

  return {
    xml: replaceLocatedTemplateCell(xml, located, patchedCellXml),
    sourceBinaryItemId,
    found: true,
  };
}

function restoreMissingTemplateImageSlots(
  sectionXml: string,
  donorSectionXml: string,
): { sectionXml: string; restoredCount: number } {
  let nextSectionXml = sectionXml;
  let restoredCount = 0;
  const seenCells = new Set<string>();

  for (const descriptor of TEMPLATE_IMAGE_PLACEHOLDERS) {
    if (descriptor.optional) {
      continue;
    }

    const cellKey = `${descriptor.table}:${descriptor.row}:${descriptor.col}`;
    if (seenCells.has(cellKey)) {
      continue;
    }
    seenCells.add(cellKey);

    const targetCell = locateTemplateCell(nextSectionXml, descriptor);
    if (!targetCell || targetCell.cellXml.includes('binaryItemIDRef="')) {
      continue;
    }

    const donorCell = locateTemplateCell(donorSectionXml, descriptor);
    if (!donorCell || !donorCell.cellXml.includes('binaryItemIDRef="')) {
      continue;
    }

    const restoredCellXml = restoreTargetCellImageSlot(targetCell.cellXml, donorCell.cellXml);
    if (!restoredCellXml) {
      continue;
    }

    nextSectionXml = replaceLocatedTemplateCell(nextSectionXml, targetCell, restoredCellXml);
    restoredCount += 1;
  }

  return { sectionXml: nextSectionXml, restoredCount };
}

async function normalizeTemplateImageSlots(
  zip: JSZip,
  sectionXml: string,
  contentHpf: string,
  warnings: string[],
): Promise<{ sectionXml: string; contentHpf: string; sourceBinaryByPlaceholderPath: Record<string, string> }> {
  let nextSectionXml = sectionXml;
  let nextContentHpf = contentHpf;
  const manifestItems = parseManifestItems(contentHpf);
  const sourceBinaryByPlaceholderPath: Record<string, string> = {};

  for (const descriptor of TEMPLATE_IMAGE_PLACEHOLDERS) {
    const replaced = replaceCellImageBinaryRef(nextSectionXml, descriptor);
    if (!replaced.found) {
      if (!descriptor.optional) {
        warnings.push(
          `Template image cell missing for ${descriptor.placeholderPath}; using text fallback when available.`,
        );
      }
      continue;
    }
    nextSectionXml = replaced.xml;

    if (!replaced.sourceBinaryItemId) {
      continue;
    }
    sourceBinaryByPlaceholderPath[descriptor.placeholderPath] = replaced.sourceBinaryItemId;

    const sourceManifestItem = manifestItems.get(replaced.sourceBinaryItemId);
    if (!sourceManifestItem) {
      throw new Error(`Manifest item "${replaced.sourceBinaryItemId}" not found for ${descriptor.placeholderPath}.`);
    }

    const clonedManifestItem = await cloneManifestBinaryAsset(zip, sourceManifestItem, descriptor.binaryItemId);

    nextContentHpf = upsertManifestItem(
      nextContentHpf,
      descriptor.binaryItemId,
      clonedManifestItem.href,
      clonedManifestItem.mediaType,
    );
  }

  return {
    sectionXml: nextSectionXml,
    contentHpf: nextContentHpf,
    sourceBinaryByPlaceholderPath,
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
    if (!resolvedAsset) {
      if (imagePlaceholder.deferred || imagePlaceholder.optional) {
        continue;
      }

      const href = `BinData/${imagePlaceholder.binaryItemId}.${BLANK_PNG_ASSET.extension}`;
      zip.file(href, BLANK_PNG_ASSET.buffer, { compression: 'STORE' });
      nextContentHpf = upsertManifestItem(
        nextContentHpf,
        imagePlaceholder.binaryItemId,
        href,
        BLANK_PNG_ASSET.mediaType,
      );
      warnings.push(`Template image fallback was missing for ${imagePlaceholder.placeholderPath}; inserted a blank placeholder image.`);
      continue;
    }

    const href = `BinData/${imagePlaceholder.binaryItemId}.${resolvedAsset.extension}`;
    zip.file(href, resolvedAsset.buffer, { compression: 'STORE' });
    nextContentHpf = upsertManifestItem(
      nextContentHpf,
      imagePlaceholder.binaryItemId,
      href,
      normalizeHwpxMediaType(resolvedAsset.mediaType, href),
    );
  }

  return nextContentHpf;
}

function pruneUnmanifestedBinaryAssets(zip: JSZip, contentHpf: string): void {
  const manifestHrefs = new Set(
    Array.from(parseManifestItems(contentHpf).values())
      .map((item) => item.href)
      .filter((href) => href.startsWith('BinData/')),
  );

  for (const fileName of Object.keys(zip.files)) {
    if (!fileName.startsWith('BinData/') || fileName.endsWith('.ole')) {
      continue;
    }
    if (manifestHrefs.has(fileName)) {
      continue;
    }
    delete zip.files[fileName];
  }
}

function removeDirectoryEntries(zip: JSZip): void {
  for (const fileName of Object.keys(zip.files)) {
    const zipEntry = zip.files[fileName];
    if (zipEntry?.dir) {
      delete zip.files[fileName];
    }
  }
}

function buildZipWriteOptions(
  entry: JSZip.JSZipObject | null | undefined,
  compression: 'STORE' | 'DEFLATE',
): {
  compression: 'STORE' | 'DEFLATE';
  createFolders: false;
  date?: Date;
  comment?: string;
  unixPermissions?: number | string | null;
  dosPermissions?: number | null;
} {
  return {
    compression,
    createFolders: false,
    date: entry?.date,
    comment: entry?.comment,
    unixPermissions: entry?.unixPermissions,
    dosPermissions: entry?.dosPermissions,
  };
}

async function preserveStoredPackageEntries(zip: JSZip): Promise<void> {
  for (const fileName of ZIP_STORED_ENTRY_NAMES) {
    const entry = zip.file(fileName);
    if (!entry) {
      continue;
    }

    const content = await entry.async(fileName === 'mimetype' ? 'string' : 'uint8array');
    zip.file(fileName, content, buildZipWriteOptions(entry, 'STORE'));
  }
}

function readZipHeaderDateMap(buffer: Uint8Array): Map<string, { modTime: number; modDate: number }> {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let eocdOffset = -1;
  for (let index = buffer.byteLength - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Template HWPX ZIP is missing the end of central directory record.');
  }

  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const entries = new Map<string, { modTime: number; modDate: number }>();
  let offset = centralDirectoryOffset;

  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (view.getUint32(offset, true) !== ZIP_CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE) {
      throw new Error(`Template HWPX ZIP central directory is malformed at entry ${entryIndex}.`);
    }

    const fileNameLength = view.getUint16(offset + 28, true);
    const extraFieldLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const fileNameBytes = buffer.slice(offset + 46, offset + 46 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);

    entries.set(fileName, {
      modTime: view.getUint16(offset + 12, true),
      modDate: view.getUint16(offset + 14, true),
    });

    offset += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return entries;
}

function patchZipHeadersForHwpx(buffer: Uint8Array, templateBuffer?: Uint8Array): Uint8Array {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const templateDates = templateBuffer ? readZipHeaderDateMap(templateBuffer) : new Map<string, { modTime: number; modDate: number }>();
  let eocdOffset = -1;
  for (let index = buffer.byteLength - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Generated HWPX ZIP is missing the end of central directory record.');
  }

  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let offset = centralDirectoryOffset;

  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (view.getUint32(offset, true) !== ZIP_CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE) {
      throw new Error(`Generated HWPX ZIP central directory is malformed at entry ${entryIndex}.`);
    }

    const compressionMethod = view.getUint16(offset + 10, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraFieldLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const fileNameBytes = buffer.slice(offset + 46, offset + 46 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);
    const generalPurposeFlag = compressionMethod === 8 ? 4 : 0;
    const externalAttr = fileName.endsWith('.ole') ? ZIP_OLE_EXTERNAL_ATTR : ZIP_DEFAULT_EXTERNAL_ATTR;
    const templateDate = templateDates.get(fileName);

    view.setUint16(offset + 4, ZIP_VERSION_MADE_BY, true);
    view.setUint16(offset + 6, ZIP_VERSION_NEEDED, true);
    view.setUint16(offset + 8, generalPurposeFlag, true);
    if (templateDate) {
      view.setUint16(offset + 12, templateDate.modTime, true);
      view.setUint16(offset + 14, templateDate.modDate, true);
    }
    view.setUint16(offset + 36, 0, true);
    view.setUint16(offset + 38, externalAttr & 0xffff, true);
    view.setUint16(offset + 40, (externalAttr >>> 16) & 0xffff, true);

    if (view.getUint32(localHeaderOffset, true) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE) {
      throw new Error(`Generated HWPX ZIP local header is malformed for "${fileName}".`);
    }

    view.setUint16(localHeaderOffset + 4, ZIP_VERSION_NEEDED, true);
    view.setUint16(localHeaderOffset + 6, generalPurposeFlag, true);
    if (templateDate) {
      view.setUint16(localHeaderOffset + 10, templateDate.modTime, true);
      view.setUint16(localHeaderOffset + 12, templateDate.modDate, true);
    }

    offset += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return buffer;
}

function repairLegacyTemplateImageAssets(zip: JSZip, contentHpf: string): string {
  let nextContentHpf = contentHpf;

  for (const repair of LEGACY_TEMPLATE_IMAGE_REPAIRS) {
    zip.file(repair.href, repair.asset.buffer, { compression: 'STORE' });
    nextContentHpf = upsertManifestItem(
      nextContentHpf,
      repair.binaryItemId,
      repair.href,
      repair.asset.mediaType,
    );
  }

  return nextContentHpf;
}

function repairLegacyContentHpfMetadata(contentHpf: string): string {
  let nextContentHpf = contentHpf;

  if (!nextContentHpf.includes('xmlns:hwpunitchar=')) {
    nextContentHpf = nextContentHpf.replace(
      '<opf:package ',
      `<opf:package ${HWPX_UNITCHAR_NAMESPACE} `,
    );
  }

  if (!nextContentHpf.includes('name="lastsaveby"')) {
    nextContentHpf = nextContentHpf.replace(
      '<opf:meta name="CreatedDate" content="text">',
      `${HWPX_LASTSAVEBY_META}<opf:meta name="CreatedDate" content="text">`,
    );
  }

  return nextContentHpf;
}

async function loadTemplateBuffer(): Promise<ArrayBuffer> {
  const response = await fetch(`${TEMPLATE_URL}?ts=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HWPX template download failed: ${response.status} ${response.statusText}`);
  }

  return response.arrayBuffer();
}

async function loadTemplateImageDonorBuffer(): Promise<ArrayBuffer> {
  const response = await fetch(`${TEMPLATE_IMAGE_DONOR_URL}?ts=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HWPX image donor template download failed: ${response.status} ${response.statusText}`);
  }

  return response.arrayBuffer();
}

export async function generateInspectionHwpxBlob(
  session: InspectionSession,
  _siteSessions: InspectionSession[] = [session],
): Promise<{ blob: Blob; filename: string; warnings: string[]; deferred: string[] }> {
  const binding = mapSessionToTemplateBinding(session);
  Object.assign(binding.images, buildDoc5ChartImages(session, _siteSessions));
  const templateBuffer = await loadTemplateBuffer();
  const zip = await JSZip.loadAsync(templateBuffer);
  const sectionEntry = zip.file('Contents/section0.xml');
  const contentEntry = zip.file('Contents/content.hpf');

  if (!sectionEntry || !contentEntry) {
    throw new Error('The HWPX template is missing Contents/section0.xml or Contents/content.hpf.');
  }

  const sectionXml = await sectionEntry.async('string');
  const sectionXmlWithDoc5Summary = ensureDoc5SummaryPlaceholder(sectionXml);
  const sectionXmlWithDoc5Charts =
    HWPX_GENERATION_MODE === 'advanced' && IMAGE_BINDING_MODE === 'embedded'
      ? ensureDoc5ChartImageRows(sectionXmlWithDoc5Summary)
      : sectionXmlWithDoc5Summary;
  const sectionXmlWithTemplateOverlays =
    HWPX_GENERATION_MODE === 'advanced' && IMAGE_BINDING_MODE === 'embedded'
      ? ensureNotificationSignatureImageSlot(sectionXmlWithDoc5Charts)
      : sectionXmlWithDoc5Charts;
  const contentHpf = await contentEntry.async('string');
  let boundSectionXml = '';

  if (HWPX_GENERATION_MODE === 'template_native') {
    boundSectionXml = stripLineSegArrays(
      replaceTextPlaceholdersPlain(applyTemplateTextQuirks(stripRepeatBlockMarkers(sectionXml)), binding.text),
    );

    for (const repeatBlockPath of REPEAT_BLOCKS) {
      const itemCount = binding.repeatCounts[repeatBlockPath] ?? 1;
      if (itemCount > REPEAT_BLOCK_CONFIG[repeatBlockPath].pageSize) {
        binding.warnings.push(
          `Template-native mode keeps only the first template page for ${repeatBlockPath}; extra items were skipped.`,
        );
      }
    }

    if (Object.values(binding.images).some((value) => valueOrBlank(value))) {
      binding.warnings.push('Template-native mode keeps the original template image placeholders and does not embed uploaded images.');
    }
  } else {
    const contentHpfWithRepairs = repairLegacyContentHpfMetadata(contentHpf);
    let boundContentHpf = contentHpfWithRepairs;

    if (IMAGE_BINDING_MODE === 'text_only') {
      const expanded = expandRepeatBlocks(sectionXmlWithTemplateOverlays, binding.repeatCounts);
      boundSectionXml = stripLineSegArrays(
        replaceTextPlaceholders(applyTemplateTextQuirks(expanded.xml), binding.text),
      );
    } else {
      const donorBuffer = await loadTemplateImageDonorBuffer();
      const donorZip = await JSZip.loadAsync(donorBuffer);
      const donorSectionEntry = donorZip.file('Contents/section0.xml');
      if (!donorSectionEntry) {
        throw new Error('The HWPX image donor template is missing Contents/section0.xml.');
      }
      const donorSectionXml = await donorSectionEntry.async('string');
      const restored = restoreMissingTemplateImageSlots(sectionXmlWithTemplateOverlays, donorSectionXml);
      if (restored.restoredCount > 0) {
        binding.warnings.push(`Restored ${restored.restoredCount} missing image slot(s) from the v6 donor template.`);
      }
      const contentHpfWithTemplateImageRepairs = repairLegacyTemplateImageAssets(zip, contentHpfWithRepairs);
      const normalized = await normalizeTemplateImageSlots(
        zip,
        restored.sectionXml,
        contentHpfWithTemplateImageRepairs,
        binding.warnings,
      );
      const expanded = expandRepeatBlocks(normalized.sectionXml, binding.repeatCounts, normalized.sourceBinaryByPlaceholderPath);
      boundSectionXml = stripLineSegArrays(
        replaceTextPlaceholders(applyTemplateTextQuirks(expanded.xml), binding.text),
      );
      boundContentHpf = await bindImagesIntoZip(
        zip,
        normalized.contentHpf,
        [...expanded.imagePlaceholders, ...DOC5_INJECTED_IMAGE_BINDINGS.map((item) => ({
          table: -1,
          row: -1,
          col: -1,
          placeholderPath: item.placeholderPath,
          binaryItemId: item.binaryItemId,
        }))],
        binding,
        binding.warnings,
      );
    }

    validateGeneratedHwpxOrThrow(zip, boundSectionXml, boundContentHpf);
    zip.file('Contents/content.hpf', boundContentHpf, buildZipWriteOptions(contentEntry, 'DEFLATE'));
    if (IMAGE_BINDING_MODE === 'embedded') {
      pruneUnmanifestedBinaryAssets(zip, boundContentHpf);
    }
  }

  zip.file('Contents/section0.xml', boundSectionXml, buildZipWriteOptions(sectionEntry, 'DEFLATE'));
  removeDirectoryEntries(zip);
  await preserveStoredPackageEntries(zip);
  removeDirectoryEntries(zip);

  const generatedBuffer = patchZipHeadersForHwpx(
    await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }),
    new Uint8Array(templateBuffer),
  );
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
