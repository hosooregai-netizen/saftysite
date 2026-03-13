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
  onRawResponse?: (raw: unknown) => void;
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
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null);
  const agents = report?.agents ?? createEmptyCausativeAgentMap();
  const reasoning = report?.reasoning.trim() ?? '';
  const hasReasoning = reasoning.length > 0;
  const isReasoningLong = reasoning.length > 180 || reasoning.includes('\n');
  const isReasoningExpanded = expandedReasoning === reasoning;
  const mobileItems = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
    section.rows.flatMap((row) => [
      { sectionLabel: section.label, item: row.left },
      { sectionLabel: section.label, item: row.right },
    ])
  );
  const contentShellClassName = [
    styles.contentShell,
    isAnalyzing ? styles.contentShellAnalyzing : '',
  ]
    .filter(Boolean)
    .join(' ');
  const reasoningBodyClassName = [
    styles.reasoningBody,
    isReasoningLong && !isReasoningExpanded ? styles.reasoningBodyCollapsed : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={styles.section}>
      <div className={styles.contentFrame} aria-busy={isAnalyzing}>
        {isAnalyzing ? (
          <div className={styles.loadingOverlay} role="status" aria-live="polite">
            <div className={styles.loadingPanel}>
              <div className={styles.loadingSpinner} aria-hidden="true" />
              <p className={styles.loadingOverlayTitle}>환경 사진을 분석하고 있습니다.</p>
              <p className={styles.loadingDescription}>
                체크표와 분석 근거를 업데이트하는 동안 잠시만 기다려 주세요.
              </p>
            </div>
          </div>
        ) : null}

        <div className={contentShellClassName}>
          <div className={styles.stack}>
            <div className={styles.fieldBlock}>
              <div className={styles.fieldHeader}>
                <p className={styles.fieldLabel}>환경 사진</p>
              </div>
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
              {hasReasoning ? (
                <div className={styles.reasoningCard}>
                  <div className={styles.reasoningHeader}>
                    <div className={styles.reasoningCopy}>
                      <p className={styles.reasoningEyebrow}>AI 판단 근거</p>
                    </div>
                    {isReasoningLong ? (
                      <button
                        type="button"
                        className={styles.reasoningToggle}
                        onClick={() =>
                          setExpandedReasoning((current) =>
                            current === reasoning ? null : reasoning
                          )
                        }
                      >
                        {isReasoningExpanded ? '접기' : '전체 보기'}
                      </button>
                    ) : null}
                  </div>
                  <p className={reasoningBodyClassName}>{reasoning}</p>
                </div>
              ) : null}
            </div>

            <div className={styles.fieldBlock}>
              <div className={styles.tableFrame}>
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
                        건설현장 12대 위험요인 기인물 및 예방조치
                      </th>
                    </tr>
                    <tr className={styles.headerRow}>
                      <th className={styles.headerCell}>구분</th>
                      <th className={styles.headerCell}>체크</th>
                      <th className={styles.headerCell}>위험사고 3대 기인물</th>
                      <th className={styles.headerCell}>필수 지시사항</th>
                      <th className={styles.headerCell}>체크</th>
                      <th className={styles.headerCell}>위험사고 3대 기인물</th>
                      <th className={styles.headerCell}>필수 지시사항</th>
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
                    건설현장 12대 위험요인 기인물 및 예방조치
                  </div>
                  <div className={styles.mobileChecklistHeaderMeta} aria-hidden="true">
                    <span className={styles.mobileChecklistHeaderMetaItem}>체크</span>
                    <span className={styles.mobileChecklistHeaderMetaItem}>기인물</span>
                    <span className={styles.mobileChecklistHeaderMetaItem}>필수 지시사항</span>
                  </div>
                  {mobileItems.map(({ item }) => {
                    const rowClassName = [
                      styles.mobileChecklistItem,
                      agents[item.key] ? styles.checkedCell : '',
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <div key={item.key} className={rowClassName}>
                        <label className={styles.mobileChecklistCheckField}>
                          <input
                            type="checkbox"
                            checked={agents[item.key]}
                            disabled={isAnalyzing}
                            onChange={(event) =>
                              onAgentToggle(item.key, event.target.checked)
                            }
                            className={styles.checkbox}
                            aria-label={`${item.number}. ${item.label}`}
                          />
                        </label>
                        <p className={styles.mobileChecklistValue}>
                          <span>
                            {item.number}. {item.label}
                          </span>
                        </p>
                        <p className={styles.mobileChecklistGuidance}>{item.guidance}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
