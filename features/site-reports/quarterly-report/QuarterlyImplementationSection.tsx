import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { ImplementationInputCell } from './QuarterlyFieldControls';
import { QuarterlySectionHeader } from './QuarterlySectionHeader';

export function QuarterlyImplementationSection(props: {
  rows: QuarterlySummaryReport['implementationRows'];
  onChange: (
    index: number,
    field: keyof QuarterlySummaryReport['implementationRows'][number],
    value: string,
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const { rows, onChange, onAdd, onRemove } = props;
  return (
    <article className={operationalStyles.reportCard}>
      <QuarterlySectionHeader title="3. 기술지도 이행현황" />
      <div className={operationalStyles.implementationTableWrap}>
        <table className={operationalStyles.implementationTable}>
          <colgroup>
            <col className={operationalStyles.implementationColTitle} />
            <col className={operationalStyles.implementationColCompact} />
            <col className={operationalStyles.implementationColPerson} />
            <col className={operationalStyles.implementationColDate} />
            <col className={operationalStyles.implementationColCompact} />
            <col className={operationalStyles.implementationColCompact} />
            <col className={operationalStyles.implementationColCompact} />
            <col className={operationalStyles.implementationColNote} />
            <col className={operationalStyles.implementationColAction} />
          </colgroup>
          <thead>
            <tr>
              <th className={operationalStyles.implementationHeaderCell}>보고서명</th>
              <th className={operationalStyles.implementationHeaderCell}>차수</th>
              <th className={operationalStyles.implementationHeaderCell}>담당자</th>
              <th className={operationalStyles.implementationHeaderCell}>지도일</th>
              <th className={operationalStyles.implementationHeaderCell}>공정률</th>
              <th className={operationalStyles.implementationHeaderCell}>지적 건수</th>
              <th className={operationalStyles.implementationHeaderCell}>개선 건수</th>
              <th className={operationalStyles.implementationHeaderCell}>비고</th>
              <th className={`${operationalStyles.implementationHeaderCell} ${operationalStyles.implementationHeaderActionCell}`}>
                <button
                  type="button"
                  className={`app-button app-button-secondary ${operationalStyles.implementationAddButton}`}
                  onClick={onAdd}
                >
                  행 추가
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((item, index) => (
                <tr key={item.sessionId || index}>
                  <ImplementationInputCell value={item.reportTitle} onChange={(value) => onChange(index, 'reportTitle', value)} />
                  <ImplementationInputCell type="number" min={0} value={item.reportNumber} onChange={(value) => onChange(index, 'reportNumber', value)} />
                  <ImplementationInputCell value={item.drafter} onChange={(value) => onChange(index, 'drafter', value)} />
                  <ImplementationInputCell value={item.reportDate} onChange={(value) => onChange(index, 'reportDate', value)} />
                  <ImplementationInputCell value={item.progressRate} onChange={(value) => onChange(index, 'progressRate', value)} />
                  <ImplementationInputCell type="number" min={0} value={item.findingCount} onChange={(value) => onChange(index, 'findingCount', value)} />
                  <ImplementationInputCell type="number" min={0} value={item.improvedCount} onChange={(value) => onChange(index, 'improvedCount', value)} />
                  <ImplementationInputCell value={item.note} onChange={(value) => onChange(index, 'note', value)} />
                  <td className={operationalStyles.implementationActionCell}>
                    <button type="button" className={`app-button app-button-secondary ${operationalStyles.implementationActionButton}`} onClick={() => onRemove(index)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className={operationalStyles.implementationEmptyCell}>선택된 기술지도 보고서가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
