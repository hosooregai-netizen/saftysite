'use client';

import { useState, type FocusEvent } from 'react';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import {
  applyHazardCountermeasureSelectionToFuturePlan,
  clearHazardCountermeasureSelectionFromFuturePlan,
  getHazardCountermeasureFieldText,
  getHazardCountermeasureRecommendations,
} from '@/lib/hazardCountermeasureCatalog';
import type { SafetyHazardCountermeasureCatalogItem } from '@/types/backend';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { QuarterlySectionHeader } from './QuarterlySectionHeader';

type QuarterlyMatchField = 'expectedRisk' | 'countermeasure';

function buildRecommendationLabel(
  item: SafetyHazardCountermeasureCatalogItem,
  field: QuarterlyMatchField,
) {
  const primary =
    getHazardCountermeasureFieldText(item, field).trim() ||
    item.title.trim() ||
    item.expectedRisk.trim() ||
    item.countermeasure.trim();
  const title = item.title.trim();
  return title && primary !== title ? `${primary} (${title})` : primary;
}

export function QuarterlyFuturePlansSection(props: {
  hazardCountermeasureCatalog: SafetyHazardCountermeasureCatalogItem[];
  plans: QuarterlySummaryReport['futurePlans'];
  onAdd: () => void;
  onChange: (plans: QuarterlySummaryReport['futurePlans']) => void;
}) {
  const { hazardCountermeasureCatalog, plans, onAdd, onChange } = props;
  const [activeEditor, setActiveEditor] = useState<{
    field: QuarterlyMatchField;
    planId: string;
  } | null>(null);

  const handleBlur = (
    planId: string,
    field: QuarterlyMatchField,
    event: FocusEvent<HTMLDivElement>,
  ) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setActiveEditor((current) =>
        current?.planId === planId && current.field === field ? null : current,
      );
    }
  };

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
              <th
                className={`${operationalStyles.implementationHeaderCell} ${operationalStyles.implementationHeaderActionCell}`}
              >
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
              plans.map((item) => {
                const recommendationQuery =
                  activeEditor?.planId === item.id
                    ? activeEditor.field === 'expectedRisk'
                      ? item.hazard || item.processName
                      : item.countermeasure
                    : '';
                const recommendations =
                  activeEditor?.planId === item.id
                    ? getHazardCountermeasureRecommendations(
                        hazardCountermeasureCatalog,
                        recommendationQuery,
                        activeEditor.field,
                        { excludeId: item.hazardCountermeasureItemId },
                      )
                    : [];
                const recommendationListId =
                  activeEditor?.planId === item.id
                    ? `quarterly-future-plan-${item.id}-${activeEditor.field}`
                    : '';

                return (
                  <tr key={item.id}>
                    <td className={operationalStyles.implementationValueCell}>
                      <div
                        style={{ position: 'relative' }}
                        onBlur={(event) => handleBlur(item.id, 'expectedRisk', event)}
                      >
                        <textarea
                          className={`app-textarea ${operationalStyles.futurePlanControl}`}
                          value={item.hazard || item.processName}
                          onFocus={() =>
                            setActiveEditor({ planId: item.id, field: 'expectedRisk' })
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              setActiveEditor((current) =>
                                current?.planId === item.id &&
                                current.field === 'expectedRisk'
                                  ? null
                                  : current,
                              );
                            }
                          }}
                          onChange={(event) =>
                            onChange(
                              plans.map((plan) =>
                                plan.id === item.id
                                  ? {
                                      ...clearHazardCountermeasureSelectionFromFuturePlan(plan),
                                      hazard: event.target.value,
                                    }
                                  : plan,
                              ),
                            )
                          }
                        />
                        {activeEditor?.planId === item.id &&
                        activeEditor.field === 'expectedRisk' &&
                        recommendations.length > 0 ? (
                          <div
                            id={recommendationListId}
                            className={workspaceStyles.doc8RecommendationList}
                            role="listbox"
                            style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
                          >
                            {recommendations.map((catalogItem) => (
                              <button
                                key={catalogItem.id}
                                type="button"
                                role="option"
                                aria-selected={false}
                                className={workspaceStyles.doc8RecommendationButton}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                  onChange(
                                    plans.map((plan) =>
                                      plan.id === item.id
                                        ? applyHazardCountermeasureSelectionToFuturePlan(
                                            plan,
                                            catalogItem,
                                          )
                                        : plan,
                                    ),
                                  );
                                  setActiveEditor(null);
                                }}
                              >
                                {buildRecommendationLabel(catalogItem, 'expectedRisk')}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className={operationalStyles.implementationValueCell}>
                      <div
                        style={{ position: 'relative' }}
                        onBlur={(event) => handleBlur(item.id, 'countermeasure', event)}
                      >
                        <textarea
                          className={`app-textarea ${operationalStyles.futurePlanControl}`}
                          value={item.countermeasure}
                          onFocus={() =>
                            setActiveEditor({ planId: item.id, field: 'countermeasure' })
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              setActiveEditor((current) =>
                                current?.planId === item.id &&
                                current.field === 'countermeasure'
                                  ? null
                                  : current,
                              );
                            }
                          }}
                          onChange={(event) =>
                            onChange(
                              plans.map((plan) =>
                                plan.id === item.id
                                  ? {
                                      ...clearHazardCountermeasureSelectionFromFuturePlan(plan),
                                      countermeasure: event.target.value,
                                      note: '',
                                    }
                                  : plan,
                              ),
                            )
                          }
                        />
                        {activeEditor?.planId === item.id &&
                        activeEditor.field === 'countermeasure' &&
                        recommendations.length > 0 ? (
                          <div
                            id={recommendationListId}
                            className={workspaceStyles.doc8RecommendationList}
                            role="listbox"
                            style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
                          >
                            {recommendations.map((catalogItem) => (
                              <button
                                key={catalogItem.id}
                                type="button"
                                role="option"
                                aria-selected={false}
                                className={workspaceStyles.doc8RecommendationButton}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                  onChange(
                                    plans.map((plan) =>
                                      plan.id === item.id
                                        ? applyHazardCountermeasureSelectionToFuturePlan(
                                            plan,
                                            catalogItem,
                                          )
                                        : plan,
                                    ),
                                  );
                                  setActiveEditor(null);
                                }}
                              >
                                {buildRecommendationLabel(catalogItem, 'countermeasure')}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </td>
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
                );
              })
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
