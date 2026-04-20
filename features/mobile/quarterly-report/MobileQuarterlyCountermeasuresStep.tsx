'use client';

import { useState, type FocusEvent } from 'react';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';
import styles from '@/features/mobile/components/MobileShell.module.css';
import {
  applyHazardCountermeasureSelectionToFuturePlan,
  clearHazardCountermeasureSelectionFromFuturePlan,
  getHazardCountermeasureFieldText,
  getHazardCountermeasureRecommendations,
} from '@/lib/hazardCountermeasureCatalog';
import type { SafetyHazardCountermeasureCatalogItem } from '@/types/backend';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { MobileQuarterlyOpsAsset } from './types';

type QuarterlyMatchField = 'expectedRisk' | 'countermeasure';

interface MobileQuarterlyCountermeasuresStepProps {
  draft: QuarterlySummaryReport;
  hazardCountermeasureCatalog: SafetyHazardCountermeasureCatalogItem[];
  isOpsAssetsLoading: boolean;
  isOpsAssetsRefreshing: boolean;
  opsAssets: MobileQuarterlyOpsAsset[];
  onAddFuturePlan: () => void;
  onRemoveFuturePlan: (planId: string) => void;
  onSelectOpsAsset: (assetId: string) => void;
  onUpdateFuturePlan: (
    planId: string,
    patch: Partial<QuarterlySummaryReport['futurePlans'][number]>,
  ) => void;
}

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

export function MobileQuarterlyCountermeasuresStep({
  draft,
  hazardCountermeasureCatalog,
  isOpsAssetsLoading,
  isOpsAssetsRefreshing,
  opsAssets,
  onAddFuturePlan,
  onRemoveFuturePlan,
  onSelectOpsAsset,
  onUpdateFuturePlan,
}: MobileQuarterlyCountermeasuresStepProps) {
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
    <section className={styles.mobileEditorCard}>
      <div className={styles.mobileImplementationListHeader}>
        <div className={styles.mobileImplementationListTitle}>4. 향후 공정 유해위험작업 안전대책</div>
        <button
          type="button"
          className={`app-button app-button-secondary ${styles.mobileImplementationAddButton}`}
          onClick={onAddFuturePlan}
        >
          행 추가
        </button>
      </div>
      {draft.futurePlans.length > 0 ? (
        <div className={styles.mobileFuturePlanCardList}>
          {draft.futurePlans.map((plan, index) => {
            const recommendationQuery =
              activeEditor?.planId === plan.id
                ? activeEditor.field === 'expectedRisk'
                  ? plan.hazard || plan.processName
                  : plan.countermeasure
                : '';
            const recommendations =
              activeEditor?.planId === plan.id
                ? getHazardCountermeasureRecommendations(
                    hazardCountermeasureCatalog,
                    recommendationQuery,
                    activeEditor.field,
                    { excludeId: plan.hazardCountermeasureItemId },
                  )
                : [];

            return (
              <article key={plan.id} className={styles.mobileFuturePlanCard}>
                <div className={styles.mobileImplementationItemTop}>
                  <span className={styles.mobileImplementationItemBadge}>{`행 ${index + 1}`}</span>
                  <button
                    type="button"
                    className={`app-button app-button-secondary ${styles.mobileFuturePlanDeleteButton}`}
                    onClick={() => onRemoveFuturePlan(plan.id)}
                  >
                    삭제
                  </button>
                </div>
                <div className={styles.mobileEditorFieldStack}>
                  <label className={styles.mobileEditorFieldGroup}>
                    <span className={styles.mobileEditorFieldLabel}>위험요인</span>
                    <div
                      className={styles.mobileDoc8ProcessStack}
                      onBlur={(event) => handleBlur(plan.id, 'expectedRisk', event)}
                    >
                      <textarea
                        className={`app-textarea ${styles.mobileFuturePlanTextarea}`}
                        rows={4}
                        value={plan.hazard || plan.processName}
                        placeholder="위험요인을 입력해 주세요"
                        onFocus={() =>
                          setActiveEditor({ planId: plan.id, field: 'expectedRisk' })
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActiveEditor((current) =>
                              current?.planId === plan.id &&
                              current.field === 'expectedRisk'
                                ? null
                                : current,
                            );
                          }
                        }}
                        onChange={(event) =>
                          onUpdateFuturePlan(plan.id, {
                            ...clearHazardCountermeasureSelectionFromFuturePlan(plan),
                            hazard: event.target.value,
                          })
                        }
                      />
                      {activeEditor?.planId === plan.id &&
                      activeEditor.field === 'expectedRisk' &&
                      recommendations.length > 0 ? (
                        <div
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
                              onClick={() => {
                                onUpdateFuturePlan(
                                  plan.id,
                                  applyHazardCountermeasureSelectionToFuturePlan(plan, item),
                                );
                                setActiveEditor(null);
                              }}
                            >
                              {buildRecommendationLabel(item, 'expectedRisk')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </label>
                  <label className={styles.mobileEditorFieldGroup}>
                    <span className={styles.mobileEditorFieldLabel}>안전대책</span>
                    <div
                      className={styles.mobileDoc8ProcessStack}
                      onBlur={(event) => handleBlur(plan.id, 'countermeasure', event)}
                    >
                      <textarea
                        className={`app-textarea ${styles.mobileFuturePlanTextarea}`}
                        rows={4}
                        value={plan.countermeasure}
                        placeholder="안전대책을 입력해 주세요"
                        onFocus={() =>
                          setActiveEditor({ planId: plan.id, field: 'countermeasure' })
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActiveEditor((current) =>
                              current?.planId === plan.id &&
                              current.field === 'countermeasure'
                                ? null
                                : current,
                            );
                          }
                        }}
                        onChange={(event) =>
                          onUpdateFuturePlan(plan.id, {
                            ...clearHazardCountermeasureSelectionFromFuturePlan(plan),
                            countermeasure: event.target.value,
                            note: '',
                          })
                        }
                      />
                      {activeEditor?.planId === plan.id &&
                      activeEditor.field === 'countermeasure' &&
                      recommendations.length > 0 ? (
                        <div
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
                              onClick={() => {
                                onUpdateFuturePlan(
                                  plan.id,
                                  applyHazardCountermeasureSelectionToFuturePlan(plan, item),
                                );
                                setActiveEditor(null);
                              }}
                            >
                              {buildRecommendationLabel(item, 'countermeasure')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.mobileFuturePlanEmpty}>등록된 위험요인 및 안전대책이 없습니다.</div>
      )}

      <label className={styles.mobileEditorFieldGroup}>
        <span className={styles.mobileEditorFieldLabel}>OPS 자료</span>
        <select
          className="app-select"
          disabled={isOpsAssetsLoading && opsAssets.length === 0}
          value={draft.opsAssetId}
          onChange={(event) => onSelectOpsAsset(event.target.value)}
        >
          <option value="">
            {isOpsAssetsLoading && opsAssets.length === 0 ? 'OPS 자료 불러오는 중...' : 'OPS 자료 없음'}
          </option>
          {opsAssets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.title}
            </option>
          ))}
        </select>
      </label>
      {isOpsAssetsRefreshing ? <p className={styles.inlineNotice}>OPS 자료 최신 데이터를 확인 중입니다.</p> : null}
      {draft.opsAssetFileUrl ? (
        <a href={draft.opsAssetFileUrl} target="_blank" rel="noreferrer">
          OPS 자료 열기
        </a>
      ) : null}
    </section>
  );
}
