import { INSPECTION_SECTIONS } from '@/constants/inspectionSession';
import type { InspectionSectionKey, InspectionSectionMeta } from '@/types/inspectionSession';

export const INSPECTION_WORKSPACE_SECTIONS: InspectionSectionMeta[] = INSPECTION_SECTIONS
  .filter((section) => section.key !== 'doc2' && section.key !== 'doc14')
  .map((section) =>
    section.key === 'doc1'
      ? {
          ...section,
          label: '1-2. 기술지도 대상사업장 / 기술지도 개요',
          shortLabel: '대상사업장 / 개요',
          compactLabel: '1-2',
        }
      : section.key === 'doc13'
        ? {
            ...section,
            label: '13-14. 재해 사례 / 안전 정보',
            shortLabel: '재해 사례 / 안전 정보',
            compactLabel: '13-14',
          }
      : section,
  );

export function resolveWorkspaceSectionKey(
  section: InspectionSectionKey,
): InspectionSectionKey {
  if (section === 'doc2') return 'doc1';
  if (section === 'doc14') return 'doc13';
  return section;
}
