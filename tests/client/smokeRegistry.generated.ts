import type { ClientSmokePlaywrightConfig } from '../../playwright.config';
import type { FeatureContractId } from './featureContracts';
import { runAdminControlCenterSmoke } from './admin/admin-control-center.spec';
import { runAdminHeadquartersSmoke } from './admin/admin-headquarters.spec';
import { runAdminReportsSmoke } from './admin/admin-reports.spec';
import { runAdminSchedulesSmoke } from './admin/admin-schedules.spec';
import { runAdminSitesSmoke } from './admin/admin-sites.spec';
import { runAdminUsersSmoke } from './admin/admin-users.spec';
import { runAuthSmoke } from './erp/auth.spec';
import { runBadWorkplaceReportSmoke } from './erp/bad-workplace-report.spec';
import { runMobileBadWorkplaceSmoke } from './erp/mobile-bad-workplace.spec';
import { runMobileLinkSmoke } from './erp/mobile-link.spec';
import { runMobileQuarterlyListSmoke } from './erp/mobile-quarterly-list.spec';
import { runMobileQuarterlyReportSmoke } from './erp/mobile-quarterly-report.spec';
import { runMobileSiteHomeSmoke } from './erp/mobile-site-home.spec';
import { runMobileSiteReportsSmoke } from './erp/mobile-site-reports.spec';
import { runMobileWorkerNavSmoke } from './erp/mobile-worker-nav.spec';
import { runQuarterlyReportSmoke } from './erp/quarterly-report.spec';
import { runSiteHubSmoke } from './erp/site-hub.spec';
import { runSiteReportListSmoke } from './erp/site-report-list.spec';
import { runWorkerCalendarSmoke } from './erp/worker-calendar.spec';

export type FeatureRunner = (config: ClientSmokePlaywrightConfig) => Promise<void>;

export interface SmokeDocLinks {
  primaryDocPath: string;
  relatedDocPaths: string[];
}

export const SMOKE_RUNNERS = {
  'admin-control-center': runAdminControlCenterSmoke,
  'admin-headquarters': runAdminHeadquartersSmoke,
  'admin-reports': runAdminReportsSmoke,
  'admin-schedules': runAdminSchedulesSmoke,
  'admin-sites': runAdminSitesSmoke,
  'admin-users': runAdminUsersSmoke,
  'auth': runAuthSmoke,
  'bad-workplace-report': runBadWorkplaceReportSmoke,
  'mobile-bad-workplace': runMobileBadWorkplaceSmoke,
  'mobile-link': runMobileLinkSmoke,
  'mobile-quarterly-list': runMobileQuarterlyListSmoke,
  'mobile-quarterly-report': runMobileQuarterlyReportSmoke,
  'mobile-site-home': runMobileSiteHomeSmoke,
  'mobile-site-reports': runMobileSiteReportsSmoke,
  'mobile-worker-nav': runMobileWorkerNavSmoke,
  'quarterly-report': runQuarterlyReportSmoke,
  'site-hub': runSiteHubSmoke,
  'site-report-list': runSiteReportListSmoke,
  'worker-calendar': runWorkerCalendarSmoke,
} as const satisfies Record<FeatureContractId, FeatureRunner>;

export const SMOKE_DOCS = {
  'admin-control-center': { primaryDocPath: 'tests/client/contracts/smoke-specs/admin/admin-control-center.md', relatedDocPaths: ['tests/client/admin/analytics-employee-monthly-only.md', 'tests/client/admin/analytics-month-detail-client-route-fix.md', 'tests/client/admin/admin-read-paths-and-cache-roles.md', 'tests/client/admin/admin-photo-album-mutation-capabilities.md', 'tests/client/admin/admin-overview-report-navigation.md'] },
  'admin-headquarters': { primaryDocPath: 'tests/client/contracts/smoke-specs/admin/admin-headquarters.md', relatedDocPaths: ['tests/client/admin/admin-headquarters-site-drilldown-main-only.md', 'tests/client/admin/admin-headquarters-site-header-navigation.md', 'tests/client/admin/admin-headquarters-write-response-regression.md', 'tests/client/admin/admin-headquarters-site-context-restore.md', 'tests/client/admin/admin-headquarters-list-order-and-count.md'] },
  'admin-reports': { primaryDocPath: 'tests/client/contracts/smoke-specs/admin/admin-reports.md', relatedDocPaths: ['tests/client/admin/admin-reports-malformed-row-guard.md', 'tests/client/admin/admin-original-pdf-asset-fallback.md', 'tests/client/admin/admin-report-open-and-list-typography.md', 'tests/client/admin/admin-overview-dispatch-technical-guidance-split.md', 'tests/client/admin/overview-dispatch-quarter-scope-proof.md'] },
  'admin-schedules': { primaryDocPath: 'tests/client/contracts/smoke-specs/admin/admin-schedules.md', relatedDocPaths: ['tests/client/admin/worker-calendar-admin-proof.md', 'tests/client/admin/worker-schedule-report-linking.proof.md'] },
  'admin-sites': { primaryDocPath: 'tests/client/contracts/smoke-specs/admin/admin-sites.md', relatedDocPaths: ['tests/client/admin/admin-sites-form-trim-and-first-assignment-modal.md', 'tests/client/admin/admin-site-entry-hub-site-management-panel.md'] },
  'admin-users': { primaryDocPath: 'tests/client/contracts/smoke-specs/admin/admin-users.md', relatedDocPaths: ['tests/client/admin/admin-users-schedules-photo-download.proof.md'] },
  'auth': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/auth.md', relatedDocPaths: [] },
  'bad-workplace-report': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/bad-workplace-report.md', relatedDocPaths: [] },
  'mobile-bad-workplace': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/mobile-bad-workplace.md', relatedDocPaths: [] },
  'mobile-link': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/mobile-link.md', relatedDocPaths: [] },
  'mobile-quarterly-list': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/mobile-quarterly-list.md', relatedDocPaths: ['tests/client/erp/site-snapshot-resolution-and-quarterly-appendix.md'] },
  'mobile-quarterly-report': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/mobile-quarterly-report.md', relatedDocPaths: ['tests/client/erp/quarterly-export-ops-image-and-risk-reflow.md', 'tests/client/erp/site-snapshot-resolution-and-quarterly-appendix.md'] },
  'mobile-site-home': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/mobile-site-home.md', relatedDocPaths: ['tests/client/erp/site-entry-hub-site-management-panel.md', 'tests/client/erp/worker-header-without-notifications.md'] },
  'mobile-site-reports': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/mobile-site-reports.md', relatedDocPaths: ['tests/client/erp/site-report-route-fallback.md', 'tests/client/erp/worker-site-report-summary-alignment.md'] },
  'mobile-worker-nav': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/mobile-worker-nav.md', relatedDocPaths: ['tests/client/erp/worker-header-without-notifications.md'] },
  'quarterly-report': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/quarterly-report.md', relatedDocPaths: ['tests/client/erp/quarterly-export-ops-image-and-risk-reflow.md', 'tests/client/erp/site-snapshot-resolution-and-quarterly-appendix.md'] },
  'site-hub': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/site-hub.md', relatedDocPaths: ['tests/client/erp/site-entry-hub-site-management-panel.md', 'tests/client/erp/admin-site-menu-context-restore.md'] },
  'site-report-list': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/site-report-list.md', relatedDocPaths: ['tests/client/erp/site-report-route-fallback.md', 'tests/client/erp/worker-site-report-summary-alignment.md'] },
  'worker-calendar': { primaryDocPath: 'tests/client/contracts/smoke-specs/erp/worker-calendar.md', relatedDocPaths: ['tests/client/admin/worker-calendar-admin-proof.md'] },
} as const satisfies Record<FeatureContractId, SmokeDocLinks>;

export const SMOKE_REGISTRY_CONTRACT_IDS = Object.keys(SMOKE_RUNNERS) as FeatureContractId[];
