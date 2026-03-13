import 'server-only';

import { access } from 'node:fs/promises';
import type { InspectionWordTemplateId } from '@/types/documents';
import {
  DocumentGeneratorNotConfiguredError,
  DocumentTemplateNotFoundError,
} from '@/server/documents/errors';
import type { InspectionWordData } from '@/server/documents/mappers/mapInspectionSessionToWordData';
import { getInspectionWordTemplate } from '@/server/documents/templates';

export interface GeneratedWordDocument {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

interface GenerateInspectionWordDocumentOptions {
  templateId?: InspectionWordTemplateId;
  data: InspectionWordData;
}

export async function generateInspectionWordDocument({
  templateId = 'default-inspection',
  data,
}: GenerateInspectionWordDocumentOptions): Promise<GeneratedWordDocument> {
  const template = getInspectionWordTemplate(templateId);

  try {
    await access(template.absolutePath);
  } catch {
    throw new DocumentTemplateNotFoundError(
      [
        `워드 템플릿 파일이 없습니다: ${template.relativePath}`,
        '템플릿 파일을 추가한 뒤 docx 렌더러를 연결하면 바로 생성 흐름을 붙일 수 있습니다.',
      ].join(' ')
    );
  }

  throw new DocumentGeneratorNotConfiguredError(
    [
      `워드 템플릿은 확인됐지만 생성 엔진은 아직 연결되지 않았습니다. (${template.id})`,
      `다음 단계: ${template.relativePath} 에 docx 템플릿을 두고,`,
      '`generateInspectionWordDocument` 안에서 템플릿 치환 라이브러리를 연결하세요.',
      `현재 매핑된 문서 제목: ${data.meta.title}`,
    ].join(' ')
  );
}

