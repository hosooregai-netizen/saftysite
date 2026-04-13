import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { BadWorkplaceReport } from '@/types/erpReports';
import { BadWorkplaceSectionHeader } from './BadWorkplaceSectionHeader';

interface BadWorkplaceViolationsSectionProps {
  draft: BadWorkplaceReport;
  onUpdateViolation: (
    violationId: string,
    patch: Partial<BadWorkplaceReport['violations'][number]>,
  ) => void;
}

export function BadWorkplaceViolationsSection({
  draft,
  onUpdateViolation,
}: BadWorkplaceViolationsSectionProps) {
  return (
    <article className={operationalStyles.reportCard}>
      <BadWorkplaceSectionHeader title="3. 기술지도 미이행 등 사망사고 고위험 취약 사항" />

      <div
        className={`${operationalStyles.tableWrap} ${operationalStyles.violationTableWrap}`}
      >
        <table
          className={`${operationalStyles.table} ${operationalStyles.violationTable}`}
        >
          <thead>
            <tr>
              <th>관련 법규</th>
              <th>유해·위험요인</th>
              <th>개선지도 사항(지도일)</th>
              <th>불이행 사항(확인일)</th>
            </tr>
          </thead>
          <tbody>
            {draft.violations.length > 0 ? (
              draft.violations.map((item) => (
                <tr key={item.id}>
                  <td data-label="관련 법규">
                    <textarea
                      className={`app-textarea ${operationalStyles.violationEditor}`}
                      value={item.legalReference}
                      onChange={(event) =>
                        onUpdateViolation(item.id, {
                          legalReference: event.target.value,
                        })
                      }
                    />
                  </td>
                  <td data-label="유해·위험요인">
                    <textarea
                      className={`app-textarea ${operationalStyles.violationEditor}`}
                      value={item.hazardFactor}
                      onChange={(event) =>
                        onUpdateViolation(item.id, {
                          hazardFactor: event.target.value,
                        })
                      }
                    />
                  </td>
                  <td data-label="개선지도 사항">
                    <div className={operationalStyles.tableCellStack}>
                      <textarea
                        className={`app-textarea ${operationalStyles.violationEditor}`}
                        value={item.improvementMeasure}
                        onChange={(event) =>
                          onUpdateViolation(item.id, {
                            improvementMeasure: event.target.value,
                          })
                        }
                      />
                      <label className={operationalStyles.tableDateField}>
                        <span className={operationalStyles.tableDateLabel}>지도일</span>
                        <input
                          className={`app-input ${operationalStyles.tableDateInput} ${operationalStyles.violationEditorInput}`}
                          value={item.guidanceDate}
                          onChange={(event) =>
                            onUpdateViolation(item.id, {
                              guidanceDate: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  </td>
                  <td data-label="불이행 사항">
                    <div className={operationalStyles.tableCellStack}>
                      <textarea
                        className={`app-textarea ${operationalStyles.violationEditor}`}
                        value={item.nonCompliance}
                        onChange={(event) =>
                          onUpdateViolation(item.id, {
                            nonCompliance: event.target.value,
                          })
                        }
                      />
                      <label className={operationalStyles.tableDateField}>
                        <span className={operationalStyles.tableDateLabel}>확인일</span>
                        <input
                          className={`app-input ${operationalStyles.tableDateInput} ${operationalStyles.violationEditorInput}`}
                          value={item.confirmationDate}
                          onChange={(event) =>
                            onUpdateViolation(item.id, {
                              confirmationDate: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className={operationalStyles.violationEmptyRow}>
                <td colSpan={4}>선택한 지적사항이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
