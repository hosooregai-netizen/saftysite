import operationalStyles from '@/components/site/OperationalReports.module.css';
import { QuarterlyDocumentInfoModal, QuarterlyTitleEditorModal } from './QuarterlyEditorModals';
import { QuarterlyFuturePlansSection } from './QuarterlyFuturePlansSection';
import { QuarterlyImplementationSection } from './QuarterlyImplementationSection';
import { QuarterlyOpsSection } from './QuarterlyOpsSection';
import { QuarterlySiteSnapshotSection } from './QuarterlySiteSnapshotSection';
import { QuarterlySourceSelectionModal } from './QuarterlySourceSelectionModal';
import { QuarterlySourceSelectionSection } from './QuarterlySourceSelectionSection';
import { QuarterlyStatsSection } from './QuarterlyStatsSection';
import { QuarterlySummaryCards } from './QuarterlySummaryCards';
import { QuarterlySummaryToolbar } from './QuarterlySummaryToolbar';
import { getQuarterSelectionTarget } from './quarterlyReportHelpers';
import type { QuarterlyReportEditorProps } from './types';
import { useQuarterlyReportEditor } from './useQuarterlyReportEditor';

export function QuarterlyReportEditor(props: QuarterlyReportEditorProps) {
  const editor = useQuarterlyReportEditor(props);

  return (
    <section className={`${operationalStyles.sectionCard} ${operationalStyles.editorShell}`}>
      <QuarterlySummaryToolbar
        draft={editor.draft}
        isGeneratingDocument={editor.isGeneratingDocument}
        isGeneratingHwpx={editor.isGeneratingHwpx}
        isGeneratingPdf={editor.isGeneratingPdf}
        onDownloadWord={editor.handleDownloadWord}
        onDownloadPdf={editor.handleDownloadPdf}
        onOpenDocumentInfo={() => editor.setDocumentInfoOpen(true)}
        onOpenTitleEditor={editor.handleOpenTitleEditor}
      />
      <QuarterlySummaryCards
        draft={editor.draft}
        error={props.error}
        documentError={editor.documentError}
        notice={editor.notice}
      />
      <QuarterlySourceSelectionSection
        periodStartDate={editor.draft.periodStartDate}
        periodEndDate={editor.draft.periodEndDate}
        selectedQuarter={String(getQuarterSelectionTarget(editor.draft).quarter)}
        sourceReports={editor.availableSourceReports}
        error={editor.error}
        loading={editor.sourceReportsLoading}
        selectedSourceSet={editor.selectedSourceSet}
        hasPendingSelectionChanges={editor.hasPendingSelectionChanges}
        onChangePeriod={editor.handlePeriodChange}
        onChangeQuarter={editor.handleQuarterChange}
        onOpenSelector={() => editor.setSourceModalOpen(true)}
        onRecalculate={editor.handleApplySourceSelection}
      />
      <QuarterlySourceSelectionModal
        open={editor.sourceModalOpen}
        sourceReports={editor.availableSourceReports}
        error={editor.error}
        loading={editor.sourceReportsLoading}
        selectedSourceSet={editor.selectedSourceSet}
        selectedSourceReportKeys={editor.selectedSourceReportKeys}
        hasPendingSelectionChanges={editor.hasPendingSelectionChanges}
        onClose={() => editor.setSourceModalOpen(false)}
        onToggleSourceReport={editor.handleToggleSourceReport}
        onSelectAll={editor.selectAllSourceReports}
        onClearSelection={editor.clearSelectedSourceReports}
        onRecalculate={async () => {
          const didApply = await editor.handleApplySourceSelection();
          if (didApply) {
            editor.setSourceModalOpen(false);
          }
        }}
      />
      <QuarterlySiteSnapshotSection
        draft={editor.draft}
        onChange={editor.updateSiteSnapshotField}
      />
      <QuarterlyStatsSection draft={editor.draft} />
      <QuarterlyImplementationSection
        rows={editor.draft.implementationRows}
        onChange={editor.handleImplementationRowChange}
        onAdd={editor.addImplementationRow}
        onRemove={editor.removeImplementationRow}
      />
      <QuarterlyFuturePlansSection
        hazardCountermeasureCatalog={editor.hazardCountermeasureCatalog}
        plans={editor.draft.futurePlans}
        onAdd={editor.addFuturePlan}
        onChange={editor.updateFuturePlans}
      />
      <QuarterlyOpsSection
        draft={editor.draft}
        loading={editor.opsLoading}
        error={editor.opsError}
      />
      <QuarterlyDocumentInfoModal
        open={editor.documentInfoOpen}
        draft={editor.draft}
        onChange={editor.updateDocumentInfo}
        onClose={() => editor.setDocumentInfoOpen(false)}
      />
      <QuarterlyTitleEditorModal
        open={editor.titleEditorOpen}
        titleDraft={editor.titleDraft}
        onClose={editor.handleCloseTitleEditor}
        onApply={editor.handleApplyTitle}
        onChangeTitleDraft={editor.setTitleDraft}
      />
    </section>
  );
}
