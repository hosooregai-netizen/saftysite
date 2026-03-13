import 'server-only';

import path from 'node:path';
import type { InspectionWordTemplateId } from '@/types/documents';

export interface InspectionWordTemplateDefinition {
  id: InspectionWordTemplateId;
  label: string;
  relativePath: string;
}

const INSPECTION_WORD_TEMPLATES: Record<
  InspectionWordTemplateId,
  InspectionWordTemplateDefinition
> = {
  'default-inspection': {
    id: 'default-inspection',
    label: '기본 점검 보고서',
    relativePath: path.join(
      'server',
      'documents',
      'templates',
      'inspection',
      'default-inspection.docx'
    ),
  },
};

export function getInspectionWordTemplate(
  templateId: InspectionWordTemplateId = 'default-inspection'
): InspectionWordTemplateDefinition & { absolutePath: string } {
  const template = INSPECTION_WORD_TEMPLATES[templateId];

  return {
    ...template,
    absolutePath: path.join(process.cwd(), template.relativePath),
  };
}

