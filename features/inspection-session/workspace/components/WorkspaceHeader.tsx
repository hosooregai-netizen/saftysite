import { PageBackControl } from '@/components/navigation/PageBackControl';
import { getSessionTitle } from '@/constants/inspectionSession';
import type { InspectionSession } from '@/types/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

interface WorkspaceHeaderProps {
  backHref: string;
  session: InspectionSession;
}

export function WorkspaceHeader({ backHref, session }: WorkspaceHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerBody}>
        <PageBackControl href={backHref} label="이전" ariaLabel="이전 화면으로 돌아가기" />
        <div className={styles.headerMain}>
          <h1 className={styles.headerTitle}>기술 지도 - {getSessionTitle(session)}</h1>
        </div>
      </div>
    </header>
  );
}

