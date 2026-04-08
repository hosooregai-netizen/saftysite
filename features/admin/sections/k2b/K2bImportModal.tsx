'use client';

import AppModal from '@/components/ui/AppModal';
import type { K2bImportScope, K2bScopeSourceSection } from '@/types/k2b';
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
  originSection: K2bScopeSourceSection;
}

function buildScopeLabel(scope: K2bImportScope) {
  if (scope.siteId) return '현장 1곳';
  if (scope.headquarterId) return '사업장 1곳';
  return '전체';
}

export function K2bImportModal({
  contextHeadquarterId = null,
  contextSiteId = null,
  onClose,
  onReload,
  open,
  originSection,
}: K2bImportModalProps) {
  const scope: K2bImportScope = {
    sourceSection: originSection,
    headquarterId: contextHeadquarterId,
    siteId: contextSiteId,
  };
  const scopeLabel = buildScopeLabel(scope);
  const title = originSection === 'sites' ? '현장 엑셀 업로드' : '사업장 엑셀 업로드';

  return (
    <AppModal
      open={open}
      title={title}
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
          현재 페이지 스코프는 <strong>{scopeLabel}</strong>입니다. 업로드 후에는 스코프에 맞는
          행만 미리보기와 반영 대상에 포함되고, 제외된 행은 이유와 함께 별도로 확인할 수 있습니다.
        </div>
        <K2bSection onReload={onReload} scope={scope} />
      </div>
    </AppModal>
  );
}
