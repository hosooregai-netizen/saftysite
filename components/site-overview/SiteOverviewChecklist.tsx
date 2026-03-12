'use client';

import {
  CAUSATIVE_AGENT_SECTIONS,
  createEmptyCausativeAgentMap,
} from '@/constants/siteOverview';
import type {
  CausativeAgentChecklistItem,
  CausativeAgentKey,
  CausativeAgentReport,
} from '@/types/siteOverview';
import styles from './SiteOverviewChecklist.module.css';

interface SiteOverviewChecklistProps {
  report: CausativeAgentReport | null;
  onAgentToggle: (key: CausativeAgentKey, checked: boolean) => void;
}

function ChecklistCell({
  item,
  checked,
  onToggle,
}: {
  item: CausativeAgentChecklistItem;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  const checkCellClassName = [
    styles.checkCell,
    checked ? styles.checkedCell : '',
  ]
    .filter(Boolean)
    .join(' ');
  const labelCellClassName = [
    styles.labelCell,
    checked ? styles.checkedCell : '',
  ]
    .filter(Boolean)
    .join(' ');
  const guidanceCellClassName = [
    styles.guidanceCell,
    checked ? styles.checkedCell : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <td className={checkCellClassName}>
        <input
          type="checkbox"
          checked={checked}
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
}: SiteOverviewChecklistProps) {
  const agents = report?.agents ?? createEmptyCausativeAgentMap();
  const selectedItems = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
    section.rows.flatMap((row) => [row.left, row.right])
  ).filter((item) => agents[item.key]);

  return (
    <section className={styles.section}>
      <div className={styles.shell}>
        <div className={styles.summaryHeader}>
          <div className={styles.summaryHeaderRow}>
            <div>
              <p className={styles.summaryTitle}>전경 점검 체크표</p>
              <p className={styles.summaryDescription}>
                체크 결과를 검토하고 필요한 항목을 직접 수정한 뒤 출력합니다.
              </p>
            </div>
            <span className={styles.summaryStatus}>
              선택 항목 {selectedItems.length}건
            </span>
          </div>
        </div>

        <div className={styles.tableFrame}>
          <table className={styles.photoTable}>
            <thead>
              <tr>
                <th className={styles.tableTitleCell}>전경사진</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.photoCell}>
                  {report?.photoUrl ? (
                    <div className={styles.photoFrame}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={report.photoUrl}
                        alt="점검 사업장 전경 사진"
                        className={styles.photoImage}
                      />
                    </div>
                  ) : (
                    <div className={styles.photoPlaceholder}>
                      전경 사진을 업로드하면 여기에 표시됩니다.
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

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
                <th className={styles.headerCell}>사망사고 다발 기인물</th>
                <th className={styles.headerCell}>필수 지도사항</th>
                <th className={styles.headerCell}>체크</th>
                <th className={styles.headerCell}>사망사고 다발 기인물</th>
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
                      onToggle={(checked) =>
                        onAgentToggle(row.left.key, checked)
                      }
                    />
                    <ChecklistCell
                      item={row.right}
                      checked={agents[row.right.key]}
                      onToggle={(checked) =>
                        onAgentToggle(row.right.key, checked)
                      }
                    />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.footerGrid}>
        <div className={styles.noteCard}>
          <div className={styles.noteCardHeader}>
            <h2 className={styles.noteTitle}>판독 근거</h2>
            <span className={styles.noteStatus}>검토 참고</span>
          </div>
          <p className={styles.noteBody}>
            {report?.reasoning || '아직 판독 결과가 없습니다.'}
          </p>
        </div>

        <div className={styles.noteCard}>
          <h2 className={styles.noteTitle}>선택 항목 요약</h2>
          {selectedItems.length > 0 ? (
            <div className={styles.summaryTableWrap}>
              <table className={styles.summaryTable}>
                <thead className={styles.summaryTableHead}>
                  <tr>
                    <th className={styles.summaryHeadCell}>번호</th>
                    <th className={styles.summaryHeadCell}>항목</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item) => (
                    <tr key={item.key} className={styles.summaryRow}>
                      <td className={styles.summaryNumber}>{item.number}</td>
                      <td className={styles.summaryItem}>{item.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.emptyText}>체크된 기인물이 없습니다.</p>
          )}
        </div>
      </div>
    </section>
  );
}
