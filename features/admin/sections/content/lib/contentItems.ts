import {
  buildDoc7ReferenceMaterialTitle,
  readDoc7ReferenceMaterialBody,
} from '@/lib/doc7ReferenceMaterials';
import {
  asMapperRecord,
  contentBodyToAssetName,
  contentBodyToAssetUrl,
  contentBodyToImageUrl,
  contentBodyToText,
  normalizeMapperText,
} from '@/lib/safetyApiMappers/utils';
import { CONTENT_TYPE_META, type ContentEditorMode } from '@/lib/admin';
import type { SafetyContentItem, SafetyContentType } from '@/types/backend';
import type { CausativeAgentKey } from '@/types/siteOverview';

export interface ContentFormState {
  accident_type: string;
  causative_agent_key: CausativeAgentKey | '';
  content_type: SafetyContentType;
  effective_from: string;
  effective_to: string;
  image_name: string;
  image_url: string;
  is_active: boolean;
  reference_title_1: string;
  reference_title_2: string;
  sort_order: string;
  text_body: string;
  title: string;
}

function bodyRecord(body: unknown) {
  return asMapperRecord(body);
}

function readText(body: unknown) {
  return contentBodyToText(body);
}

function readMeasurementSafetyCriteria(body: unknown) {
  const record = bodyRecord(body);
  const listText = Array.isArray(record.safety_standard)
    ? record.safety_standard
        .map((entry) => normalizeMapperText(entry))
        .filter(Boolean)
        .join('\n')
    : '';

  return (
    normalizeMapperText(record.safetyCriteria) ||
    normalizeMapperText(record.safety_criteria) ||
    listText ||
    readText(body)
  );
}

export function createEmptyContentForm(
  type: SafetyContentType = 'measurement_template',
): ContentFormState {
  return {
    accident_type: '',
    causative_agent_key: '',
    content_type: type,
    effective_from: '',
    effective_to: '',
    image_name: '',
    image_url: '',
    is_active: true,
    reference_title_1: '',
    reference_title_2: '',
    sort_order: '0',
    text_body: '',
    title: '',
  };
}

export function mapContentItemToForm(item: SafetyContentItem): ContentFormState {
  const record = bodyRecord(item.body);
  const isMeasurementTemplate = item.content_type === 'measurement_template';
  const isSafetyNews = item.content_type === 'safety_news';
  const doc7ReferenceMaterial =
    item.content_type === 'doc7_reference_material'
      ? readDoc7ReferenceMaterialBody(item.body)
      : null;

  return {
    accident_type: doc7ReferenceMaterial?.accidentType ?? '',
    causative_agent_key: doc7ReferenceMaterial?.causativeAgentKey ?? '',
    content_type: item.content_type,
    effective_from: item.effective_from?.slice(0, 10) ?? '',
    effective_to: item.effective_to?.slice(0, 10) ?? '',
    image_name:
      doc7ReferenceMaterial?.imageName ||
      contentBodyToAssetName(item.body) ||
      normalizeMapperText(record.imageName) ||
      normalizeMapperText(record.image_name),
    image_url: isSafetyNews ? contentBodyToAssetUrl(item.body) : contentBodyToImageUrl(item.body),
    is_active: item.is_active,
    reference_title_1: doc7ReferenceMaterial?.referenceTitle1 ?? '',
    reference_title_2: doc7ReferenceMaterial?.referenceTitle2 ?? '',
    sort_order: String(item.sort_order),
    text_body: isMeasurementTemplate
      ? readMeasurementSafetyCriteria(item.body)
      : doc7ReferenceMaterial?.body ?? readText(item.body),
    title: item.title,
  };
}

export function switchContentType(
  form: ContentFormState,
  nextType: SafetyContentType,
): ContentFormState {
  const next = createEmptyContentForm(nextType);
  return {
    ...next,
    effective_from: form.effective_from,
    effective_to: form.effective_to,
    is_active: form.is_active,
    sort_order: form.sort_order,
    title: form.title,
  };
}

export function buildContentTitle(form: ContentFormState): string {
  if (form.content_type === 'doc7_reference_material') {
    if (!form.accident_type.trim() || !form.causative_agent_key) {
      return '';
    }

    return buildDoc7ReferenceMaterialTitle(
      form.accident_type,
      form.causative_agent_key,
    );
  }

  return form.title.trim();
}

export function buildContentBody(form: ContentFormState): Record<string, unknown> | string {
  const meta = CONTENT_TYPE_META[form.content_type];
  const textBody = form.text_body.trim();

  if (form.content_type === 'measurement_template') {
    return {
      instrumentName: form.title.trim(),
      safetyCriteria: textBody,
    };
  }

  if (form.content_type === 'safety_news') {
    return {
      body: '',
      imageName: form.image_name || '',
      imageUrl: form.image_url || '',
    };
  }

  if (form.content_type === 'doc7_reference_material') {
    return {
      accidentType: form.accident_type.trim(),
      body: textBody,
      causativeAgentKey: form.causative_agent_key,
      imageName: form.image_name || '',
      imageUrl: form.image_url || '',
      referenceTitle1: form.reference_title_1.trim(),
      referenceTitle2: form.reference_title_2.trim(),
    };
  }

  if (meta.editorMode === 'image') {
    return {
      body:
        form.content_type === 'disaster_case' || form.content_type === 'campaign_template'
          ? ''
          : textBody,
      imageName: form.image_name || '',
      imageUrl: form.image_url || '',
      summary: form.content_type === 'disaster_case' ? '' : undefined,
    };
  }

  return textBody;
}

export function getContentPreview(item: SafetyContentItem): string {
  const meta = CONTENT_TYPE_META[item.content_type];
  const text =
    item.content_type === 'measurement_template'
      ? readMeasurementSafetyCriteria(item.body) || normalizeMapperText(item.title)
      : item.content_type === 'doc7_reference_material'
        ? readDoc7ReferenceMaterialBody(item.body).body ||
          normalizeMapperText(item.title)
        : contentBodyToText(item.body) || normalizeMapperText(item.title);

  if (item.content_type === 'measurement_template') {
    return text || '안전 기준 없음';
  }

  if (meta.editorMode === 'image') {
    if (item.content_type === 'safety_news') {
      return contentBodyToAssetUrl(item.body)
        ? `${text || '안전 정보'} 및 자료`
        : text || '안전 정보';
    }

    if (item.content_type === 'doc7_reference_material') {
      return text || '참고자료 내용 없음';
    }

    return contentBodyToImageUrl(item.body)
      ? `${text || '이미지형 콘텐츠'} 및 이미지`
      : text || '이미지형 콘텐츠';
  }

  return text || '-';
}

export function getContentAttachmentSummary(item: SafetyContentItem): string {
  if (item.content_type === 'safety_news') {
    return contentBodyToAssetUrl(item.body) ? 'PDF/이미지 업로드' : 'PDF/이미지 없음';
  }

  const mode: ContentEditorMode = CONTENT_TYPE_META[item.content_type].editorMode;
  if (mode === 'image') {
    return contentBodyToImageUrl(item.body) ? '이미지 업로드' : '이미지 없음';
  }
  if (mode === 'list') return '목록형';
  return '텍스트';
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () =>
      reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
}
