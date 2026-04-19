import type { InspectionSession } from '@/types/inspectionSession';

export type InspectionTemplateVariant = 'v9' | 'v9-1';

export const INSPECTION_TEMPLATE_FILENAMES: Record<InspectionTemplateVariant, string> = {
  v9: '기술지도 수동보고서 앱 - 서식_4.annotated.v9-2.hwpx',
  'v9-1': '기술지도 수동보고서 앱 - 서식_4.annotated.v9-2-1.hwpx',
};

export const INSPECTION_TEMPLATE_IMAGE_DONOR_FILENAME =
  '기술지도 수동보고서 앱 - 서식_4.annotated.v6.hwpx';

export function selectInspectionTemplateVariant(
  session: Pick<InspectionSession, 'document2Overview'>,
): InspectionTemplateVariant {
  return session.document2Overview.accidentOccurred === 'yes' ? 'v9-1' : 'v9';
}

export function getInspectionTemplateFilename(variant: InspectionTemplateVariant): string {
  return INSPECTION_TEMPLATE_FILENAMES[variant];
}
