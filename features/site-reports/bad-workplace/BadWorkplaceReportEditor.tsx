import operationalStyles from '@/components/site/OperationalReports.module.css';
import { BadWorkplaceSiteSnapshotSection } from './BadWorkplaceSiteSnapshotSection';
import { BadWorkplaceSourceSelectionModal } from './BadWorkplaceSourceSelectionModal';
import { BadWorkplaceSourceSelectionSection } from './BadWorkplaceSourceSelectionSection';
import { BadWorkplaceSummaryToolbar } from './BadWorkplaceSummaryToolbar';
import type { BadWorkplaceReportEditorProps } from './types';
import { useBadWorkplaceReportEditor } from './useBadWorkplaceReportEditor';
import { BadWorkplaceViolationsSection } from './BadWorkplaceViolationsSection';

export function BadWorkplaceReportEditor(props: BadWorkplaceReportEditorProps) {
  const editor = useBadWorkplaceReportEditor(props);

  return (
    <section
      className={`${operationalStyles.sectionCard} ${operationalStyles.editorShell}`}
    >
      <BadWorkplaceSummaryToolbar
        title={editor.draft.title}
        isGeneratingHwpx={editor.isGeneratingHwpx}
        isSaving={props.isSaving}
        onDownloadHwpx={() => void editor.handleDownloadHwpx()}
        onSave={() => void editor.handleSave()}
      />

      {props.error ? <div className={operationalStyles.bannerError}>{props.error}</div> : null}
      {editor.documentError ? (
        <div className={operationalStyles.bannerError}>{editor.documentError}</div>
      ) : null}
      {editor.notice ? <div className={operationalStyles.bannerInfo}>{editor.notice}</div> : null}
      <p className={operationalStyles.reportCardDescription}>
        현재 초안 기준은 {editor.sourceModeLabel}입니다.
      </p>

      <BadWorkplaceSourceSelectionSection
        draft={editor.draft}
        selectedSession={editor.selectedSession}
        siteSessions={editor.siteSessions}
        onChangeSourceMode={editor.handleSourceModeChange}
        onOpenSelector={() => editor.setSourceModalOpen(true)}
      />
      <BadWorkplaceSourceSelectionModal
        open={editor.sourceModalOpen}
        selectedSessionId={editor.selectedSession?.id ?? null}
        siteSessions={editor.siteSessions}
        onClose={() => editor.setSourceModalOpen(false)}
        onSelectSession={editor.handleSourceSessionChange}
      />
      <BadWorkplaceSiteSnapshotSection
        draft={editor.draft}
        onUpdateDraft={editor.updateDraft}
        onUpdateSiteSnapshot={editor.updateSiteSnapshot}
      />
      <BadWorkplaceViolationsSection
        draft={editor.draft}
        onUpdateViolation={editor.updateViolation}
      />
    </section>
  );
}
