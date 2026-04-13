import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { FuturePlanInputCell } from './QuarterlyFieldControls';
import { QuarterlySectionHeader } from './QuarterlySectionHeader';

export function QuarterlyFuturePlansSection(props: {
  plans: QuarterlySummaryReport['futurePlans'];
  onAdd: () => void;
  onChange: (plans: QuarterlySummaryReport['futurePlans']) => void;
}) {
  const { plans, onAdd, onChange } = props;
  return (
    <article className={operationalStyles.reportCard}>
      <QuarterlySectionHeader title="4. 향후 공정 유해위험작업 안전대책" />
      <div className={operationalStyles.implementationTableWrap}>
        <table className={operationalStyles.implementationTable}>
          <colgroup>
            <col className={operationalStyles.futurePlanColHazard} />
            <col className={operationalStyles.futurePlanColMeasure} />
            <col className={operationalStyles.futurePlanColAction} />
          </colgroup>
          <thead>
            <tr>
              <th className={operationalStyles.implementationHeaderCell}>위험요인</th>
              <th className={operationalStyles.implementationHeaderCell}>안전대책</th>
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
            {plans.length > 0 ? (
              plans.map((item) => (
                <tr key={item.id}>
                  <FuturePlanInputCell
                    value={item.hazard || item.processName}
                    onChange={(value) =>
                      onChange(
                        plans.map((plan) =>
                          plan.id === item.id
                            ? { ...plan, hazard: value, processName: '', source: 'manual' }
                            : plan,
                        ),
                      )
                    }
                  />
                  <FuturePlanInputCell
                    value={item.countermeasure}
                    onChange={(value) =>
                      onChange(
                        plans.map((plan) =>
                          plan.id === item.id
                            ? { ...plan, note: '', countermeasure: value, source: 'manual' }
                            : plan,
                        ),
                      )
                    }
                  />
                  <td className={operationalStyles.implementationActionCell}>
                    <button
                      type="button"
                      className={`app-button app-button-secondary ${operationalStyles.implementationActionButton}`}
                      onClick={() => onChange(plans.filter((plan) => plan.id !== item.id))}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className={operationalStyles.implementationEmptyCell}>
                  등록된 위험요인 및 안전대책이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
