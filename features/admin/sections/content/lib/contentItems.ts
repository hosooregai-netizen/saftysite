import type { SafetyContentItem, SafetyContentType } from '@/types/backend';
import { resolveSafetyAssetUrl } from '@/lib/safetyApi/assetUrls';
import {
  asMapperRecord,
  contentBodyToAssetName,
  contentBodyToAssetUrl,
  contentBodyToImageUrl,
  contentBodyToText,
  normalizeMapperText,
} from '@/lib/safetyApiMappers/utils';
import { CONTENT_TYPE_META, type ContentEditorMode } from '@/lib/admin';

export interface ContentFormState {
  content_type: SafetyContentType;
  title: string;
  code: string;
  text_body: string;
  image_url: string;
  image_name: string;
  file_url_1: string;
  file_name_1: string;
  file_url_2: string;
  file_name_2: string;
  tags: string;
  sort_order: string;
  effective_from: string;
  effective_to: string;
  is_active: boolean;
}

function bodyRecord(body: unknown) {
  return asMapperRecord(body);
}

function readText(body: unknown, type: SafetyContentType) {
  const text = contentBodyToText(body);
  return text || (type === 'correction_result_option' ? normalizeMapperText(body) : '');
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
    readText(body, 'measurement_template')
  );
}

function readFileUrl(body: unknown, order: 1 | 2) {
  const record = bodyRecord(body);
  if (order === 1) {
    return resolveSafetyAssetUrl(
      normalizeMapperText(record.referenceMaterial1) ||
      normalizeMapperText(record.reference_material_1) ||
      normalizeMapperText(record.material1)
    );
  }

  return resolveSafetyAssetUrl(
    normalizeMapperText(record.referenceMaterial2) ||
    normalizeMapperText(record.reference_material_2) ||
    normalizeMapperText(record.material2)
  );
}

function readFileName(body: unknown, order: 1 | 2) {
  const record = bodyRecord(body);
  if (order === 1) {
    return (
      normalizeMapperText(record.referenceMaterial1Name) ||
      normalizeMapperText(record.reference_material_1_name) ||
      normalizeMapperText(record.material1Name)
    );
  }

  return (
    normalizeMapperText(record.referenceMaterial2Name) ||
    normalizeMapperText(record.reference_material_2_name) ||
    normalizeMapperText(record.material2Name)
  );
}

export function createEmptyContentForm(
  type: SafetyContentType = 'legal_reference',
): ContentFormState {
  return {
    content_type: type,
    title: '',
    code: '',
    text_body: '',
    image_url: '',
    image_name: '',
    file_url_1: '',
    file_name_1: '',
    file_url_2: '',
    file_name_2: '',
    tags: '',
    sort_order: '0',
    effective_from: '',
    effective_to: '',
    is_active: true,
  };
}

export function mapContentItemToForm(item: SafetyContentItem): ContentFormState {
  const record = bodyRecord(item.body);
  const isMeasurementTemplate = item.content_type === 'measurement_template';
  const isSafetyNews = item.content_type === 'safety_news';

  return {
    content_type: item.content_type,
    title: item.title,
    code: item.code ?? '',
    text_body: isMeasurementTemplate
      ? readMeasurementSafetyCriteria(item.body)
      : readText(item.body, item.content_type),
    image_url: isSafetyNews ? contentBodyToAssetUrl(item.body) : contentBodyToImageUrl(item.body),
    image_name: isSafetyNews
      ? contentBodyToAssetName(item.body)
      : normalizeMapperText(record.imageName) || normalizeMapperText(record.image_name),
    file_url_1: readFileUrl(item.body, 1),
    file_name_1: readFileName(item.body, 1),
    file_url_2: readFileUrl(item.body, 2),
    file_name_2: readFileName(item.body, 2),
    tags: item.tags.join(', '),
    sort_order: String(item.sort_order),
    effective_from: item.effective_from?.slice(0, 10) ?? '',
    effective_to: item.effective_to?.slice(0, 10) ?? '',
    is_active: item.is_active,
  };
}

export function switchContentType(
  form: ContentFormState,
  nextType: SafetyContentType,
): ContentFormState {
  const next = createEmptyContentForm(nextType);
  return {
    ...next,
    title: form.title,
    code: form.code,
    tags: form.tags,
    sort_order: form.sort_order,
    effective_from: form.effective_from,
    effective_to: form.effective_to,
    is_active: form.is_active,
  };
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
      body: textBody,
      imageUrl: form.image_url || '',
      imageName: form.image_name || '',
    };
  }

  if (meta.editorMode === 'image') {
    return {
      body: textBody,
      imageUrl: form.image_url || '',
      imageName: form.image_name || '',
    };
  }

  if (meta.editorMode === 'file') {
    return {
      body: textBody,
      referenceMaterial1: form.file_url_1 || '',
      referenceMaterial1Name: form.file_name_1 || '',
      referenceMaterial2: form.file_url_2 || '',
      referenceMaterial2Name: form.file_name_2 || '',
    };
  }

  if (meta.editorMode === 'list') {
    return textBody || form.title.trim();
  }

  return textBody;
}

export function getContentPreview(item: SafetyContentItem): string {
  const meta = CONTENT_TYPE_META[item.content_type];
  const text =
    item.content_type === 'measurement_template'
      ? readMeasurementSafetyCriteria(item.body) || normalizeMapperText(item.title)
      : contentBodyToText(item.body) || normalizeMapperText(item.title);

  if (item.content_type === 'measurement_template') {
    return text || '안전 기준 없음';
  }

  if (meta.editorMode === 'image') {
    return contentBodyToImageUrl(item.body)
      ? `${text || '이미지형 콘텐츠'} 및 이미지`
      : text || '이미지형 콘텐츠';
  }

  if (meta.editorMode === 'file') {
    const hasFile =
      item.content_type === 'safety_news'
        ? Boolean(contentBodyToAssetUrl(item.body))
        : Boolean(readFileUrl(item.body, 1) || readFileUrl(item.body, 2));
    return hasFile ? `${text || '파일형 콘텐츠'} 및 파일` : text || '파일형 콘텐츠';
  }

  return text || '-';
}

export function getContentAttachmentSummary(item: SafetyContentItem): string {
  const mode: ContentEditorMode = CONTENT_TYPE_META[item.content_type].editorMode;
  if (mode === 'image') {
    return contentBodyToImageUrl(item.body) ? '이미지 업로드' : '이미지 없음';
  }
  if (mode === 'file') {
    if (item.content_type === 'safety_news') {
      return contentBodyToAssetUrl(item.body) ? 'PDF/이미지 업로드' : 'PDF/이미지 없음';
    }
    return readFileUrl(item.body, 1) || readFileUrl(item.body, 2)
      ? '파일 업로드'
      : '파일 없음';
  }
  if (mode === 'list') return '목록값';
  return '텍스트';
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
}
