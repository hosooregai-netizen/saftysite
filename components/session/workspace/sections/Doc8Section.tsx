'use client';

import { useState, type FocusEvent } from 'react';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { FUTURE_PROCESS_LIBRARY } from '@/components/session/workspace/constants';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';
import { createFutureProcessRiskPlan } from '@/constants/inspectionSession';

const MAX_DOC8_RECOMMENDATIONS = 6;

function normalizeProcessName(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

function findProcessMatch(value: string) {
  const normalizedValue = normalizeProcessName(value);
  if (!normalizedValue) {
    return null;
  }

  return (
    FUTURE_PROCESS_LIBRARY.find(
      (libraryItem) => normalizeProcessName(libraryItem.processName) === normalizedValue,
    ) ?? null
  );
}

function getProcessRecommendations(value: string) {
  const normalizedValue = normalizeProcessName(value);
  const matchingItems = normalizedValue
    ? FUTURE_PROCESS_LIBRARY.filter((libraryItem) =>
        normalizeProcessName(libraryItem.processName).includes(normalizedValue),
      )
    : FUTURE_PROCESS_LIBRARY;

  return matchingItems.slice(0, MAX_DOC8_RECOMMENDATIONS);
}

export default function Doc8Section({
  applyDocumentUpdate,
  session,
}: Pick<HazardStatsSectionProps, 'applyDocumentUpdate' | 'session'>) {
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const updateProcessPlan = (planId: string, nextProcessName: string) => {
    const matched = findProcessMatch(nextProcessName);

    applyDocumentUpdate('doc8', matched ? 'api' : 'manual', (current) => ({
      ...current,
      document8Plans: current.document8Plans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              processName: nextProcessName,
              hazard: matched?.hazard ?? plan.hazard,
              countermeasure: matched?.countermeasure ?? plan.countermeasure,
              source: matched ? 'api' : 'manual',
            }
          : plan,
      ),
    }));
  };

  const handleProcessCellBlur = (planId: string, event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setActivePlanId((current) => (current === planId ? null : current));
    }
  };

  return (
    <div className={styles.sectionStack}>
      <div className={styles.workPlanSection}>
        <table className={`${styles.workPlanTable} ${styles.doc8FutureTable}`}>
          <caption className={styles.doc8CaptionWrap}>
            <span className={styles.doc8CaptionTitle}>향후 주요 작업공정 · 위험요인 · 안전대책</span>
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
              const recommendationListId = `doc8-process-recommendations-${item.id}`;
              const recommendations =
                activePlanId === item.id ? getProcessRecommendations(item.processName) : [];
              const visibleRecommendations = recommendations.filter(
                (libraryItem) => libraryItem.processName !== item.processName,
              );
              const showRecommendations = visibleRecommendations.length > 0;

              return (
                <tr key={item.id}>
                  <td className={styles.doc8TdProcess}>
                    <div
                      className={styles.doc8ProcessCellStack}
                      onBlur={(event) => handleProcessCellBlur(item.id, event)}
                    >
                      <input
                        autoComplete="off"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-controls={recommendationListId}
                        aria-expanded={showRecommendations}
                        aria-haspopup="listbox"
                        className={`${styles.doc8ProcessInput} app-input`}
                        value={item.processName}
                        placeholder="향후 작업공정 입력"
                        onFocus={() => setActivePlanId(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActivePlanId((current) => (current === item.id ? null : current));
                          }
                        }}
                        onChange={(event) => {
                          setActivePlanId(item.id);
                          updateProcessPlan(item.id, event.target.value);
                        }}
                      />
                      {activePlanId === item.id && showRecommendations ? (
                        <div
                          id={recommendationListId}
                          className={styles.doc8RecommendationList}
                          role="listbox"
                        >
                          {visibleRecommendations.map((libraryItem) => {
                            return (
                              <button
                                key={libraryItem.processName}
                                type="button"
                                role="option"
                                aria-selected={false}
                                className={styles.doc8RecommendationButton}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                  updateProcessPlan(item.id, libraryItem.processName);
                                  setActivePlanId(null);
                                }}
                              >
                                {libraryItem.processName}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className={styles.doc8TdArea}>
                    <textarea
                      rows={5}
                      className={`${styles.doc8Textarea} app-textarea`}
                      value={item.hazard}
                      onChange={(event) =>
                        applyDocumentUpdate('doc8', 'manual', (current) => ({
                          ...current,
                          document8Plans: current.document8Plans.map((plan) =>
                            plan.id === item.id
                              ? { ...plan, hazard: event.target.value, source: 'manual' }
                              : plan,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td className={styles.doc8TdArea}>
                    <textarea
                      rows={5}
                      className={`${styles.doc8Textarea} app-textarea`}
                      value={item.countermeasure}
                      onChange={(event) =>
                        applyDocumentUpdate('doc8', 'manual', (current) => ({
                          ...current,
                          document8Plans: current.document8Plans.map((plan) =>
                            plan.id === item.id
                              ? { ...plan, countermeasure: event.target.value, source: 'manual' }
                              : plan,
                          ),
                        }))
                      }
                    />
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
