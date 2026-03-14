import 'server-only';

import { access, readFile } from 'node:fs/promises';
import type { InspectionWordTemplateId } from '@/types/documents';
import {
  DocumentGenerationError,
  DocumentTemplateNotFoundError,
} from '@/server/documents/errors';
import type { InspectionWordData } from '@/server/documents/mappers/mapInspectionSessionToWordData';
import { getInspectionWordTemplate } from '@/server/documents/templates';
import { TemplateHandler } from 'easy-template-x';
import { buildInspectionWordTemplatePayload } from './buildInspectionWordTemplatePayload';

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
      `워드 템플릿 파일이 없습니다: ${template.relativePath}`
    );
  }

  try {
    const templateFile = await readFile(template.absolutePath);
    const payload = await buildInspectionWordTemplatePayload(data);
    const handler = new TemplateHandler({
      delimiters: {
        tagStart: '[[',
        tagEnd: ']]',
        containerTagOpen: '#',
        containerTagClose: '/',
      },
    });

    const buffer = await handler.process(templateFile, payload);

    return {
      buffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      filename: `${sanitizeFilename(getDocumentFilenameBase(data))}.docx`,
    };
  } catch (error) {
    throw new DocumentGenerationError(
      error instanceof Error
        ? `워드 문서를 생성하지 못했습니다: ${error.message}`
        : '워드 문서를 생성하지 못했습니다.'
    );
  }
}

function getDocumentFilenameBase(data: InspectionWordData): string {
  const inspectionDate = normalizeText(data.cover.inspectionDate);
  const projectName = normalizeText(data.cover.projectName);

  if (inspectionDate && projectName) {
    return `${inspectionDate} - ${projectName}`;
  }

  if (inspectionDate) return inspectionDate;
  if (projectName) return projectName;
  return normalizeText(data.meta.title) || 'inspection-report';
}

function sanitizeFilename(value: string): string {
  const normalized = value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || 'inspection-report';
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}
