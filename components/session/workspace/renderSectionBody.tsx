'use client';

import { renderOverviewSection } from '@/components/session/workspace/Doc1To3Section';
import { renderDoc11To14 } from '@/components/session/workspace/Doc11To14Section';
import { renderDoc4To6 } from '@/components/session/workspace/Doc4To6Section';
import { renderDoc7To10 } from '@/components/session/workspace/Doc7To10Section';
import type {
  HazardStatsSectionProps,
  OverviewSectionProps,
  SupportSectionProps,
} from '@/components/session/workspace/types';
import type { InspectionSectionKey } from '@/types/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

type RenderSectionProps = OverviewSectionProps &
  HazardStatsSectionProps &
  SupportSectionProps & {
    currentSection: InspectionSectionKey;
  };

export function renderSectionBody({
  currentSection,
  ...props
}: RenderSectionProps) {
  return (
    renderOverviewSection(currentSection, props) ||
    renderDoc4To6(currentSection, props) ||
    renderDoc7To10(currentSection, props) ||
    renderDoc11To14(currentSection, props) || (
      <div className={styles.emptyInline}>이 문서 섹션은 이어서 연결 중입니다.</div>
    )
  );
}
