'use client';

import type { FocusEvent } from 'react';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { createFutureProcessRiskPlan } from '@/constants/inspectionSession/itemFactory';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';
import styles from '@/features/mobile/components/MobileShell.module.css';
import { getDoc8ProcessRecommendations } from './mobileInspectionSessionHelpers';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep8Props {
  activeDoc8PlanId: string | null;
  handleDoc8ProcessBlur: (planId: string, event: FocusEvent<HTMLDivElement>) => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
  setActiveDoc8PlanId: React.Dispatch<React.SetStateAction<string | null>>;
  updateDoc8ProcessPlan: (planId: string, nextProcessName: string) => void;
}

export function MobileInspectionSessionStep8({
  activeDoc8PlanId,
  handleDoc8ProcessBlur,
  screen,
  session,
  setActiveDoc8PlanId,
  updateDoc8ProcessPlan,
}: MobileInspectionSessionStep8Props) {
  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>향후 진행공정 위험요인</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {session.document8Plans.map((plan, index) => (
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
                  <div className={styles.mobileDoc8ProcessStack} onBlur={(event) => handleDoc8ProcessBlur(plan.id, event)}>
                    <input
                      autoComplete="off"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-controls={`mobile-doc8-recommendations-${plan.id}`}
                      aria-expanded={activeDoc8PlanId === plan.id}
                      aria-haspopup="listbox"
                      className="app-input"
                      value={plan.processName}
                      onFocus={() => setActiveDoc8PlanId(plan.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          setActiveDoc8PlanId((current) => (current === plan.id ? null : current));
                        }
                      }}
                      onChange={(event) => {
                        setActiveDoc8PlanId(plan.id);
                        updateDoc8ProcessPlan(plan.id, event.target.value);
                      }}
                      placeholder="공정명 (예: 철골 자재 반입)"
                      style={{ width: '100%' }}
                    />
                    {activeDoc8PlanId === plan.id && getDoc8ProcessRecommendations(plan.processName).length > 0 ? (
                      <div id={`mobile-doc8-recommendations-${plan.id}`} className={workspaceStyles.doc8RecommendationList} role="listbox">
                        {getDoc8ProcessRecommendations(plan.processName).map((item) => {
                          const isSelected = item.processName === plan.processName;
                          return (
                            <button
                              key={item.processName}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              className={`${workspaceStyles.doc8RecommendationButton} ${isSelected ? workspaceStyles.doc8RecommendationButtonActive : ''}`}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                updateDoc8ProcessPlan(plan.id, item.processName);
                                setActiveDoc8PlanId(null);
                              }}
                            >
                              {item.processName}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className={styles.mobileEditorFieldGroup}>
                  <span className={styles.mobileEditorFieldLabel}>위험요인</span>
                  <textarea className={`app-input ${styles.mobileEditorTextareaCompact}`} value={plan.hazard} onChange={(event) => screen.applyDocumentUpdate('doc8', 'manual', (current) => ({ ...current, document8Plans: current.document8Plans.map((item) => item.id === plan.id ? { ...item, hazard: event.target.value } : item) }))} placeholder="위험요인" style={{ width: '100%' }} />
                </div>
                <div className={styles.mobileEditorFieldGroup}>
                  <span className={styles.mobileEditorFieldLabel}>안전대책</span>
                  <textarea className={`app-input ${styles.mobileEditorTextareaCompact}`} value={plan.countermeasure} onChange={(event) => screen.applyDocumentUpdate('doc8', 'manual', (current) => ({ ...current, document8Plans: current.document8Plans.map((item) => item.id === plan.id ? { ...item, countermeasure: event.target.value } : item) }))} placeholder="안전대책" style={{ width: '100%' }} />
                </div>
              </div>
            </article>
          ))}
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
