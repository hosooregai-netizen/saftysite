'use client';

import AppModal from '@/components/ui/AppModal';
import { K2bSection } from './K2bSection';
import styles from './K2bSection.module.css';

interface K2bImportModalProps {
  contextHeadquarterId?: string | null;
  contextSiteId?: string | null;
  onClose: () => void;
  onReload: (options?: {
    force?: boolean;
    includeContent?: boolean;
    includeReports?: boolean;
  }) => Promise<void>;
  open: boolean;
  originSection: 'headquarters' | 'reports';
}

export function K2bImportModal({
  contextHeadquarterId = null,
  contextSiteId = null,
  onClose,
  onReload,
  open,
  originSection,
}: K2bImportModalProps) {
  return (
    <AppModal
      open={open}
      title="엑셀 업로드"
      size="large"
      onClose={onClose}
      actions={
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={onClose}
        >
          닫기
        </button>
      }
    >
      <div className={styles.stepStack}>
        <div className={styles.noticeBox}>
          {originSection === 'reports'
            ? '전체 보고서 화면에서 여는 K2B 업로드입니다. 반영 후 사업장/현장 기준 데이터가 함께 갱신됩니다.'
            : '사업장/현장 화면에서 여는 K2B 업로드입니다. 반영 후 현재 목록의 보완 필요 상태가 즉시 갱신됩니다.'}
          {contextSiteId
            ? ' 현재 현장 컨텍스트를 유지한 채 업로드합니다.'
            : contextHeadquarterId
              ? ' 현재 사업장 컨텍스트를 유지한 채 업로드합니다.'
              : ''}
        </div>
        <K2bSection onReload={onReload} />
      </div>
    </AppModal>
  );
}
