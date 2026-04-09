import {
  buildDoc7ReferenceMaterialTitle,
  readDoc7ReferenceMaterialBody,
} from '@/lib/doc7ReferenceMaterials';
import { CONTENT_TYPE_META, type ContentEditorMode } from '@/lib/admin';
import { resolveSafetyAssetUrlIfPathLike } from '@/lib/safetyApi/assetUrls';
import {
  asMapperRecord,
  contentBodyToAssetName,
  contentBodyToAssetUrl,
  contentBodyToImageUrl,
  contentBodyToText,
  normalizeMapperText,
} from '@/lib/safetyApiMappers/utils';
import type { SafetyContentItem, SafetyContentType } from '@/types/backend';

export interface ContentFormState {
  accident_type: string;
  causative_agent_key: string;
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
  effective_from: string;
  effective_to: string;
  is_active: boolean;
  reference_title_1: string;
  reference_title_2: string;
  sort_order: string;
}

function bodyRecord(body: unknown) {
  return asMapperRecord(body);
}

function readText(body: unknown, type?: SafetyContentType) {
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
    return resolveSafetyAssetUrlIfPathLike(
      normalizeMapperText(record.referenceMaterial1) ||
        normalizeMapperText(record.reference_material_1) ||
        normalizeMapperText(record.file_url_1) ||
        normalizeMapperText(record.fileUrl1) ||
        normalizeMapperText(record.material1),
    );
  }

  return resolveSafetyAssetUrlIfPathLike(
    normalizeMapperText(record.referenceMaterial2) ||
      normalizeMapperText(record.reference_material_2) ||
      normalizeMapperText(record.file_url_2) ||
      normalizeMapperText(record.fileUrl2) ||
      normalizeMapperText(record.material2),
  );
}

function readFileName(body: unknown, order: 1 | 2) {
  const record = bodyRecord(body);
  if (order === 1) {
    return (
      normalizeMapperText(record.referenceMaterial1Name) ||
      normalizeMapperText(record.reference_material_1_name) ||
      normalizeMapperText(record.file_name_1) ||
      normalizeMapperText(record.fileName1) ||
      normalizeMapperText(record.material1Name)
    );
  }

  return (
    normalizeMapperText(record.referenceMaterial2Name) ||
    normalizeMapperText(record.reference_material_2_name) ||
    normalizeMapperText(record.file_name_2) ||
    normalizeMapperText(record.fileName2) ||
    normalizeMapperText(record.material2Name)
  );
}

export function createEmptyContentForm(
  type: SafetyContentType = 'measurement_template',
): ContentFormState {
  return {
    accident_type: '',
    causative_agent_key: '',
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
    effective_from: '',
    effective_to: '',
    is_active: true,
    reference_title_1: '',
    reference_title_2: '',
    sort_order: '0',
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
    title: item.title,
    code: item.code ?? '',
    text_body: isMeasurementTemplate
      ? readMeasurementSafetyCriteria(item.body)
      : doc7ReferenceMaterial?.body ?? readText(item.body, item.content_type),
    image_url: isSafetyNews ? contentBodyToAssetUrl(item.body) : contentBodyToImageUrl(item.body),
    image_name:
      doc7ReferenceMaterial?.imageName ||
      contentBodyToAssetName(item.body) ||
      normalizeMapperText(record.imageName) ||
      normalizeMapperText(record.image_name),
    file_url_1: readFileUrl(item.body, 1),
    file_name_1: readFileName(item.body, 1),
    file_url_2: readFileUrl(item.body, 2),
    file_name_2: readFileName(item.body, 2),
    tags: item.tags.join(', '),
    effective_from: item.effective_from?.slice(0, 10) ?? '',
    effective_to: item.effective_to?.slice(0, 10) ?? '',
    is_active: item.is_active,
    reference_title_1: doc7ReferenceMaterial?.referenceTitle1 ?? '',
    reference_title_2: doc7ReferenceMaterial?.referenceTitle2 ?? '',
    sort_order: String(item.sort_order),
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
    effective_from: form.effective_from,
    effective_to: form.effective_to,
    is_active: form.is_active,
    sort_order: form.sort_order,
  };
}

export function buildContentTitle(form: ContentFormState): string {
  if (form.content_type === 'doc7_reference_material') {
    if (!form.accident_type.trim() || !form.causative_agent_key.trim()) {
      return '';
    }

    return buildDoc7ReferenceMaterialTitle(form.accident_type, form.causative_agent_key);
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
      body: textBody,
      imageName: form.image_name || '',
      imageUrl: form.image_url || '',
    };
  }

  if (form.content_type === 'doc7_reference_material') {
    return {
      accidentType: form.accident_type.trim(),
      body: textBody,
      causativeAgentKey: form.causative_agent_key.trim(),
      imageName: form.image_name || '',
      imageUrl: form.image_url || '',
      referenceTitle1: form.reference_title_1.trim(),
      referenceTitle2: form.reference_title_2.trim(),
    };
  }

  if (meta.editorMode === 'image') {
    return {
      body: textBody,
      imageName: form.image_name || '',
      imageUrl: form.image_url || '',
      summary: form.content_type === 'disaster_case' ? textBody : undefined,
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
      : item.content_type === 'doc7_reference_material'
        ? readDoc7ReferenceMaterialBody(item.body).body || normalizeMapperText(item.title)
        : readText(item.body, item.content_type) || normalizeMapperText(item.title);

  if (item.content_type === 'measurement_template') {
    return text || '안전 기준 없음';
  }

  if (!meta) {
    return text || normalizeMapperText(item.title) || '-';
  }

  if (meta.editorMode === 'image') {
    if (item.content_type === 'safety_news') {
      return contentBodyToAssetUrl(item.body) ? `${text || '안전 정보'} 및 자료` : text || '안전 정보';
    }

    if (item.content_type === 'doc7_reference_material') {
      return text || '참고자료 내용 없음';
    }

    return contentBodyToImageUrl(item.body)
      ? `${text || '이미지형 콘텐츠'} 및 이미지`
      : text || '이미지형 콘텐츠';
  }

  if (meta.editorMode === 'file') {
    const hasFile = Boolean(readFileUrl(item.body, 1) || readFileUrl(item.body, 2));
    return hasFile ? `${text || '파일형 콘텐츠'} 및 파일` : text || '파일형 콘텐츠';
  }

  return text || '-';
}

export function getContentAttachmentSummary(item: SafetyContentItem): string {
  if (item.content_type === 'safety_news') {
    return contentBodyToAssetUrl(item.body) ? 'PDF/이미지 업로드' : 'PDF/이미지 없음';
  }

  const meta = CONTENT_TYPE_META[item.content_type];
  if (!meta) {
    return '-';
  }

  const mode: ContentEditorMode = meta.editorMode;
  if (mode === 'image') {
    return contentBodyToImageUrl(item.body) ? '이미지 업로드' : '이미지 없음';
  }
  if (mode === 'file') {
    return readFileUrl(item.body, 1) || readFileUrl(item.body, 2) ? '파일 업로드' : '파일 없음';
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
