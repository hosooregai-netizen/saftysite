import {
  createCurrentHazardFinding,
  createFutureProcessRiskPlan,
  createMeasurementCheckItem,
  createPreviousGuidanceFollowUpItem,
  getSessionGuidanceDate,
} from '@/constants/inspectionSession';
import Doc10Section from '@/components/session/workspace/sections/Doc10Section';
import Doc11Section from '@/components/session/workspace/sections/Doc11Section';
import Doc12Section from '@/components/session/workspace/sections/Doc12Section';
import Doc13Section from '@/components/session/workspace/sections/Doc13Section';
import Doc14Section from '@/components/session/workspace/sections/Doc14Section';
import Doc1Section from '@/components/session/workspace/sections/Doc1Section';
import Doc2Section from '@/components/session/workspace/sections/Doc2Section';
import Doc3Section from '@/components/session/workspace/sections/Doc3Section';
import Doc4Section from '@/components/session/workspace/sections/Doc4Section';
import Doc5Section from '@/components/session/workspace/sections/Doc5Section';
import Doc6Section from '@/components/session/workspace/sections/Doc6Section';
import Doc7Section from '@/components/session/workspace/sections/Doc7Section';
import Doc8Section from '@/components/session/workspace/sections/Doc8Section';
import Doc9Section from '@/components/session/workspace/sections/Doc9Section';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type {
  HazardStatsSectionProps,
  OverviewSectionProps,
  SupportSectionProps,
} from '@/components/session/workspace/types';
import type { InspectionSectionKey } from '@/types/inspectionSession';

type InspectionWorkspaceSectionProps = OverviewSectionProps &
  HazardStatsSectionProps &
  SupportSectionProps & {
    currentSection: InspectionSectionKey;
  };

function renderToolbarButton(
  label: string,
  onClick: () => void,
) {
  return (
    <div className={`${styles.sectionToolbar} ${styles.doc4Toolbar}`}>
      <button type="button" className="app-button app-button-secondary" onClick={onClick}>
        {label}
      </button>
    </div>
  );
}

function renderCombinedOverviewSections(props: InspectionWorkspaceSectionProps) {
  return (
    <div className={styles.combinedOverviewSectionStack}>
      <section className={styles.combinedOverviewSectionBlock} aria-labelledby="doc1-section-title">
        <h2 id="doc1-section-title" className={styles.combinedOverviewSectionTitle}>
          1. 기술지도 대상사업장
        </h2>
        <Doc1Section session={props.session} />
      </section>
      <section className={styles.combinedOverviewSectionBlock} aria-labelledby="doc2-section-title">
        <h2 id="doc2-section-title" className={styles.combinedOverviewSectionTitle}>
          2. 기술지도 개요
        </h2>
        <Doc2Section {...props} />
      </section>
    </div>
  );
}

const inspectionSectionRegistry: Record<
  InspectionSectionKey,
  {
    render: (props: InspectionWorkspaceSectionProps) => React.ReactNode;
    renderToolbar?: (props: InspectionWorkspaceSectionProps) => React.ReactNode;
    title: string;
  }
> = {
  doc1: {
    render: renderCombinedOverviewSections,
    title: '1. 기술지도 대상사업장 / 2. 기술지도 개요',
  },
  doc2: {
    render: renderCombinedOverviewSections,
    title: '1. 기술지도 대상사업장 / 2. 기술지도 개요',
  },
  doc3: { render: (props) => <Doc3Section {...props} />, title: '문서 3' },
  doc4: {
    render: (props) => <Doc4Section {...props} />,
    renderToolbar: (props) =>
      renderToolbarButton('이행여부 추가', () =>
        props.applyDocumentUpdate('doc4', 'manual', (current) => ({
          ...current,
          document4FollowUps: [
            ...current.document4FollowUps,
            createPreviousGuidanceFollowUpItem({
              confirmationDate: getSessionGuidanceDate(current),
            }),
          ],
        })),
      ),
    title: '문서 4',
  },
  doc5: { render: (props) => <Doc5Section {...props} />, title: '문서 5' },
  doc6: { render: (props) => <Doc6Section {...props} />, title: '문서 6' },
  doc7: {
    render: (props) => <Doc7Section {...props} />,
    renderToolbar: (props) =>
      renderToolbarButton('위험요인 추가', () =>
        props.applyDocumentUpdate('doc7', 'manual', (current) => ({
          ...current,
          document7Findings: [
            ...current.document7Findings,
            createCurrentHazardFinding({ inspector: current.meta.drafter }),
          ],
        })),
      ),
    title: '문서 7',
  },
  doc8: {
    render: (props) => <Doc8Section {...props} />,
    renderToolbar: (props) =>
      renderToolbarButton('행 추가', () =>
        props.applyDocumentUpdate('doc8', 'manual', (current) => ({
          ...current,
          document8Plans: [...current.document8Plans, createFutureProcessRiskPlan()],
        })),
      ),
    title: '문서 8',
  },
  doc9: { render: (props) => <Doc9Section {...props} />, title: '문서 9' },
  doc10: {
    render: (props) => <Doc10Section {...props} />,
    renderToolbar: (props) =>
      renderToolbarButton('행 추가', () =>
        props.applyDocumentUpdate('doc10', 'manual', (current) => ({
          ...current,
          document10Measurements: [
            ...current.document10Measurements,
            createMeasurementCheckItem(),
          ],
        })),
      ),
    title: '문서 10',
  },
  doc11: { render: (props) => <Doc11Section {...props} />, title: '문서 11' },
  doc12: { render: (props) => <Doc12Section {...props} />, title: '문서 12' },
  doc13: { render: (props) => <Doc13Section session={props.session} />, title: '문서 13' },
  doc14: { render: (props) => <Doc14Section session={props.session} />, title: '문서 14' },
};

export function getInspectionSectionContent(props: InspectionWorkspaceSectionProps) {
  return inspectionSectionRegistry[props.currentSection]?.render(props) ?? (
    <div className={styles.emptyInline}>문서 섹션을 이어서 연결 중입니다.</div>
  );
}

export function getInspectionSectionTitle(section: InspectionSectionKey): string {
  return inspectionSectionRegistry[section]?.title ?? '';
}

export function getInspectionSectionToolbar(props: InspectionWorkspaceSectionProps) {
  return inspectionSectionRegistry[props.currentSection]?.renderToolbar?.(props) ?? null;
}

