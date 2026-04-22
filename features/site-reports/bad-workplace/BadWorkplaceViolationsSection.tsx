import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { BadWorkplaceReport } from '@/types/erpReports';
import { BadWorkplaceSectionHeader } from './BadWorkplaceSectionHeader';

interface BadWorkplaceViolationsSectionProps {
  draft: BadWorkplaceReport;
  onAddViolation: () => void;
  onRemoveViolation: (violationId: string) => void;
  onUpdateViolation: (
    violationId: string,
    patch: Partial<BadWorkplaceReport['violations'][number]>,
  ) => void;
}

export function BadWorkplaceViolationsSection({
  draft,
  onAddViolation,
  onRemoveViolation,
  onUpdateViolation,
}: BadWorkplaceViolationsSectionProps) {
  return (
    <article className={operationalStyles.reportCard}>
      <BadWorkplaceSectionHeader title="3. 기술지도 미이행 등 사망사고 고위험 취약 사항" />

      <div className={`${operationalStyles.tableWrap} ${operationalStyles.violationTableWrap}`}>
        <table className={`${operationalStyles.table} ${operationalStyles.violationTable}`}>
          <thead>
            <tr>
              <th scope="col">관련 법령</th>
              <th scope="col">유해위험요인</th>
              <th scope="col">개선지도 사항(지도일)</th>
              <th scope="col">불이행 사항(확인일)</th>
              <th scope="col" className={operationalStyles.violationActionHeader}>행 관리</th>
            </tr>
          </thead>
          <tbody>
            {draft.violations.length > 0 ? (
              draft.violations.map((item, index) => {
                const isLastRow = index === draft.violations.length - 1;

                return (
                  <tr key={item.id}>
                    <td data-label="관련 법령">
                      <textarea
                        aria-label="관련 법령"
                        className={`app-textarea ${operationalStyles.violationEditor}`}
                        value={item.legalReference}
                        onChange={(event) =>
                          onUpdateViolation(item.id, {
                            legalReference: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td data-label="유해위험요인">
                      <textarea
                        aria-label="유해위험요인"
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
                          aria-label="개선지도 사항"
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
                            aria-label="지도일"
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
                          aria-label="불이행 사항"
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
                            aria-label="확인일"
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
                    <td className={operationalStyles.violationActionCell} data-label="행 관리">
                      <div className={operationalStyles.reportRowActionStack}>
                        {isLastRow ? (
                          <button
                            type="button"
                            className={operationalStyles.reportRowActionAdd}
                            onClick={onAddViolation}
                          >
                            행 추가
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={operationalStyles.reportRowActionRemove}
                          onClick={() => onRemoveViolation(item.id)}
                        >
                          행 삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className={operationalStyles.violationEmptyRow}>
                <td colSpan={5}>
                  <div className={operationalStyles.reportEmptyState}>
                    <span>표시할 취약 사항이 없습니다.</span>
                    <button
                      type="button"
                      className={operationalStyles.reportEmptyActionButton}
                      onClick={onAddViolation}
                    >
                      행 추가
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
