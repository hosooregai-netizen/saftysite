'use client';

import { useMemo, useState, type FocusEvent } from 'react';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { FUTURE_PROCESS_LIBRARY } from '@/components/session/workspace/constants';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';
import { createFutureProcessRiskPlan } from '@/constants/inspectionSession';
import {
  applyHazardCountermeasureSelectionToFuturePlan,
  buildHazardCountermeasureFallbackCatalog,
  clearHazardCountermeasureSelectionFromFuturePlan,
  getHazardCountermeasureFieldText,
  getHazardCountermeasureRecommendations,
  type HazardCountermeasureCatalogMatchField,
} from '@/lib/hazardCountermeasureCatalog';

type Doc8MatchField = Extract<
  HazardCountermeasureCatalogMatchField,
  'title' | 'expectedRisk' | 'countermeasure'
>;

function buildRecommendationLabel(
  item: HazardStatsSectionProps['hazardCountermeasureCatalog'][number],
  field: Doc8MatchField,
) {
  const primary =
    getHazardCountermeasureFieldText(item, field).trim() ||
    item.title.trim() ||
    item.expectedRisk.trim() ||
    item.countermeasure.trim();
  const title = item.title.trim();
  return title && primary !== title ? `${primary} (${title})` : primary;
}

export default function Doc8Section({
  applyDocumentUpdate,
  hazardCountermeasureCatalog,
  session,
}: Pick<
  HazardStatsSectionProps,
  'applyDocumentUpdate' | 'hazardCountermeasureCatalog' | 'session'
>) {
  const [activeEditor, setActiveEditor] = useState<{
    field: Doc8MatchField;
    planId: string;
  } | null>(null);

  const recommendationSource = useMemo(
    () =>
      hazardCountermeasureCatalog.length > 0
        ? hazardCountermeasureCatalog
        : buildHazardCountermeasureFallbackCatalog(FUTURE_PROCESS_LIBRARY),
    [hazardCountermeasureCatalog],
  );

  const updatePlanField = (planId: string, field: Doc8MatchField, value: string) => {
    applyDocumentUpdate('doc8', 'manual', (current) => ({
      ...current,
      document8Plans: current.document8Plans.map((plan) => {
        if (plan.id !== planId) {
          return plan;
        }

        const nextPlan = clearHazardCountermeasureSelectionFromFuturePlan(plan);
        if (field === 'title') {
          return {
            ...nextPlan,
            processName: value,
          };
        }
        if (field === 'expectedRisk') {
          return {
            ...nextPlan,
            hazard: value,
          };
        }
        return {
          ...nextPlan,
          countermeasure: value,
        };
      }),
    }));
  };

  const selectRecommendation = (
    planId: string,
    item: (typeof recommendationSource)[number],
  ) => {
    applyDocumentUpdate('doc8', 'api', (current) => ({
      ...current,
      document8Plans: current.document8Plans.map((plan) =>
        plan.id === planId ? applyHazardCountermeasureSelectionToFuturePlan(plan, item) : plan,
      ),
    }));
    setActiveEditor(null);
  };

  const handleEditorBlur = (
    planId: string,
    field: Doc8MatchField,
    event: FocusEvent<HTMLDivElement>,
  ) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setActiveEditor((current) =>
        current?.planId === planId && current.field === field ? null : current,
      );
    }
  };

  return (
    <div className={styles.sectionStack}>
      <div className={styles.workPlanSection}>
        <table className={`${styles.workPlanTable} ${styles.doc8FutureTable}`}>
          <caption className={styles.doc8CaptionWrap}>
            <span className={styles.doc8CaptionTitle}>향후 주요 작업공정 및 유해위험요인 / 안전대책</span>
          </caption>
          <colgroup>
            <col className={styles.doc8ColProcess} />
            <col className={styles.doc8ColHazard} />
            <col className={styles.doc8ColMeasure} />
            <col className={styles.doc8ColAction} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className={styles.doc8Th}>
                향후 주요 작업공정
              </th>
              <th scope="col" className={styles.doc8Th}>
                위험요인
              </th>
              <th scope="col" className={styles.doc8Th}>
                안전대책
              </th>
              <th scope="col" className={`${styles.doc8Th} ${styles.doc8ThAction}`}>
                행 관리
              </th>
            </tr>
          </thead>
          <tbody>
            {session.document8Plans.map((item, index) => {
              const isLastRow = index === session.document8Plans.length - 1;
              const recommendationQuery =
                activeEditor?.planId === item.id
                  ? activeEditor.field === 'title'
                    ? item.processName
                    : activeEditor.field === 'expectedRisk'
                      ? item.hazard
                      : item.countermeasure
                  : '';
              const recommendations =
                activeEditor?.planId === item.id
                  ? getHazardCountermeasureRecommendations(
                      recommendationSource,
                      recommendationQuery,
                      activeEditor.field,
                      { excludeId: item.hazardCountermeasureItemId },
                    )
                  : [];
              const recommendationListId =
                activeEditor?.planId === item.id
                  ? `doc8-plan-recommendations-${item.id}-${activeEditor.field}`
                  : '';

              return (
                <tr key={item.id}>
                  <td className={styles.doc8TdProcess}>
                    <div
                      className={styles.doc8ProcessCellStack}
                      onBlur={(event) => handleEditorBlur(item.id, 'title', event)}
                    >
                      <input
                        autoComplete="off"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-controls={recommendationListId}
                        aria-expanded={
                          activeEditor?.planId === item.id &&
                          activeEditor.field === 'title' &&
                          recommendations.length > 0
                        }
                        aria-haspopup="listbox"
                        className={`${styles.doc8ProcessInput} app-input`}
                        value={item.processName}
                        placeholder="향후 작업공정 입력"
                        onFocus={() => setActiveEditor({ planId: item.id, field: 'title' })}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActiveEditor((current) =>
                              current?.planId === item.id && current.field === 'title'
                                ? null
                                : current,
                            );
                          }
                        }}
                        onChange={(event) =>
                          updatePlanField(item.id, 'title', event.target.value)
                        }
                      />
                      {activeEditor?.planId === item.id &&
                      activeEditor.field === 'title' &&
                      recommendations.length > 0 ? (
                        <div
                          id={recommendationListId}
                          className={styles.doc8RecommendationList}
                          role="listbox"
                        >
                          {recommendations.map((catalogItem) => (
                            <button
                              key={catalogItem.id}
                              type="button"
                              role="option"
                              aria-selected={false}
                              className={styles.doc8RecommendationButton}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectRecommendation(item.id, catalogItem)}
                            >
                              {buildRecommendationLabel(catalogItem, 'title')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className={styles.doc8TdArea}>
                    <div
                      style={{ position: 'relative' }}
                      onBlur={(event) => handleEditorBlur(item.id, 'expectedRisk', event)}
                    >
                      <textarea
                        rows={5}
                        className={`${styles.doc8Textarea} app-textarea`}
                        value={item.hazard}
                        onFocus={() => setActiveEditor({ planId: item.id, field: 'expectedRisk' })}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActiveEditor((current) =>
                              current?.planId === item.id && current.field === 'expectedRisk'
                                ? null
                                : current,
                            );
                          }
                        }}
                        onChange={(event) =>
                          updatePlanField(item.id, 'expectedRisk', event.target.value)
                        }
                      />
                      {activeEditor?.planId === item.id &&
                      activeEditor.field === 'expectedRisk' &&
                      recommendations.length > 0 ? (
                        <div
                          id={recommendationListId}
                          className={styles.doc8RecommendationList}
                          role="listbox"
                          style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
                        >
                          {recommendations.map((catalogItem) => (
                            <button
                              key={catalogItem.id}
                              type="button"
                              role="option"
                              aria-selected={false}
                              className={styles.doc8RecommendationButton}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectRecommendation(item.id, catalogItem)}
                            >
                              {buildRecommendationLabel(catalogItem, 'expectedRisk')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className={styles.doc8TdArea}>
                    <div
                      style={{ position: 'relative' }}
                      onBlur={(event) => handleEditorBlur(item.id, 'countermeasure', event)}
                    >
                      <textarea
                        rows={5}
                        className={`${styles.doc8Textarea} app-textarea`}
                        value={item.countermeasure}
                        onFocus={() =>
                          setActiveEditor({ planId: item.id, field: 'countermeasure' })
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActiveEditor((current) =>
                              current?.planId === item.id && current.field === 'countermeasure'
                                ? null
                                : current,
                            );
                          }
                        }}
                        onChange={(event) =>
                          updatePlanField(item.id, 'countermeasure', event.target.value)
                        }
                      />
                      {activeEditor?.planId === item.id &&
                      activeEditor.field === 'countermeasure' &&
                      recommendations.length > 0 ? (
                        <div
                          id={recommendationListId}
                          className={styles.doc8RecommendationList}
                          role="listbox"
                          style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
                        >
                          {recommendations.map((catalogItem) => (
                            <button
                              key={catalogItem.id}
                              type="button"
                              role="option"
                              aria-selected={false}
                              className={styles.doc8RecommendationButton}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectRecommendation(item.id, catalogItem)}
                            >
                              {buildRecommendationLabel(catalogItem, 'countermeasure')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className={styles.doc8TdAction}>
                    <div className={styles.doc8ActionStack}>
                      {isLastRow ? (
                        <button
                          type="button"
                          className={`${styles.doc8RowActionButton} ${styles.doc8RowActionAdd}`}
                          onClick={() =>
                            applyDocumentUpdate('doc8', 'manual', (current) => ({
                              ...current,
                              document8Plans: [...current.document8Plans, createFutureProcessRiskPlan()],
                            }))
                          }
                        >
                          행 추가
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={`${styles.doc8RowActionButton} ${styles.doc8RowActionRemove}`}
                        onClick={() =>
                          applyDocumentUpdate('doc8', 'manual', (current) => ({
                            ...current,
                            document8Plans:
                              current.document8Plans.length <= 1
                                ? current.document8Plans
                                : current.document8Plans.filter((plan) => plan.id !== item.id),
                          }))
                        }
                        disabled={session.document8Plans.length <= 1}
                      >
                        행 삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
