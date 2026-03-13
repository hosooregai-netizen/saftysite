'use client';

import { useState } from 'react';
import {
  CAUSATIVE_AGENT_SECTIONS,
  createEmptyCausativeAgentMap,
} from '@/constants/siteOverview';
import SiteOverviewUploadPanel from './SiteOverviewUploadPanel';
import type {
  CausativeAgentChecklistItem,
  CausativeAgentKey,
  CausativeAgentReport,
} from '@/types/siteOverview';
import styles from './SiteOverviewChecklist.module.css';

interface SiteOverviewChecklistProps {
  report: CausativeAgentReport | null;
  onAgentToggle: (key: CausativeAgentKey, checked: boolean) => void;
  onUploadSuccess: (report: CausativeAgentReport) => void;
  onUploadClear: () => void;
  onRawResponse: (raw: unknown) => void;
}

function ChecklistCell({
  item,
  checked,
  disabled,
  onToggle,
}: {
  item: CausativeAgentChecklistItem;
  checked: boolean;
  disabled: boolean;
  onToggle: (checked: boolean) => void;
}) {
  const checkCellClassName = [styles.checkCell, checked ? styles.checkedCell : '']
    .filter(Boolean)
    .join(' ');
  const labelCellClassName = [styles.labelCell, checked ? styles.checkedCell : '']
    .filter(Boolean)
    .join(' ');
  const guidanceCellClassName = [styles.guidanceCell, checked ? styles.checkedCell : '']
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <td className={checkCellClassName}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onToggle(event.target.checked)}
          className={styles.checkbox}
          aria-label={`${item.number}. ${item.label}`}
        />
      </td>
      <td className={labelCellClassName}>
        {item.number}. {item.label}
      </td>
      <td className={guidanceCellClassName}>{item.guidance}</td>
    </>
  );
}

export default function SiteOverviewChecklist({
  report,
  onAgentToggle,
  onUploadSuccess,
  onUploadClear,
  onRawResponse,
}: SiteOverviewChecklistProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const agents = report?.agents ?? createEmptyCausativeAgentMap();
  const mobileItems = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
    section.rows.flatMap((row) => [
      { sectionLabel: section.label, item: row.left },
      { sectionLabel: section.label, item: row.right },
    ])
  );
  const selectedItems = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
    section.rows.flatMap((row) => [row.left, row.right])
  ).filter((item) => agents[item.key]);
  const tableFrameContentClassName = [
    styles.tableFrameContent,
    isAnalyzing ? styles.tableFrameContentAnalyzing : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={styles.section}>
      <div className={styles.shell}>
        <div className={styles.summaryHeader}>
          <div className={styles.summaryHeaderRow}>
            <div>
              <p className={styles.summaryTitle}>전경 사진 체크표</p>
              <p className={styles.summaryDescription}>
                체크 결과를 검토하고 필요한 항목을 직접 수정한 뒤 활용합니다.
              </p>
            </div>
            <span className={styles.summaryStatus}>선택 항목 {selectedItems.length}건</span>
          </div>
        </div>

        <div className={styles.tableFrame} aria-busy={isAnalyzing}>
          {isAnalyzing ? (
            <div className={styles.loadingOverlay} role="status" aria-live="polite">
              <div className={styles.loadingPanel}>
                <div className={styles.loadingSpinner} aria-hidden="true" />
                <p className={styles.loadingOverlayTitle}>전경 사진을 분석하고 있습니다.</p>
                <p className={styles.loadingDescription}>
                  체크표를 업데이트하는 동안 잠시만 기다려 주세요.
                </p>
              </div>
            </div>
          ) : null}

          <div className={tableFrameContentClassName}>
            <div className={styles.photoSection}>
              <p className={styles.photoSectionTitle}>전경사진</p>
              <SiteOverviewUploadPanel
                report={
                  report ?? {
                    agents: createEmptyCausativeAgentMap(),
                    reasoning: '',
                    photoUrl: '',
                  }
                }
                onSuccess={onUploadSuccess}
                onClear={onUploadClear}
                onRawResponse={onRawResponse}
                onLoadingChange={setIsAnalyzing}
              />
            </div>

            <div className={styles.checklistBody}>
              <table className={styles.checklistTable}>
                <colgroup>
                  <col className={styles.colSection} />
                  <col className={styles.colCheck} />
                  <col className={styles.colLabel} />
                  <col className={styles.colGuidanceWide} />
                  <col className={styles.colCheck} />
                  <col className={styles.colLabel} />
                  <col className={styles.colGuidance} />
                </colgroup>
                <thead>
                  <tr>
                    <th colSpan={7} className={styles.tableTitleCell}>
                      건설현장 12대 사망사고 기인물 핵심 안전조치
                    </th>
                  </tr>
                  <tr className={styles.headerRow}>
                    <th className={styles.headerCell}>구분</th>
                    <th className={styles.headerCell}>체크</th>
                    <th className={styles.headerCell}>사망사고 3대 기인물</th>
                    <th className={styles.headerCell}>필수 지도사항</th>
                    <th className={styles.headerCell}>체크</th>
                    <th className={styles.headerCell}>사망사고 3대 기인물</th>
                    <th className={styles.headerCell}>필수 지도사항</th>
                  </tr>
                </thead>
                <tbody>
                  {CAUSATIVE_AGENT_SECTIONS.map((section) =>
                    section.rows.map((row, rowIndex) => (
                      <tr key={row.left.key}>
                        {rowIndex === 0 && (
                          <td rowSpan={section.rows.length} className={styles.sectionCell}>
                            {section.label}
                          </td>
                        )}
                        <ChecklistCell
                          item={row.left}
                          checked={agents[row.left.key]}
                          disabled={isAnalyzing}
                          onToggle={(checked) => onAgentToggle(row.left.key, checked)}
                        />
                        <ChecklistCell
                          item={row.right}
                          checked={agents[row.right.key]}
                          disabled={isAnalyzing}
                          onToggle={(checked) => onAgentToggle(row.right.key, checked)}
                        />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className={styles.mobileChecklistList}>
                <div className={styles.mobileChecklistHeader}>
                  건설현장 12대 사망사고 기인물 핵심 안전조치
                </div>
                {mobileItems.map(({ sectionLabel, item }) => {
                  const rowClassName = [
                    styles.mobileChecklistItem,
                    agents[item.key] ? styles.checkedCell : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div key={item.key} className={rowClassName}>
                      <div className={styles.mobileChecklistTop}>
                        <span className={styles.mobileChecklistSection}>{sectionLabel}</span>
                        <label className={styles.mobileChecklistLabel}>
                          <input
                            type="checkbox"
                            checked={agents[item.key]}
                            disabled={isAnalyzing}
                            onChange={(event) => onAgentToggle(item.key, event.target.checked)}
                            className={styles.checkbox}
                            aria-label={`${item.number}. ${item.label}`}
                          />
                          <span>
                            {item.number}. {item.label}
                          </span>
                        </label>
                      </div>
                      <p className={styles.mobileChecklistGuidance}>{item.guidance}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <details className={`${styles.footerGrid} ${styles.reasoningDisclosure}`}>
        <summary className={styles.reasoningSummary}>
          <span className={styles.reasoningSummaryLabel}>AI 분석 근거 확인하기</span>
          <span className={styles.reasoningSummaryIcon} aria-hidden="true">
            ▾
          </span>
        </summary>
        <p className={styles.noteBody}>
          {report?.reasoning || '아직 판독 결과가 없습니다.'}
        </p>
      </details>
    </section>
  );
}
