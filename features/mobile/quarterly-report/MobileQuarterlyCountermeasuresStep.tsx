'use client';

import styles from '@/features/mobile/components/MobileShell.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { MobileQuarterlyOpsAsset } from './types';

interface MobileQuarterlyCountermeasuresStepProps {
  draft: QuarterlySummaryReport;
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

export function MobileQuarterlyCountermeasuresStep({
  draft,
  isOpsAssetsLoading,
  isOpsAssetsRefreshing,
  opsAssets,
  onAddFuturePlan,
  onRemoveFuturePlan,
  onSelectOpsAsset,
  onUpdateFuturePlan,
}: MobileQuarterlyCountermeasuresStepProps) {
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
          {draft.futurePlans.map((plan, index) => (
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
                  <textarea
                    className={`app-textarea ${styles.mobileFuturePlanTextarea}`}
                    rows={4}
                    value={plan.hazard || plan.processName}
                    placeholder="위험요인을 입력해 주세요."
                    onChange={(event) =>
                      onUpdateFuturePlan(plan.id, {
                        hazard: event.target.value,
                        processName: '',
                        source: 'manual',
                      })
                    }
                  />
                </label>
                <label className={styles.mobileEditorFieldGroup}>
                  <span className={styles.mobileEditorFieldLabel}>안전대책</span>
                  <textarea
                    className={`app-textarea ${styles.mobileFuturePlanTextarea}`}
                    rows={4}
                    value={plan.countermeasure}
                    placeholder="안전대책을 입력해 주세요."
                    onChange={(event) =>
                      onUpdateFuturePlan(plan.id, {
                        countermeasure: event.target.value,
                        note: '',
                        source: 'manual',
                      })
                    }
                  />
                </label>
              </div>
            </article>
          ))}
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
