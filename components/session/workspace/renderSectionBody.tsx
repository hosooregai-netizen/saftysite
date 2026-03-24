'use client';

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
  switch (currentSection) {
    case 'doc1':
      return <Doc1Section session={props.session} />;
    case 'doc2':
      return <Doc2Section {...props} />;
    case 'doc3':
      return <Doc3Section {...props} />;
    case 'doc4':
      return <Doc4Section {...props} />;
    case 'doc5':
      return <Doc5Section {...props} />;
    case 'doc6':
      return <Doc6Section {...props} />;
    case 'doc7':
      return <Doc7Section {...props} />;
    case 'doc8':
      return <Doc8Section {...props} />;
    case 'doc9':
      return <Doc9Section {...props} />;
    case 'doc10':
      return <Doc10Section {...props} />;
    case 'doc11':
      return <Doc11Section {...props} />;
    case 'doc12':
      return <Doc12Section {...props} />;
    case 'doc13':
      return <Doc13Section session={props.session} />;
    case 'doc14':
      return <Doc14Section session={props.session} />;
    default:
      return <div className={styles.emptyInline}>이 문서 섹션은 이어서 연결 중입니다.</div>;
  }
}
