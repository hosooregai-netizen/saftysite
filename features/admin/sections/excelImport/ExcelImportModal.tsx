'use client';

import AppModal from '@/components/ui/AppModal';
import type { ExcelImportKind, ExcelImportScope, ExcelScopeSourceSection } from '@/types/excelImport';
import { ExcelImportSection } from './ExcelImportSection';
import styles from './ExcelImportSection.module.css';

interface ExcelImportModalProps {
  contextHeadquarterId?: string | null;
  contextSiteId?: string | null;
  onClose: () => void;
  onReload: (options?: {
    force?: boolean;
    includeContent?: boolean;
    includeReports?: boolean;
  }) => Promise<void>;
  open: boolean;
  originSection: ExcelScopeSourceSection;
  importKind?: ExcelImportKind;
}

function buildScopeLabel(scope: ExcelImportScope) {
  if (scope.siteId) return '현장 1곳';
  if (scope.headquarterId) return '건설사 1곳';
  return '전체';
}

export function ExcelImportModal({
  contextHeadquarterId = null,
  contextSiteId = null,
  onClose,
  onReload,
  open,
  originSection,
  importKind = 'generic',
}: ExcelImportModalProps) {
  const scope: ExcelImportScope = {
    sourceSection: originSection,
    headquarterId: contextHeadquarterId,
    siteId: contextSiteId,
    importKind,
  };
  const scopeLabel = buildScopeLabel(scope);
  const title =
    importKind === 'k2b_guidance'
      ? 'K2B 엑셀로 추가'
      : originSection === 'sites'
        ? '현장 엑셀 업로드'
        : '건설사 엑셀 업로드';

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
          {importKind === 'k2b_guidance' ? (
            <>
              K2B 실적 엑셀의 건설사, 현장, 회차, 기술지도일을 기준으로 자동등록합니다. 이미 등록된
              건설사, 현장, 회차 보고서는 재사용하고 누락 또는 모호한 행은 제외 사유로 표시됩니다.
            </>
          ) : (
            <>
              현재 페이지 스코프는 <strong>{scopeLabel}</strong>입니다. 업로드 후에는 스코프에 맞는
              행만 미리보기와 반영 대상에 포함되고, 제외된 행은 이유와 함께 별도로 확인할 수 있습니다.
            </>
          )}
        </div>
        <ExcelImportSection onReload={onReload} scope={scope} />
      </div>
    </AppModal>
  );
}
