'use client';

import type { ComponentProps } from 'react';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { MailboxHeaderPanel } from './MailboxHeaderPanel';
import { MailboxReportPickerModal } from './MailboxReportPickerModal';
import { MailboxWorkspaceContent } from './MailboxWorkspaceContent';
import type {
  MailboxPanelProps,
  MailboxReportOption,
} from './mailboxPanelTypes';
import localStyles from './MailboxPanel.module.css';

interface MailboxPanelLayoutProps {
  activeError: string | null;
  activeNotice: string | null;
  adminSites: MailboxPanelProps['adminSites'];
  filteredReportOptions: MailboxReportOption[];
  filteredReportOptionsByKey: Map<string, MailboxReportOption>;
  mode: MailboxPanelProps['mode'];
  reportPickerLoading: boolean;
  reportPickerOpen: boolean;
  reportSearch: string;
  reportSiteFilter: string;
  setReportPickerOpen: (open: boolean) => void;
  setReportSearch: (value: string) => void;
  setReportSiteFilter: (value: string) => void;
  workspaceProps: ComponentProps<typeof MailboxWorkspaceContent>;
  headerProps: ComponentProps<typeof MailboxHeaderPanel>;
  onSelectReport: (reportKey: string) => void;
}

export function MailboxPanelLayout({
  activeError,
  activeNotice,
  adminSites = [],
  filteredReportOptions,
  filteredReportOptionsByKey,
  headerProps,
  mode,
  reportPickerLoading,
  reportPickerOpen,
  reportSearch,
  reportSiteFilter,
  setReportPickerOpen,
  setReportSearch,
  setReportSiteFilter,
  workspaceProps,
  onSelectReport,
}: MailboxPanelLayoutProps) {
  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <MailboxHeaderPanel {...headerProps} />

      <div className={`${styles.sectionBody} ${localStyles.shell}`}>
        {activeError ? <div className={styles.bannerError}>{activeError}</div> : null}
        {activeNotice ? <div className={styles.bannerNotice}>{activeNotice}</div> : null}
        <div className={`${localStyles.workspace} ${localStyles.workspaceSingle}`}>
          <div
            className={localStyles.mainColumn}
            data-mailbox-workspace={
              workspaceProps.showMailboxConnectGate ? undefined : 'true'
            }
          >
            <MailboxWorkspaceContent {...workspaceProps} />
          </div>
        </div>
      </div>

      <MailboxReportPickerModal
        filteredReportOptions={filteredReportOptions}
        mode={mode}
        open={reportPickerOpen}
        reportPickerLoading={reportPickerLoading}
        reportSearch={reportSearch}
        reportSiteFilter={reportSiteFilter}
        siteOptions={adminSites}
        onChangeReportSearch={setReportSearch}
        onChangeSiteFilter={setReportSiteFilter}
        onClose={() => setReportPickerOpen(false)}
        onSelectReport={(reportKey) => {
          if (filteredReportOptionsByKey.has(reportKey)) {
            onSelectReport(reportKey);
          }
        }}
      />
    </section>
  );
}
