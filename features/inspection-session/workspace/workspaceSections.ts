import { INSPECTION_SECTIONS } from '@/constants/inspectionSession';
import type { InspectionSectionKey, InspectionSectionMeta } from '@/types/inspectionSession';

export const INSPECTION_WORKSPACE_SECTIONS: InspectionSectionMeta[] = INSPECTION_SECTIONS
  .filter((section) => section.key !== 'doc2')
  .map((section) =>
    section.key === 'doc1'
      ? {
          ...section,
          label: '1-2. 기술지도 대상사업장 / 기술지도 개요',
          shortLabel: '대상사업장 / 개요',
          compactLabel: '1-2',
        }
      : section,
  );

export function resolveWorkspaceSectionKey(
  section: InspectionSectionKey,
): InspectionSectionKey {
  return section === 'doc2' ? 'doc1' : section;
}

