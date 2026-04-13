'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/mobile/components/MobileShell.module.css';
import type { MobileQuarterlySourceReport } from './types';

interface MobileQuarterlySourceModalProps {
  isSourceLoading: boolean;
  open: boolean;
  selectedSourceKeys: string[];
  sourceReports: MobileQuarterlySourceReport[];
  onApply: () => void;
  onClose: () => void;
  onToggleReport: (reportKey: string, checked: boolean) => void;
}

export function MobileQuarterlySourceModal({
  isSourceLoading,
  open,
  selectedSourceKeys,
  sourceReports,
  onApply,
  onClose,
  onToggleReport,
}: MobileQuarterlySourceModalProps) {
  const selectedSourceSet = new Set(selectedSourceKeys);

  return (
    <AppModal
      open={open}
      title="원본 보고서 선택"
      size="large"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="app-button app-button-secondary" onClick={onClose}>
            닫기
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={onApply}
            disabled={isSourceLoading}
          >
            {isSourceLoading ? '반영 중...' : '선택 반영'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '10px' }}>
        {sourceReports.length > 0 ? (
          sourceReports.map((report) => (
            <label
              key={report.report_key}
              style={{
                border: '1px solid rgba(215, 224, 235, 0.96)',
                borderRadius: '14px',
                display: 'grid',
                gap: '8px',
                padding: '14px',
              }}
            >
              <div
                style={{
                  alignItems: 'flex-start',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'grid', gap: '4px' }}>
                  <strong>{report.report_title || report.guidance_date || report.report_key}</strong>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>
                    {report.guidance_date || '-'} · {report.drafter || '작성자 미상'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedSourceSet.has(report.report_key)}
                  onChange={(event) => onToggleReport(report.report_key, event.target.checked)}
                />
              </div>
            </label>
          ))
        ) : (
          <div className={styles.inlineNotice}>선택 가능한 원본 보고서가 없습니다.</div>
        )}
      </div>
    </AppModal>
  );
}
