'use client';

import styles from '@/features/mobile/components/MobileShell.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { MobileQuarterlyAnalysisStep } from './MobileQuarterlyAnalysisStep';
import { MobileQuarterlyCountermeasuresStep } from './MobileQuarterlyCountermeasuresStep';
import { MobileQuarterlyImplementationStep } from './MobileQuarterlyImplementationStep';
import { MobileQuarterlyOverviewStep } from './MobileQuarterlyOverviewStep';
import { MobileQuarterlySnapshotStep } from './MobileQuarterlySnapshotStep';
import type { MobileQuarterlyOpsAsset, MobileQuarterlySourceReport, MobileQuarterlyStepId } from './types';

interface MobileQuarterlyStepContentProps {
  activeStep: MobileQuarterlyStepId;
  documentNotice: string | null;
  draft: QuarterlySummaryReport;
  isOpsAssetsLoading: boolean;
  isOpsAssetsRefreshing: boolean;
  isSourceLoading: boolean;
  loadError: string | null;
  mutationError: string | null;
  opsAssets: MobileQuarterlyOpsAsset[];
  saveNotice: string | null;
  selectedQuarter: string;
  selectedSourceKeys: string[];
  sourceError: string | null;
  sourceNotice: string | null;
  sourceReports: MobileQuarterlySourceReport[];
  onAddFuturePlan: () => void;
  onAddImplementationRow: () => void;
  onApplySourceSelection: () => void;
  onChangeTitle: (value: string) => void;
  onOpenSourceModal: () => void;
  onPeriodFieldChange: (key: 'periodStartDate' | 'periodEndDate', value: string) => void;
  onQuarterChange: (value: string) => void;
  onRemoveFuturePlan: (planId: string) => void;
  onRemoveImplementationRow: (sessionId: string) => void;
  onSelectOpsAsset: (assetId: string) => void;
  onUpdateFuturePlan: (
    planId: string,
    patch: Partial<QuarterlySummaryReport['futurePlans'][number]>,
  ) => void;
  onUpdateImplementationRow: (
    sessionId: string,
    field: keyof QuarterlySummaryReport['implementationRows'][number],
    value: string,
  ) => void;
  onUpdateSnapshotField: (field: keyof QuarterlySummaryReport['siteSnapshot'], value: string) => void;
}

export function MobileQuarterlyStepContent({
  activeStep,
  documentNotice,
  draft,
  isOpsAssetsLoading,
  isOpsAssetsRefreshing,
  isSourceLoading,
  loadError,
  mutationError,
  opsAssets,
  saveNotice,
  selectedQuarter,
  selectedSourceKeys,
  sourceError,
  sourceNotice,
  sourceReports,
  onAddFuturePlan,
  onAddImplementationRow,
  onApplySourceSelection,
  onChangeTitle,
  onOpenSourceModal,
  onPeriodFieldChange,
  onQuarterChange,
  onRemoveFuturePlan,
  onRemoveImplementationRow,
  onSelectOpsAsset,
  onUpdateFuturePlan,
  onUpdateImplementationRow,
  onUpdateSnapshotField,
}: MobileQuarterlyStepContentProps) {
  return (
    <div style={{ display: 'grid', gap: '14px', padding: '14px' }}>
      {loadError ? <div className={styles.errorNotice}>{loadError}</div> : null}
      {mutationError ? <div className={styles.errorNotice}>{mutationError}</div> : null}
      {sourceError ? <div className={styles.errorNotice}>{sourceError}</div> : null}
      {saveNotice ? <div className={styles.inlineNotice}>{saveNotice}</div> : null}
      {documentNotice ? <div className={styles.inlineNotice}>{documentNotice}</div> : null}

      {activeStep === 'overview' ? (
        <MobileQuarterlyOverviewStep
          draft={draft}
          isSourceLoading={isSourceLoading}
          selectedQuarter={selectedQuarter}
          selectedSourceKeys={selectedSourceKeys}
          sourceNotice={sourceNotice}
          sourceReports={sourceReports}
          onApplySourceSelection={onApplySourceSelection}
          onChangeTitle={onChangeTitle}
          onOpenSourceModal={onOpenSourceModal}
          onPeriodFieldChange={onPeriodFieldChange}
          onQuarterChange={onQuarterChange}
        />
      ) : null}
      {activeStep === 'snapshot' ? (
        <MobileQuarterlySnapshotStep draft={draft} onUpdateField={onUpdateSnapshotField} />
      ) : null}
      {activeStep === 'analysis' ? <MobileQuarterlyAnalysisStep draft={draft} /> : null}
      {activeStep === 'implementation' ? (
        <MobileQuarterlyImplementationStep
          draft={draft}
          onAddRow={onAddImplementationRow}
          onRemoveRow={onRemoveImplementationRow}
          onUpdateRow={onUpdateImplementationRow}
        />
      ) : null}
      {activeStep === 'countermeasures' ? (
        <MobileQuarterlyCountermeasuresStep
          draft={draft}
          isOpsAssetsLoading={isOpsAssetsLoading}
          isOpsAssetsRefreshing={isOpsAssetsRefreshing}
          opsAssets={opsAssets}
          onAddFuturePlan={onAddFuturePlan}
          onRemoveFuturePlan={onRemoveFuturePlan}
          onSelectOpsAsset={onSelectOpsAsset}
          onUpdateFuturePlan={onUpdateFuturePlan}
        />
      ) : null}
    </div>
  );
}
