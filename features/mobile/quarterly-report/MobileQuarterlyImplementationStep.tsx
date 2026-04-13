'use client';

import styles from '@/features/mobile/components/MobileShell.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';

interface MobileQuarterlyImplementationStepProps {
  draft: QuarterlySummaryReport;
  onAddRow: () => void;
  onRemoveRow: (sessionId: string) => void;
  onUpdateRow: (
    sessionId: string,
    field: keyof QuarterlySummaryReport['implementationRows'][number],
    value: string,
  ) => void;
}

export function MobileQuarterlyImplementationStep({
  draft,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
}: MobileQuarterlyImplementationStepProps) {
  return (
    <section className={styles.mobileEditorCard}>
      <div className={styles.mobileImplementationListHeader}>
        <div className={styles.mobileImplementationListTitle}>기술지도 이행현황</div>
        <button
          type="button"
          className={`app-button app-button-secondary ${styles.mobileImplementationAddButton}`}
          onClick={onAddRow}
        >
          행 추가
        </button>
      </div>
      {draft.implementationRows.length > 0 ? (
        <div className={styles.mobileImplementationList}>
          {draft.implementationRows.map((row, index) => (
            <article key={row.sessionId} className={styles.mobileImplementationItem}>
              <div className={styles.mobileImplementationItemTop}>
                <span className={styles.mobileImplementationItemBadge}>{row.reportNumber || index + 1}차</span>
                <button
                  type="button"
                  className={`app-button app-button-secondary ${styles.mobileImplementationDeleteButton}`}
                  onClick={() => onRemoveRow(row.sessionId)}
                >
                  삭제
                </button>
              </div>
              <label className={`${styles.mobileEditorFieldGroup} ${styles.mobileImplementationFieldWide}`}>
                <span className={styles.mobileEditorFieldLabel}>보고서명</span>
                <input
                  className="app-input"
                  value={row.reportTitle}
                  placeholder="보고서명"
                  onChange={(event) => onUpdateRow(row.sessionId, 'reportTitle', event.target.value)}
                />
              </label>
              <div className={styles.mobileImplementationFieldGrid}>
                <label className={styles.mobileEditorFieldGroup}>
                  <span className={styles.mobileEditorFieldLabel}>차수</span>
                  <input
                    type="number"
                    min={0}
                    className="app-input"
                    value={row.reportNumber}
                    onChange={(event) => onUpdateRow(row.sessionId, 'reportNumber', event.target.value)}
                  />
                </label>
                <label className={styles.mobileEditorFieldGroup}>
                  <span className={styles.mobileEditorFieldLabel}>담당자</span>
                  <input
                    className="app-input"
                    value={row.drafter}
                    placeholder="담당자"
                    onChange={(event) => onUpdateRow(row.sessionId, 'drafter', event.target.value)}
                  />
                </label>
                <label className={styles.mobileEditorFieldGroup}>
                  <span className={styles.mobileEditorFieldLabel}>지도일</span>
                  <input
                    className="app-input"
                    value={row.reportDate}
                    placeholder="YYYY-MM-DD"
                    onChange={(event) => onUpdateRow(row.sessionId, 'reportDate', event.target.value)}
                  />
                </label>
                <label className={styles.mobileEditorFieldGroup}>
                  <span className={styles.mobileEditorFieldLabel}>공정률</span>
                  <input
                    className="app-input"
                    value={row.progressRate}
                    placeholder="공정률"
                    onChange={(event) => onUpdateRow(row.sessionId, 'progressRate', event.target.value)}
                  />
                </label>
                <label className={styles.mobileEditorFieldGroup}>
                  <span className={styles.mobileEditorFieldLabel}>지적 건수</span>
                  <input
                    type="number"
                    min={0}
                    className="app-input"
                    value={row.findingCount}
                    onChange={(event) => onUpdateRow(row.sessionId, 'findingCount', event.target.value)}
                  />
                </label>
                <label className={styles.mobileEditorFieldGroup}>
                  <span className={styles.mobileEditorFieldLabel}>개선 건수</span>
                  <input
                    type="number"
                    min={0}
                    className="app-input"
                    value={row.improvedCount}
                    onChange={(event) => onUpdateRow(row.sessionId, 'improvedCount', event.target.value)}
                  />
                </label>
                <label className={`${styles.mobileEditorFieldGroup} ${styles.mobileImplementationFieldWide}`}>
                  <span className={styles.mobileEditorFieldLabel}>비고</span>
                  <input
                    className="app-input"
                    value={row.note}
                    placeholder="비고"
                    onChange={(event) => onUpdateRow(row.sessionId, 'note', event.target.value)}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.mobileImplementationEmpty}>선택된 기술지도 보고서가 없습니다.</div>
      )}
    </section>
  );
}
