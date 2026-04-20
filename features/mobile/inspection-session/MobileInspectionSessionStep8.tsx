'use client';

import { useMemo, useState, type FocusEvent } from 'react';
import { createFutureProcessRiskPlan } from '@/constants/inspectionSession/itemFactory';
import { FUTURE_PROCESS_LIBRARY } from '@/components/session/workspace/constants';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import styles from '@/features/mobile/components/MobileShell.module.css';
import {
  applyHazardCountermeasureSelectionToFuturePlan,
  buildHazardCountermeasureFallbackCatalog,
  clearHazardCountermeasureSelectionFromFuturePlan,
  getHazardCountermeasureFieldText,
  getHazardCountermeasureRecommendations,
  type HazardCountermeasureCatalogMatchField,
} from '@/lib/hazardCountermeasureCatalog';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;
type Doc8MatchField = Extract<
  HazardCountermeasureCatalogMatchField,
  'title' | 'expectedRisk' | 'countermeasure'
>;

interface MobileInspectionSessionStep8Props {
  activeDoc8PlanId: string | null;
  handleDoc8ProcessBlur: (planId: string, event: FocusEvent<HTMLDivElement>) => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
  setActiveDoc8PlanId: React.Dispatch<React.SetStateAction<string | null>>;
  updateDoc8ProcessPlan: (planId: string, nextProcessName: string) => void;
}

function buildRecommendationLabel(
  item: InspectionScreenController['derivedData']['hazardCountermeasureCatalog'][number],
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

export function MobileInspectionSessionStep8({
  activeDoc8PlanId,
  handleDoc8ProcessBlur,
  screen,
  session,
  setActiveDoc8PlanId,
  updateDoc8ProcessPlan,
}: MobileInspectionSessionStep8Props) {
  const [activeField, setActiveField] = useState<Doc8MatchField>('title');
  const recommendationSource = useMemo(
    () =>
      screen.derivedData.hazardCountermeasureCatalog.length > 0
        ? screen.derivedData.hazardCountermeasureCatalog
        : buildHazardCountermeasureFallbackCatalog(FUTURE_PROCESS_LIBRARY),
    [screen.derivedData.hazardCountermeasureCatalog],
  );

  const updatePlanField = (planId: string, field: Doc8MatchField, value: string) => {
    if (field === 'title') {
      updateDoc8ProcessPlan(planId, value);
      return;
    }

    screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
      ...current,
      document8Plans: current.document8Plans.map((item) => {
        if (item.id !== planId) {
          return item;
        }

        const nextPlan = clearHazardCountermeasureSelectionFromFuturePlan(item);
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
    screen.applyDocumentUpdate('doc8', 'api', (current) => ({
      ...current,
      document8Plans: current.document8Plans.map((plan) =>
        plan.id === planId ? applyHazardCountermeasureSelectionToFuturePlan(plan, item) : plan,
      ),
    }));
    setActiveDoc8PlanId(null);
  };

  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>향후 진행공정 위험요인</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {session.document8Plans.map((plan, index) => {
            const recommendationQuery =
              activeDoc8PlanId === plan.id
                ? activeField === 'title'
                  ? plan.processName
                  : activeField === 'expectedRisk'
                    ? plan.hazard
                    : plan.countermeasure
                : '';
            const recommendations =
              activeDoc8PlanId === plan.id
                ? getHazardCountermeasureRecommendations(
                    recommendationSource,
                    recommendationQuery,
                    activeField,
                    { excludeId: plan.hazardCountermeasureItemId },
                  )
                : [];

            return (
              <article key={plan.id} className={styles.mobileEditorCard}>
                <div className={styles.mobileEditorCardHeader}>
                  <span className={styles.mobileEditorCardTitle}>진행공정 {index + 1}</span>
                  <button
                    type="button"
                    className={styles.mobileEditorCardAction}
                    onClick={() => {
                      screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                        ...current,
                        document8Plans: current.document8Plans.filter((item) => item.id !== plan.id),
                      }));
                    }}
                  >
                    삭제
                  </button>
                </div>
                <div className={styles.mobileEditorFieldStack}>
                  <div className={styles.mobileEditorFieldGroup}>
                    <span className={styles.mobileEditorFieldLabel}>공정명</span>
                    <div
                      className={styles.mobileDoc8ProcessStack}
                      onBlur={(event) => handleDoc8ProcessBlur(plan.id, event)}
                    >
                      <input
                        autoComplete="off"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-controls={`mobile-doc8-recommendations-${plan.id}-${activeField}`}
                        aria-expanded={activeDoc8PlanId === plan.id && activeField === 'title'}
                        aria-haspopup="listbox"
                        className="app-input"
                        value={plan.processName}
                        onFocus={() => {
                          setActiveField('title');
                          setActiveDoc8PlanId(plan.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActiveDoc8PlanId((current) => (current === plan.id ? null : current));
                          }
                        }}
                        onChange={(event) => {
                          setActiveField('title');
                          setActiveDoc8PlanId(plan.id);
                          updatePlanField(plan.id, 'title', event.target.value);
                        }}
                        placeholder="공정명 입력"
                        style={{ width: '100%' }}
                      />
                      {activeDoc8PlanId === plan.id &&
                      activeField === 'title' &&
                      recommendations.length > 0 ? (
                        <div
                          id={`mobile-doc8-recommendations-${plan.id}-${activeField}`}
                          className={workspaceStyles.doc8RecommendationList}
                          role="listbox"
                        >
                          {recommendations.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              role="option"
                              aria-selected={false}
                              className={workspaceStyles.doc8RecommendationButton}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectRecommendation(plan.id, item)}
                            >
                              {buildRecommendationLabel(item, 'title')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.mobileEditorFieldGroup}>
                    <span className={styles.mobileEditorFieldLabel}>위험요인</span>
                    <div
                      className={styles.mobileDoc8ProcessStack}
                      onBlur={(event) => handleDoc8ProcessBlur(plan.id, event)}
                    >
                      <textarea
                        className={`app-input ${styles.mobileEditorTextareaCompact}`}
                        value={plan.hazard}
                        onFocus={() => {
                          setActiveField('expectedRisk');
                          setActiveDoc8PlanId(plan.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActiveDoc8PlanId((current) => (current === plan.id ? null : current));
                          }
                        }}
                        onChange={(event) => {
                          setActiveField('expectedRisk');
                          setActiveDoc8PlanId(plan.id);
                          updatePlanField(plan.id, 'expectedRisk', event.target.value);
                        }}
                        placeholder="위험요인"
                        style={{ width: '100%' }}
                      />
                      {activeDoc8PlanId === plan.id &&
                      activeField === 'expectedRisk' &&
                      recommendations.length > 0 ? (
                        <div
                          id={`mobile-doc8-recommendations-${plan.id}-${activeField}`}
                          className={workspaceStyles.doc8RecommendationList}
                          role="listbox"
                          style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
                        >
                          {recommendations.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              role="option"
                              aria-selected={false}
                              className={workspaceStyles.doc8RecommendationButton}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectRecommendation(plan.id, item)}
                            >
                              {buildRecommendationLabel(item, 'expectedRisk')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.mobileEditorFieldGroup}>
                    <span className={styles.mobileEditorFieldLabel}>안전대책</span>
                    <div
                      className={styles.mobileDoc8ProcessStack}
                      onBlur={(event) => handleDoc8ProcessBlur(plan.id, event)}
                    >
                      <textarea
                        className={`app-input ${styles.mobileEditorTextareaCompact}`}
                        value={plan.countermeasure}
                        onFocus={() => {
                          setActiveField('countermeasure');
                          setActiveDoc8PlanId(plan.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActiveDoc8PlanId((current) => (current === plan.id ? null : current));
                          }
                        }}
                        onChange={(event) => {
                          setActiveField('countermeasure');
                          setActiveDoc8PlanId(plan.id);
                          updatePlanField(plan.id, 'countermeasure', event.target.value);
                        }}
                        placeholder="안전대책"
                        style={{ width: '100%' }}
                      />
                      {activeDoc8PlanId === plan.id &&
                      activeField === 'countermeasure' &&
                      recommendations.length > 0 ? (
                        <div
                          id={`mobile-doc8-recommendations-${plan.id}-${activeField}`}
                          className={workspaceStyles.doc8RecommendationList}
                          role="listbox"
                          style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
                        >
                          {recommendations.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              role="option"
                              aria-selected={false}
                              className={workspaceStyles.doc8RecommendationButton}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectRecommendation(plan.id, item)}
                            >
                              {buildRecommendationLabel(item, 'countermeasure')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          <button
            type="button"
            className="app-button app-button-secondary"
            style={{ width: '100%' }}
            onClick={() => {
              screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                ...current,
                document8Plans: [...current.document8Plans, createFutureProcessRiskPlan()],
              }));
            }}
          >
            + 공정 추가
          </button>
        </div>
      </div>
    </section>
  );
}
