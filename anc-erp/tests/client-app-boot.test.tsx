import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

import HomePage from "../client/app/page";
import DashboardPage from "../client/app/dashboard/page";
import DashboardMyWorkPage from "../client/app/dashboard/my-work/page";
import DashboardProjectsHealthPage from "../client/app/dashboard/projects/page";
import DashboardInspectionsPage from "../client/app/dashboard/inspections/page";
import DashboardDocumentsPage from "../client/app/dashboard/documents/page";
import DashboardFindingsPage from "../client/app/dashboard/findings/page";
import DashboardSafetyCostsPage from "../client/app/dashboard/safety-costs/page";
import DashboardApprovalsPage from "../client/app/dashboard/approvals/page";
import DashboardFilesMailsPage from "../client/app/dashboard/files-mails/page";
import DashboardStatisticsPage from "../client/app/dashboard/statistics/page";
import DashboardAlertsPage from "../client/app/dashboard/alerts/page";
import DashboardSettingsPage from "../client/app/dashboard/settings/page";
import ProjectsPage from "../client/app/projects/page";
import NewProjectPage from "../client/app/projects/new/page";
import ProjectDetailPage from "../client/app/projects/[projectId]/page";
import ProjectOverviewPage from "../client/app/projects/[projectId]/overview/page";
import ProjectPartiesPage from "../client/app/projects/[projectId]/parties/page";
import ProjectContactsPage from "../client/app/projects/[projectId]/contacts/page";
import ProjectRequirementsPage from "../client/app/projects/[projectId]/requirements/page";
import ProjectRelatedPage from "../client/app/projects/[projectId]/related/page";
import ProjectHistoryPage from "../client/app/projects/[projectId]/history/page";
import ProjectSettingsPage from "../client/app/projects/[projectId]/settings/page";
import ProjectContractsPage from "../client/app/projects/[projectId]/contracts/page";
import NewContractPage from "../client/app/projects/[projectId]/contracts/new/page";
import ProjectInspectionsPage from "../client/app/projects/[projectId]/inspections/page";
import InspectionSchedulePage from "../client/app/projects/[projectId]/inspections/schedule/page";
import NewInspectionRoundPage from "../client/app/projects/[projectId]/inspections/new/page";
import ContractDetailPage from "../client/app/contracts/[contractId]/page";
import ContractEditPage from "../client/app/contracts/[contractId]/edit/page";
import ContractPreviewPage from "../client/app/contracts/[contractId]/preview/page";
import ContractPaymentsPage from "../client/app/contracts/[contractId]/payments/page";
import ContractFilesPage from "../client/app/contracts/[contractId]/files/page";
import ContractChangesPage from "../client/app/contracts/[contractId]/changes/page";
import InspectionRoundPage from "../client/app/inspections/[inspectionRoundId]/page";
import InspectionRoundFindingsPage from "../client/app/inspections/[inspectionRoundId]/findings/page";
import NewRoundFindingPage from "../client/app/inspections/[inspectionRoundId]/findings/new/page";
import ChecklistPage from "../client/app/inspections/[inspectionRoundId]/checklist/page";
import ChecklistMobilePage from "../client/app/inspections/[inspectionRoundId]/checklist/mobile/page";
import ChecklistReviewPage from "../client/app/inspections/[inspectionRoundId]/checklist/review/page";
import ProjectSafetyCostsPage from "../client/app/projects/[projectId]/safety-costs/page";
import ProjectSafetyCostOwnerMatrixPage from "../client/app/projects/[projectId]/safety-costs/owner-matrix/page";
import InspectionSafetyCostsPage from "../client/app/inspections/[inspectionRoundId]/safety-costs/page";
import NewSafetyCostUsagePage from "../client/app/inspections/[inspectionRoundId]/safety-costs/new/page";
import SafetyCostDetailPage from "../client/app/safety-costs/[usageId]/page";
import SafetyCostEditPage from "../client/app/safety-costs/[usageId]/edit/page";
import SafetyCostEvidencePage from "../client/app/safety-costs/[usageId]/evidence/page";
import SafetyCostReviewPage from "../client/app/safety-costs/[usageId]/review/page";
import SafetyCostPreviewPage from "../client/app/safety-costs/[usageId]/preview/page";
import SafetyCostHistoryPage from "../client/app/safety-costs/[usageId]/history/page";
import DocumentSafetyCostSectionPage from "../client/app/documents/safety-reports/[documentId]/sections/safety_cost_usage/page";
import ProjectSafetyReportsPage from "../client/app/projects/[projectId]/documents/safety-reports/page";
import NewSafetyReportPage from "../client/app/projects/[projectId]/documents/safety-reports/new/page";
import ProjectSafetyManagementPlansPage from "../client/app/projects/[projectId]/documents/safety-management-plans/page";
import NewSafetyManagementPlanPage from "../client/app/projects/[projectId]/documents/safety-management-plans/new/page";
import ProjectSafetyHealthLedgersPage from "../client/app/projects/[projectId]/documents/safety-health-ledgers/page";
import NewSafetyHealthLedgerPage from "../client/app/projects/[projectId]/documents/safety-health-ledgers/new/page";
import SafetyReportDetailPage from "../client/app/documents/safety-reports/[documentId]/page";
import SafetyReportEditPage from "../client/app/documents/safety-reports/[documentId]/edit/page";
import SafetyReportPreviewPage from "../client/app/documents/safety-reports/[documentId]/preview/page";
import SafetyReportSectionsPage from "../client/app/documents/safety-reports/[documentId]/sections/page";
import SafetyReportVariablesPage from "../client/app/documents/safety-reports/[documentId]/variables/page";
import SafetyReportExportPage from "../client/app/documents/safety-reports/[documentId]/export/page";
import SafetyReportSubmissionPage from "../client/app/documents/safety-reports/[documentId]/submission/page";
import SafetyManagementPlanDetailPage from "../client/app/documents/safety-management-plans/[documentId]/page";
import SafetyManagementPlanEditPage from "../client/app/documents/safety-management-plans/[documentId]/edit/page";
import SafetyManagementPlanPreviewPage from "../client/app/documents/safety-management-plans/[documentId]/preview/page";
import SafetyManagementPlanSectionsPage from "../client/app/documents/safety-management-plans/[documentId]/sections/page";
import SafetyManagementPlanRisksPage from "../client/app/documents/safety-management-plans/[documentId]/risks/page";
import SafetyManagementPlanOrganizationPage from "../client/app/documents/safety-management-plans/[documentId]/organization/page";
import SafetyManagementPlanEducationPage from "../client/app/documents/safety-management-plans/[documentId]/education/page";
import SafetyManagementPlanEmergencyPage from "../client/app/documents/safety-management-plans/[documentId]/emergency/page";
import SafetyManagementPlanAttachmentsPage from "../client/app/documents/safety-management-plans/[documentId]/attachments/page";
import SafetyManagementPlanExportPage from "../client/app/documents/safety-management-plans/[documentId]/export/page";
import SafetyHealthLedgerDetailPage from "../client/app/documents/safety-health-ledgers/[documentId]/page";
import SafetyHealthLedgerEditPage from "../client/app/documents/safety-health-ledgers/[documentId]/edit/page";
import SafetyHealthLedgerRisksPage from "../client/app/documents/safety-health-ledgers/[documentId]/risks/page";
import SafetyHealthLedgerMeasuresPage from "../client/app/documents/safety-health-ledgers/[documentId]/measures/page";
import SafetyHealthLedgerInspectionsPage from "../client/app/documents/safety-health-ledgers/[documentId]/inspections/page";
import SafetyHealthLedgerFindingsPage from "../client/app/documents/safety-health-ledgers/[documentId]/findings/page";
import SafetyHealthLedgerSafetyCostsPage from "../client/app/documents/safety-health-ledgers/[documentId]/safety-costs/page";
import SafetyHealthLedgerAttachmentsPage from "../client/app/documents/safety-health-ledgers/[documentId]/attachments/page";
import SafetyHealthLedgerPreviewPage from "../client/app/documents/safety-health-ledgers/[documentId]/preview/page";
import SafetyHealthLedgerExportPage from "../client/app/documents/safety-health-ledgers/[documentId]/export/page";
import SafetyHealthLedgerVersionsPage from "../client/app/documents/safety-health-ledgers/[documentId]/versions/page";
import OwnerReportTaskDocumentPage from "../client/app/inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document/page";
import PhotoLedgerRoundPage from "../client/app/inspections/[inspectionRoundId]/photo-ledger/page";
import NewPhotoLedgerPage from "../client/app/inspections/[inspectionRoundId]/photo-ledger/new/page";
import WebhardHomePage from "../client/app/webhard/page";
import WebhardProjectPage from "../client/app/webhard/projects/[projectId]/page";
import WebhardFolderPage from "../client/app/webhard/projects/[projectId]/folders/[folderId]/page";
import WebhardRecentPage from "../client/app/webhard/recent/page";
import WebhardSharedPage from "../client/app/webhard/shared/page";
import WebhardTrashPage from "../client/app/webhard/trash/page";
import WebhardSearchPage from "../client/app/webhard/search/page";
import WebhardFilePage from "../client/app/files/[fileId]/page";
import WebhardFileVersionsPage from "../client/app/files/[fileId]/versions/page";
import WebhardFileActivityPage from "../client/app/files/[fileId]/activity/page";
import PublicSharePage from "../client/app/share/[token]/page";
import MailPage from "../client/app/mail/page";
import MailComposePage from "../client/app/mail/compose/page";
import ApprovalsPage from "../client/app/approvals/page";
import ProjectMailPage from "../client/app/projects/[projectId]/mail/page";
import ProjectDashboardPage from "../client/app/projects/[projectId]/dashboard/page";
import ProjectMailComposePage from "../client/app/projects/[projectId]/mail/compose/page";
import MailAccountsPage from "../client/app/mail/accounts/page";
import MailSettingsPage from "../client/app/mail/settings/page";
import MailThreadDetailPage from "../client/app/mail/threads/[threadId]/page";
import MailMessageDetailPage from "../client/app/mail/messages/[messageId]/page";
import SubmissionMailPage from "../client/app/documents/[documentId]/submission-mail/page";
import DocumentApprovalPage from "../client/app/documents/[documentId]/approval/page";
import DocumentSignaturePage from "../client/app/documents/[documentId]/signature/page";
import DocumentSubmissionPage from "../client/app/documents/[documentId]/submission/page";
import ActionRequestMailPage from "../client/app/findings/[findingId]/action-request-mail/page";
import ContractMailPage from "../client/app/contracts/[contractId]/send-mail/page";
import SettingsMailAccountsPage from "../client/app/settings/mail-accounts/page";
import SettingsMailTemplatesPage from "../client/app/settings/mail-templates/page";
import InspectionMailPage from "../client/app/inspections/[inspectionRoundId]/mail/page";
import InspectionRoundEditPage from "../client/app/inspections/[inspectionRoundId]/edit/page";
import InspectionTasksPage from "../client/app/inspections/[inspectionRoundId]/tasks/page";
import InspectionOwnerReportsPage from "../client/app/inspections/[inspectionRoundId]/owner-reports/page";
import InspectionAttachmentsPage from "../client/app/inspections/[inspectionRoundId]/attachments/page";
import InspectionCalendarPage from "../client/app/calendar/inspections/page";
import ProjectFindingsPage from "../client/app/projects/[projectId]/findings/page";
import NewProjectFindingPage from "../client/app/projects/[projectId]/findings/new/page";
import FindingDetailPage from "../client/app/findings/[findingId]/page";
import FindingEditPage from "../client/app/findings/[findingId]/edit/page";
import FindingActionsPage from "../client/app/findings/[findingId]/actions/page";
import FindingPhotosPage from "../client/app/findings/[findingId]/photos/page";
import FindingVerifyPage from "../client/app/findings/[findingId]/verify/page";
import PhotoLedgerDetailPage from "../client/app/photo-ledgers/[photoLedgerId]/page";
import PhotoLedgerEditPage from "../client/app/photo-ledgers/[photoLedgerId]/edit/page";
import PhotoLedgerPreviewPage from "../client/app/photo-ledgers/[photoLedgerId]/preview/page";
import PhotoLedgerExportPage from "../client/app/photo-ledgers/[photoLedgerId]/export/page";
import DocumentPhotoLedgerSectionPage from "../client/app/documents/safety-reports/[documentId]/sections/photo_ledger/page";
import ChecklistSessionPage from "../client/app/checklist-sessions/[sessionId]/page";
import ChecklistSessionResultsPage from "../client/app/checklist-sessions/[sessionId]/results/page";
import ChecklistFindingCandidatesPage from "../client/app/checklist-sessions/[sessionId]/finding-candidates/page";
import ChecklistPhotosPage from "../client/app/checklist-sessions/[sessionId]/photos/page";
import ProjectChecklistTemplatesPage from "../client/app/projects/[projectId]/checklist-templates/page";
import AdminPage from "../client/app/admin/page";
import AdminTemplatesPage from "../client/app/admin/templates/page";
import AdminChecklistTemplatesPage from "../client/app/admin/checklist-templates/page";
import AdminChecklistTemplateDetailPage from "../client/app/admin/checklist-templates/[templateId]/page";
import AdminDocumentTemplateDetailPage from "../client/app/admin/document-templates/[templateId]/page";
import AdminDocumentTemplateVersionsPage from "../client/app/admin/document-templates/[templateId]/versions/page";
import AdminDocumentTemplateVariablesPage from "../client/app/admin/document-templates/[templateId]/variables/page";
import AdminDocumentTemplatePreviewPage from "../client/app/admin/document-templates/[templateId]/preview/page";
import AdminApprovalTemplatesPage from "../client/app/admin/approval-templates/page";
import AdminApprovalTemplateDetailPage from "../client/app/admin/approval-templates/[templateId]/page";
import AdminPromptsPage from "../client/app/admin/prompts/page";
import AdminPromptDetailPage from "../client/app/admin/prompts/[promptId]/page";
import AdminPromptVersionsPage from "../client/app/admin/prompts/[promptId]/versions/page";
import AdminPromptRunPage from "../client/app/admin/prompts/[promptId]/run/page";
import AdminPromptTestCasesPage from "../client/app/admin/prompts/[promptId]/test-cases/page";
import AdminChecklistsPage from "../client/app/admin/checklists/page";
import AdminUsersPage from "../client/app/admin/users/page";
import AdminRolesPage from "../client/app/admin/roles/page";
import AdminCompanyPage from "../client/app/admin/company/page";
import AdminPhraseLibraryPage from "../client/app/admin/phrase-library/page";
import AdminLegalClausesPage from "../client/app/admin/legal-clauses/page";
import AdminMailTemplatesPage from "../client/app/admin/mail-templates/page";
import AdminSignatureAssetsPage from "../client/app/admin/signature-assets/page";
import AdminSignatureAssetDetailPage from "../client/app/admin/signature-assets/[assetId]/page";
import AdminWebhardPoliciesPage from "../client/app/admin/webhard-policies/page";
import AdminAuditLogsPage from "../client/app/admin/audit-logs/page";
import ProjectEstimatesPage from "../client/app/projects/[projectId]/estimates/page";
import NewEstimatePage from "../client/app/projects/[projectId]/estimates/new/page";
import EstimateDetailPage from "../client/app/estimates/[estimateId]/page";
import EstimatePreviewPage from "../client/app/estimates/[estimateId]/preview/page";
import { globalNavigation } from "../client/lib/module-registry";
import {
  loadContractDetailData,
  loadEstimateDetailData,
  loadProjectContractCreateData,
  loadProjectContractsPageData,
  loadProjectEstimatesPageData,
} from "../client/lib/contract-page-data";
import {
  loadInspectionCalendarPageData,
  loadInspectionRoundCreateData,
  loadInspectionRoundDetailData,
  loadInspectionSchedulePageData,
  loadProjectInspectionsPageData,
} from "../client/lib/inspection-page-data";
import {
  loadChecklistRoundPageData,
  loadChecklistSessionPageData,
  loadChecklistTemplateAdminPageData,
  loadChecklistTemplateDetailPageData,
} from "../client/lib/checklist-page-data";
import {
  createCorrectiveActionDraft,
  draftActionRequestMailForFindings,
  saveEvidencePhotoCaption,
  saveEvidencePhotoMarkup,
  sendActionRequestMailDraft,
  updatePhotoLedgerEntryDraft,
  validatePhotoLedgerDraft,
  uploadFindingEvidencePhoto,
  verifyCorrectiveActionDraft,
} from "../client/lib/finding-actions";
import {
  loadProjectCreationDraft,
  loadProjectDetailData,
  loadProjectsPageData,
} from "../client/lib/project-page-data";
import {
  calculateSafetyCostRateDraft,
  confirmSafetyCostUsageDraft,
  createRoundSafetyCostUsageDraft,
  generateSafetyCostCommentDraft,
  reviewSafetyCostUsageDraft,
  syncSafetyCostUsageDraft,
  updateSafetyCostUsageDraft,
  uploadSafetyCostEvidenceDraft,
  validateSafetyCostUsageDraft,
} from "../client/lib/safety-cost-actions";
import {
  approveDocumentStepAction,
  archiveSubmissionAction,
  completeDocumentSignatureTaskAction,
  confirmSubmissionOwnerReceiptAction,
  createProjectSubmissionAction,
  createSubmissionPackageAction,
  finalizeSubmissionPackageAction,
  markManualSubmissionAction,
  rejectDocumentStepAction,
  requestDocumentApprovalAction,
  requestDocumentStepChangesAction,
  requestSubmissionRevisionAction,
  sendSubmissionMailAction,
  uploadSignedDocumentFileAction,
  validateSubmissionPackageAction,
  waiveDocumentSignatureTaskAction,
} from "../client/lib/approval-actions";
import {
  createAdminDocumentTemplateAction,
  createAdminLegalClauseAction,
  createAdminPhraseAction,
  createAdminPromptAction,
  createAdminPromptTestCaseAction,
  createAdminPromptVersionAction,
  createAdminTemplateVersionAction,
  createAdminUserAction,
  extractAdminTemplateVariablesAction,
  previewAdminTemplateVersionAction,
  publishAdminChecklistTemplateAction,
  publishAdminLegalClauseAction,
  publishAdminPhraseAction,
  publishAdminPromptVersionAction,
  publishAdminTemplateVersionAction,
  reviewAdminTemplateVersionAction,
  rollbackAdminPromptVersionAction,
  rollbackAdminTemplateVersionAction,
  runAdminPromptTestCasesAction,
  runAdminPromptVersionAction,
  updateAdminApprovalTemplateAction,
  updateAdminCompanyProfileAction,
  updateAdminLegalClauseAction,
  updateAdminMailTemplateAction,
  updateAdminRolePermissionsAction,
  updateAdminSignatureAssetAction,
  updateAdminWebhardPolicyAction,
  validateAdminTemplateVersionAction,
} from "../client/lib/admin-actions";
import {
  acknowledgeDashboardAlertAction,
  createDashboardAlertRuleAction,
  createDashboardProjectRiskInsightAction,
  createDashboardInsightSummaryAction,
  createDashboardWidgetAction,
  dismissDashboardAlertAction,
  refreshDashboardAlertsAction,
  reorderDashboardWidgetsAction,
  updateDashboardAlertRuleAction,
} from "../client/lib/dashboard-actions";
import {
  loadApprovalsInboxPageData,
  loadApprovalsQueuePageData,
  loadDocumentApprovalPageData,
  loadDocumentSignaturePageData,
  loadDocumentSubmissionPageData,
  loadRequestedApprovalsPageData,
  loadSubmissionDetailPageData,
} from "../client/lib/approval-page-data";
import {
  loadDashboardApprovalsPageData,
  loadDashboardAlertsPageData,
  loadDashboardFilesMailsPageData,
  loadDashboardFindingsPageData,
  loadDashboardInspectionsPageData,
  loadDashboardMyWorkPageData,
  loadDashboardOverviewPageData,
  loadDashboardProjectsPageData,
  loadDashboardReportsPageData,
  loadDashboardSafetyCostsPageData,
  loadDashboardSettingsPageData,
  loadDashboardStatisticsPageData,
  loadProjectDashboardPageData,
} from "../client/lib/dashboard-page-data";
import {
  loadAdminAuditLogsPageData,
  loadAdminChecklistsPageData,
  loadAdminChecklistTemplateDetailPageData,
  loadAdminCompanyPageData,
  loadAdminDashboardPageData,
  loadAdminLegalClausesPageData,
  loadAdminApprovalTemplateDetailPageData,
  loadAdminApprovalTemplatesPageData,
  loadAdminMailTemplatesPageData,
  loadAdminPhrasesPageData,
  loadAdminPromptDetailPageData,
  loadAdminPromptRunPageData,
  loadAdminPromptsPageData,
  loadAdminPromptTestCasesPageData,
  loadAdminPromptVersionsPageData,
  loadAdminRolesPageData,
  loadAdminTemplateDetailPageData,
  loadAdminTemplatePreviewPageData,
  loadAdminTemplateVariablesPageData,
  loadAdminTemplateVersionsPageData,
  loadAdminTemplatesPageData,
  loadAdminUsersPageData,
  loadAdminSignatureAssetDetailPageData,
  loadAdminSignatureAssetsPageData,
  loadAdminWebhardPolicyPageData,
} from "../client/lib/admin-page-data";
import {
  createSafetyReportDraftAction,
  exportSafetyReportDraft,
  getSafetyReportOwnerBranchesAction,
  getSafetyReportRequiredDataAction,
  linkSafetyReportOwnerTaskDraft,
  markSafetyReportSubmittedDraft,
  regenerateSafetyReportSectionDraft,
  refreshSafetyReportLinkedDataDraft,
  saveSafetyReportSectionDraft,
} from "../client/lib/safety-report-actions";
import {
  createSafetyManagementPlanDraftAction,
  createSafetyManagementRiskDraft,
  createSafetyManagementWorkTypeDraft,
  exportSafetyManagementPlanDraft,
  generateSafetyManagementRisksFromWorkTypesDraft,
  importSafetyManagementRisksFromChecklistDraft,
  linkSafetyManagementAttachmentDraft,
  regenerateSafetyManagementPlanSectionDraft,
  refreshSafetyManagementPlanLinkedDataDraft,
  saveSafetyManagementPlanSectionDraft,
  updateSafetyManagementEducationDraft,
  updateSafetyManagementEmergencyDraft,
  updateSafetyManagementOrganizationDraft,
  validateSafetyManagementPlanDraft,
} from "../client/lib/safety-management-plan-actions";
import {
  createSafetyHealthLedgerDraftAction,
  createSafetyHealthLedgerMeasureDraft,
  createSafetyHealthLedgerRiskDraft,
  detectSafetyHealthLedgerRecurrenceDraft,
  exportSafetyHealthLedgerDraft,
  importSafetyHealthLedgerRisksFromPlanDraft,
  linkSafetyHealthLedgerAttachmentDraft,
  regenerateSafetyHealthLedgerSectionDraft,
  saveSafetyHealthLedgerSectionDraft,
  syncSafetyHealthLedgerFindingHistoryDraft,
  syncSafetyHealthLedgerInspectionHistoryDraft,
  syncSafetyHealthLedgerSafetyCostHistoryDraft,
  validateSafetyHealthLedgerDraft,
} from "../client/lib/safety-health-ledger-actions";
import {
  addWebhardFileVersionDraft,
  classifyWebhardFileDraft,
  createWebhardFolderDraft,
  createWebhardShareLinkDraft,
  getMailAttachmentSaveSuggestionsDraft,
  restoreWebhardFileDraft,
  revokeWebhardShareLinkDraft,
  saveMailAttachmentToWebhardDraft,
  uploadWebhardFileDraft,
} from "../client/lib/webhard-actions";
import {
  classifyMailMessageDraft,
  createGuestMailAccountDraft,
  createMailDraftAction,
  createSubmissionMailDraftAction,
  createScheduleCoordinationMailDraftAction,
  generateMailDraftAction,
  linkMailMessageEntityDraft,
  markMailMessageReadDraft,
  saveMailboxAttachmentToWebhardDraft,
  sendMailDraftAction,
  startGoogleMailOAuthDraft,
  syncMailAccountDraft,
  updateMailTemplateDraft,
  validateMailDraftAction,
} from "../client/lib/mail-actions";
import {
  loadMailAccountsPageData,
  loadMailboxPageData,
  loadMailComposePageData,
  loadMailMessagePageData,
  loadMailSettingsPageData,
  loadScheduleCoordinationMailComposerPageData,
  loadMailThreadPageData,
  loadSubmissionMailComposerPageData,
} from "../client/lib/mail-page-data";
import {
  loadDocumentSafetyCostPageData,
  loadProjectSafetyCostOwnerMatrixPageData,
  loadProjectSafetyCostsPageData,
  loadRoundSafetyCostsPageData,
  loadSafetyCostDetailPageData,
  loadSafetyCostHistoryPageData,
} from "../client/lib/safety-cost-page-data";
import {
  loadOwnerReportTaskDocumentPageData,
  loadProjectSafetyReportsPageData,
  loadSafetyReportDetailPageData,
  loadSafetyReportVariablesPageData,
} from "../client/lib/safety-report-page-data";
import {
  loadProjectSafetyManagementPlansPageData,
  loadSafetyManagementPlanDetailPageData,
} from "../client/lib/safety-management-plan-page-data";
import { getSampleSafetyManagementPlanDetail } from "../client/lib/safety-management-plan-demo-data";
import {
  loadProjectSafetyHealthLedgersPageData,
  loadSafetyHealthLedgerDetailPageData,
} from "../client/lib/safety-health-ledger-page-data";
import { loadProjectWebhardPageData } from "../client/lib/webhard-page-data";
import { createAncErpApiClient } from "../packages/api-client/src";

async function run() {
  const homeMarkup = renderToStaticMarkup(<HomePage />);
  assert.match(homeMarkup, /A&amp;C ERP/);
  assert.match(homeMarkup, /Project/);

  const dashboardMarkup = renderToStaticMarkup(await DashboardPage());
  assert.match(dashboardMarkup, /Dashboard/);
  assert.match(dashboardMarkup, /전역 대시보드 \/ 통계 허브/);

  const dashboardMyWorkMarkup = renderToStaticMarkup(await DashboardMyWorkPage());
  assert.match(dashboardMyWorkMarkup, /오늘 할 일/);

  const dashboardProjectsMarkup = renderToStaticMarkup(await DashboardProjectsHealthPage());
  assert.match(dashboardProjectsMarkup, /프로젝트 health summary/);

  const dashboardInspectionsMarkup = renderToStaticMarkup(await DashboardInspectionsPage());
  assert.match(dashboardInspectionsMarkup, /점검회차 상태 목록/);

  const dashboardDocumentsMarkup = renderToStaticMarkup(await DashboardDocumentsPage());
  assert.match(dashboardDocumentsMarkup, /발주처별 제출 상태 매트릭스/);

  const dashboardFindingsMarkup = renderToStaticMarkup(await DashboardFindingsPage());
  assert.match(dashboardFindingsMarkup, /지적사항 경과 분포/);

  const dashboardSafetyCostsMarkup = renderToStaticMarkup(await DashboardSafetyCostsPage());
  assert.match(dashboardSafetyCostsMarkup, /산안비 경고/);

  const dashboardApprovalsMarkup = renderToStaticMarkup(await DashboardApprovalsPage());
  assert.match(dashboardApprovalsMarkup, /서명 \/ 날인 누락/);

  const dashboardFilesMailsMarkup = renderToStaticMarkup(await DashboardFilesMailsPage());
  assert.match(dashboardFilesMailsMarkup, /미분류 메일/);

  const dashboardStatisticsMarkup = renderToStaticMarkup(await DashboardStatisticsPage());
  assert.match(dashboardStatisticsMarkup, /월별 점검 통계/);

  const dashboardAlertsMarkup = renderToStaticMarkup(await DashboardAlertsPage());
  assert.match(dashboardAlertsMarkup, /운영 경고/);

  const dashboardSettingsMarkup = renderToStaticMarkup(await DashboardSettingsPage());
  assert.match(dashboardSettingsMarkup, /위젯 설정/);

  const dashboardLoaderCalls: string[] = [];
  const dashboardLoaderFetch: typeof fetch = async (input) => {
    const url = String(input);
    dashboardLoaderCalls.push(url);
    if (url.endsWith("/api/v1/dashboard/overview")) {
      return new Response(
        JSON.stringify({
          generatedAt: "2026-05-10T16:30:00+09:00",
          metrics: [],
          todayInspections: [],
          upcomingInspections: [],
          reportDueItems: [],
          openFindings: [],
          safetyCostWarnings: [],
          pendingApprovals: [],
          submissionStatuses: [],
          mailFileActivity: { messages: [], files: [], unclassifiedMailCount: 0, unclassifiedMessages: [] },
          widgets: [],
          alerts: [],
          snapshot: {
            id: "dashboard-snapshot-001",
            scope: "global",
            snapshotDate: "2026-05-10",
            metrics: [],
            alerts: [],
            createdAt: "2026-05-10T16:30:00+09:00",
          },
        }),
      );
    }
    if (url.endsWith("/api/v1/dashboard/metrics/project-health")) {
      return new Response(JSON.stringify([{ id: "project-health-project-sample-001", projectId: "project-sample-001", projectName: "리움미술관 승강기 교체공사", riskScore: 55, openFindings: 4, pendingApprovals: 1, overdueReports: 2, submissionLagCount: 2, safetyCostWarningCount: 1, healthStatus: "warning", updatedAt: "" }]));
    }
    if (url.endsWith("/api/v1/dashboard/my-work")) {
      return new Response(JSON.stringify({ generatedAt: "2026-05-10T16:30:00+09:00", tasks: [], upcomingInspections: [], pendingApprovals: [], openFindings: [] }));
    }
    if (url.endsWith("/api/v1/dashboard/metrics/inspection-status")) {
      return new Response(JSON.stringify([{ id: "dashboard-metric-round-001", metricKey: "inspection_status", label: "1회 점검", value: 1, status: "review", projectId: "project-sample-001", inspectionRoundId: "round-sample-001", metadata: { roundStatus: "planned", plannedDate: "2026-05-10", actualInspectionDate: null, documentNo: "DOC-001" } }]));
    }
    if (url.endsWith("/api/v1/dashboard/metrics/report-status")) {
      return new Response(JSON.stringify([{ id: "owner-report-summary-001", projectId: "project-sample-001", inspectionRoundId: "round-sample-001", ownerPartyId: "owner-samsung-cultural-foundation", ownerDisplayName: "삼성문화재단", status: "drafting", documentId: "doc-sample-001", dueDate: "2026-05-09" }]));
    }
    if (url.endsWith("/api/v1/dashboard/metrics/submission-status")) {
      return new Response(JSON.stringify([{ id: "owner-report-summary-001", projectId: "project-sample-001", inspectionRoundId: "round-sample-001", ownerPartyId: "owner-samsung-cultural-foundation", ownerDisplayName: "삼성문화재단", status: "drafting", documentId: "doc-sample-001", dueDate: "2026-05-09" }]));
    }
    if (url.endsWith("/api/v1/dashboard/metrics/finding-aging")) {
      return new Response(JSON.stringify([{ id: "finding-aging-8-plus", projectId: "global", bucketKey: "8_plus", label: "8일 이상", count: 2, findingIds: [] }]));
    }
    if (url.endsWith("/api/v1/dashboard/statistics/risk-types")) {
      return new Response(JSON.stringify([{ id: "stat-risk-electric", seriesKey: "risk_types", label: "위험유형 분포", x: "electric", y: 3, metadata: {} }]));
    }
    if (url.endsWith("/api/v1/dashboard/statistics/monthly-inspections")) {
      return new Response(JSON.stringify([{ id: "stat-inspection-2026-05", seriesKey: "monthly_inspections", label: "월별 점검회차", x: "2026-05", y: 2, basisDate: "2026-05-10", periodStart: "2026-01-01", periodEnd: "2026-05-10", calculationNote: "InspectionRound 집계", sourceModels: ["InspectionRound"], metadata: {} }]));
    }
    if (url.endsWith("/api/v1/dashboard/statistics/monthly-submissions")) {
      return new Response(JSON.stringify([{ id: "stat-submission-2026-05", seriesKey: "monthly_submissions", label: "월별 제출", x: "2026-05", y: 1, basisDate: "2026-05-10", periodStart: "2026-01-01", periodEnd: "2026-05-10", calculationNote: "Submission 집계", sourceModels: ["Submission"], metadata: {} }]));
    }
    if (url.endsWith("/api/v1/dashboard/statistics/owner-submission-lag")) {
      return new Response(JSON.stringify([{ id: "stat-owner-lag-001", seriesKey: "owner_submission_lag", label: "발주처별 제출 지연", x: "삼성문화재단", y: 3, basisDate: "2026-05-10", periodStart: "2026-05-01", periodEnd: "2026-05-10", calculationNote: "dueDate 경과일", sourceModels: ["InspectionOwnerReportTask", "Submission"], metadata: {} }]));
    }
    if (url.endsWith("/api/v1/dashboard/statistics/export-summary")) {
      return new Response(JSON.stringify([{ id: "stat-export-001", seriesKey: "export_summary", label: "문서 export 요약", x: "project-sample-001", y: 2, basisDate: "2026-05-10", periodStart: "2026-01-01", periodEnd: "2026-05-10", calculationNote: "export file 집계", sourceModels: ["FileAsset", "DocumentInstance"], metadata: {} }]));
    }
    if (url.endsWith("/api/v1/dashboard/alerts")) {
      return new Response(JSON.stringify([{ id: "dashboard-alert-001", alertKey: "report_overdue", scope: "project", severity: "warning", title: "발주처별 보고서 제출 지연", message: "지연", route: "/dashboard/documents", status: "open", createdAt: "", updatedAt: "" }]));
    }
    if (url.endsWith("/api/v1/dashboard/alert-rules")) {
      return new Response(JSON.stringify([{ id: "dashboard-alert-rule-001", ruleKey: "report_overdue", name: "보고서 제출 지연", description: "지연 경고", severity: "warning", enabled: true, threshold: 0, scope: "global", createdAt: "", updatedAt: "" }]));
    }
    if (url.endsWith("/api/v1/dashboard/widgets")) {
      return new Response(JSON.stringify([{ id: "dashboard-widget-001", title: "오늘 점검", widgetType: "today_inspections", route: "/dashboard", scope: "global", displayOrder: 1, settings: {}, enabled: true, createdAt: "", updatedAt: "" }]));
    }
    if (url.endsWith("/api/v1/dashboard/metrics/safety-cost-usage")) {
      return new Response(JSON.stringify([{ usage: { projectId: "project-sample-001", ownerPartyId: "owner-samsung-cultural-foundation", inspectionRoundId: "round-sample-001" }, issues: ["evidence_missing"], evidenceCount: 0 }]));
    }
    if (url.endsWith("/api/v1/dashboard/metrics/approval-queue")) {
      return new Response(JSON.stringify([{ workflow: { id: "approval-workflow-sample-001", projectId: "project-sample-001", documentId: "doc-sample-001", title: "보고서 결재", status: "requested" }, document: { id: "doc-sample-001", title: "이행확인 보고서" }, currentStep: null, pendingRequiredCount: 2, missingRequiredSignatureCount: 1, missingSignatureTasks: [{ id: "signature-task-sample-002", title: "서명/날인 반영본 업로드", status: "pending", required: true }] }]));
    }
    if (url.endsWith("/api/v1/dashboard/metrics/mail-file-activity")) {
      return new Response(JSON.stringify({ messages: [], files: [], unclassifiedMailCount: 1, unclassifiedMessages: [{ id: "mail-message-sample-001", subject: "점검 일정 협의", fromAddress: "owner@example.com" }] }));
    }
    if (url.endsWith("/api/v1/projects/project-sample-001/dashboard")) {
      return new Response(JSON.stringify({ project: { id: "project-sample-001", projectCode: "PJT-2025-001", projectName: "리움미술관 승강기 교체공사", siteName: "리움미술관", siteAddress: "서울", constructionType: "승강기 교체", status: "active", createdAt: "", updatedAt: "" }, healthMetric: { id: "project-health-project-sample-001", projectId: "project-sample-001", projectName: "리움미술관 승강기 교체공사", riskScore: 55, openFindings: 4, pendingApprovals: 1, overdueReports: 2, submissionLagCount: 2, safetyCostWarningCount: 1, healthStatus: "warning", updatedAt: "" }, ownerReportMatrix: [], findingAging: [], openFindings: [{ finding: { id: "finding-sample-001", title: "난간 미설치", dueDate: "2026-05-12", inspectionRoundId: "round-sample-001", status: "open" }, actions: [], photos: [] }], safetyCostWarnings: [], pendingApprovals: [], mailFileActivity: { messages: [], files: [], unclassifiedMailCount: 0, unclassifiedMessages: [] } }));
    }
    return new Response(JSON.stringify([]));
  };

  const dashboardOverviewData = await loadDashboardOverviewPageData(dashboardLoaderFetch);
  assert.equal(dashboardOverviewData.dataSource, "api");
  const dashboardMyWorkData = await loadDashboardMyWorkPageData(dashboardLoaderFetch);
  assert.equal(dashboardMyWorkData.dataSource, "api");
  const dashboardProjectsData = await loadDashboardProjectsPageData(dashboardLoaderFetch);
  assert.equal(dashboardProjectsData.dataSource, "api");
  const dashboardInspectionsData = await loadDashboardInspectionsPageData(dashboardLoaderFetch);
  assert.equal(dashboardInspectionsData.dataSource, "api");
  const dashboardReportsData = await loadDashboardReportsPageData(dashboardLoaderFetch);
  assert.equal(dashboardReportsData.dataSource, "api");
  const dashboardFindingsData = await loadDashboardFindingsPageData(dashboardLoaderFetch);
  assert.equal(dashboardFindingsData.dataSource, "api");
  const dashboardSafetyCostsData = await loadDashboardSafetyCostsPageData(dashboardLoaderFetch);
  assert.equal(dashboardSafetyCostsData.dataSource, "api");
  const dashboardApprovalsData = await loadDashboardApprovalsPageData(dashboardLoaderFetch);
  assert.equal(dashboardApprovalsData.dataSource, "api");
  const dashboardStatisticsData = await loadDashboardStatisticsPageData(dashboardLoaderFetch);
  assert.equal(dashboardStatisticsData.dataSource, "api");
  const dashboardAlertsData = await loadDashboardAlertsPageData(dashboardLoaderFetch);
  assert.equal(dashboardAlertsData.dataSource, "api");
  const dashboardSettingsData = await loadDashboardSettingsPageData(dashboardLoaderFetch);
  assert.equal(dashboardSettingsData.dataSource, "api");
  const projectDashboardData = await loadProjectDashboardPageData("project-sample-001", dashboardLoaderFetch);
  assert.equal(projectDashboardData.dataSource, "api");
  const dashboardFilesMailsData = await loadDashboardFilesMailsPageData(dashboardLoaderFetch);
  assert.equal(dashboardFilesMailsData.dataSource, "api");
  assert.ok(dashboardLoaderCalls.some((url) => url.endsWith("/api/v1/dashboard/overview")));
  assert.ok(dashboardLoaderCalls.some((url) => url.endsWith("/api/v1/dashboard/my-work")));
  assert.ok(dashboardLoaderCalls.some((url) => url.endsWith("/api/v1/dashboard/metrics/project-health")));
  assert.ok(dashboardLoaderCalls.some((url) => url.endsWith("/api/v1/dashboard/metrics/inspection-status")));
  assert.ok(dashboardLoaderCalls.some((url) => url.endsWith("/api/v1/dashboard/metrics/safety-cost-usage")));
  assert.ok(dashboardLoaderCalls.some((url) => url.endsWith("/api/v1/dashboard/metrics/approval-queue")));
  assert.ok(dashboardLoaderCalls.some((url) => url.endsWith("/api/v1/dashboard/statistics/risk-types")));
  assert.ok(dashboardLoaderCalls.some((url) => url.endsWith("/api/v1/projects/project-sample-001/dashboard")));

  const dashboardActionCalls: Array<{ url: string; method: string }> = [];
  const dashboardActionFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    dashboardActionCalls.push({ url, method });
    if (url.endsWith("/api/v1/dashboard/widgets")) {
      return new Response(JSON.stringify({ widget: { id: "dashboard-widget-002", title: "신규 KPI 카드", widgetType: "custom_metric", route: "/dashboard", scope: "global", displayOrder: 4, settings: {}, enabled: true, createdAt: "", updatedAt: "" } }));
    }
    if (url.endsWith("/api/v1/dashboard/widgets/reorder")) {
      return new Response(JSON.stringify([]));
    }
    if (url.endsWith("/api/v1/dashboard/alerts/refresh")) {
      return new Response(JSON.stringify({ alerts: [{ id: "dashboard-alert-001" }] }));
    }
    if (url.endsWith("/acknowledge")) {
      return new Response(JSON.stringify({ alert: { id: "dashboard-alert-001", status: "acknowledged" } }));
    }
    if (url.endsWith("/dismiss")) {
      return new Response(JSON.stringify({ alert: { id: "dashboard-alert-001", status: "dismissed" } }));
    }
    if (url.endsWith("/api/v1/dashboard/alert-rules")) {
      return new Response(JSON.stringify({ alertRule: { id: "dashboard-alert-rule-002", ruleKey: "custom_watch", name: "사용자 경고", description: "운영자 경고", severity: "warning", enabled: true, scope: "global", createdAt: "", updatedAt: "" } }));
    }
    if (url.includes("/api/v1/dashboard/alert-rules/")) {
      return new Response(JSON.stringify({ alertRule: { id: "dashboard-alert-rule-001", enabled: false } }));
    }
    if (url.endsWith("/api/v1/dashboard/insights/summary")) {
      return new Response(JSON.stringify({ insightRun: { id: "dashboard-insight-001", insightType: "summary", scope: "global", title: "AI draft briefing", summaryText: "활성 프로젝트 1개 기반 초안", sourceMetricKeys: ["active_projects"], warnings: ["ai_output_is_draft_only"], createdAt: "" } }));
    }
    if (url.endsWith("/api/v1/dashboard/insights/project-risk")) {
      return new Response(JSON.stringify({ insightRun: { id: "dashboard-insight-002", insightType: "project_risk", scope: "project", projectId: "project-sample-001", title: "AI draft briefing", summaryText: "프로젝트 위험요약 초안", sourceMetricKeys: ["open_findings"], warnings: ["ai_output_is_draft_only"], createdAt: "" } }));
    }
    return new Response(JSON.stringify({}));
  };

  await createDashboardWidgetAction({ title: "신규 KPI 카드", widgetType: "custom_metric", route: "/dashboard" }, dashboardActionFetch);
  await reorderDashboardWidgetsAction(["dashboard-widget-001"], dashboardActionFetch);
  await refreshDashboardAlertsAction(undefined, dashboardActionFetch);
  await acknowledgeDashboardAlertAction("dashboard-alert-001", dashboardActionFetch);
  await dismissDashboardAlertAction("dashboard-alert-001", dashboardActionFetch);
  await createDashboardAlertRuleAction({ ruleKey: "custom_watch", name: "사용자 경고", description: "운영자 경고", severity: "warning" }, dashboardActionFetch);
  await updateDashboardAlertRuleAction("dashboard-alert-rule-001", { enabled: false }, dashboardActionFetch);
  await createDashboardInsightSummaryAction({}, dashboardActionFetch);
  await createDashboardProjectRiskInsightAction({ projectId: "project-sample-001" }, dashboardActionFetch);
  assert.ok(dashboardActionCalls.some((call) => call.url.endsWith("/api/v1/dashboard/widgets") && call.method === "POST"));
  assert.ok(dashboardActionCalls.some((call) => call.url.endsWith("/api/v1/dashboard/widgets/reorder") && call.method === "POST"));
  assert.ok(dashboardActionCalls.some((call) => call.url.endsWith("/api/v1/dashboard/alerts/refresh") && call.method === "POST"));
  assert.ok(dashboardActionCalls.some((call) => call.url.endsWith("/api/v1/dashboard/alerts/dashboard-alert-001/acknowledge") && call.method === "PATCH"));
  assert.ok(dashboardActionCalls.some((call) => call.url.endsWith("/api/v1/dashboard/alerts/dashboard-alert-001/dismiss") && call.method === "PATCH"));
  assert.ok(dashboardActionCalls.some((call) => call.url.endsWith("/api/v1/dashboard/alert-rules") && call.method === "POST"));
  assert.ok(dashboardActionCalls.some((call) => call.url.endsWith("/api/v1/dashboard/alert-rules/dashboard-alert-rule-001") && call.method === "PATCH"));
  assert.ok(dashboardActionCalls.some((call) => call.url.endsWith("/api/v1/dashboard/insights/summary") && call.method === "POST"));
  assert.ok(dashboardActionCalls.some((call) => call.url.endsWith("/api/v1/dashboard/insights/project-risk") && call.method === "POST"));

  const projectsMarkup = renderToStaticMarkup(await ProjectsPage());
  assert.match(projectsMarkup, /프로젝트 \/ 현장 원장/);
  assert.match(projectsMarkup, /프로젝트 목록/);

  const newProjectMarkup = renderToStaticMarkup(await NewProjectPage());
  assert.match(newProjectMarkup, /새 프로젝트 등록/);
  assert.match(newProjectMarkup, /문서에서 정보 추출/);

  const projectDetailMarkup = renderToStaticMarkup(
    await ProjectDetailPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(projectDetailMarkup, /리움미술관 승강기 교체공사/);
  assert.match(projectDetailMarkup, /관련 업무 진입/);

  const projectDashboardMarkup = renderToStaticMarkup(
    await ProjectDashboardPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(projectDashboardMarkup, /Project Dashboard/);
  assert.match(projectDashboardMarkup, /프로젝트 미조치 지적사항/);

  const overviewMarkup = renderToStaticMarkup(
    await ProjectOverviewPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(overviewMarkup, /공사금액 \/ 발주처 분담/);

  const webhardHomeMarkup = renderToStaticMarkup(await WebhardHomePage());
  assert.match(webhardHomeMarkup, /웹하드/);
  assert.match(webhardHomeMarkup, /full-screen 파일 관리자/);

  const webhardProjectMarkup = renderToStaticMarkup(
    await WebhardProjectPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(webhardProjectMarkup, /프로젝트 웹하드/);
  assert.match(webhardProjectMarkup, /프로젝트 폴더/);
  assert.match(webhardProjectMarkup, /기본 정보/);

  const webhardFolderMarkup = renderToStaticMarkup(
    await WebhardFolderPage({
      params: Promise.resolve({
        projectId: "project-sample-001",
        folderId: "folder-project-sample-001-11",
      }),
    }),
  );
  assert.match(webhardFolderMarkup, /현재 폴더 기준 업로드/);

  const webhardRecentMarkup = renderToStaticMarkup(await WebhardRecentPage());
  assert.match(webhardRecentMarkup, /최근 파일/);

  const webhardSharedMarkup = renderToStaticMarkup(await WebhardSharedPage());
  assert.match(webhardSharedMarkup, /공유 파일/);
  assert.match(webhardSharedMarkup, /공유 링크 생성/);

  const webhardTrashMarkup = renderToStaticMarkup(await WebhardTrashPage());
  assert.match(webhardTrashMarkup, /휴지통/);

  const webhardSearchMarkup = renderToStaticMarkup(await WebhardSearchPage());
  assert.match(webhardSearchMarkup, /파일 검색/);

  const webhardFileMarkup = renderToStaticMarkup(
    await WebhardFilePage({
      params: Promise.resolve({ fileId: "file-asset-webhard-sample-001" }),
    }),
  );
  assert.match(webhardFileMarkup, /미리보기/);
  assert.match(webhardFileMarkup, /태그 편집/);

  const webhardFileVersionsMarkup = renderToStaticMarkup(
    await WebhardFileVersionsPage({
      params: Promise.resolve({ fileId: "file-asset-webhard-sample-001" }),
    }),
  );
  assert.match(webhardFileVersionsMarkup, /버전 이력/);

  const webhardFileActivityMarkup = renderToStaticMarkup(
    await WebhardFileActivityPage({
      params: Promise.resolve({ fileId: "file-asset-webhard-sample-001" }),
    }),
  );
  assert.match(webhardFileActivityMarkup, /활동 이력/);

  const publicShareMarkup = renderToStaticMarkup(
    await PublicSharePage({
      params: Promise.resolve({ token: "share-token-sample-001" }),
    }),
  );
  assert.match(publicShareMarkup, /공유 자료|발주처 공유 링크/);

  const mailMarkup = renderToStaticMarkup(await MailPage());
  assert.match(mailMarkup, /메일함/);
  assert.match(mailMarkup, /3-pane 메일 앱/);

  const approvalsMarkup = renderToStaticMarkup(await ApprovalsPage());
  assert.match(approvalsMarkup, /전역 결재 큐/);

  const documentApprovalMarkup = renderToStaticMarkup(
    await DocumentApprovalPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(documentApprovalMarkup, /문서 결재|Document Approval/);

  const documentSignatureMarkup = renderToStaticMarkup(
    await DocumentSignaturePage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(documentSignatureMarkup, /서명\/날인 task/);

  const documentSubmissionMarkup = renderToStaticMarkup(
    await DocumentSubmissionPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(documentSubmissionMarkup, /제출 가능 상태/);

  const mailComposeMarkup = renderToStaticMarkup(await MailComposePage());
  assert.match(mailComposeMarkup, /메일 작성/);

  const projectMailMarkup = renderToStaticMarkup(
    await ProjectMailPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(projectMailMarkup, /프로젝트 메일함/);

  const projectMailComposeMarkup = renderToStaticMarkup(
    await ProjectMailComposePage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(projectMailComposeMarkup, /projectId를 루트 키/);

  const mailAccountsMarkup = renderToStaticMarkup(await MailAccountsPage());
  assert.match(mailAccountsMarkup, /메일 계정/);

  const mailSettingsMarkup = renderToStaticMarkup(await MailSettingsPage());
  assert.match(mailSettingsMarkup, /메일 설정/);

  const mailThreadMarkup = renderToStaticMarkup(
    await MailThreadDetailPage({
      params: Promise.resolve({ threadId: "mail-thread-sample-001" }),
    }),
  );
  assert.match(mailThreadMarkup, /메일 스레드/);

  const mailMessageMarkup = renderToStaticMarkup(
    await MailMessageDetailPage({
      params: Promise.resolve({ messageId: "mail-message-sample-001" }),
    }),
  );
  assert.match(mailMessageMarkup, /메일 메시지/);

  const submissionMailMarkup = renderToStaticMarkup(
    await SubmissionMailPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(submissionMailMarkup, /제출 메일/);

  const actionRequestMailMarkup = renderToStaticMarkup(
    await ActionRequestMailPage({
      params: Promise.resolve({ findingId: "finding-sample-001" }),
    }),
  );
  assert.match(actionRequestMailMarkup, /조치 요청 메일/);

  const contractMailMarkup = renderToStaticMarkup(
    await ContractMailPage({
      params: Promise.resolve({ contractId: "contract-sample-001" }),
    }),
  );
  assert.match(contractMailMarkup, /계약 메일/);

  const inspectionMailMarkup = renderToStaticMarkup(
    await InspectionMailPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(inspectionMailMarkup, /점검회차 메일/);

  const settingsMailAccountsMarkup = renderToStaticMarkup(await SettingsMailAccountsPage());
  assert.match(settingsMailAccountsMarkup, /메일 계정/);

  const settingsMailTemplatesMarkup = renderToStaticMarkup(await SettingsMailTemplatesPage());
  assert.match(settingsMailTemplatesMarkup, /메일 설정/);

  const webhardLoaderCalls: string[] = [];
  const webhardLoaderFetch: typeof fetch = async (input) => {
    const url = String(input);
    webhardLoaderCalls.push(url);
    if (url.endsWith("/api/v1/projects/project-sample-001/folder-tree")) {
      return new Response(
        JSON.stringify([
          {
            folder: {
              id: "folder-root-project-sample-001",
              projectId: "project-sample-001",
              name: "프로젝트 루트",
              type: "project_root",
              path: "/프로젝트 루트",
              displayOrder: 0,
              isSystem: true,
              isArchived: false,
              createdAt: "",
              updatedAt: "",
            },
            children: [],
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/files?project_id=project-sample-001")) {
      return new Response(
        JSON.stringify([
          {
            id: "file-asset-webhard-sample-001",
            projectId: "project-sample-001",
            fileName: "보고서초안.pdf",
            fileType: "application/pdf",
            storagePath: "/draft/report.pdf",
            linkedEntityType: "document_instance",
            linkedEntityId: "doc-sample-001",
            createdAt: "2026-05-10T09:00:00+09:00",
            updatedAt: "2026-05-10T09:00:00+09:00",
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/share-links?project_id=project-sample-001")) {
      return new Response(JSON.stringify([]));
    }
    if (url.endsWith("/api/v1/webhard/storage-usage?project_id=project-sample-001")) {
      return new Response(
        JSON.stringify({
          projectId: "project-sample-001",
          totalFiles: 1,
          activeFiles: 1,
          deletedFiles: 0,
          lockedFiles: 0,
          totalSizeBytes: 1024,
        }),
      );
    }
    if (url.endsWith("/api/v1/webhard/activities?project_id=project-sample-001")) {
      return new Response(JSON.stringify([]));
    }
    if (url.endsWith("/api/v1/files/file-asset-webhard-sample-001")) {
      return new Response(
        JSON.stringify({
          file: {
            id: "file-asset-webhard-sample-001",
            projectId: "project-sample-001",
            fileName: "보고서초안.pdf",
            fileType: "application/pdf",
            storagePath: "/draft/report.pdf",
            linkedEntityType: "document_instance",
            linkedEntityId: "doc-sample-001",
            createdAt: "2026-05-10T09:00:00+09:00",
            updatedAt: "2026-05-10T09:00:00+09:00",
          },
          folder: null,
          versions: [],
          links: [],
          shareLinks: [],
          activities: [],
          suggestion: null,
        }),
      );
    }
    return new Response(JSON.stringify({}));
  };

  const webhardProjectData = await loadProjectWebhardPageData("project-sample-001", webhardLoaderFetch);
  assert.equal(webhardProjectData.dataSource, "api");
  assert.ok(
    webhardLoaderCalls.some((call) =>
      call.endsWith("/api/v1/files/file-asset-webhard-sample-001"),
    ),
  );

  const webhardActionCalls: Array<{ url: string; method: string }> = [];
  const webhardActionFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    webhardActionCalls.push({ url, method });
    if (url.endsWith("/api/v1/mail/messages/mail-message-draft/attachments/save-suggestions?project_id=project-sample-001")) {
      return new Response(
        JSON.stringify({
          projectId: "project-sample-001",
          folder: {
            id: "folder-mail",
            projectId: "project-sample-001",
            name: "메일 첨부",
            type: "mail_attachment",
            path: "/프로젝트 루트/09_메일첨부",
            displayOrder: 9,
            isSystem: true,
            isArchived: false,
            createdAt: "",
            updatedAt: "",
          },
          suggestedTags: ["mail_attachment"],
          linkedEntityType: "mail_message",
          linkedEntityId: "mail-message-draft",
        }),
      );
    }
    return new Response(JSON.stringify({ shareLink: { id: "share-link-001", isRevoked: true }, versions: [], suggestion: { id: "suggestion-001" } }));
  };

  await uploadWebhardFileDraft(
    {
      projectId: "project-sample-001",
      folderId: "folder-root-project-sample-001",
      fileName: "draft-upload.bin",
    },
    webhardActionFetch,
  );
  await createWebhardFolderDraft(
    {
      projectId: "project-sample-001",
      name: "발주처 전달본",
      type: "custom",
    },
    webhardActionFetch,
  );
  await classifyWebhardFileDraft("file-asset-webhard-sample-001", webhardActionFetch);
  await createWebhardShareLinkDraft(
    {
      projectId: "project-sample-001",
      fileId: "file-asset-webhard-sample-001",
      title: "공유본",
      permission: "view",
    },
    webhardActionFetch,
  );
  await revokeWebhardShareLinkDraft("share-link-001", webhardActionFetch);
  await restoreWebhardFileDraft("file-asset-webhard-sample-004", webhardActionFetch);
  await addWebhardFileVersionDraft(
    "file-asset-webhard-sample-001",
    { versionKind: "review", changeSummary: "검토본 추가", sizeBytes: 1 },
    webhardActionFetch,
  );
  await getMailAttachmentSaveSuggestionsDraft(
    "mail-message-draft",
    "project-sample-001",
    webhardActionFetch,
  );
  await saveMailAttachmentToWebhardDraft(
    "mail-message-draft",
    {
      projectId: "project-sample-001",
      fileName: "draft-attachment.pdf",
    },
    webhardActionFetch,
  );

  assert.ok(
    webhardActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/files/upload"),
    ),
  );
  const mailLoaderCalls: string[] = [];
  const mailLoaderFetch: typeof fetch = async (input) => {
    const url = String(input);
    mailLoaderCalls.push(url);
    if (url.endsWith("/api/v1/mail/accounts")) {
      return new Response(JSON.stringify([{ id: "mail-account-001", provider: "guest", mode: "guest_draft_mode", email: "guest@anc.local", displayName: "Guest", status: "active", isConnected: false, createdAt: "", updatedAt: "" }]));
    }
    if (url.includes("/api/v1/mail/threads")) {
      return new Response(JSON.stringify([{ thread: { id: "mail-thread-001", projectId: "project-sample-001", subject: "제출 메일", participantContactIds: [], linkedFindingIds: [], createdAt: "", updatedAt: "" }, latestMessage: { id: "mail-message-001", projectId: "project-sample-001", subject: "제출 메일", fromAddress: "reports@anc.local", toAddresses: ["owner1@example.com"], createdAt: "" }, unreadCount: 0, links: [] }]));
    }
    if (url.endsWith("/api/v1/mail/messages?folder=inbox") || url.endsWith("/api/v1/mail/messages?project_id=project-sample-001&folder=inbox")) {
      return new Response(JSON.stringify([{ id: "mail-message-001", projectId: "project-sample-001", subject: "제출 메일", fromAddress: "reports@anc.local", toAddresses: ["owner1@example.com"], createdAt: "" }]));
    }
    if (url.endsWith("/api/v1/mail/templates")) {
      return new Response(JSON.stringify([{ id: "mail-template-001", name: "제출", templateType: "submission", subjectTemplate: "{{documentTitle}}", bodyTemplate: "본문", variables: ["documentTitle"], createdAt: "", updatedAt: "" }]));
    }
    if (url.endsWith("/api/v1/mail/signatures")) {
      return new Response(JSON.stringify([{ id: "mail-signature-001", label: "기본", content: "A&C", isDefault: true, createdAt: "", updatedAt: "" }]));
    }
    if (url.endsWith("/api/v1/mail/threads/mail-thread-001")) {
      return new Response(JSON.stringify({ thread: { id: "mail-thread-001", projectId: "project-sample-001", subject: "제출 메일", participantContactIds: [], linkedFindingIds: [], createdAt: "", updatedAt: "" }, messages: [{ id: "mail-message-001", projectId: "project-sample-001", subject: "제출 메일", fromAddress: "reports@anc.local", toAddresses: ["owner1@example.com"], createdAt: "" }], attachments: [], links: [] }));
    }
    if (url.endsWith("/api/v1/mail/messages/mail-message-001")) {
      return new Response(JSON.stringify({ message: { id: "mail-message-001", projectId: "project-sample-001", subject: "제출 메일", fromAddress: "reports@anc.local", toAddresses: ["owner1@example.com"], createdAt: "" }, attachments: [], links: [] }));
    }
    if (url.includes("/api/v1/mail/accounts/") && url.endsWith("/sync-jobs")) {
      return new Response(JSON.stringify([{ id: "job-001", accountId: "mail-account-001", status: "completed", summary: "sync", startedAt: "" }]));
    }
    if (url.endsWith("/api/v1/documents/doc-sample-001/submission-mail/draft")) {
      return new Response(JSON.stringify({ draft: { id: "mail-draft-001", draftType: "submission_mail", mode: "connected_oauth_mode", documentId: "doc-sample-001", findingIds: [], toAddresses: ["owner1@example.com"], ccAddresses: [], subject: "제출", body: "본문", attachmentFileIds: ["file-001"], validationWarnings: [], createdAt: "", updatedAt: "" }, warnings: [] }));
    }
    return new Response(JSON.stringify([]));
  };

  const mailboxPageData = await loadMailboxPageData("project-sample-001", "inbox", mailLoaderFetch);
  assert.equal(mailboxPageData.dataSource, "api");
  const composePageData = await loadMailComposePageData("project-sample-001", mailLoaderFetch);
  assert.equal(composePageData.dataSource, "api");
  const threadPageData = await loadMailThreadPageData("mail-thread-001", mailLoaderFetch);
  assert.equal(threadPageData.dataSource, "api");
  const messagePageData = await loadMailMessagePageData("mail-message-001", mailLoaderFetch);
  assert.equal(messagePageData.dataSource, "api");
  const accountsPageData = await loadMailAccountsPageData(mailLoaderFetch);
  assert.equal(accountsPageData.dataSource, "api");
  const settingsPageData = await loadMailSettingsPageData(mailLoaderFetch);
  assert.equal(settingsPageData.dataSource, "api");
  const submissionComposerData = await loadSubmissionMailComposerPageData("doc-sample-001", mailLoaderFetch);
  assert.equal(submissionComposerData.dataSource, "api");
  const scheduleComposerData = await loadScheduleCoordinationMailComposerPageData("round-sample-001", mailLoaderFetch);
  assert.equal(scheduleComposerData.dataSource, "api");
  assert.ok(mailLoaderCalls.some((url) => url.includes("/api/v1/mail/threads")));
  assert.ok(
    mailLoaderCalls.some((url) => url.endsWith("/api/v1/inspection-rounds/round-sample-001/schedule-coordination-mail/draft")),
  );

  const mailActionCalls: Array<{ url: string; method: string }> = [];
  const mailActionFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    mailActionCalls.push({ url, method });
    if (url.endsWith("/api/v1/mail/oauth/google/start")) {
      return new Response(JSON.stringify({ provider: "google", authUrl: "https://accounts.google.com/o/oauth2/auth?client_id=draft", mode: "connected_oauth_mode" }));
    }
    if (url.endsWith("/api/v1/mail/accounts/guest")) {
      return new Response(JSON.stringify({ account: { id: "mail-account-001", provider: "guest", mode: "guest_draft_mode", email: "guest@anc.local", displayName: "Guest", status: "active", isConnected: false, createdAt: "", updatedAt: "" } }));
    }
    if (url.endsWith("/api/v1/mail/accounts/mail-account-001/sync")) {
      return new Response(JSON.stringify({ account: { id: "mail-account-001", provider: "google", mode: "connected_oauth_mode", email: "reports@anc.local", displayName: "Reports", status: "active", isConnected: true, createdAt: "", updatedAt: "" }, job: { id: "job-001", accountId: "mail-account-001", status: "completed", summary: "sync", startedAt: "" }, threads: [], messages: [] }));
    }
    if (url.endsWith("/api/v1/mail/drafts")) {
      return new Response(JSON.stringify({ draft: { id: "mail-draft-001", draftType: "general", mode: "guest_draft_mode", findingIds: [], toAddresses: [], ccAddresses: [], subject: "", body: "", attachmentFileIds: [], validationWarnings: [], createdAt: "", updatedAt: "" }, warnings: [] }));
    }
    if (url.endsWith("/generate")) {
      return new Response(JSON.stringify({ draft: { id: "mail-draft-001", draftType: "general", mode: "guest_draft_mode", findingIds: [], toAddresses: [], ccAddresses: [], subject: "", body: "", attachmentFileIds: [], validationWarnings: [], createdAt: "", updatedAt: "" }, warnings: ["ai_output_is_draft_only"] }));
    }
    if (url.endsWith("/validate")) {
      return new Response(JSON.stringify({ draftId: "mail-draft-001", recipientsValid: true, missingFields: [], warnings: [], sendBlocked: false, draft: { id: "mail-draft-001", draftType: "general", mode: "guest_draft_mode", findingIds: [], toAddresses: [], ccAddresses: [], subject: "", body: "", attachmentFileIds: [], validationWarnings: [], createdAt: "", updatedAt: "" } }));
    }
    if (url.endsWith("/send")) {
      return new Response(JSON.stringify({ draft: { id: "mail-draft-001", draftType: "general", mode: "guest_draft_mode", findingIds: [], toAddresses: [], ccAddresses: [], subject: "", body: "", attachmentFileIds: [], validationWarnings: [], createdAt: "", updatedAt: "" }, sendMode: "copy_only", warnings: [] }));
    }
    if (url.endsWith("/mark-read")) {
      return new Response(JSON.stringify({ message: { id: "mail-message-001", projectId: "project-sample-001", subject: "제출 메일", fromAddress: "reports@anc.local", toAddresses: ["owner1@example.com"], createdAt: "" } }));
    }
    if (url.endsWith("/classify")) {
      return new Response(JSON.stringify({ message: { id: "mail-message-001", projectId: "project-sample-001", subject: "제출 메일", fromAddress: "reports@anc.local", toAddresses: ["owner1@example.com"], createdAt: "" }, links: [], warnings: [] }));
    }
    if (url.endsWith("/link-entity")) {
      return new Response(JSON.stringify({ message: { id: "mail-message-001", projectId: "project-sample-001", subject: "제출 메일", fromAddress: "reports@anc.local", toAddresses: ["owner1@example.com"], createdAt: "" }, link: { id: "link-001" }, links: [] }));
    }
    if (url.endsWith("/save-to-webhard")) {
      return new Response(JSON.stringify({ attachment: { id: "mail-attachment-001", messageId: "mail-message-001", projectId: "project-sample-001", fileName: "첨부.pdf", mimeType: "application/pdf", sizeBytes: 1, createdAt: "" } }));
    }
    if (url.endsWith("/api/v1/documents/doc-sample-001/submission-mail/draft")) {
      return new Response(JSON.stringify({ draft: { id: "mail-draft-001", draftType: "submission_mail", mode: "connected_oauth_mode", documentId: "doc-sample-001", findingIds: [], toAddresses: ["owner1@example.com"], ccAddresses: [], subject: "제출", body: "본문", attachmentFileIds: ["file-001"], validationWarnings: [], createdAt: "", updatedAt: "" }, warnings: [] }));
    }
    if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/schedule-coordination-mail/draft")) {
      return new Response(JSON.stringify({ draft: { id: "mail-draft-schedule-001", draftType: "schedule_coordination", mode: "connected_oauth_mode", projectId: "project-sample-001", inspectionRoundId: "round-sample-001", findingIds: [], toAddresses: ["owner1@example.com"], ccAddresses: [], subject: "일정 협의", body: "본문", attachmentFileIds: [], validationWarnings: [], createdAt: "", updatedAt: "" }, warnings: [] }));
    }
    if (url.endsWith("/api/v1/mail/templates/mail-template-001") && method === "PATCH") {
      return new Response(JSON.stringify({ template: { id: "mail-template-001", name: "제출", templateType: "submission", subjectTemplate: "{{documentTitle}}", bodyTemplate: "본문", variables: ["documentTitle"], createdAt: "", updatedAt: "" } }));
    }
    return new Response(JSON.stringify({}));
  };

  await createGuestMailAccountDraft({ projectId: "project-sample-001" }, mailActionFetch);
  await startGoogleMailOAuthDraft(mailActionFetch);
  await syncMailAccountDraft("mail-account-001", mailActionFetch);
  await createMailDraftAction({ draftType: "general", projectId: "project-sample-001" }, mailActionFetch);
  await generateMailDraftAction("mail-draft-001", {}, mailActionFetch);
  await validateMailDraftAction("mail-draft-001", mailActionFetch);
  await sendMailDraftAction("mail-draft-001", {}, mailActionFetch);
  await markMailMessageReadDraft("mail-message-001", mailActionFetch);
  await classifyMailMessageDraft("mail-message-001", mailActionFetch);
  await linkMailMessageEntityDraft("mail-message-001", { projectId: "project-sample-001", entityType: "project", entityId: "project-sample-001" }, mailActionFetch);
  await saveMailboxAttachmentToWebhardDraft("mail-attachment-001", mailActionFetch);
  await createSubmissionMailDraftAction("doc-sample-001", {}, mailActionFetch);
  await createScheduleCoordinationMailDraftAction("round-sample-001", mailActionFetch);
  await updateMailTemplateDraft("mail-template-001", { subjectTemplate: "{{documentTitle}}" }, mailActionFetch);
  assert.ok(mailActionCalls.some((call) => call.url.endsWith("/api/v1/mail/accounts/guest") && call.method === "POST"));
  assert.ok(mailActionCalls.some((call) => call.url.endsWith("/api/v1/mail/drafts/mail-draft-001/validate") && call.method === "POST"));
  assert.ok(
    mailActionCalls.some(
      (call) => call.url.endsWith("/api/v1/inspection-rounds/round-sample-001/schedule-coordination-mail/draft") && call.method === "POST",
    ),
  );
  assert.ok(
    mailActionCalls.some(
      (call) => call.url.endsWith("/api/v1/mail/templates/mail-template-001") && call.method === "PATCH",
    ),
  );
  assert.ok(
    webhardActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/folders"),
    ),
  );
  assert.ok(
    webhardActionCalls.some(
      (call) =>
        call.method === "POST" && call.url.endsWith("/api/v1/files/file-asset-webhard-sample-001/classify"),
    ),
  );
  assert.ok(
    webhardActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/share-links"),
    ),
  );
  assert.ok(
    webhardActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/share-links/share-link-001/revoke"),
    ),
  );
  assert.ok(
    webhardActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/files/file-asset-webhard-sample-004/restore"),
    ),
  );
  assert.ok(
    webhardActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/files/file-asset-webhard-sample-001/versions"),
    ),
  );
  assert.ok(
    webhardActionCalls.some(
      (call) =>
        call.method === "GET" &&
        call.url.endsWith(
          "/api/v1/mail/messages/mail-message-draft/attachments/save-suggestions?project_id=project-sample-001",
        ),
    ),
  );
  assert.ok(
    webhardActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/mail/messages/mail-message-draft/attachments/save-to-webhard"),
    ),
  );

  const partiesMarkup = renderToStaticMarkup(
    await ProjectPartiesPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(partiesMarkup, /관계자 원장/);

  const contactsMarkup = renderToStaticMarkup(
    await ProjectContactsPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(contactsMarkup, /담당자 연락처/);

  const requirementsMarkup = renderToStaticMarkup(
    await ProjectRequirementsPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(requirementsMarkup, /프로젝트 원장 누락 정보/);

  const relatedMarkup = renderToStaticMarkup(
    await ProjectRelatedPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(relatedMarkup, /관련 업무 진입/);

  const historyMarkup = renderToStaticMarkup(
    await ProjectHistoryPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(historyMarkup, /프로젝트 이력/);

  const settingsMarkup = renderToStaticMarkup(
    await ProjectSettingsPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(settingsMarkup, /설정 탭/);

  const contractsMarkup = renderToStaticMarkup(
    await ProjectContractsPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(contractsMarkup, /계약\/견적 허브/);

  const newContractMarkup = renderToStaticMarkup(
    await NewContractPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(newContractMarkup, /신규 계약 초안/);

  const inspectionsMarkup = renderToStaticMarkup(
    await ProjectInspectionsPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(inspectionsMarkup, /점검회차 \/ 일정 관리/);

  const projectFindingsMarkup = renderToStaticMarkup(
    await ProjectFindingsPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(projectFindingsMarkup, /프로젝트 전체 지적사항/);

  const projectSafetyCostsMarkup = renderToStaticMarkup(
    await ProjectSafetyCostsPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(projectSafetyCostsMarkup, /프로젝트 안전관리비 목록/);

  const ownerMatrixMarkup = renderToStaticMarkup(
    await ProjectSafetyCostOwnerMatrixPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(ownerMatrixMarkup, /발주처별 안전관리비 비교/);

  const projectSafetyReportsMarkup = renderToStaticMarkup(
    await ProjectSafetyReportsPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(projectSafetyReportsMarkup, /이행확인 보고서 허브/);

  const newSafetyReportMarkup = renderToStaticMarkup(
    await NewSafetyReportPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(newSafetyReportMarkup, /초안 생성/);

  const projectSafetyManagementPlansMarkup = renderToStaticMarkup(
    await ProjectSafetyManagementPlansPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(projectSafetyManagementPlansMarkup, /안전관리계획서/);

  const newSafetyManagementPlanMarkup = renderToStaticMarkup(
    await NewSafetyManagementPlanPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(newSafetyManagementPlanMarkup, /초안 생성/);

  const projectSafetyHealthLedgersMarkup = renderToStaticMarkup(
    await ProjectSafetyHealthLedgersPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(projectSafetyHealthLedgersMarkup, /프로젝트 누적 안전보건대장/);

  const newSafetyHealthLedgerMarkup = renderToStaticMarkup(
    await NewSafetyHealthLedgerPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(newSafetyHealthLedgerMarkup, /안전보건대장 생성/);

  const newProjectFindingMarkup = renderToStaticMarkup(
    await NewProjectFindingPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(newProjectFindingMarkup, /수동 등록/);

  const inspectionScheduleMarkup = renderToStaticMarkup(
    await InspectionSchedulePage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(inspectionScheduleMarkup, /점검 일정 생성/);

  const newInspectionMarkup = renderToStaticMarkup(
    await NewInspectionRoundPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(newInspectionMarkup, /점검회차 수동 등록/);

  const inspectionSafetyCostsMarkup = renderToStaticMarkup(
    await InspectionSafetyCostsPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(inspectionSafetyCostsMarkup, /점검회차 안전관리비 목록/);

  const newSafetyCostMarkup = renderToStaticMarkup(
    await NewSafetyCostUsagePage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(newSafetyCostMarkup, /점검회차 안전관리비 입력/);

  const contractDetailMarkup = renderToStaticMarkup(
    await ContractDetailPage({
      params: Promise.resolve({ contractId: "contract-sample-001" }),
    }),
  );
  assert.match(contractDetailMarkup, /계약 상세/);

  const contractEditMarkup = renderToStaticMarkup(
    await ContractEditPage({
      params: Promise.resolve({ contractId: "contract-sample-001" }),
    }),
  );
  assert.match(contractEditMarkup, /계약 수정/);

  const contractPreviewMarkup = renderToStaticMarkup(
    await ContractPreviewPage({
      params: Promise.resolve({ contractId: "contract-sample-001" }),
    }),
  );
  assert.match(contractPreviewMarkup, /계약 미리보기/);

  const contractPaymentsMarkup = renderToStaticMarkup(
    await ContractPaymentsPage({
      params: Promise.resolve({ contractId: "contract-sample-001" }),
    }),
  );
  assert.match(contractPaymentsMarkup, /지급조건/);

  const contractFilesMarkup = renderToStaticMarkup(
    await ContractFilesPage({
      params: Promise.resolve({ contractId: "contract-sample-001" }),
    }),
  );
  assert.match(contractFilesMarkup, /계약 파일/);

  const contractChangesMarkup = renderToStaticMarkup(
    await ContractChangesPage({
      params: Promise.resolve({ contractId: "contract-sample-001" }),
    }),
  );
  assert.match(contractChangesMarkup, /계약 변경 이력/);

  const inspectionRoundMarkup = renderToStaticMarkup(
    await InspectionRoundPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(inspectionRoundMarkup, /Inspection Round: 1회/);

  const inspectionFindingsMarkup = renderToStaticMarkup(
    await InspectionRoundFindingsPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(inspectionFindingsMarkup, /회차 지적사항/);

  const newRoundFindingMarkup = renderToStaticMarkup(
    await NewRoundFindingPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(newRoundFindingMarkup, /회차 지적사항 등록/);

  const checklistMarkup = renderToStaticMarkup(
    await ChecklistPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(checklistMarkup, /체크리스트 · round-sample-001/);

  const checklistMobileMarkup = renderToStaticMarkup(
    await ChecklistMobilePage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(checklistMobileMarkup, /체크리스트 모바일 입력/);

  const checklistReviewMarkup = renderToStaticMarkup(
    await ChecklistReviewPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(checklistReviewMarkup, /체크리스트 검토/);

  const photoLedgerRoundMarkup = renderToStaticMarkup(
    await PhotoLedgerRoundPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(photoLedgerRoundMarkup, /사진대지 항목/);

  const newPhotoLedgerMarkup = renderToStaticMarkup(
    await NewPhotoLedgerPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(newPhotoLedgerMarkup, /사진대지 초안/);

  const inspectionEditMarkup = renderToStaticMarkup(
    await InspectionRoundEditPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(inspectionEditMarkup, /점검회차 수정/);

  const inspectionTasksMarkup = renderToStaticMarkup(
    await InspectionTasksPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(inspectionTasksMarkup, /회차 업무/);

  const inspectionOwnerReportsMarkup = renderToStaticMarkup(
    await InspectionOwnerReportsPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(inspectionOwnerReportsMarkup, /발주처별 보고서/);

  const inspectionAttachmentsMarkup = renderToStaticMarkup(
    await InspectionAttachmentsPage({
      params: Promise.resolve({ inspectionRoundId: "round-sample-001" }),
    }),
  );
  assert.match(inspectionAttachmentsMarkup, /공사일정 첨부/);

  const inspectionCalendarMarkup = renderToStaticMarkup(await InspectionCalendarPage());
  assert.match(inspectionCalendarMarkup, /점검 캘린더/);

  const checklistSessionMarkup = renderToStaticMarkup(
    await ChecklistSessionPage({
      params: Promise.resolve({ sessionId: "checklist-session-sample-001" }),
    }),
  );
  assert.match(checklistSessionMarkup, /Checklist Session/);

  const checklistSessionResultsMarkup = renderToStaticMarkup(
    await ChecklistSessionResultsPage({
      params: Promise.resolve({ sessionId: "checklist-session-sample-001" }),
    }),
  );
  assert.match(checklistSessionResultsMarkup, /체크리스트 결과 목록/);

  const checklistCandidatesMarkup = renderToStaticMarkup(
    await ChecklistFindingCandidatesPage({
      params: Promise.resolve({ sessionId: "checklist-session-sample-001" }),
    }),
  );
  assert.match(checklistCandidatesMarkup, /지적사항 후보/);

  const checklistPhotosMarkup = renderToStaticMarkup(
    await ChecklistPhotosPage({
      params: Promise.resolve({ sessionId: "checklist-session-sample-001" }),
    }),
  );
  assert.match(checklistPhotosMarkup, /체크리스트 사진/);

  const checklistTemplatesMarkup = renderToStaticMarkup(
    await ProjectChecklistTemplatesPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(checklistTemplatesMarkup, /프로젝트 체크리스트 템플릿/);

  const adminChecklistTemplatesMarkup = renderToStaticMarkup(await AdminChecklistTemplatesPage());
  assert.match(adminChecklistTemplatesMarkup, /체크리스트 템플릿 관리자/);

  const adminChecklistTemplateDetailMarkup = renderToStaticMarkup(
    await AdminChecklistTemplateDetailPage({
      params: Promise.resolve({ templateId: "checklist-template-sample-001" }),
    }),
  );
  assert.match(adminChecklistTemplateDetailMarkup, /체크리스트 템플릿 상세/);

  const adminMarkup = renderToStaticMarkup(await AdminPage());
  assert.match(adminMarkup, /관리자 \/ 템플릿 \/ 프롬프트/);

  const adminTemplatesMarkup = renderToStaticMarkup(await AdminTemplatesPage());
  assert.match(adminTemplatesMarkup, /문서 템플릿/);

  const adminTemplateDetailMarkup = renderToStaticMarkup(
    await AdminDocumentTemplateDetailPage({
      params: Promise.resolve({ templateId: "document-template-sample-001" }),
    }),
  );
  assert.match(adminTemplateDetailMarkup, /템플릿 상세/);

  const adminTemplateVersionsMarkup = renderToStaticMarkup(
    await AdminDocumentTemplateVersionsPage({
      params: Promise.resolve({ templateId: "document-template-sample-001" }),
    }),
  );
  assert.match(adminTemplateVersionsMarkup, /템플릿 버전 이력/);

  const adminTemplateVariablesMarkup = renderToStaticMarkup(
    await AdminDocumentTemplateVariablesPage({
      params: Promise.resolve({ templateId: "document-template-sample-001" }),
    }),
  );
  assert.match(adminTemplateVariablesMarkup, /템플릿 변수 맵/);

  const adminTemplatePreviewMarkup = renderToStaticMarkup(
    await AdminDocumentTemplatePreviewPage({
      params: Promise.resolve({ templateId: "document-template-sample-001" }),
    }),
  );
  assert.match(adminTemplatePreviewMarkup, /템플릿 미리보기/);

  const adminPromptsMarkup = renderToStaticMarkup(await AdminPromptsPage());
  assert.match(adminPromptsMarkup, /프롬프트 저장소/);

  const adminApprovalTemplatesMarkup = renderToStaticMarkup(await AdminApprovalTemplatesPage());
  assert.match(adminApprovalTemplatesMarkup, /Approval Templates/);

  const adminApprovalTemplateDetailMarkup = renderToStaticMarkup(
    await AdminApprovalTemplateDetailPage({
      params: Promise.resolve({ templateId: "approval-template-safety-report-001" }),
    }),
  );
  assert.match(adminApprovalTemplateDetailMarkup, /Approval Template/);

  const adminPromptDetailMarkup = renderToStaticMarkup(
    await AdminPromptDetailPage({
      params: Promise.resolve({ promptId: "prompt-template-sample-001" }),
    }),
  );
  assert.match(adminPromptDetailMarkup, /프롬프트 상세/);

  const adminPromptVersionsMarkup = renderToStaticMarkup(
    await AdminPromptVersionsPage({
      params: Promise.resolve({ promptId: "prompt-template-sample-001" }),
    }),
  );
  assert.match(adminPromptVersionsMarkup, /프롬프트 버전 이력/);

  const adminPromptRunMarkup = renderToStaticMarkup(
    await AdminPromptRunPage({
      params: Promise.resolve({ promptId: "prompt-template-sample-001" }),
    }),
  );
  assert.match(adminPromptRunMarkup, /프롬프트 실행 콘솔/);

  const adminPromptTestCasesMarkup = renderToStaticMarkup(
    await AdminPromptTestCasesPage({
      params: Promise.resolve({ promptId: "prompt-template-sample-001" }),
    }),
  );
  assert.match(adminPromptTestCasesMarkup, /프롬프트 테스트 케이스/);

  const adminChecklistsMarkup = renderToStaticMarkup(await AdminChecklistsPage());
  assert.match(adminChecklistsMarkup, /체크리스트 템플릿 관리자/);

  const adminUsersMarkup = renderToStaticMarkup(await AdminUsersPage());
  assert.match(adminUsersMarkup, /관리자 계정/);

  const adminRolesMarkup = renderToStaticMarkup(await AdminRolesPage());
  assert.match(adminRolesMarkup, /역할 \/ 권한/);

  const adminCompanyMarkup = renderToStaticMarkup(await AdminCompanyPage());
  assert.match(adminCompanyMarkup, /회사 정보/);

  const adminPhraseLibraryMarkup = renderToStaticMarkup(await AdminPhraseLibraryPage());
  assert.match(adminPhraseLibraryMarkup, /표준 문구/);

  const adminLegalClausesMarkup = renderToStaticMarkup(await AdminLegalClausesPage());
  assert.match(adminLegalClausesMarkup, /법령 문구/);

  const adminMailTemplatesMarkup = renderToStaticMarkup(await AdminMailTemplatesPage());
  assert.match(adminMailTemplatesMarkup, /메일 템플릿/);

  const adminSignatureAssetsMarkup = renderToStaticMarkup(await AdminSignatureAssetsPage());
  assert.match(adminSignatureAssetsMarkup, /Signature Assets/);

  const adminSignatureAssetDetailMarkup = renderToStaticMarkup(
    await AdminSignatureAssetDetailPage({
      params: Promise.resolve({ assetId: "signature-asset-sample-001" }),
    }),
  );
  assert.match(adminSignatureAssetDetailMarkup, /Signature Asset/);

  const adminWebhardPoliciesMarkup = renderToStaticMarkup(await AdminWebhardPoliciesPage());
  assert.match(adminWebhardPoliciesMarkup, /웹하드 정책/);

  const adminAuditLogsMarkup = renderToStaticMarkup(await AdminAuditLogsPage());
  assert.match(adminAuditLogsMarkup, /관리자 감사로그/);

  const estimatesMarkup = renderToStaticMarkup(
    await ProjectEstimatesPage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(estimatesMarkup, /견적 목록/);

  const newEstimateMarkup = renderToStaticMarkup(
    await NewEstimatePage({
      params: Promise.resolve({ projectId: "project-sample-001" }),
    }),
  );
  assert.match(newEstimateMarkup, /신규 견적 초안/);

  const estimateDetailMarkup = renderToStaticMarkup(
    await EstimateDetailPage({
      params: Promise.resolve({ estimateId: "estimate-sample-001" }),
    }),
  );
  assert.match(estimateDetailMarkup, /견적 상세/);

  const estimatePreviewMarkup = renderToStaticMarkup(
    await EstimatePreviewPage({
      params: Promise.resolve({ estimateId: "estimate-sample-001" }),
    }),
  );
  assert.match(estimatePreviewMarkup, /견적 미리보기/);

  const findingDetailMarkup = renderToStaticMarkup(
    await FindingDetailPage({
      params: Promise.resolve({ findingId: "finding-sample-001" }),
    }),
  );
  assert.match(findingDetailMarkup, /지적사항 상세/);

  const findingEditMarkup = renderToStaticMarkup(
    await FindingEditPage({
      params: Promise.resolve({ findingId: "finding-sample-001" }),
    }),
  );
  assert.match(findingEditMarkup, /지적사항 수정/);

  const findingActionsMarkup = renderToStaticMarkup(
    await FindingActionsPage({
      params: Promise.resolve({ findingId: "finding-sample-001" }),
    }),
  );
  assert.match(findingActionsMarkup, /조치현황/);

  const findingPhotosMarkup = renderToStaticMarkup(
    await FindingPhotosPage({
      params: Promise.resolve({ findingId: "finding-sample-001" }),
    }),
  );
  assert.match(findingPhotosMarkup, /사진 관리/);

  const findingVerifyMarkup = renderToStaticMarkup(
    await FindingVerifyPage({
      params: Promise.resolve({ findingId: "finding-sample-001" }),
    }),
  );
  assert.match(findingVerifyMarkup, /조치 확인/);

  const safetyCostDetailMarkup = renderToStaticMarkup(
    await SafetyCostDetailPage({
      params: Promise.resolve({ usageId: "safety-cost-usage-sample-001" }),
    }),
  );
  assert.match(safetyCostDetailMarkup, /안전관리비 상세/);

  const safetyCostEditMarkup = renderToStaticMarkup(
    await SafetyCostEditPage({
      params: Promise.resolve({ usageId: "safety-cost-usage-sample-001" }),
    }),
  );
  assert.match(safetyCostEditMarkup, /안전관리비 수정/);

  const safetyCostEvidenceMarkup = renderToStaticMarkup(
    await SafetyCostEvidencePage({
      params: Promise.resolve({ usageId: "safety-cost-usage-sample-001" }),
    }),
  );
  assert.match(safetyCostEvidenceMarkup, /증빙파일 목록/);

  const safetyCostReviewMarkup = renderToStaticMarkup(
    await SafetyCostReviewPage({
      params: Promise.resolve({ usageId: "safety-cost-usage-sample-001" }),
    }),
  );
  assert.match(safetyCostReviewMarkup, /검토 \/ 확정/);

  const safetyCostPreviewMarkup = renderToStaticMarkup(
    await SafetyCostPreviewPage({
      params: Promise.resolve({ usageId: "safety-cost-usage-sample-001" }),
    }),
  );
  assert.match(safetyCostPreviewMarkup, /산업안전보건관리비 사용 실적/);

  const safetyCostHistoryMarkup = renderToStaticMarkup(
    await SafetyCostHistoryPage({
      params: Promise.resolve({ usageId: "safety-cost-usage-sample-001" }),
    }),
  );
  assert.match(safetyCostHistoryMarkup, /변경 이력/);

  const photoLedgerDetailMarkup = renderToStaticMarkup(
    await PhotoLedgerDetailPage({
      params: Promise.resolve({ photoLedgerId: "photo-ledger-sample-001" }),
    }),
  );
  assert.match(photoLedgerDetailMarkup, /사진대지 상세/);

  const photoLedgerEditMarkup = renderToStaticMarkup(
    await PhotoLedgerEditPage({
      params: Promise.resolve({ photoLedgerId: "photo-ledger-sample-001" }),
    }),
  );
  assert.match(photoLedgerEditMarkup, /사진대지 편집/);

  const photoLedgerPreviewMarkup = renderToStaticMarkup(
    await PhotoLedgerPreviewPage({
      params: Promise.resolve({ photoLedgerId: "photo-ledger-sample-001" }),
    }),
  );
  assert.match(photoLedgerPreviewMarkup, /A4 미리보기/);

  const photoLedgerExportMarkup = renderToStaticMarkup(
    await PhotoLedgerExportPage({
      params: Promise.resolve({ photoLedgerId: "photo-ledger-sample-001" }),
    }),
  );
  assert.match(photoLedgerExportMarkup, /export 전 검토/);

  const documentPhotoLedgerSectionMarkup = renderToStaticMarkup(
    await DocumentPhotoLedgerSectionPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(documentPhotoLedgerSectionMarkup, /photo_ledger section/);

  const safetyReportDetailMarkup = renderToStaticMarkup(
    await SafetyReportDetailPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(safetyReportDetailMarkup, /보고서 상세/);

  const safetyReportEditMarkup = renderToStaticMarkup(
    await SafetyReportEditPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(safetyReportEditMarkup, /보고서 편집/);

  const safetyReportPreviewMarkup = renderToStaticMarkup(
    await SafetyReportPreviewPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(safetyReportPreviewMarkup, /A4 미리보기/);
  assert.match(safetyReportPreviewMarkup, /PageNavigator/);
  assert.match(safetyReportPreviewMarkup, /PrintLayoutWarningPanel/);

  const safetyReportSectionsMarkup = renderToStaticMarkup(
    await SafetyReportSectionsPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(safetyReportSectionsMarkup, /섹션 관리/);
  assert.match(safetyReportSectionsMarkup, /linked data 새로고침/);

  const safetyReportVariablesMarkup = renderToStaticMarkup(
    await SafetyReportVariablesPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(safetyReportVariablesMarkup, /변수 관리/);

  const safetyReportExportMarkup = renderToStaticMarkup(
    await SafetyReportExportPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(safetyReportExportMarkup, /최종본 export/);

  const safetyReportSubmissionMarkup = renderToStaticMarkup(
    await SafetyReportSubmissionPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(safetyReportSubmissionMarkup, /제출/);
  assert.match(safetyReportSubmissionMarkup, /SubmittedFileCard/);

  const safetyManagementPlanDetailMarkup = renderToStaticMarkup(
    await SafetyManagementPlanDetailPage({
      params: Promise.resolve({ documentId: "safety-management-plan-sample-001" }),
    }),
  );
  assert.match(safetyManagementPlanDetailMarkup, /안전관리계획서 상세|안전관리계획서/);

  const safetyManagementPlanEditMarkup = renderToStaticMarkup(
    await SafetyManagementPlanEditPage({
      params: Promise.resolve({ documentId: "safety-management-plan-sample-001" }),
    }),
  );
  assert.match(safetyManagementPlanEditMarkup, /편집/);

  const safetyManagementPlanPreviewMarkup = renderToStaticMarkup(
    await SafetyManagementPlanPreviewPage({
      params: Promise.resolve({ documentId: "safety-management-plan-sample-001" }),
    }),
  );
  assert.match(safetyManagementPlanPreviewMarkup, /A4 미리보기/);

  const safetyManagementPlanSectionsMarkup = renderToStaticMarkup(
    await SafetyManagementPlanSectionsPage({
      params: Promise.resolve({ documentId: "safety-management-plan-sample-001" }),
    }),
  );
  assert.match(safetyManagementPlanSectionsMarkup, /섹션 관리/);

  const safetyManagementPlanRisksMarkup = renderToStaticMarkup(
    await SafetyManagementPlanRisksPage({
      params: Promise.resolve({ documentId: "safety-management-plan-sample-001" }),
    }),
  );
  assert.match(safetyManagementPlanRisksMarkup, /위험요인/);

  const safetyManagementPlanOrganizationMarkup = renderToStaticMarkup(
    await SafetyManagementPlanOrganizationPage({
      params: Promise.resolve({ documentId: "safety-management-plan-sample-001" }),
    }),
  );
  assert.match(safetyManagementPlanOrganizationMarkup, /안전관리조직/);

  const safetyManagementPlanEducationMarkup = renderToStaticMarkup(
    await SafetyManagementPlanEducationPage({
      params: Promise.resolve({ documentId: "safety-management-plan-sample-001" }),
    }),
  );
  assert.match(safetyManagementPlanEducationMarkup, /안전교육 계획/);

  const safetyManagementPlanEmergencyMarkup = renderToStaticMarkup(
    await SafetyManagementPlanEmergencyPage({
      params: Promise.resolve({ documentId: "safety-management-plan-sample-001" }),
    }),
  );
  assert.match(safetyManagementPlanEmergencyMarkup, /비상대응 계획/);

  const safetyManagementPlanAttachmentsMarkup = renderToStaticMarkup(
    await SafetyManagementPlanAttachmentsPage({
      params: Promise.resolve({ documentId: "safety-management-plan-sample-001" }),
    }),
  );
  assert.match(safetyManagementPlanAttachmentsMarkup, /첨부자료/);

  const safetyManagementPlanExportMarkup = renderToStaticMarkup(
    await SafetyManagementPlanExportPage({
      params: Promise.resolve({ documentId: "safety-management-plan-sample-001" }),
    }),
  );
  assert.match(safetyManagementPlanExportMarkup, /최종본 export/);

  const safetyHealthLedgerDetailMarkup = renderToStaticMarkup(
    await SafetyHealthLedgerDetailPage({
      params: Promise.resolve({ documentId: "safety-health-ledger-sample-001" }),
    }),
  );
  assert.match(safetyHealthLedgerDetailMarkup, /안전보건대장 상세/);

  const safetyHealthLedgerEditMarkup = renderToStaticMarkup(
    await SafetyHealthLedgerEditPage({
      params: Promise.resolve({ documentId: "safety-health-ledger-sample-001" }),
    }),
  );
  assert.match(safetyHealthLedgerEditMarkup, /안전보건대장 편집/);

  const safetyHealthLedgerRisksMarkup = renderToStaticMarkup(
    await SafetyHealthLedgerRisksPage({
      params: Promise.resolve({ documentId: "safety-health-ledger-sample-001" }),
    }),
  );
  assert.match(safetyHealthLedgerRisksMarkup, /위험요인 register/);

  const safetyHealthLedgerMeasuresMarkup = renderToStaticMarkup(
    await SafetyHealthLedgerMeasuresPage({
      params: Promise.resolve({ documentId: "safety-health-ledger-sample-001" }),
    }),
  );
  assert.match(safetyHealthLedgerMeasuresMarkup, /감소대책/);

  const safetyHealthLedgerInspectionsMarkup = renderToStaticMarkup(
    await SafetyHealthLedgerInspectionsPage({
      params: Promise.resolve({ documentId: "safety-health-ledger-sample-001" }),
    }),
  );
  assert.match(safetyHealthLedgerInspectionsMarkup, /점검이력/);

  const safetyHealthLedgerFindingsMarkup = renderToStaticMarkup(
    await SafetyHealthLedgerFindingsPage({
      params: Promise.resolve({ documentId: "safety-health-ledger-sample-001" }),
    }),
  );
  assert.match(safetyHealthLedgerFindingsMarkup, /지적사항 이력/);

  const safetyHealthLedgerSafetyCostsMarkup = renderToStaticMarkup(
    await SafetyHealthLedgerSafetyCostsPage({
      params: Promise.resolve({ documentId: "safety-health-ledger-sample-001" }),
    }),
  );
  assert.match(safetyHealthLedgerSafetyCostsMarkup, /산안비 이력/);

  const safetyHealthLedgerAttachmentsMarkup = renderToStaticMarkup(
    await SafetyHealthLedgerAttachmentsPage({
      params: Promise.resolve({ documentId: "safety-health-ledger-sample-001" }),
    }),
  );
  assert.match(safetyHealthLedgerAttachmentsMarkup, /첨부자료/);

  const safetyHealthLedgerPreviewMarkup = renderToStaticMarkup(
    await SafetyHealthLedgerPreviewPage({
      params: Promise.resolve({ documentId: "safety-health-ledger-sample-001" }),
    }),
  );
  assert.match(safetyHealthLedgerPreviewMarkup, /A4 문서 preview/);
  assert.match(safetyHealthLedgerPreviewMarkup, /PageNavigator/);
  assert.match(safetyHealthLedgerPreviewMarkup, /PrintLayoutWarningPanel/);

  const safetyHealthLedgerExportMarkup = renderToStaticMarkup(
    await SafetyHealthLedgerExportPage({
      params: Promise.resolve({ documentId: "safety-health-ledger-sample-001" }),
    }),
  );
  assert.match(safetyHealthLedgerExportMarkup, /export 전 검토/);

  const safetyHealthLedgerVersionsMarkup = renderToStaticMarkup(
    await SafetyHealthLedgerVersionsPage({
      params: Promise.resolve({ documentId: "safety-health-ledger-sample-001" }),
    }),
  );
  assert.match(safetyHealthLedgerVersionsMarkup, /버전 이력/);

  const ownerReportTaskDocumentMarkup = renderToStaticMarkup(
    await OwnerReportTaskDocumentPage({
      params: Promise.resolve({
        inspectionRoundId: "round-sample-001",
        ownerReportTaskId: "owner-report-task-001-01",
      }),
    }),
  );
  assert.match(ownerReportTaskDocumentMarkup, /발주처 보고서 작업/);

  const documentSafetyCostSectionMarkup = renderToStaticMarkup(
    await DocumentSafetyCostSectionPage({
      params: Promise.resolve({ documentId: "doc-sample-001" }),
    }),
  );
  assert.match(documentSafetyCostSectionMarkup, /보고서 산안비 섹션/);

  assert.deepEqual(
    globalNavigation.map((item) => item.route),
    ["/dashboard", "/projects", "/webhard", "/mail", "/admin"],
  );

  const expectedRoutes = [
    "../client/app/projects/[projectId]/overview/page.tsx",
    "../client/app/projects/[projectId]/parties/page.tsx",
    "../client/app/projects/[projectId]/contacts/page.tsx",
    "../client/app/projects/[projectId]/requirements/page.tsx",
    "../client/app/projects/[projectId]/related/page.tsx",
    "../client/app/projects/[projectId]/history/page.tsx",
    "../client/app/projects/[projectId]/settings/page.tsx",
    "../client/app/projects/[projectId]/contracts/page.tsx",
    "../client/app/projects/[projectId]/contracts/new/page.tsx",
    "../client/app/projects/[projectId]/documents/safety-reports/page.tsx",
    "../client/app/projects/[projectId]/documents/safety-reports/new/page.tsx",
    "../client/app/projects/[projectId]/documents/safety-management-plans/page.tsx",
    "../client/app/projects/[projectId]/documents/safety-management-plans/new/page.tsx",
    "../client/app/projects/[projectId]/documents/safety-health-ledgers/page.tsx",
    "../client/app/projects/[projectId]/documents/safety-health-ledgers/new/page.tsx",
    "../client/app/projects/[projectId]/findings/page.tsx",
    "../client/app/projects/[projectId]/findings/new/page.tsx",
    "../client/app/projects/[projectId]/safety-costs/page.tsx",
    "../client/app/projects/[projectId]/safety-costs/owner-matrix/page.tsx",
    "../client/app/projects/[projectId]/inspections/page.tsx",
    "../client/app/projects/[projectId]/inspections/schedule/page.tsx",
    "../client/app/projects/[projectId]/inspections/new/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/findings/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/findings/new/page.tsx",
    "../client/app/contracts/[contractId]/page.tsx",
    "../client/app/contracts/[contractId]/edit/page.tsx",
    "../client/app/contracts/[contractId]/preview/page.tsx",
    "../client/app/contracts/[contractId]/payments/page.tsx",
    "../client/app/contracts/[contractId]/files/page.tsx",
    "../client/app/contracts/[contractId]/changes/page.tsx",
    "../client/app/projects/[projectId]/estimates/page.tsx",
    "../client/app/projects/[projectId]/estimates/new/page.tsx",
    "../client/app/estimates/[estimateId]/page.tsx",
    "../client/app/estimates/[estimateId]/preview/page.tsx",
    "../client/app/projects/[projectId]/safety-management-plans/page.tsx",
    "../client/app/projects/[projectId]/safety-management-plans/new/page.tsx",
    "../client/app/projects/[projectId]/safety-health-ledgers/page.tsx",
    "../client/app/projects/[projectId]/safety-health-ledgers/new/page.tsx",
    "../client/app/documents/[documentId]/approval/page.tsx",
    "../client/app/documents/[documentId]/signature/page.tsx",
    "../client/app/documents/[documentId]/submission/page.tsx",
    "../client/app/documents/safety-reports/[documentId]/page.tsx",
    "../client/app/documents/safety-reports/[documentId]/edit/page.tsx",
    "../client/app/documents/safety-reports/[documentId]/preview/page.tsx",
    "../client/app/documents/safety-reports/[documentId]/sections/page.tsx",
    "../client/app/documents/safety-reports/[documentId]/variables/page.tsx",
    "../client/app/documents/safety-reports/[documentId]/export/page.tsx",
    "../client/app/documents/safety-reports/[documentId]/submission/page.tsx",
    "../client/app/documents/safety-management-plans/[documentId]/page.tsx",
    "../client/app/documents/safety-management-plans/[documentId]/edit/page.tsx",
    "../client/app/documents/safety-management-plans/[documentId]/preview/page.tsx",
    "../client/app/documents/safety-management-plans/[documentId]/sections/page.tsx",
    "../client/app/documents/safety-management-plans/[documentId]/risks/page.tsx",
    "../client/app/documents/safety-management-plans/[documentId]/organization/page.tsx",
    "../client/app/documents/safety-management-plans/[documentId]/education/page.tsx",
    "../client/app/documents/safety-management-plans/[documentId]/emergency/page.tsx",
    "../client/app/documents/safety-management-plans/[documentId]/attachments/page.tsx",
    "../client/app/documents/safety-management-plans/[documentId]/export/page.tsx",
    "../client/app/documents/safety-health-ledgers/[documentId]/page.tsx",
    "../client/app/documents/safety-health-ledgers/[documentId]/edit/page.tsx",
    "../client/app/documents/safety-health-ledgers/[documentId]/risks/page.tsx",
    "../client/app/documents/safety-health-ledgers/[documentId]/measures/page.tsx",
    "../client/app/documents/safety-health-ledgers/[documentId]/inspections/page.tsx",
    "../client/app/documents/safety-health-ledgers/[documentId]/findings/page.tsx",
    "../client/app/documents/safety-health-ledgers/[documentId]/safety-costs/page.tsx",
    "../client/app/documents/safety-health-ledgers/[documentId]/attachments/page.tsx",
    "../client/app/documents/safety-health-ledgers/[documentId]/preview/page.tsx",
    "../client/app/documents/safety-health-ledgers/[documentId]/export/page.tsx",
    "../client/app/documents/safety-health-ledgers/[documentId]/versions/page.tsx",
    "../client/app/safety-management-plans/[planId]/page.tsx",
    "../client/app/safety-management-plans/[planId]/edit/page.tsx",
    "../client/app/safety-management-plans/[planId]/preview/page.tsx",
    "../client/app/safety-management-plans/[planId]/sections/page.tsx",
    "../client/app/safety-management-plans/[planId]/risks/page.tsx",
    "../client/app/safety-management-plans/[planId]/organization/page.tsx",
    "../client/app/safety-management-plans/[planId]/education/page.tsx",
    "../client/app/safety-management-plans/[planId]/emergency/page.tsx",
    "../client/app/safety-management-plans/[planId]/attachments/page.tsx",
    "../client/app/safety-management-plans/[planId]/export/page.tsx",
    "../client/app/safety-health-ledgers/[ledgerId]/page.tsx",
    "../client/app/safety-health-ledgers/[ledgerId]/edit/page.tsx",
    "../client/app/safety-health-ledgers/[ledgerId]/risks/page.tsx",
    "../client/app/safety-health-ledgers/[ledgerId]/measures/page.tsx",
    "../client/app/safety-health-ledgers/[ledgerId]/inspections/page.tsx",
    "../client/app/safety-health-ledgers/[ledgerId]/findings/page.tsx",
    "../client/app/safety-health-ledgers/[ledgerId]/safety-costs/page.tsx",
    "../client/app/safety-health-ledgers/[ledgerId]/attachments/page.tsx",
    "../client/app/safety-health-ledgers/[ledgerId]/preview/page.tsx",
    "../client/app/safety-health-ledgers/[ledgerId]/export/page.tsx",
    "../client/app/safety-health-ledgers/[ledgerId]/versions/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/checklist/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/checklist/mobile/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/checklist/review/page.tsx",
    "../client/app/checklist-sessions/[sessionId]/page.tsx",
    "../client/app/checklist-sessions/[sessionId]/results/page.tsx",
    "../client/app/checklist-sessions/[sessionId]/finding-candidates/page.tsx",
    "../client/app/checklist-sessions/[sessionId]/photos/page.tsx",
    "../client/app/projects/[projectId]/checklist-templates/page.tsx",
    "../client/app/projects/[projectId]/inspections/[inspectionRoundId]/checklist/page.tsx",
    "../client/app/admin/checklist-templates/page.tsx",
    "../client/app/admin/checklist-templates/[templateId]/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/edit/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/tasks/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/owner-reports/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/attachments/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/findings/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/photo-ledger/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/photo-ledger/new/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/safety-costs/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/safety-costs/new/page.tsx",
    "../client/app/inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document/page.tsx",
    "../client/app/calendar/inspections/page.tsx",
    "../client/app/findings/[findingId]/page.tsx",
    "../client/app/findings/[findingId]/edit/page.tsx",
    "../client/app/findings/[findingId]/actions/page.tsx",
    "../client/app/findings/[findingId]/photos/page.tsx",
    "../client/app/findings/[findingId]/verify/page.tsx",
    "../client/app/photo-ledgers/[photoLedgerId]/page.tsx",
    "../client/app/photo-ledgers/[photoLedgerId]/edit/page.tsx",
    "../client/app/photo-ledgers/[photoLedgerId]/preview/page.tsx",
    "../client/app/photo-ledgers/[photoLedgerId]/export/page.tsx",
    "../client/app/safety-costs/[usageId]/page.tsx",
    "../client/app/safety-costs/[usageId]/edit/page.tsx",
    "../client/app/safety-costs/[usageId]/evidence/page.tsx",
    "../client/app/safety-costs/[usageId]/review/page.tsx",
    "../client/app/safety-costs/[usageId]/preview/page.tsx",
    "../client/app/safety-costs/[usageId]/history/page.tsx",
    "../client/app/documents/safety-reports/[documentId]/sections/photo_ledger/page.tsx",
    "../client/app/documents/safety-reports/[documentId]/sections/safety_cost_usage/page.tsx",
    "../client/app/documents/safety-reports/[documentId]/safety-cost-usage/page.tsx",
  ];

  expectedRoutes.forEach((filePath) => {
    assert.equal(existsSync(new URL(filePath, import.meta.url)), true);
  });

  const apiClient = createAncErpApiClient({
    baseUrl: "http://localhost:8010/",
    fetchImpl: async (input, init) => {
      const url = String(input);

      if (url.endsWith("/health")) {
        return new Response(
          JSON.stringify({
            status: "ok",
            service: "anc-erp-server",
            rootEntity: "Project",
            version: "0.1.0",
          }),
        );
      }

      if (url.endsWith("/api/v1/projects")) {
        return new Response(
          JSON.stringify([
            {
              project: {
                id: "project-sample-001",
                projectName: "리움미술관 승강기 교체공사",
                siteName: "리움미술관",
                siteAddress: "서울시 용산구",
                constructionType: "승강기 교체공사",
                status: "active",
                createdAt: "2026-05-01T09:00:00+09:00",
                updatedAt: "2026-05-01T09:00:00+09:00",
              },
              ownerNames: ["삼성문화재단", "삼성생명공익재단"],
              contractorNames: ["현대엘리베이터(주)"],
              relatedCounts: {
                projectId: "project-sample-001",
                contracts: 1,
                inspectionRounds: 1,
                documents: 1,
                files: 1,
                mailThreads: 0,
                openFindings: 0,
              },
              nextInspectionDate: "2026-06-15",
              lastActivity: "프로젝트 원장과 기본 웹하드 폴더 생성 요청이 등록되었습니다.",
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/projects/project-sample-001/summary")) {
        return new Response(
          JSON.stringify({
            projectId: "project-sample-001",
            projectName: "리움미술관 승강기 교체공사",
            siteAddress: "서울시 용산구",
            status: "active",
            ownerCount: 2,
            reportTargetOwnerCount: 2,
            relatedCounts: {
              projectId: "project-sample-001",
              contracts: 1,
              inspectionRounds: 1,
              documents: 1,
              files: 1,
              mailThreads: 0,
              openFindings: 0,
            },
          }),
        );
      }

      if (url.endsWith("/api/v1/bootstrap/summary")) {
        assert.equal(init, undefined);
        return new Response(
          JSON.stringify({
            rootEntity: "Project",
            hierarchy: {
              Project: ["InspectionRound"],
              InspectionRound: ["ChecklistSession"],
              DocumentInstance: ["DocumentSection"],
            },
            sampleIds: {
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              documentId: "doc-sample-001",
            },
          }),
        );
      }

      if (url.endsWith("/api/v1/projects/project-sample-001/contracts")) {
        return new Response(
          JSON.stringify([
            {
              contract: {
                id: "contract-sample-001",
                projectId: "project-sample-001",
                contractTitle: "리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서",
                contractType: "technical_service",
                serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
                serviceScope: "공사안전보건대장 이행점검 결과보고서 작성 및 제출",
                contractAmount: 11000000,
                vatIncluded: true,
                deliverables: [],
                status: "draft",
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-09T09:00:00+09:00",
              },
              clientNames: ["삼성문화재단", "삼성생명공익재단"],
              paymentTermCount: 2,
              versionCount: 1,
              warnings: [],
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/projects/project-sample-001/inspection-schedules")) {
        return new Response(
          JSON.stringify([
            {
              id: "inspection-schedule-sample-001",
              projectId: "project-sample-001",
              contractId: "contract-sample-001",
              scheduleName: "리움미술관 정기 점검 일정",
              basisType: "contract_period",
              cycleText: "3개월 이내 1회",
              totalRounds: 10,
              startDate: "2026-01-23",
              endDate: "2028-02-28",
              status: "active",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/projects/project-sample-001/inspection-schedules/preview")) {
        return new Response(
          JSON.stringify({
            projectId: "project-sample-001",
            scheduleDraft: {
              scheduleName: "리움미술관 정기 점검 일정",
              basisType: "contract_period",
              cycleText: "3개월 이내 1회",
              totalRounds: 10,
              contractId: "contract-sample-001",
            },
            rounds: [
              {
                roundNo: 1,
                name: "1회 점검",
                plannedMonth: "2026-01",
                plannedDate: "2026-01-23",
                actualInspectionDate: "2026-01-23",
                documentNo: "제2026-01호",
                milestoneLabel: null,
                reportDueDate: null,
                status: "checked",
              },
            ],
            ownerReportTasks: [
              {
                projectId: "project-sample-001",
                ownerPartyId: "project-party-owner-001",
                roundNo: 1,
                targetName: "삼성문화재단",
                status: "pending",
              },
            ],
            warnings: [],
            isDraft: true,
          }),
        );
      }

      if (url.endsWith("/api/v1/projects/project-sample-001/inspection-schedules/generate")) {
        return new Response(
          JSON.stringify({
            schedule: {
              id: "inspection-schedule-generated-001",
              projectId: "project-sample-001",
              contractId: "contract-sample-001",
              scheduleName: "리움미술관 정기 점검 일정",
              basisType: "contract_period",
              cycleText: "3개월 이내 1회",
              totalRounds: 10,
              startDate: "2026-01-23",
              endDate: "2028-02-28",
              status: "active",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            rounds: [],
            ownerReportTasks: [],
            tasks: [],
            warnings: [],
            isDraft: false,
          }),
        );
      }

      if (url.endsWith("/api/v1/projects/project-sample-001/inspection-rounds")) {
        if (init?.method === "POST") {
          return new Response(
            JSON.stringify({
              round: {
                id: "round-created-001",
                projectId: "project-sample-001",
                scheduleId: null,
                roundNo: 11,
                name: "11회 점검",
                documentNo: "제2028-11호",
                plannedMonth: null,
                plannedDate: null,
                actualInspectionDate: null,
                inspectorUserId: null,
                confirmerContactId: null,
                contractorContactId: null,
                reportDueDate: null,
                milestoneLabel: null,
                memo: null,
                status: "planned",
                nextInspectionDate: null,
                documentInstances: [],
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-09T09:00:00+09:00",
              },
              warnings: [],
            }),
          );
        }
        return new Response(
          JSON.stringify([
            {
              round: {
                id: "round-sample-001",
                projectId: "project-sample-001",
                scheduleId: "inspection-schedule-sample-001",
                roundNo: 1,
                name: "1회 점검",
                documentNo: "제2026-01호",
                plannedMonth: "2026-01",
                plannedDate: "2026-01-23",
                actualInspectionDate: "2026-01-23",
                inspectorUserId: "user-inspector-001",
                confirmerContactId: "contact-sample-001",
                contractorContactId: "contact-sample-003",
                reportDueDate: "2026-01-31",
                milestoneLabel: null,
                memo: null,
                status: "checked",
                nextInspectionDate: "2026-01-23",
                documentInstances: [],
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-09T09:00:00+09:00",
              },
              ownerReportTaskCount: 2,
              completedTaskCount: 2,
              openTaskCount: 1,
              warnings: [],
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/inspection-rounds/round-sample-001")) {
        if (init?.method === "PATCH") {
          return new Response(
            JSON.stringify({
              round: {
                id: "round-sample-001",
                projectId: "project-sample-001",
                scheduleId: "inspection-schedule-sample-001",
                roundNo: 1,
                name: "1회 점검",
                documentNo: "제2026-01호",
                plannedMonth: "2026-01",
                plannedDate: "2026-01-23",
                actualInspectionDate: "2026-01-23",
                inspectorUserId: "user-inspector-001",
                confirmerContactId: "contact-sample-001",
                contractorContactId: "contact-sample-003",
                reportDueDate: "2026-01-31",
                milestoneLabel: null,
                memo: null,
                status: "review",
                nextInspectionDate: "2026-01-23",
                documentInstances: [],
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-10T09:00:00+09:00",
              },
              warnings: [],
            }),
          );
        }
        return new Response(
          JSON.stringify({
            round: {
              id: "round-sample-001",
              projectId: "project-sample-001",
              scheduleId: "inspection-schedule-sample-001",
              roundNo: 1,
              name: "1회 점검",
              documentNo: "제2026-01호",
              plannedMonth: "2026-01",
              plannedDate: "2026-01-23",
              actualInspectionDate: "2026-01-23",
              inspectorUserId: "user-inspector-001",
              confirmerContactId: "contact-sample-001",
              contractorContactId: "contact-sample-003",
              reportDueDate: "2026-01-31",
              milestoneLabel: null,
              memo: null,
              status: "checked",
              nextInspectionDate: "2026-01-23",
              documentInstances: [],
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            project: {
              id: "project-sample-001",
              projectName: "리움미술관 승강기 교체공사",
              siteName: "리움미술관",
              siteAddress: "서울시 용산구",
              constructionType: "승강기 교체공사",
              status: "active",
              createdAt: "2026-05-01T09:00:00+09:00",
              updatedAt: "2026-05-01T09:00:00+09:00",
            },
            schedule: {
              id: "inspection-schedule-sample-001",
              projectId: "project-sample-001",
              contractId: "contract-sample-001",
              scheduleName: "리움미술관 정기 점검 일정",
              basisType: "contract_period",
              cycleText: "3개월 이내 1회",
              totalRounds: 10,
              startDate: "2026-01-23",
              endDate: "2028-02-28",
              status: "active",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            ownerReportTasks: [
              {
                id: "owner-report-task-001-01",
                projectId: "project-sample-001",
                inspectionRoundId: "round-sample-001",
                ownerPartyId: "project-party-owner-001",
                ownerDisplayName: "삼성문화재단",
                documentInstanceId: "doc-sample-001",
                status: "review",
                exportedFileId: "file-exported-001",
                submittedAt: "2026-01-30T10:00:00+09:00",
                mailThreadId: "mail-thread-001",
                submissionId: "submission-001",
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-09T09:00:00+09:00",
              },
            ],
            tasks: [
              {
                id: "inspection-task-001-01",
                projectId: "project-sample-001",
                inspectionRoundId: "round-sample-001",
                taskType: "schedule_confirm",
                title: "점검 일정 확인",
                dueDate: "2026-01-23",
                assigneeId: null,
                status: "todo",
                linkedEntityType: null,
                linkedEntityId: null,
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-09T09:00:00+09:00",
              },
            ],
            attachments: [
              {
                id: "inspection-attachment-sample-001",
                projectId: "project-sample-001",
                inspectionRoundId: "round-sample-001",
                fileId: "file-asset-sample-schedule-001",
                fileName: "2026_공사일정표.pdf",
                storagePath: "/리움미술관 승강기 교체공사/01_점검회차/2026_공사일정표.pdf",
                attachmentType: "master_schedule",
                sourceLabel: "프로젝트 전체 공정표",
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-09T09:00:00+09:00",
              },
            ],
            rescheduleLogs: [],
            auditLogs: [],
            milestone: null,
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/confirm-date")) {
        return new Response(
          JSON.stringify({
            round: {
              id: "round-sample-001",
              projectId: "project-sample-001",
              scheduleId: "inspection-schedule-sample-001",
              roundNo: 1,
              name: "1회 점검",
              documentNo: "제2026-01호",
              plannedMonth: "2026-01",
              plannedDate: "2026-01-24",
              actualInspectionDate: "2026-01-24",
              inspectorUserId: "user-inspector-001",
              confirmerContactId: "contact-sample-001",
              contractorContactId: "contact-sample-003",
              reportDueDate: "2026-01-31",
              milestoneLabel: null,
              memo: null,
              status: "scheduled",
              nextInspectionDate: "2026-01-24",
              documentInstances: [],
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/reschedule")) {
        return new Response(
          JSON.stringify({
            round: {
              id: "round-sample-001",
              projectId: "project-sample-001",
              scheduleId: "inspection-schedule-sample-001",
              roundNo: 1,
              name: "1회 점검",
              documentNo: "제2026-01호",
              plannedMonth: "2026-01",
              plannedDate: "2026-01-25",
              actualInspectionDate: "2026-01-23",
              inspectorUserId: "user-inspector-001",
              confirmerContactId: "contact-sample-001",
              contractorContactId: "contact-sample-003",
              reportDueDate: "2026-01-31",
              milestoneLabel: null,
              memo: null,
              status: "scheduled",
              nextInspectionDate: "2026-01-25",
              documentInstances: [],
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            rescheduleLog: {
              id: "inspection-reschedule-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              previousPlannedDate: "2026-01-23",
              nextPlannedDate: "2026-01-25",
              previousActualInspectionDate: "2026-01-23",
              nextActualInspectionDate: "2026-01-23",
              reason: "발주처 요청",
              requestedBy: null,
              approvedBy: null,
              mailThreadId: null,
              fileId: null,
              createdAt: "2026-05-10T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/owner-report-tasks")) {
        return new Response(
          JSON.stringify([
            {
              id: "owner-report-task-001-01",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "project-party-owner-001",
              ownerDisplayName: "삼성문화재단",
              documentInstanceId: "doc-sample-001",
              status: "review",
              exportedFileId: "file-exported-001",
              submittedAt: "2026-01-30T10:00:00+09:00",
              mailThreadId: "mail-thread-001",
              submissionId: "submission-001",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/tasks")) {
        if (init?.method === "POST") {
          return new Response(
            JSON.stringify({
              task: {
                id: "inspection-task-created-001",
                projectId: "project-sample-001",
                inspectionRoundId: "round-sample-001",
                taskType: "schedule_confirm",
                title: "점검 일정 확인",
                dueDate: "2026-01-23",
                assigneeId: null,
                status: "todo",
                linkedEntityType: null,
                linkedEntityId: null,
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-09T09:00:00+09:00",
              },
              warnings: [],
            }),
          );
        }
        return new Response(
          JSON.stringify([
            {
              id: "inspection-task-001-01",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              taskType: "schedule_confirm",
              title: "점검 일정 확인",
              dueDate: "2026-01-23",
              assigneeId: null,
              status: "todo",
              linkedEntityType: null,
              linkedEntityId: null,
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/attachments")) {
        if (init?.method === "POST") {
          return new Response(
            JSON.stringify({
              attachment: {
                id: "inspection-attachment-created-001",
                projectId: "project-sample-001",
                inspectionRoundId: "round-sample-001",
                fileId: "file-asset-sample-schedule-001",
                fileName: "2026_공사일정표.pdf",
                storagePath: "/리움미술관 승강기 교체공사/01_점검회차/2026_공사일정표.pdf",
                attachmentType: "master_schedule",
                sourceLabel: "프로젝트 전체 공정표",
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-09T09:00:00+09:00",
              },
              warnings: [],
            }),
          );
        }
        return new Response(
          JSON.stringify([
            {
              id: "inspection-attachment-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              fileId: "file-asset-sample-schedule-001",
              fileName: "2026_공사일정표.pdf",
              storagePath: "/리움미술관 승강기 교체공사/01_점검회차/2026_공사일정표.pdf",
              attachmentType: "master_schedule",
              sourceLabel: "프로젝트 전체 공정표",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/checklist-sessions")) {
        return new Response(
          JSON.stringify([
            {
              id: "checklist-session-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: null,
              templateId: "checklist-template-sample-001",
              templateVersion: "2026.1",
              inspectorUserId: "user-inspector-001",
              inspectionDate: "2026-01-23",
              status: "in_progress",
              startedAt: "2026-05-10T09:00:00+09:00",
              completedAt: null,
              reviewedAt: null,
              lockedAt: null,
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
              resultCount: 4,
              completedCount: 3,
              progressRate: 0.75,
            },
          ]),
        );
      }

    if (url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001")) {
      return new Response(
        JSON.stringify({
            session: {
              id: "checklist-session-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: null,
              templateId: "checklist-template-sample-001",
              templateVersion: "2026.1",
              inspectorUserId: "user-inspector-001",
              inspectionDate: "2026-01-23",
              status: "in_progress",
              startedAt: "2026-05-10T09:00:00+09:00",
              completedAt: null,
              reviewedAt: null,
              lockedAt: null,
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
              resultCount: 4,
              completedCount: 3,
              progressRate: 0.75,
            },
            template: {
              id: "checklist-template-sample-001",
              name: "승강기 교체공사 표준 현장점검 체크리스트",
              description: "공사안전보건대장 이행점검 결과보고서용 기본 점검표",
              projectType: "elevator_replacement",
              documentType: "safety_health_ledger_inspection_report",
              version: "2026.1",
              status: "published",
              publishedAt: "2026-05-10T09:00:00+09:00",
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            categories: [
              {
                id: "checklist-category-common",
                templateId: "checklist-template-sample-001",
                key: "common",
                title: "공통",
                displayOrder: 1,
              },
            ],
            results: [
              {
                id: "checklist-result-001",
                sessionId: "checklist-session-sample-001",
                projectId: "project-sample-001",
                inspectionRoundId: "round-sample-001",
                checklistItemId: "checklist-item-001",
                result: "good",
                comment: null,
                reportComment: null,
                actionRequired: false,
                responsiblePartyId: null,
                dueDate: null,
                photoIds: [],
                findingCandidateId: null,
                findingId: null,
                reportMappingStatus: "mapped",
                createdAt: "2026-05-10T09:00:00+09:00",
                updatedAt: "2026-05-10T09:00:00+09:00",
                item: {
                  id: "checklist-item-001",
                  templateId: "checklist-template-sample-001",
                  categoryId: "checklist-category-common",
                  categoryKey: "common",
                  discipline: null,
                  title: "안전관리 계획 수립 및 이행 적정 여부",
                  detail: "안전관리 계획서와 현장 적용 상태를 확인합니다.",
                  reportLabel: "안전관리 계획 수립 및 이행",
                  defaultApplicability: true,
                  isRequired: true,
                  findingRequiredWhen: "caution_or_bad",
                  sourceSectionKey: "inspection_checklist",
                  displayOrder: 1,
                },
              },
            ],
            findingCandidates: [],
            riskReductionItems: [],
            additionalHazards: [],
            photos: [],
            reportMappings: [],
            mobileDrafts: [],
            auditLogs: [],
            warnings: [],
          }),
        );
      }

    if (url.endsWith("/api/v1/checklist-templates/checklist-template-sample-001/items")) {
      return new Response(
        JSON.stringify([
          {
            id: "checklist-item-001",
            templateId: "checklist-template-sample-001",
            categoryId: "checklist-category-common",
            categoryKey: "common",
            discipline: null,
            title: "안전관리 계획 수립 및 이행 적정 여부",
            detail: "안전관리 계획서와 현장 적용 상태를 확인합니다.",
            reportLabel: "안전관리 계획 수립 및 이행",
            defaultApplicability: true,
            isRequired: true,
            findingRequiredWhen: "caution_or_bad",
            sourceSectionKey: "inspection_checklist",
            displayOrder: 1,
            category: {
              id: "checklist-category-common",
              templateId: "checklist-template-sample-001",
              key: "common",
              title: "공통",
              displayOrder: 1,
            },
          },
        ]),
      );
    }

    if (url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001/results")) {
      return new Response(
        JSON.stringify([
          {
            id: "checklist-result-001",
            sessionId: "checklist-session-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            checklistItemId: "checklist-item-001",
            result: "good",
            comment: null,
            reportComment: null,
            actionRequired: false,
            responsiblePartyId: null,
            dueDate: null,
            photoIds: [],
            findingCandidateId: null,
            findingId: null,
            reportMappingStatus: "mapped",
            createdAt: "2026-05-10T09:00:00+09:00",
            updatedAt: "2026-05-10T09:00:00+09:00",
            item: {
              id: "checklist-item-001",
              templateId: "checklist-template-sample-001",
              categoryId: "checklist-category-common",
              categoryKey: "common",
              discipline: null,
              title: "안전관리 계획 수립 및 이행 적정 여부",
              detail: "안전관리 계획서와 현장 적용 상태를 확인합니다.",
              reportLabel: "안전관리 계획 수립 및 이행",
              defaultApplicability: true,
              isRequired: true,
              findingRequiredWhen: "caution_or_bad",
              sourceSectionKey: "inspection_checklist",
              displayOrder: 1,
            },
          },
        ]),
      );
    }

    if (url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001/report-mapping")) {
      return new Response(
        JSON.stringify({
          sessionId: "checklist-session-sample-001",
          reportMappings: [
            {
              id: "checklist-report-mapping-sample-001",
              sessionId: "checklist-session-sample-001",
              documentId: null,
              sourceSectionKey: "inspection_checklist",
              reportLabel: "안전관리 계획 수립 및 이행",
              rowSummary: "good",
              stale: false,
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
          ],
          warnings: [],
        }),
      );
    }

      if (url.endsWith("/api/v1/checklist-templates/checklist-template-sample-001/items")) {
        return new Response(
          JSON.stringify([
            {
              id: "checklist-item-001",
              templateId: "checklist-template-sample-001",
              categoryId: "checklist-category-common",
              categoryKey: "common",
              discipline: null,
              title: "안전관리 계획 수립 및 이행 적정 여부",
              detail: "안전관리 계획서와 현장 적용 상태를 확인합니다.",
              reportLabel: "안전관리 계획 수립 및 이행",
              defaultApplicability: true,
              isRequired: true,
              findingRequiredWhen: "caution_or_bad",
              sourceSectionKey: "inspection_checklist",
              displayOrder: 1,
              category: {
                id: "checklist-category-common",
                templateId: "checklist-template-sample-001",
                key: "common",
                title: "공통",
                displayOrder: 1,
              },
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001/results")) {
        return new Response(
          JSON.stringify([
            {
              id: "checklist-result-001",
              sessionId: "checklist-session-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              checklistItemId: "checklist-item-001",
              result: "good",
              comment: null,
              reportComment: null,
              actionRequired: false,
              responsiblePartyId: null,
              dueDate: null,
              photoIds: [],
              findingCandidateId: null,
              findingId: null,
              reportMappingStatus: "mapped",
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
              item: {
                id: "checklist-item-001",
                templateId: "checklist-template-sample-001",
                categoryId: "checklist-category-common",
                categoryKey: "common",
                discipline: null,
                title: "안전관리 계획 수립 및 이행 적정 여부",
                detail: "안전관리 계획서와 현장 적용 상태를 확인합니다.",
                reportLabel: "안전관리 계획 수립 및 이행",
                defaultApplicability: true,
                isRequired: true,
                findingRequiredWhen: "caution_or_bad",
                sourceSectionKey: "inspection_checklist",
                displayOrder: 1,
              },
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001/report-mapping")) {
        return new Response(
          JSON.stringify({
            sessionId: "checklist-session-sample-001",
            reportMappings: [
              {
                id: "checklist-report-mapping-sample-001",
                sessionId: "checklist-session-sample-001",
                documentId: null,
                sourceSectionKey: "inspection_checklist",
                reportLabel: "안전관리 계획 수립 및 이행",
                rowSummary: "good",
                stale: false,
                createdAt: "2026-05-10T09:00:00+09:00",
                updatedAt: "2026-05-10T09:00:00+09:00",
              },
            ],
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/checklist-templates")) {
        return new Response(
          JSON.stringify([
            {
              id: "checklist-template-sample-001",
              name: "승강기 교체공사 표준 현장점검 체크리스트",
              description: "공사안전보건대장 이행점검 결과보고서용 기본 점검표",
              projectType: "elevator_replacement",
              documentType: "safety_health_ledger_inspection_report",
              version: "2026.1",
              status: "published",
              publishedAt: "2026-05-10T09:00:00+09:00",
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/checklist-templates/checklist-template-sample-001")) {
        return new Response(
          JSON.stringify({
            template: {
              id: "checklist-template-sample-001",
              name: "승강기 교체공사 표준 현장점검 체크리스트",
              description: "공사안전보건대장 이행점검 결과보고서용 기본 점검표",
              projectType: "elevator_replacement",
              documentType: "safety_health_ledger_inspection_report",
              version: "2026.1",
              status: "published",
              publishedAt: "2026-05-10T09:00:00+09:00",
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            categories: [],
            items: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001/additional-hazards")) {
        return new Response(
          JSON.stringify({
            additionalHazard: {
              id: "additional-hazard-created-001",
              sessionId: "checklist-session-sample-001",
              no: 2,
              hazardDescription: "추가 유해·위험요인 초안",
              contractorPlan: null,
              checkPoint: "현장 확인 필요",
              implementationStatus: "not_checked",
              note: null,
              photoIds: [],
              findingCandidateId: null,
              findingId: null,
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/additional-hazards/additional-hazard-sample-001")) {
        return new Response(
          JSON.stringify({
            additionalHazard: {
              id: "additional-hazard-sample-001",
              sessionId: "checklist-session-sample-001",
              no: 1,
              hazardDescription: "방우형 콘센트 덮개 파손 상태 확인 필요",
              contractorPlan: null,
              checkPoint: "현장 콘센트 방우 상태 확인",
              implementationStatus: "identified",
              note: null,
              photoIds: [],
              findingCandidateId: null,
              findingId: null,
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/owner-report-tasks/owner-report-task-001-01")) {
        return new Response(
          JSON.stringify({
            ownerReportTask: {
              id: "owner-report-task-001-01",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "project-party-owner-001",
              ownerDisplayName: "삼성문화재단",
              documentInstanceId: "doc-sample-001",
              status: "review",
              exportedFileId: "file-exported-001",
              submittedAt: "2026-01-30T10:00:00+09:00",
              mailThreadId: "mail-thread-001",
              submissionId: "submission-001",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/owner-report-tasks/owner-report-task-001-01/link-document")) {
        return new Response(
          JSON.stringify({
            ownerReportTask: {
              id: "owner-report-task-001-01",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "project-party-owner-001",
              ownerDisplayName: "삼성문화재단",
              documentInstanceId: "doc-sample-001",
              status: "review",
              exportedFileId: "file-exported-001",
              submittedAt: null,
              mailThreadId: null,
              submissionId: null,
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/owner-report-tasks/owner-report-task-001-01/mark-exported")) {
        return new Response(
          JSON.stringify({
            ownerReportTask: {
              id: "owner-report-task-001-01",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "project-party-owner-001",
              ownerDisplayName: "삼성문화재단",
              documentInstanceId: "doc-sample-001",
              status: "exported",
              exportedFileId: "file-exported-001",
              submittedAt: null,
              mailThreadId: null,
              submissionId: null,
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/owner-report-tasks/owner-report-task-001-01/mark-submitted")) {
        return new Response(
          JSON.stringify({
            ownerReportTask: {
              id: "owner-report-task-001-01",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "project-party-owner-001",
              ownerDisplayName: "삼성문화재단",
              documentInstanceId: "doc-sample-001",
              status: "submitted",
              exportedFileId: "file-exported-001",
              submittedAt: "2026-01-30T10:00:00+09:00",
              mailThreadId: "mail-thread-001",
              submissionId: "submission-001",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/inspection-tasks/inspection-task-001-01")) {
        return new Response(
          JSON.stringify({
            task: {
              id: "inspection-task-001-01",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              taskType: "schedule_confirm",
              title: "점검 일정 확인",
              dueDate: "2026-01-23",
              assigneeId: null,
              status: "done",
              linkedEntityType: null,
              linkedEntityId: null,
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/tasks/generate-defaults")) {
        return new Response(
          JSON.stringify({
            tasks: [
              {
                id: "inspection-task-001-01",
                projectId: "project-sample-001",
                inspectionRoundId: "round-sample-001",
                taskType: "schedule_confirm",
                title: "점검 일정 확인",
                dueDate: "2026-01-23",
                assigneeId: null,
                status: "todo",
                linkedEntityType: null,
                linkedEntityId: null,
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-09T09:00:00+09:00",
              },
            ],
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/work-schedule-attachments/inspection-attachment-sample-001")) {
        return new Response(
          JSON.stringify({
            attachment: {
              id: "inspection-attachment-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              fileId: "file-asset-sample-schedule-001",
              fileName: "2026_공사일정표.pdf",
              storagePath: "/리움미술관 승강기 교체공사/01_점검회차/2026_공사일정표.pdf",
              attachmentType: "master_schedule",
              sourceLabel: "프로젝트 전체 공정표",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.includes("/api/v1/calendar/inspection-rounds")) {
        return new Response(
          JSON.stringify({
            dateFrom: "2026-01-01",
            dateTo: "2028-12-31",
            rounds: [],
          }),
        );
      }

      if (url.includes("/api/v1/calendar/inspection-tasks")) {
        return new Response(
          JSON.stringify({
            dateFrom: "2026-01-01",
            dateTo: "2028-12-31",
            tasks: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/contracts/contract-sample-001") && init?.method === "DELETE") {
        return new Response(JSON.stringify({ deleted: true }));
      }

      if (url.endsWith("/api/v1/contract-parties/contract-party-client-001")) {
        if (init?.method === "DELETE") {
          return new Response(JSON.stringify({ deleted: true }));
        }
        return new Response(
          JSON.stringify({
            contractParty: {
              id: "contract-party-client-001",
              contractId: "contract-sample-001",
              organizationId: "org-owner-001",
              role: "client_1",
              displayName: "삼성문화재단",
              paymentRequired: true,
              signingRequired: true,
              displayOrder: 1,
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/payment-terms/payment-term-sample-001")) {
        if (init?.method === "DELETE") {
          return new Response(JSON.stringify({ deleted: true }));
        }
        return new Response(
          JSON.stringify({
            paymentTerm: {
              id: "payment-term-sample-001",
              contractId: "contract-sample-001",
              label: "1차기성",
              triggerText: "착수 후 1차 이행점검 완료 시",
              amount: 4400000,
              status: "planned",
              splitItems: [],
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/projects/project-sample-001/estimates")) {
        return new Response(
          JSON.stringify([
            {
              estimate: {
                id: "estimate-sample-001",
                projectId: "project-sample-001",
                title: "리움미술관 승강기 교체공사 기술용역 견적서",
                serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
                status: "draft",
                supplyAmount: 10000000,
                vatAmount: 1000000,
                totalAmount: 11000000,
                items: [],
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-09T09:00:00+09:00",
              },
              itemCount: 1,
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/estimates/estimate-sample-001")) {
        if (init?.method === "DELETE") {
          return new Response(JSON.stringify({ deleted: true }));
        }
        if (init?.method === "PATCH") {
          return new Response(
            JSON.stringify({
              estimate: {
                id: "estimate-sample-001",
                projectId: "project-sample-001",
                title: "리움미술관 승강기 교체공사 기술용역 견적서",
                serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
                status: "sent",
                supplyAmount: 10000000,
                vatAmount: 1000000,
                totalAmount: 11000000,
                items: [],
                createdAt: "2026-05-09T09:00:00+09:00",
                updatedAt: "2026-05-10T09:00:00+09:00",
              },
            }),
          );
        }
        return new Response(
          JSON.stringify({
            id: "estimate-sample-001",
            projectId: "project-sample-001",
            title: "리움미술관 승강기 교체공사 기술용역 견적서",
            serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
            status: "draft",
            supplyAmount: 10000000,
            vatAmount: 1000000,
            totalAmount: 11000000,
            items: [],
            createdAt: "2026-05-09T09:00:00+09:00",
            updatedAt: "2026-05-09T09:00:00+09:00",
          }),
        );
      }

      if (url.endsWith("/api/v1/contracts/contract-sample-001/files/contract-file-sample-final/set-final")) {
        return new Response(
          JSON.stringify({
            contract: {
              id: "contract-sample-001",
              projectId: "project-sample-001",
              contractTitle: "리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서",
              contractType: "technical_service",
              serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
              serviceScope: "공사안전보건대장 이행점검 결과보고서 작성 및 제출",
              contractAmount: 11000000,
              vatIncluded: true,
              deliverables: [],
              status: "draft",
              finalFileId: "contract-file-sample-final",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            file: {
              id: "contract-file-sample-final",
              fileId: "file-asset-sample-final",
              contractId: "contract-sample-001",
              fileName: "리움미술관_기술용역계약서_v1.pdf",
              fileType: "application/pdf",
              storagePath: "/리움미술관 승강기 교체공사/00_계약_견적/리움미술관_기술용역계약서_v1.pdf",
              fileCategory: "final",
              isFinal: true,
              isSigned: false,
              createdAt: "2026-05-09T09:00:00+09:00",
            },
          }),
        );
      }

      if (url.endsWith("/api/v1/contracts/contract-sample-001/files/contract-file-sample-final/set-signed")) {
        return new Response(
          JSON.stringify({
            contract: {
              id: "contract-sample-001",
              projectId: "project-sample-001",
              contractTitle: "리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서",
              contractType: "technical_service",
              serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
              serviceScope: "공사안전보건대장 이행점검 결과보고서 작성 및 제출",
              contractAmount: 11000000,
              vatIncluded: true,
              deliverables: [],
              status: "draft",
              signedFileId: "contract-file-sample-final",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            file: {
              id: "contract-file-sample-final",
              fileId: "file-asset-sample-final",
              contractId: "contract-sample-001",
              fileName: "리움미술관_기술용역계약서_v1.pdf",
              fileType: "application/pdf",
              storagePath: "/리움미술관 승강기 교체공사/00_계약_견적/리움미술관_기술용역계약서_v1.pdf",
              fileCategory: "signed",
              isFinal: false,
              isSigned: true,
              createdAt: "2026-05-09T09:00:00+09:00",
            },
          }),
        );
      }

      if (url.endsWith("/api/v1/estimates/estimate-sample-001/convert-to-contract")) {
        return new Response(
          JSON.stringify({
            estimate: {
              id: "estimate-sample-001",
              projectId: "project-sample-001",
              title: "리움미술관 승강기 교체공사 기술용역 견적서",
              serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
              status: "converted",
              supplyAmount: 10000000,
              vatAmount: 1000000,
              totalAmount: 11000000,
              items: [],
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            contract: {
              id: "contract-new-001",
              projectId: "project-sample-001",
              contractTitle: "견적 전환 초안",
              contractType: "estimate-converted",
              serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
              serviceScope: "견적서 기준 서비스 범위 초안",
              contractAmount: 11000000,
              vatIncluded: true,
              deliverables: [],
              status: "draft",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
          }),
        );
      }

      if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/findings")) {
        if ((init?.method ?? "GET") === "POST") {
          return new Response(
            JSON.stringify({
              finding: {
                id: "finding-new-001",
                projectId: "project-sample-001",
                inspectionRoundId: "round-sample-001",
                title: "임시 지적사항",
                detail: "임시 지적 상세",
                status: "open",
                createdAt: "2026-05-10T09:00:00+09:00",
                updatedAt: "2026-05-10T09:00:00+09:00",
              },
              warnings: [],
            }),
          );
        }
        return new Response(
          JSON.stringify([
            {
              finding: {
                id: "finding-sample-001",
                projectId: "project-sample-001",
                inspectionRoundId: "round-sample-001",
                title: "엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치 미비",
                detail: "이동식 사다리 전도 방지를 위한 아웃트리거 설치 상태가 확인되지 않았습니다.",
                ownerPartyId: "owner-samsung-cultural-foundation",
                riskType: "fall",
                requiredAction: "아웃트리거 설치조치",
                status: "verified",
                createdAt: "2026-05-10T09:00:00+09:00",
                updatedAt: "2026-05-10T09:00:00+09:00",
              },
              ownerDisplayName: "삼성문화재단",
              responsibleOrganizationName: "현대엘리베이터(주)",
              findingPhotoCount: 1,
              actionPhotoCount: 1,
              correctiveActionStatus: "verified",
              warnings: [],
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/findings/finding-sample-001")) {
        return new Response(
          JSON.stringify({
            finding: {
              id: "finding-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              title: "엘리베이터 하단부 이동식 사다리에 아웃트리거 설치조치 미비",
              detail: "이동식 사다리 전도 방지를 위한 아웃트리거 설치 상태가 확인되지 않았습니다.",
              ownerPartyId: "owner-samsung-cultural-foundation",
              riskType: "fall",
              requiredAction: "아웃트리거 설치조치",
              status: "verified",
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            correctiveActions: [],
            photos: [],
            timeline: [],
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/photo-ledgers")) {
        return new Response(
          JSON.stringify([
            {
              id: "photo-ledger-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "owner-samsung-cultural-foundation",
              title: "삼성문화재단 사진대지",
              status: "draft",
              layoutMode: "one_entry_per_page",
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
          ]),
        );
      }

      if (url.endsWith("/api/v1/photo-ledgers/photo-ledger-sample-001")) {
        return new Response(
          JSON.stringify({
            photoLedger: {
              id: "photo-ledger-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "owner-samsung-cultural-foundation",
              title: "삼성문화재단 사진대지",
              status: "draft",
              layoutMode: "one_entry_per_page",
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            entries: [],
            findings: [],
            correctiveActions: [],
            photos: [],
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/documents/doc-sample-001/photo-ledger-section")) {
        return new Response(
          JSON.stringify({
            documentId: "doc-sample-001",
            section: {
              documentId: "doc-sample-001",
              documentVersionId: "document-version-sample-001",
              sectionKey: "photo_ledger",
              photoLedgerId: "photo-ledger-sample-001",
              entryIds: [],
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            photoLedger: {
              id: "photo-ledger-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "owner-samsung-cultural-foundation",
              title: "삼성문화재단 사진대지",
              status: "synced",
              layoutMode: "one_entry_per_page",
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            entries: [],
            findings: [],
            correctiveActions: [],
            photos: [],
            warnings: [],
          }),
        );
      }

      if (url.endsWith("/api/v1/findings/action-request-mail/draft")) {
        return new Response(
          JSON.stringify({
            mailDraft: {
              id: "action-request-mail-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              findingIds: ["finding-sample-001"],
              subject: "[A&C ERP] 조치 요청",
              body: "지적사항 조치 요청 메일 초안",
              attachmentFileIds: [],
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            warnings: [],
          }),
        );
      }

      return new Response(JSON.stringify({}));
    },
  });

  assert.equal(apiClient.baseUrl, "http://localhost:8010");
  const summary = await apiClient.getBootstrapSummary();
  assert.equal(summary.sampleIds.projectId, "project-sample-001");
  const projects = await apiClient.listProjects();
  assert.equal(projects[0].ownerNames.length, 2);
  const projectSummary = await apiClient.getProjectSummary("project-sample-001");
  assert.equal(projectSummary.ownerCount, 2);
  const contracts = await apiClient.listContracts("project-sample-001");
  assert.equal(contracts[0].clientNames.length, 2);
  const inspectionSchedules = await apiClient.listInspectionSchedules("project-sample-001");
  assert.equal(inspectionSchedules[0].totalRounds, 10);
  const inspectionPreview = await apiClient.previewInspectionSchedule("project-sample-001", {
    contractId: "contract-sample-001",
    scheduleName: "리움미술관 정기 점검 일정",
    basisType: "contract_period",
    cycleText: "3개월 이내 1회",
    totalRounds: 10,
  });
  assert.equal(inspectionPreview.isDraft, true);
  const generatedInspectionSchedule = await apiClient.generateInspectionSchedule("project-sample-001", {
    contractId: "contract-sample-001",
    scheduleName: "리움미술관 정기 점검 일정",
    basisType: "contract_period",
    cycleText: "3개월 이내 1회",
    totalRounds: 10,
  });
  assert.equal(generatedInspectionSchedule.isDraft, false);
  const inspectionRounds = await apiClient.listInspectionRounds("project-sample-001");
  assert.equal(inspectionRounds[0].round.roundNo, 1);
  const createdInspectionRound = await apiClient.createInspectionRound("project-sample-001", {
    roundNo: 11,
    name: "11회 점검",
    status: "planned",
  });
  assert.equal(createdInspectionRound.round.id, "round-created-001");
  const inspectionRoundDetail = await apiClient.getInspectionRound("round-sample-001");
  assert.equal(inspectionRoundDetail.round.id, "round-sample-001");
  const updatedInspectionRound = await apiClient.updateInspectionRound("round-sample-001", {
    status: "review",
  });
  assert.equal(updatedInspectionRound.round.status, "review");
  const confirmedInspectionRound = await apiClient.confirmInspectionRoundDate("round-sample-001", {
    plannedDate: "2026-01-24",
    actualInspectionDate: "2026-01-24",
  });
  assert.equal(confirmedInspectionRound.round.status, "scheduled");
  const rescheduledInspectionRound = await apiClient.rescheduleInspectionRound("round-sample-001", {
    plannedDate: "2026-01-25",
    reason: "발주처 요청",
  });
  assert.equal(rescheduledInspectionRound.rescheduleLog.reason, "발주처 요청");
  const inspectionOwnerTasks = await apiClient.listOwnerReportTasks("round-sample-001");
  assert.equal(inspectionOwnerTasks[0].ownerDisplayName, "삼성문화재단");
  const updatedOwnerTask = await apiClient.updateOwnerReportTask("owner-report-task-001-01", {
    status: "review",
  });
  assert.equal(updatedOwnerTask.ownerReportTask.status, "review");
  const linkedOwnerTask = await apiClient.linkOwnerReportDocument("owner-report-task-001-01", {
    documentInstanceId: "doc-sample-001",
  });
  assert.equal(linkedOwnerTask.ownerReportTask.documentInstanceId, "doc-sample-001");
  const exportedOwnerTask = await apiClient.markOwnerReportExported("owner-report-task-001-01", {
    exportedFileId: "file-exported-001",
  });
  assert.equal(exportedOwnerTask.ownerReportTask.status, "exported");
  const submittedOwnerTask = await apiClient.markOwnerReportSubmitted("owner-report-task-001-01", {
    submittedAt: "2026-01-30T10:00:00+09:00",
    mailThreadId: "mail-thread-001",
    submissionId: "submission-001",
  });
  assert.equal(submittedOwnerTask.ownerReportTask.submissionId, "submission-001");
  const inspectionTasks = await apiClient.listInspectionTasks("round-sample-001");
  assert.equal(inspectionTasks[0].title, "점검 일정 확인");
  const createdInspectionTask = await apiClient.createInspectionTask("round-sample-001", {
    taskType: "schedule_confirm",
    title: "점검 일정 확인",
  });
  assert.equal(createdInspectionTask.task.id, "inspection-task-created-001");
  const updatedInspectionTask = await apiClient.updateInspectionTask("inspection-task-001-01", {
    status: "done",
  });
  assert.equal(updatedInspectionTask.task.status, "done");
  const generatedInspectionTasks = await apiClient.generateDefaultInspectionTasks("round-sample-001");
  assert.equal(generatedInspectionTasks.tasks[0].inspectionRoundId, "round-sample-001");
  const inspectionAttachments = await apiClient.listWorkScheduleAttachments("round-sample-001");
  assert.equal(inspectionAttachments[0].fileName, "2026_공사일정표.pdf");
  const createdInspectionAttachment = await apiClient.createWorkScheduleAttachment("round-sample-001", {
    fileId: "file-asset-sample-schedule-001",
    fileName: "2026_공사일정표.pdf",
    storagePath: "/리움미술관 승강기 교체공사/01_점검회차/2026_공사일정표.pdf",
    attachmentType: "master_schedule",
    sourceLabel: "프로젝트 전체 공정표",
  });
  assert.equal(createdInspectionAttachment.attachment.id, "inspection-attachment-created-001");
  const updatedInspectionAttachment = await apiClient.updateWorkScheduleAttachment("inspection-attachment-sample-001", {
    sourceLabel: "프로젝트 전체 공정표",
  });
  assert.equal(updatedInspectionAttachment.attachment.id, "inspection-attachment-sample-001");
  const inspectionCalendarRounds = await apiClient.getInspectionCalendarRounds("2026-01-01", "2028-12-31");
  assert.ok(Array.isArray(inspectionCalendarRounds.rounds));
  const inspectionCalendarTasks = await apiClient.getInspectionCalendarTasks("2026-01-01", "2028-12-31");
  assert.ok(Array.isArray(inspectionCalendarTasks.tasks));
  const deletedContract = await apiClient.deleteContract("contract-sample-001");
  assert.equal(deletedContract.deleted, true);
  const updatedContractParty = await apiClient.updateContractParty("contract-party-client-001", {
    displayName: "삼성문화재단",
  });
  assert.equal(updatedContractParty.contractParty.id, "contract-party-client-001");
  const deletedContractParty = await apiClient.deleteContractParty("contract-party-client-001");
  assert.equal(deletedContractParty.deleted, true);
  const updatedPaymentTerm = await apiClient.updatePaymentTerm("payment-term-sample-001", {
    amount: 4400000,
  });
  assert.equal(updatedPaymentTerm.paymentTerm.id, "payment-term-sample-001");
  const deletedPaymentTerm = await apiClient.deletePaymentTerm("payment-term-sample-001");
  assert.equal(deletedPaymentTerm.deleted, true);
  const finalFileResult = await apiClient.setFinalContractFile("contract-sample-001", "contract-file-sample-final");
  assert.equal(finalFileResult.file.isFinal, true);
  const signedFileResult = await apiClient.setSignedContractFile("contract-sample-001", "contract-file-sample-final");
  assert.equal(signedFileResult.file.isSigned, true);
  const estimates = await apiClient.listEstimates("project-sample-001");
  assert.equal(estimates[0].itemCount, 1);
  const updatedEstimate = await apiClient.updateEstimate("estimate-sample-001", { status: "sent" });
  assert.equal(updatedEstimate.estimate.status, "sent");
  const convertedEstimate = await apiClient.convertEstimateToContract("estimate-sample-001");
  assert.equal(convertedEstimate.contract?.id, "contract-new-001");
  const deletedEstimate = await apiClient.deleteEstimate("estimate-sample-001");
  assert.equal(deletedEstimate.deleted, true);
  const checklistTemplateItems = await apiClient.listChecklistTemplateItems("checklist-template-sample-001");
  assert.equal(checklistTemplateItems[0].id, "checklist-item-001");
  const checklistResults = await apiClient.listChecklistResults("checklist-session-sample-001");
  assert.equal(checklistResults[0].id, "checklist-result-001");
  const checklistReportMapping = await apiClient.getChecklistReportMapping("checklist-session-sample-001");
  assert.equal(checklistReportMapping.reportMappings[0].id, "checklist-report-mapping-sample-001");
  const createdAdditionalHazard = await apiClient.createChecklistAdditionalHazard("checklist-session-sample-001", {
    hazardDescription: "추가 유해·위험요인 초안",
    checkPoint: "현장 확인 필요",
    implementationStatus: "not_checked",
  });
  assert.equal(createdAdditionalHazard.additionalHazard.id, "additional-hazard-created-001");
  const updatedAdditionalHazard = await apiClient.updateChecklistAdditionalHazard("additional-hazard-sample-001", {
    implementationStatus: "identified",
  });
  assert.equal(updatedAdditionalHazard.additionalHazard.implementationStatus, "identified");
  const roundFindings = await apiClient.listInspectionRoundFindings("round-sample-001");
  assert.equal(roundFindings[0].finding.id, "finding-sample-001");
  const findingDetail = await apiClient.getFinding("finding-sample-001");
  assert.equal(findingDetail.finding.id, "finding-sample-001");
  const photoLedgers = await apiClient.listPhotoLedgers("round-sample-001");
  assert.equal(photoLedgers[0].id, "photo-ledger-sample-001");
  const photoLedgerDetail = await apiClient.getPhotoLedger("photo-ledger-sample-001");
  assert.equal(photoLedgerDetail.photoLedger.id, "photo-ledger-sample-001");
  const actionMailDraft = await apiClient.draftActionRequestMail({
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    findingIds: ["finding-sample-001"],
  });
  assert.equal(actionMailDraft.mailDraft.id, "action-request-mail-sample-001");
  const documentPhotoLedgerSection = await apiClient.getDocumentPhotoLedgerSection("doc-sample-001");
  assert.equal(documentPhotoLedgerSection.documentId, "doc-sample-001");

  const calledUrls: string[] = [];
  const loaderFetch: typeof fetch = async (input) => {
    const url = String(input);
    calledUrls.push(url);

    if (url.endsWith("/api/v1/projects")) {
      return new Response(
        JSON.stringify([
          {
            project: {
              id: "project-sample-001",
              projectName: "리움미술관 승강기 교체공사",
              siteName: "리움미술관",
              siteAddress: "서울시 용산구",
              constructionType: "승강기 교체공사",
              status: "active",
              createdAt: "2026-05-01T09:00:00+09:00",
              updatedAt: "2026-05-01T09:00:00+09:00",
            },
            ownerNames: ["삼성문화재단", "삼성생명공익재단"],
            contractorNames: ["현대엘리베이터(주)"],
            relatedCounts: {
              projectId: "project-sample-001",
              contracts: 1,
              inspectionRounds: 1,
              documents: 1,
              files: 1,
              mailThreads: 0,
              openFindings: 0,
            },
            nextInspectionDate: "2026-06-15",
            lastActivity: "프로젝트 원장과 기본 웹하드 폴더 생성 요청이 등록되었습니다.",
          },
        ]),
      );
    }

    if (url.endsWith("/api/v1/projects/project-sample-001")) {
      return new Response(
        JSON.stringify({
          project: {
            id: "project-sample-001",
            projectName: "리움미술관 승강기 교체공사",
            siteName: "리움미술관",
            siteAddress: "서울시 용산구",
            constructionType: "승강기 교체공사",
            status: "active",
            createdAt: "2026-05-01T09:00:00+09:00",
            updatedAt: "2026-05-01T09:00:00+09:00",
          },
          organizations: [],
          projectParties: [],
          contacts: [],
          inspectionRounds: [],
          relatedCounts: {
            projectId: "project-sample-001",
            contracts: 1,
            inspectionRounds: 1,
            documents: 1,
            files: 1,
            mailThreads: 0,
            openFindings: 0,
          },
          activityLogs: [],
        }),
      );
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/requirements")) {
      return new Response(
        JSON.stringify({
          projectId: "project-sample-001",
          forSafetyReport: [],
          forContract: [],
          forInspectionRound: [],
          forMailSubmission: [],
          warnings: [],
        }),
      );
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/parties")) {
      return new Response(JSON.stringify([]));
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/contacts")) {
      return new Response(JSON.stringify([]));
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/related-counts")) {
      return new Response(
        JSON.stringify({
          projectId: "project-sample-001",
          contracts: 0,
          inspectionRounds: 1,
          documents: 1,
          files: 0,
          mailThreads: 0,
          openFindings: 0,
        }),
      );
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/history")) {
      return new Response(JSON.stringify([]));
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/summary")) {
      return new Response(
        JSON.stringify({
          projectId: "project-sample-001",
          projectName: "리움미술관 승강기 교체공사",
          siteAddress: "서울시 용산구",
          status: "active",
          ownerCount: 2,
          reportTargetOwnerCount: 2,
          relatedCounts: {
            projectId: "project-sample-001",
            contracts: 1,
            inspectionRounds: 1,
            documents: 1,
            files: 1,
            mailThreads: 0,
            openFindings: 0,
          },
        }),
      );
    }

    if (url.endsWith("/api/v1/projects/extract-from-document")) {
      return new Response(
        JSON.stringify({
          project: {
            projectName: "리움미술관 승강기 교체공사",
          },
          organizations: [],
          projectParties: [],
          contacts: [],
          warnings: [],
          isDraft: true,
        }),
      );
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/validate-extracted-info")) {
      return new Response(
        JSON.stringify({
          projectId: "project-sample-001",
          warnings: [],
          isDraft: true,
        }),
      );
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/contracts")) {
      return new Response(
        JSON.stringify([
          {
            contract: {
              id: "contract-sample-001",
              projectId: "project-sample-001",
              contractTitle: "리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서",
              contractType: "technical_service",
              serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
              serviceScope: "공사안전보건대장 이행점검 결과보고서 작성 및 제출",
              contractAmount: 11000000,
              vatIncluded: true,
              deliverables: [],
              status: "draft",
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            clientNames: ["삼성문화재단", "삼성생명공익재단"],
            paymentTermCount: 2,
            versionCount: 1,
            warnings: [],
          },
        ]),
      );
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/inspection-schedules")) {
      return new Response(
        JSON.stringify([
          {
            id: "inspection-schedule-sample-001",
            projectId: "project-sample-001",
            contractId: "contract-sample-001",
            scheduleName: "리움미술관 정기 점검 일정",
            basisType: "contract_period",
            cycleText: "3개월 이내 1회",
            totalRounds: 10,
            startDate: "2026-01-23",
            endDate: "2028-02-28",
            status: "active",
            createdAt: "2026-05-09T09:00:00+09:00",
            updatedAt: "2026-05-09T09:00:00+09:00",
          },
        ]),
      );
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/inspection-schedules/preview")) {
      return new Response(
        JSON.stringify({
          projectId: "project-sample-001",
          scheduleDraft: {
            scheduleName: "리움미술관 정기 점검 일정",
            basisType: "contract_period",
            cycleText: "3개월 이내 1회",
            totalRounds: 10,
            contractId: "contract-sample-001",
          },
          rounds: [],
          ownerReportTasks: [],
          warnings: [],
          isDraft: true,
        }),
      );
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/inspection-rounds")) {
      return new Response(
        JSON.stringify([
          {
            round: {
              id: "round-sample-001",
              projectId: "project-sample-001",
              scheduleId: "inspection-schedule-sample-001",
              roundNo: 1,
              name: "1회 점검",
              documentNo: "제2026-01호",
              plannedMonth: "2026-01",
              plannedDate: "2026-01-23",
              actualInspectionDate: "2026-01-23",
              inspectorUserId: "user-inspector-001",
              confirmerContactId: "contact-sample-001",
              contractorContactId: "contact-sample-003",
              reportDueDate: "2026-01-31",
              milestoneLabel: null,
              memo: null,
              status: "checked",
              nextInspectionDate: "2026-01-23",
              documentInstances: [],
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            ownerReportTaskCount: 2,
            completedTaskCount: 2,
            openTaskCount: 1,
            warnings: [],
          },
        ]),
      );
    }

    if (url.endsWith("/api/v1/inspection-rounds/round-sample-001")) {
      return new Response(
        JSON.stringify({
          round: {
            id: "round-sample-001",
            projectId: "project-sample-001",
            scheduleId: "inspection-schedule-sample-001",
            roundNo: 1,
            name: "1회 점검",
            documentNo: "제2026-01호",
            plannedMonth: "2026-01",
            plannedDate: "2026-01-23",
            actualInspectionDate: "2026-01-23",
            inspectorUserId: "user-inspector-001",
            confirmerContactId: "contact-sample-001",
            contractorContactId: "contact-sample-003",
            reportDueDate: "2026-01-31",
            milestoneLabel: null,
            memo: null,
            status: "checked",
            nextInspectionDate: "2026-01-23",
            documentInstances: [],
            createdAt: "2026-05-09T09:00:00+09:00",
            updatedAt: "2026-05-09T09:00:00+09:00",
          },
          project: {
            id: "project-sample-001",
            projectName: "리움미술관 승강기 교체공사",
            siteName: "리움미술관",
            siteAddress: "서울시 용산구",
            constructionType: "승강기 교체공사",
            status: "active",
            createdAt: "2026-05-01T09:00:00+09:00",
            updatedAt: "2026-05-01T09:00:00+09:00",
          },
          schedule: {
            id: "inspection-schedule-sample-001",
            projectId: "project-sample-001",
            contractId: "contract-sample-001",
            scheduleName: "리움미술관 정기 점검 일정",
            basisType: "contract_period",
            cycleText: "3개월 이내 1회",
            totalRounds: 10,
            startDate: "2026-01-23",
            endDate: "2028-02-28",
            status: "active",
            createdAt: "2026-05-09T09:00:00+09:00",
            updatedAt: "2026-05-09T09:00:00+09:00",
          },
          ownerReportTasks: [],
          tasks: [],
          attachments: [],
          rescheduleLogs: [],
          auditLogs: [],
          milestone: null,
          warnings: [],
        }),
      );
    }

    if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/owner-report-tasks")) {
      return new Response(JSON.stringify([]));
    }

    if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/tasks")) {
      return new Response(JSON.stringify([]));
    }

    if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/attachments")) {
      return new Response(JSON.stringify([]));
    }

    if (url.includes("/api/v1/calendar/inspection-rounds")) {
      return new Response(
        JSON.stringify({
          dateFrom: "2026-01-01",
          dateTo: "2028-12-31",
          rounds: [],
        }),
      );
    }

    if (url.includes("/api/v1/calendar/inspection-tasks")) {
      return new Response(
        JSON.stringify({
          dateFrom: "2026-01-01",
          dateTo: "2028-12-31",
          tasks: [],
        }),
      );
    }

    if (url.endsWith("/api/v1/contracts/contract-sample-001")) {
      return new Response(
        JSON.stringify({
          contract: {
            id: "contract-sample-001",
            projectId: "project-sample-001",
            contractTitle: "리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서",
            contractType: "technical_service",
            serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
            serviceScope: "공사안전보건대장 이행점검 결과보고서 작성 및 제출",
            contractAmount: 11000000,
            vatIncluded: true,
            deliverables: [],
            inspectionCount: 10,
            status: "draft",
            createdAt: "2026-05-09T09:00:00+09:00",
            updatedAt: "2026-05-09T09:00:00+09:00",
          },
          project: {
            id: "project-sample-001",
            projectName: "리움미술관 승강기 교체공사",
            siteName: "리움미술관",
            siteAddress: "서울시 용산구",
            constructionType: "승강기 교체공사",
            status: "active",
            createdAt: "2026-05-01T09:00:00+09:00",
            updatedAt: "2026-05-01T09:00:00+09:00",
          },
          parties: [],
          paymentTerms: [],
          versions: [],
          changes: [],
          files: [],
          auditLogs: [],
          warnings: [],
        }),
      );
    }

    if (url.endsWith("/api/v1/contracts/contract-sample-001/preview")) {
      return new Response(
        JSON.stringify({
          contractId: "contract-sample-001",
          templateKey: "contract-draft-generation",
          draftText: "계약서 초안",
          missingFields: [],
          warnings: [],
          isDraft: true,
        }),
      );
    }

    if (url.endsWith("/api/v1/contracts/contract-sample-001/payment-terms/calculate-split")) {
      return new Response(
        JSON.stringify({
          contractId: "contract-sample-001",
          paymentTermAmount: 4400000,
          splitItems: [],
          warnings: [],
          totalRatio: 100,
          totalAmount: 4400000,
        }),
      );
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/estimates")) {
      return new Response(
        JSON.stringify([
          {
            estimate: {
              id: "estimate-sample-001",
              projectId: "project-sample-001",
              title: "리움미술관 승강기 교체공사 기술용역 견적서",
              serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
              status: "draft",
              supplyAmount: 10000000,
              vatAmount: 1000000,
              totalAmount: 11000000,
              items: [],
              createdAt: "2026-05-09T09:00:00+09:00",
              updatedAt: "2026-05-09T09:00:00+09:00",
            },
            itemCount: 1,
          },
        ]),
      );
    }

    if (url.endsWith("/api/v1/estimates/estimate-sample-001")) {
      return new Response(
        JSON.stringify({
          id: "estimate-sample-001",
          projectId: "project-sample-001",
          title: "리움미술관 승강기 교체공사 기술용역 견적서",
          serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
          status: "draft",
          supplyAmount: 10000000,
          vatAmount: 1000000,
          totalAmount: 11000000,
          items: [],
          createdAt: "2026-05-09T09:00:00+09:00",
          updatedAt: "2026-05-09T09:00:00+09:00",
        }),
      );
    }

    if (url.endsWith("/api/v1/estimates/estimate-sample-001/generate")) {
      return new Response(
        JSON.stringify({
          estimateId: "estimate-sample-001",
          draftText: "견적서 초안",
          isDraft: true,
        }),
      );
    }

    return new Response(JSON.stringify({}));
  };

  await loadProjectsPageData(loaderFetch);
  await loadProjectCreationDraft(loaderFetch);
  await loadProjectDetailData("project-sample-001", loaderFetch);
  await loadProjectContractsPageData("project-sample-001", loaderFetch);
  await loadProjectContractCreateData("project-sample-001", loaderFetch);
  await loadContractDetailData("contract-sample-001", loaderFetch);
  await loadProjectInspectionsPageData("project-sample-001", loaderFetch);
  await loadInspectionSchedulePageData("project-sample-001", loaderFetch);
  await loadInspectionRoundCreateData("project-sample-001", loaderFetch);
  await loadInspectionRoundDetailData("round-sample-001", loaderFetch);
  await loadInspectionCalendarPageData(loaderFetch);
  await loadChecklistRoundPageData("round-sample-001", loaderFetch);
  await loadChecklistSessionPageData("checklist-session-sample-001", loaderFetch);
  await loadChecklistTemplateAdminPageData("project-sample-001", loaderFetch);
  await loadChecklistTemplateDetailPageData("checklist-template-sample-001", loaderFetch);
  await loadProjectEstimatesPageData("project-sample-001", loaderFetch);
  await loadEstimateDetailData("estimate-sample-001", loaderFetch);

  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects/project-sample-001")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects/project-sample-001/requirements")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects/project-sample-001/parties")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects/project-sample-001/contacts")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects/project-sample-001/related-counts")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects/project-sample-001/history")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects/extract-from-document")));
  assert.ok(
    calledUrls.some((url) =>
      url.endsWith("/api/v1/projects/project-sample-001/validate-extracted-info"),
    ),
  );
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects/project-sample-001/contracts")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/contracts/contract-sample-001")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/contracts/contract-sample-001/preview")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects/project-sample-001/inspection-schedules")));
  assert.ok(
    calledUrls.some((url) =>
      url.endsWith("/api/v1/projects/project-sample-001/inspection-schedules/preview"),
    ),
  );
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects/project-sample-001/inspection-rounds")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/inspection-rounds/round-sample-001")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/inspection-rounds/round-sample-001/checklist-sessions")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/checklist-templates")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/checklist-templates/checklist-template-sample-001")));
  assert.ok(calledUrls.some((url) => url.includes("/api/v1/calendar/inspection-rounds")));
  assert.ok(calledUrls.some((url) => url.includes("/api/v1/calendar/inspection-tasks")));
  assert.ok(
    calledUrls.some((url) =>
      url.endsWith("/api/v1/contracts/contract-sample-001/payment-terms/calculate-split"),
    ),
  );
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/projects/project-sample-001/estimates")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/estimates/estimate-sample-001")));
  assert.ok(calledUrls.some((url) => url.endsWith("/api/v1/estimates/estimate-sample-001/generate")));

  const safetyCostLoaderUrls: string[] = [];
  const safetyCostLoaderFetch: typeof fetch = async (input) => {
    const url = String(input);
    safetyCostLoaderUrls.push(url);

    if (url.endsWith("/api/v1/projects/project-sample-001/safety-cost-usages")) {
      return new Response(
        JSON.stringify([
          {
            usage: {
              id: "safety-cost-usage-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "owner-samsung-cultural-foundation",
              calculatedAmount: 100000000,
              usedAmount: 32000000,
              usedRateCalculated: 32,
              userEnteredRate: 32,
              basisMonth: "2월말",
              basisDate: null,
              basisDocumentText: "산업안전보건관리비 사용내역서",
              appropriatenessComment: "검토 의견",
              appropriatenessStatus: "appropriate",
              status: "confirmed",
              confirmedBy: "user-engineer-001",
              confirmedAt: "2026-05-10T09:00:00+09:00",
              reportInclude: true,
              syncedDocumentId: "doc-sample-001",
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            ownerDisplayName: "삼성문화재단",
            evidenceCount: 1,
            warnings: [],
          },
        ]),
      );
    }

    if (url.endsWith("/api/v1/projects/project-sample-001/safety-cost-usages/owner-matrix")) {
      return new Response(
        JSON.stringify({
          projectId: "project-sample-001",
          rows: [
            {
              ownerPartyId: "owner-samsung-cultural-foundation",
              ownerDisplayName: "삼성문화재단",
              usage: {
                id: "safety-cost-usage-sample-001",
                projectId: "project-sample-001",
                inspectionRoundId: "round-sample-001",
                ownerPartyId: "owner-samsung-cultural-foundation",
                calculatedAmount: 100000000,
                usedAmount: 32000000,
                usedRateCalculated: 32,
                userEnteredRate: 32,
                basisMonth: "2월말",
                basisDate: null,
                basisDocumentText: "산업안전보건관리비 사용내역서",
                appropriatenessComment: "검토 의견",
                appropriatenessStatus: "appropriate",
                status: "confirmed",
                confirmedBy: "user-engineer-001",
                confirmedAt: "2026-05-10T09:00:00+09:00",
                reportInclude: true,
                syncedDocumentId: "doc-sample-001",
                createdAt: "2026-05-10T09:00:00+09:00",
                updatedAt: "2026-05-10T09:00:00+09:00",
              },
              warnings: [],
              evidenceCount: 1,
            },
          ],
        }),
      );
    }

    if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/safety-cost-usages")) {
      return new Response(
        JSON.stringify([
          {
            usage: {
              id: "safety-cost-usage-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "owner-samsung-cultural-foundation",
              calculatedAmount: 100000000,
              usedAmount: 32000000,
              usedRateCalculated: 32,
              userEnteredRate: 32,
              basisMonth: "2월말",
              basisDate: null,
              basisDocumentText: "산업안전보건관리비 사용내역서",
              appropriatenessComment: "검토 의견",
              appropriatenessStatus: "appropriate",
              status: "confirmed",
              confirmedBy: "user-engineer-001",
              confirmedAt: "2026-05-10T09:00:00+09:00",
              reportInclude: true,
              syncedDocumentId: "doc-sample-001",
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            ownerDisplayName: "삼성문화재단",
            evidenceCount: 1,
            warnings: [],
          },
        ]),
      );
    }

    if (url.endsWith("/api/v1/safety-cost-usages/safety-cost-usage-sample-001")) {
      return new Response(
        JSON.stringify({
          usage: {
            id: "safety-cost-usage-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: "owner-samsung-cultural-foundation",
            calculatedAmount: 100000000,
            usedAmount: 32000000,
            usedRateCalculated: 32,
            userEnteredRate: 32,
            basisMonth: "2월말",
            basisDate: null,
            basisDocumentText: "산업안전보건관리비 사용내역서",
            appropriatenessComment: "검토 의견",
            appropriatenessStatus: "appropriate",
            status: "confirmed",
            confirmedBy: "user-engineer-001",
            confirmedAt: "2026-05-10T09:00:00+09:00",
            reportInclude: true,
            syncedDocumentId: "doc-sample-001",
            createdAt: "2026-05-10T09:00:00+09:00",
            updatedAt: "2026-05-10T09:00:00+09:00",
          },
          ownerDisplayName: "삼성문화재단",
          evidenceItems: [],
          reviews: [],
          history: [],
          warnings: [],
          reportMapping: null,
          documentVersion: null,
        }),
      );
    }

    if (url.endsWith("/api/v1/safety-cost-usages/safety-cost-usage-sample-001/validate")) {
      return new Response(
        JSON.stringify({
          usageId: "safety-cost-usage-sample-001",
          warnings: [],
          hasDanger: false,
        }),
      );
    }

    if (url.endsWith("/api/v1/safety-cost-usages/safety-cost-usage-sample-001/history")) {
      return new Response(
        JSON.stringify([
          {
            id: "safety-cost-history-sample-001",
            safetyCostUsageId: "safety-cost-usage-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: "owner-samsung-cultural-foundation",
            eventType: "safety-cost.created",
            summary: "산업안전보건관리비 사용내역이 등록되었습니다.",
            changedFields: ["calculatedAmount"],
            fileId: null,
            createdAt: "2026-05-10T09:00:00+09:00",
          },
        ]),
      );
    }

    if (url.endsWith("/api/v1/documents/doc-sample-001/safety-cost-usage")) {
      return new Response(
        JSON.stringify({
          documentId: "doc-sample-001",
          section: {
            documentId: "doc-sample-001",
            documentVersionId: "document-version-sample-001",
            sectionKey: "safety_cost_usage",
            safetyCostUsageId: "safety-cost-usage-sample-001",
            projectSummaryPhrase: "계상금액 100,000,000원 중 32,000,000원 사용",
            implementationBudgetPhrase: "검토 의견",
            updatedAt: "2026-05-10T09:00:00+09:00",
          },
          documentVersion: null,
          usage: {
            id: "safety-cost-usage-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: "owner-samsung-cultural-foundation",
            calculatedAmount: 100000000,
            usedAmount: 32000000,
            usedRateCalculated: 32,
            userEnteredRate: 32,
            basisMonth: "2월말",
            basisDate: null,
            basisDocumentText: "산업안전보건관리비 사용내역서",
            appropriatenessComment: "검토 의견",
            appropriatenessStatus: "appropriate",
            status: "synced_to_report",
            confirmedBy: "user-engineer-001",
            confirmedAt: "2026-05-10T09:00:00+09:00",
            reportInclude: true,
            syncedDocumentId: "doc-sample-001",
            createdAt: "2026-05-10T09:00:00+09:00",
            updatedAt: "2026-05-10T09:00:00+09:00",
          },
          evidenceItems: [],
          reviews: [],
          warnings: [],
          reportMapping: null,
        }),
      );
    }

    throw new Error(`Unexpected safety cost loader URL: ${url}`);
  };

  await loadProjectSafetyCostsPageData("project-sample-001", safetyCostLoaderFetch);
  await loadProjectSafetyCostOwnerMatrixPageData(
    "project-sample-001",
    safetyCostLoaderFetch,
  );
  await loadRoundSafetyCostsPageData("round-sample-001", safetyCostLoaderFetch);
  await loadSafetyCostDetailPageData(
    "safety-cost-usage-sample-001",
    safetyCostLoaderFetch,
  );
  await loadSafetyCostHistoryPageData(
    "safety-cost-usage-sample-001",
    safetyCostLoaderFetch,
  );
  await loadDocumentSafetyCostPageData("doc-sample-001", safetyCostLoaderFetch);

  assert.ok(
    safetyCostLoaderUrls.some((url) =>
      url.endsWith("/api/v1/projects/project-sample-001/safety-cost-usages"),
    ),
  );
  assert.ok(
    safetyCostLoaderUrls.some((url) =>
      url.endsWith("/api/v1/projects/project-sample-001/safety-cost-usages/owner-matrix"),
    ),
  );
  assert.ok(
    safetyCostLoaderUrls.some((url) =>
      url.endsWith("/api/v1/inspection-rounds/round-sample-001/safety-cost-usages"),
    ),
  );
  assert.ok(
    safetyCostLoaderUrls.some((url) =>
      url.endsWith("/api/v1/safety-cost-usages/safety-cost-usage-sample-001"),
    ),
  );
  assert.ok(
    safetyCostLoaderUrls.some((url) =>
      url.endsWith("/api/v1/safety-cost-usages/safety-cost-usage-sample-001/validate"),
    ),
  );
  assert.ok(
    safetyCostLoaderUrls.some((url) =>
      url.endsWith("/api/v1/safety-cost-usages/safety-cost-usage-sample-001/history"),
    ),
  );
  assert.ok(
    safetyCostLoaderUrls.some((url) =>
      url.endsWith("/api/v1/documents/doc-sample-001/safety-cost-usage"),
    ),
  );

  const checklistLoaderUrls: string[] = [];
  const checklistLoaderFetch: typeof fetch = async (input) => {
    const url = String(input);
    checklistLoaderUrls.push(url);

    if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/checklist-sessions")) {
      return new Response(
        JSON.stringify([
          {
            id: "checklist-session-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: null,
            templateId: "checklist-template-sample-001",
            templateVersion: "2026.1",
            inspectorUserId: "user-inspector-001",
            inspectionDate: "2026-01-23",
            status: "in_progress",
            startedAt: "2026-05-10T09:00:00+09:00",
            completedAt: null,
            reviewedAt: null,
            lockedAt: null,
            createdAt: "2026-05-10T09:00:00+09:00",
            updatedAt: "2026-05-10T09:00:00+09:00",
            resultCount: 4,
            completedCount: 3,
            progressRate: 0.75,
          },
        ]),
      );
    }

    if (url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001")) {
      return new Response(
        JSON.stringify({
          session: {
            id: "checklist-session-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: null,
            templateId: "checklist-template-sample-001",
            templateVersion: "2026.1",
            inspectorUserId: "user-inspector-001",
            inspectionDate: "2026-01-23",
            status: "in_progress",
            startedAt: "2026-05-10T09:00:00+09:00",
            completedAt: null,
            reviewedAt: null,
            lockedAt: null,
            createdAt: "2026-05-10T09:00:00+09:00",
            updatedAt: "2026-05-10T09:00:00+09:00",
            resultCount: 4,
            completedCount: 3,
            progressRate: 0.75,
          },
          template: {
            id: "checklist-template-sample-001",
            name: "승강기 교체공사 표준 현장점검 체크리스트",
            description: "공사안전보건대장 이행점검 결과보고서용 기본 점검표",
            projectType: "elevator_replacement",
            documentType: "safety_health_ledger_inspection_report",
            version: "2026.1",
            status: "published",
            publishedAt: "2026-05-10T09:00:00+09:00",
            createdAt: "2026-05-10T09:00:00+09:00",
            updatedAt: "2026-05-10T09:00:00+09:00",
          },
          categories: [
            {
              id: "checklist-category-common",
              templateId: "checklist-template-sample-001",
              key: "common",
              title: "공통",
              displayOrder: 1,
            },
          ],
          results: [],
          findingCandidates: [],
          riskReductionItems: [],
          additionalHazards: [],
          photos: [],
          reportMappings: [],
          mobileDrafts: [],
          auditLogs: [],
          warnings: [],
        }),
      );
    }

    if (url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001/results")) {
      return new Response(JSON.stringify([]));
    }

    if (url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001/report-mapping")) {
      return new Response(
        JSON.stringify({
          sessionId: "checklist-session-sample-001",
          reportMappings: [],
          warnings: [],
        }),
      );
    }

    if (url.endsWith("/api/v1/checklist-templates/checklist-template-sample-001/items")) {
      return new Response(JSON.stringify([]));
    }

    throw new Error(`Unexpected checklist loader URL: ${url}`);
  };

  await loadChecklistRoundPageData("round-sample-001", checklistLoaderFetch);
  assert.ok(
    checklistLoaderUrls.some((url) => url.endsWith("/api/v1/checklist-templates/checklist-template-sample-001/items")),
  );
  assert.ok(
    checklistLoaderUrls.some((url) => url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001/results")),
  );
  assert.ok(
    checklistLoaderUrls.some((url) => url.endsWith("/api/v1/checklist-sessions/checklist-session-sample-001/report-mapping")),
  );

  const findingActionCalls: Array<{ url: string; method: string }> = [];
  const findingActionFetch: typeof fetch = async (input, init) => {
    findingActionCalls.push({
      url: String(input),
      method: init?.method ?? "GET",
    });
    return new Response(JSON.stringify({ ok: true, warnings: [] }));
  };

  await createCorrectiveActionDraft(
    "finding-sample-001",
    { actionDetail: "조치현황 초안" },
    findingActionFetch,
  );
  await verifyCorrectiveActionDraft(
    "action-sample-001",
    { verifiedBy: "user-engineer-001", verifiedAt: "2026-05-10T09:00:00+09:00" },
    findingActionFetch,
  );
  await uploadFindingEvidencePhoto(
    "finding-sample-001",
    {
      fileId: "file-draft-001",
      fileName: "finding-photo.jpg",
      storagePath: "/draft/findings/finding-photo.jpg",
      photoType: "finding_photo",
    },
    findingActionFetch,
  );
  await saveEvidencePhotoMarkup(
    "photo-sample-001",
    {
      shapes: [
        {
          id: "shape-sample-001",
          shapeType: "ellipse",
          x: 0.3,
          y: 0.4,
          width: 0.2,
          height: 0.1,
        },
      ],
    },
    findingActionFetch,
  );
  await saveEvidencePhotoCaption("photo-sample-001", "캡션 초안", findingActionFetch);
  await updatePhotoLedgerEntryDraft(
    "photo-ledger-entry-sample-001",
    { confirmed: true },
    findingActionFetch,
  );
  await validatePhotoLedgerDraft("photo-ledger-sample-001", findingActionFetch);
  await draftActionRequestMailForFindings(
    {
      projectId: "project-sample-001",
      inspectionRoundId: "round-sample-001",
      findingIds: ["finding-sample-001"],
    },
    findingActionFetch,
  );
  await sendActionRequestMailDraft({ mailDraftId: "mail-draft-sample-001" }, findingActionFetch);

  assert.ok(
    findingActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/findings/finding-sample-001/actions"),
    ),
  );
  assert.ok(
    findingActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/corrective-actions/action-sample-001/verify"),
    ),
  );
  assert.ok(
    findingActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/findings/finding-sample-001/photos/upload"),
    ),
  );
  assert.ok(
    findingActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/evidence-photos/photo-sample-001/markup"),
    ),
  );
  assert.ok(
    findingActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/evidence-photos/photo-sample-001/set-caption"),
    ),
  );
  assert.ok(
    findingActionCalls.some(
      (call) => call.method === "PATCH" && call.url.endsWith("/api/v1/photo-ledger-entries/photo-ledger-entry-sample-001"),
    ),
  );
  assert.ok(
    findingActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/photo-ledgers/photo-ledger-sample-001/validate"),
    ),
  );
  assert.ok(
    findingActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/findings/action-request-mail/draft"),
    ),
  );
  assert.ok(
    findingActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/findings/action-request-mail/send"),
    ),
  );

  const safetyCostActionCalls: Array<{ url: string; method: string }> = [];
  const safetyCostActionFetch: typeof fetch = async (input, init) => {
    safetyCostActionCalls.push({
      url: String(input),
      method: init?.method ?? "GET",
    });
    return new Response(JSON.stringify({ ok: true, warnings: [] }));
  };

  await createRoundSafetyCostUsageDraft(
    "round-sample-001",
    {
      ownerPartyId: "owner-samsung-cultural-foundation",
      calculatedAmount: 100000000,
      usedAmount: 32000000,
    },
    safetyCostActionFetch,
  );
  await updateSafetyCostUsageDraft(
    "safety-cost-usage-sample-001",
    { usedAmount: 33000000 },
    safetyCostActionFetch,
  );
  await calculateSafetyCostRateDraft(
    "safety-cost-usage-sample-001",
    safetyCostActionFetch,
  );
  await validateSafetyCostUsageDraft(
    "safety-cost-usage-sample-001",
    safetyCostActionFetch,
  );
  await uploadSafetyCostEvidenceDraft(
    "safety-cost-usage-sample-001",
    {
      fileId: "file-safety-cost-001",
      evidenceType: "receipt",
      fileName: "receipt.pdf",
      storagePath: "/draft/receipt.pdf",
    },
    safetyCostActionFetch,
  );
  await generateSafetyCostCommentDraft(
    "safety-cost-usage-sample-001",
    safetyCostActionFetch,
  );
  await reviewSafetyCostUsageDraft(
    "safety-cost-usage-sample-001",
    {
      reviewerId: "user-engineer-001",
      reviewComment: "적정성 검토 완료",
      appropriatenessStatus: "appropriate",
    },
    safetyCostActionFetch,
  );
  await confirmSafetyCostUsageDraft(
    "safety-cost-usage-sample-001",
    { confirmedBy: "user-engineer-001" },
    safetyCostActionFetch,
  );
  await syncSafetyCostUsageDraft(
    "safety-cost-usage-sample-001",
    { documentId: "doc-sample-001" },
    safetyCostActionFetch,
  );

  assert.ok(
    safetyCostActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/inspection-rounds/round-sample-001/safety-cost-usages"),
    ),
  );
  assert.ok(
    safetyCostActionCalls.some(
      (call) =>
        call.method === "PATCH" &&
        call.url.endsWith("/api/v1/safety-cost-usages/safety-cost-usage-sample-001"),
    ),
  );
  assert.ok(
    safetyCostActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith(
          "/api/v1/safety-cost-usages/safety-cost-usage-sample-001/calculate-rate",
        ),
    ),
  );
  assert.ok(
    safetyCostActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith(
          "/api/v1/safety-cost-usages/safety-cost-usage-sample-001/validate",
        ),
    ),
  );
  assert.ok(
    safetyCostActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith(
          "/api/v1/safety-cost-usages/safety-cost-usage-sample-001/evidence/upload",
        ),
    ),
  );
  assert.ok(
    safetyCostActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith(
          "/api/v1/safety-cost-usages/safety-cost-usage-sample-001/generate-comment",
        ),
    ),
  );
  assert.ok(
    safetyCostActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-cost-usages/safety-cost-usage-sample-001/review"),
    ),
  );
  assert.ok(
    safetyCostActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-cost-usages/safety-cost-usage-sample-001/confirm"),
    ),
  );
  assert.ok(
    safetyCostActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith(
          "/api/v1/safety-cost-usages/safety-cost-usage-sample-001/sync-to-report",
        ),
    ),
  );

  const safetyReportLoaderCalls: string[] = [];
  const safetyReportFetch: typeof fetch = async (input) => {
    const url = String(input);
    safetyReportLoaderCalls.push(url);
    if (url.endsWith("/api/v1/projects/project-sample-001/safety-reports")) {
      return new Response(
        JSON.stringify([
          {
            document: {
              id: "doc-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "owner-samsung-cultural-foundation",
              title: "공사안전보건대장 이행확인 보고서",
              status: "draft",
            },
            ownerDisplayName: "삼성문화재단",
            inspectionRoundName: "1회 점검",
            missingRequiredCount: 0,
            warningCount: 1,
            linkedOwnerReportTask: null,
            latestVersion: null,
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/safety-reports/doc-sample-001")) {
      return new Response(
        JSON.stringify({
          document: {
            id: "doc-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: "owner-samsung-cultural-foundation",
            title: "공사안전보건대장 이행확인 보고서",
            status: "draft",
            latestVersionNo: 1,
          },
          snapshot: {
            meta: {
              documentId: "doc-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "owner-samsung-cultural-foundation",
              ownerDisplayName: "삼성문화재단",
              templateId: "template-safety-report-v1",
              generatedMode: "from_linked_data",
              draftWatermark: "AI DRAFT",
            },
            variables: { projectName: "리움미술관 승강기 교체공사" },
            sections: [],
            missingFields: [],
            reviewWarnings: [],
            sourceLinks: [],
          },
          sections: [],
          versions: [],
          missingFields: [],
          warnings: [],
          linkedOwnerReportTask: null,
          linkedDataSummary: {
            checklistResults: 0,
            findings: 0,
            photoLedgers: 0,
            safetyCostUsages: 0,
            attachments: 0,
          },
          exportedFile: null,
        }),
      );
    }
    if (url.endsWith("/api/v1/safety-reports/doc-sample-001/variables")) {
      return new Response(
        JSON.stringify({
          documentId: "doc-sample-001",
          variables: { projectName: "리움미술관 승강기 교체공사" },
          sourceLinks: [],
        }),
      );
    }
    if (url.endsWith("/api/v1/safety-reports/doc-sample-001/missing-fields")) {
      return new Response(JSON.stringify([]));
    }
    if (url.endsWith("/api/v1/safety-reports/doc-sample-001/validate")) {
      return new Response(
        JSON.stringify({
          documentId: "doc-sample-001",
          missingFields: [],
          warnings: [],
          hasDanger: false,
        }),
      );
    }
    if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/owner-report-tasks")) {
      return new Response(
        JSON.stringify([
          {
            id: "owner-report-task-001-01",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: "owner-samsung-cultural-foundation",
            ownerDisplayName: "삼성문화재단",
            documentInstanceId: "doc-sample-001",
            status: "drafting",
          },
        ]),
      );
    }
    return new Response("{}", { status: 200 });
  };

  const safetyReportListData = await loadProjectSafetyReportsPageData(
    "project-sample-001",
    safetyReportFetch,
  );
  assert.equal(safetyReportListData.dataSource, "api");
  const safetyReportDetailData = await loadSafetyReportDetailPageData(
    "doc-sample-001",
    safetyReportFetch,
  );
  assert.equal(safetyReportDetailData.dataSource, "api");
  const safetyReportVariablesData = await loadSafetyReportVariablesPageData(
    "doc-sample-001",
    safetyReportFetch,
  );
  assert.equal(safetyReportVariablesData.dataSource, "api");
  const ownerTaskData = await loadOwnerReportTaskDocumentPageData(
    "round-sample-001",
    "owner-report-task-001-01",
    safetyReportFetch,
  );
  assert.equal(ownerTaskData.dataSource, "api");

  assert.ok(
    safetyReportLoaderCalls.some((call) =>
      call.endsWith("/api/v1/projects/project-sample-001/safety-reports"),
    ),
  );
  assert.ok(
    safetyReportLoaderCalls.some((call) =>
      call.endsWith("/api/v1/safety-reports/doc-sample-001/variables"),
    ),
  );

  const safetyReportActionCalls: Array<{ url: string; method: string }> = [];
  const safetyReportActionFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    safetyReportActionCalls.push({ url, method });
    if (url.endsWith("/api/v1/safety-reports/draft")) {
      return new Response(JSON.stringify({ document: { id: "doc-created-001" } }));
    }
    if (url.endsWith("/api/v1/safety-reports/doc-sample-001/save-section")) {
      return new Response(JSON.stringify({ version: { id: "version-001" } }));
    }
    if (url.endsWith("/api/v1/safety-reports/doc-sample-001/sections/cover/regenerate")) {
      return new Response(JSON.stringify({ version: { id: "version-002" } }));
    }
    if (url.endsWith("/api/v1/safety-reports/doc-sample-001/refresh-linked-data")) {
      return new Response(JSON.stringify({ document: { id: "doc-sample-001" }, warnings: [] }));
    }
    if (url.endsWith("/api/v1/safety-reports/doc-sample-001/export")) {
      return new Response(
        JSON.stringify({
          fileAsset: { storagePath: "/reports/doc-sample-001.pdf" },
        }),
      );
    }
    if (url.endsWith("/api/v1/safety-reports/doc-sample-001/mark-submitted")) {
      return new Response(JSON.stringify({ document: { status: "submitted" } }));
    }
    if (url.endsWith("/api/v1/safety-reports/doc-sample-001/link-owner-report-task")) {
      return new Response(JSON.stringify({ ownerReportTask: { id: "owner-report-task-001-01" } }));
    }
    if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/safety-report-required-data")) {
      return new Response(
        JSON.stringify({
          projectId: "project-sample-001",
          inspectionRoundId: "round-sample-001",
          ownerBranches: [
            {
              ownerPartyId: "owner-samsung-cultural-foundation",
              ownerDisplayName: "삼성문화재단",
            },
          ],
          requiredData: [],
          warnings: [],
        }),
      );
    }
    if (url.endsWith("/api/v1/inspection-rounds/round-sample-001/owner-report-branches")) {
      return new Response(
        JSON.stringify([
          {
            ownerPartyId: "owner-samsung-cultural-foundation",
            ownerDisplayName: "삼성문화재단",
          },
        ]),
      );
    }
    return new Response(JSON.stringify({}));
  };

  await createSafetyReportDraftAction(
    {
      projectId: "project-sample-001",
      inspectionRoundId: "round-sample-001",
      ownerPartyId: "owner-samsung-cultural-foundation",
      templateId: "template-safety-report-v1",
    },
    safetyReportActionFetch,
  );
  await saveSafetyReportSectionDraft(
    "doc-sample-001",
    { sectionKey: "cover", content: { summary: "updated" } },
    safetyReportActionFetch,
  );
  await regenerateSafetyReportSectionDraft("doc-sample-001", "cover", safetyReportActionFetch);
  await refreshSafetyReportLinkedDataDraft("doc-sample-001", safetyReportActionFetch);
  await exportSafetyReportDraft(
    "doc-sample-001",
    { exportedBy: "user-engineer-001" },
    safetyReportActionFetch,
  );
  await markSafetyReportSubmittedDraft(
    "doc-sample-001",
    { submittedAt: "2026-05-10T09:00:00+09:00", mailThreadId: "mail-thread-001" },
    safetyReportActionFetch,
  );
  await linkSafetyReportOwnerTaskDraft(
    "doc-sample-001",
    { ownerReportTaskId: "owner-report-task-001-01" },
    safetyReportActionFetch,
  );
  await getSafetyReportRequiredDataAction("round-sample-001", safetyReportActionFetch);
  await getSafetyReportOwnerBranchesAction("round-sample-001", safetyReportActionFetch);

  assert.ok(
    safetyReportActionCalls.some(
      (call) => call.method === "POST" && call.url.endsWith("/api/v1/safety-reports/draft"),
    ),
  );
  assert.ok(
    safetyReportActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-reports/doc-sample-001/save-section"),
    ),
  );

  const approvalLoaderCalls: string[] = [];
  const approvalFetch: typeof fetch = async (input) => {
    const url = String(input);
    approvalLoaderCalls.push(url);
    if (url.endsWith("/api/v1/approvals")) {
      return new Response(
        JSON.stringify([
          {
            workflow: {
              id: "approval-workflow-sample-001",
              documentId: "doc-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "owner-samsung-cultural-foundation",
              title: "결재",
              status: "requested",
              templateId: "approval-template-safety-report-001",
              currentStepOrder: 1,
              requestedBy: "user-engineer-001",
              requestedAt: "",
              completedAt: null,
              createdAt: "",
              updatedAt: "",
            },
            document: {
              id: "doc-sample-001",
              projectId: "project-sample-001",
              inspectionRoundId: "round-sample-001",
              ownerPartyId: "owner-samsung-cultural-foundation",
              title: "공사안전보건대장 이행확인 보고서",
              status: "approval_requested",
              documentType: "safety_health_ledger_inspection_report",
              roundNo: 1,
              latestVersionNo: 2,
              createdAt: "",
              updatedAt: "",
            },
            currentStep: {
              id: "approval-step-sample-001",
              workflowId: "approval-workflow-sample-001",
              stepOrder: 1,
              role: "internal_review",
              assigneeLabel: "기술지도팀",
              status: "current",
              required: true,
              createdAt: "",
              updatedAt: "",
            },
            pendingRequiredCount: 2,
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/approvals/inbox")) {
      return new Response(JSON.stringify([]));
    }
    if (url.endsWith("/api/v1/approvals/requested")) {
      return new Response(JSON.stringify([]));
    }
    if (url.endsWith("/api/v1/documents/doc-sample-001/approval")) {
      return new Response(
        JSON.stringify({
          document: {
            id: "doc-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: "owner-samsung-cultural-foundation",
            title: "공사안전보건대장 이행확인 보고서",
            status: "approval_requested",
            documentType: "safety_health_ledger_inspection_report",
            roundNo: 1,
            latestVersionNo: 2,
            createdAt: "",
            updatedAt: "",
          },
          workflow: {
            id: "approval-workflow-sample-001",
            documentId: "doc-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: "owner-samsung-cultural-foundation",
            title: "결재",
            status: "requested",
            templateId: "approval-template-safety-report-001",
            currentStepOrder: 1,
            requestedBy: "user-engineer-001",
            requestedAt: "",
            completedAt: null,
            createdAt: "",
            updatedAt: "",
          },
          steps: [],
          comments: [],
          auditLogs: [],
        }),
      );
    }
    if (url.endsWith("/api/v1/documents/doc-sample-001/signature-tasks")) {
      return new Response(
        JSON.stringify({
          document: {
            id: "doc-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: "owner-samsung-cultural-foundation",
            title: "공사안전보건대장 이행확인 보고서",
            status: "approval_requested",
            documentType: "safety_health_ledger_inspection_report",
            roundNo: 1,
            latestVersionNo: 2,
            createdAt: "",
            updatedAt: "",
          },
          tasks: [],
        }),
      );
    }
    if (url.endsWith("/api/v1/signature-assets")) {
      return new Response(JSON.stringify([]));
    }
    if (url.endsWith("/api/v1/documents/doc-sample-001/submission-readiness")) {
      return new Response(
        JSON.stringify({
          document: {
            id: "doc-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: "owner-samsung-cultural-foundation",
            title: "공사안전보건대장 이행확인 보고서",
            status: "approved",
            documentType: "safety_health_ledger_inspection_report",
            exportedFileId: "file-asset-final-001",
            roundNo: 1,
            latestVersionNo: 2,
            createdAt: "",
            updatedAt: "",
          },
          workflow: null,
          signatureTasks: [],
          package: null,
          warnings: [],
          ready: true,
        }),
      );
    }
    if (url.endsWith("/api/v1/submissions/submission-sample-001")) {
      return new Response(
        JSON.stringify({
          submission: {
            id: "submission-sample-001",
            documentId: "doc-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: "owner-samsung-cultural-foundation",
            exportedFileId: "file-asset-final-001",
            mailThreadId: "mail-thread-001",
            submittedAt: "2026-05-10T13:00:00+09:00",
            status: "submitted",
            createdAt: "",
            updatedAt: "",
          },
          document: {
            id: "doc-sample-001",
            projectId: "project-sample-001",
            inspectionRoundId: "round-sample-001",
            ownerPartyId: "owner-samsung-cultural-foundation",
            title: "공사안전보건대장 이행확인 보고서",
            status: "submitted",
            documentType: "safety_health_ledger_inspection_report",
            roundNo: 1,
            latestVersionNo: 2,
            createdAt: "",
            updatedAt: "",
          },
          package: null,
          recipients: [],
          attachments: [],
          events: [],
          auditLogs: [],
        }),
      );
    }
    return new Response(JSON.stringify({}));
  };

  const approvalsQueue = await loadApprovalsQueuePageData(approvalFetch);
  assert.equal(approvalsQueue.dataSource, "api");
  const approvalsInbox = await loadApprovalsInboxPageData(approvalFetch);
  assert.equal(approvalsInbox.dataSource, "api");
  const approvalsRequested = await loadRequestedApprovalsPageData(approvalFetch);
  assert.equal(approvalsRequested.dataSource, "api");
  const approvalDetail = await loadDocumentApprovalPageData("doc-sample-001", approvalFetch);
  assert.equal(approvalDetail.dataSource, "api");
  const signatureDetail = await loadDocumentSignaturePageData("doc-sample-001", approvalFetch);
  assert.equal(signatureDetail.dataSource, "api");
  const submissionDetail = await loadDocumentSubmissionPageData("doc-sample-001", approvalFetch);
  assert.equal(submissionDetail.dataSource, "api");
  const queuedSubmission = await loadSubmissionDetailPageData("submission-sample-001", approvalFetch);
  assert.equal(queuedSubmission.dataSource, "api");
  assert.ok(
    approvalLoaderCalls.some((call) => call.endsWith("/api/v1/documents/doc-sample-001/submission-readiness")),
  );
  assert.ok(approvalLoaderCalls.some((call) => call.endsWith("/api/v1/approvals/inbox")));
  assert.ok(approvalLoaderCalls.some((call) => call.endsWith("/api/v1/approvals/requested")));

  const approvalActionCalls: Array<{ url: string; method: string }> = [];
  const approvalActionFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    approvalActionCalls.push({ url, method });
    return new Response(
      JSON.stringify({
        document: {
          id: "doc-sample-001",
          projectId: "project-sample-001",
          inspectionRoundId: "round-sample-001",
          ownerPartyId: "owner-samsung-cultural-foundation",
          title: "공사안전보건대장 이행확인 보고서",
          status: "submitted",
          documentType: "safety_health_ledger_inspection_report",
          roundNo: 1,
          latestVersionNo: 2,
          createdAt: "",
          updatedAt: "",
        },
        workflow: null,
        steps: [],
        comments: [],
        auditLogs: [],
        task: {
          id: "signature-task-sample-002",
          documentId: "doc-sample-001",
          projectId: "project-sample-001",
          ownerPartyId: "owner-samsung-cultural-foundation",
          taskType: "signed_file_upload",
          title: "서명본 업로드",
          status: "completed",
          required: true,
          signatureAssetId: null,
          signedFileId: "file-signed-001",
          createdAt: "",
          updatedAt: "",
        },
        tasks: [],
        package: { id: "submission-package-001", documentId: "doc-sample-001", projectId: "project-sample-001", ownerPartyId: "owner-samsung-cultural-foundation", mainFileId: "file-001", attachmentFileIds: [], status: "finalized", createdAt: "", updatedAt: "" },
        submission: { id: "submission-001", documentId: "doc-sample-001", projectId: "project-sample-001", inspectionRoundId: "round-sample-001", ownerPartyId: "owner-samsung-cultural-foundation", exportedFileId: "file-001", mailThreadId: "mail-thread-001", submittedAt: "2026-05-10T13:00:00+09:00", status: "submitted", createdAt: "", updatedAt: "" },
        recipients: [],
        attachments: [],
        events: [],
      }),
    );
  };

  await requestDocumentApprovalAction("doc-sample-001", {}, approvalActionFetch);
  await approveDocumentStepAction("approval-step-sample-001", {}, approvalActionFetch);
  await rejectDocumentStepAction("approval-step-sample-001", { comment: "반려" }, approvalActionFetch);
  await requestDocumentStepChangesAction("approval-step-sample-001", { comment: "보완" }, approvalActionFetch);
  await completeDocumentSignatureTaskAction("signature-task-sample-002", { signedFileId: "file-signed-001" }, approvalActionFetch);
  await waiveDocumentSignatureTaskAction("signature-task-sample-002", { waivedReason: "예외 승인" }, approvalActionFetch);
  await uploadSignedDocumentFileAction("doc-sample-001", { fileName: "signed.pdf" }, approvalActionFetch);
  await createSubmissionPackageAction("doc-sample-001", { mainFileId: "file-001" }, approvalActionFetch);
  await validateSubmissionPackageAction("submission-package-001", approvalActionFetch);
  await finalizeSubmissionPackageAction("submission-package-001", approvalActionFetch);
  await createProjectSubmissionAction("project-sample-001", { documentId: "doc-sample-001", packageId: "submission-package-001" }, approvalActionFetch);
  await sendSubmissionMailAction("submission-001", {}, approvalActionFetch);
  await markManualSubmissionAction("submission-001", { memo: "수동 제출" }, approvalActionFetch);
  await confirmSubmissionOwnerReceiptAction("submission-001", approvalActionFetch);
  await requestSubmissionRevisionAction("submission-001", { memo: "보완 요청" }, approvalActionFetch);
  await archiveSubmissionAction("submission-001", approvalActionFetch);

  assert.ok(
    approvalActionCalls.some((call) => call.method === "POST" && call.url.endsWith("/api/v1/documents/doc-sample-001/approval/request")),
  );
  assert.ok(
    approvalActionCalls.some((call) => call.method === "POST" && call.url.endsWith("/api/v1/submissions/submission-001/send-mail")),
  );
  assert.ok(
    approvalActionCalls.some((call) => call.method === "POST" && call.url.endsWith("/api/v1/approval-steps/approval-step-sample-001/request-changes")),
  );
  assert.ok(
    approvalActionCalls.some((call) => call.method === "POST" && call.url.endsWith("/api/v1/submissions/submission-001/confirm-owner-receipt")),
  );

  const adminLoaderCalls: string[] = [];
  const adminFetch: typeof fetch = async (input) => {
    const url = String(input);
    adminLoaderCalls.push(url);
    if (url.endsWith("/api/v1/admin/summary")) {
      return new Response(
        JSON.stringify({
          counts: {
            users: 1,
            activeTemplates: 1,
            reviewTemplates: 0,
            publishedPrompts: 1,
            failedPromptTests: 0,
          },
          recentLegalChanges: [],
          recentAuditLogs: [],
          warnings: [],
        }),
      );
    }
    if (url.endsWith("/api/v1/admin/users")) {
      return new Response(
        JSON.stringify([
          {
            id: "user-admin-001",
            name: "관리자",
            email: "admin@anc.local",
            status: "active",
            roleIds: ["role-001"],
            projectAccessPolicy: "all",
            createdAt: "",
            updatedAt: "",
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/admin/roles")) {
      return new Response(
        JSON.stringify([
          {
            id: "role-001",
            key: "super_admin",
            name: "최고관리자",
            permissionKeys: ["template.read"],
            systemRole: true,
            createdAt: "",
            updatedAt: "",
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/admin/permissions")) {
      return new Response(JSON.stringify([{ id: "permission-001", key: "template.read", name: "템플릿 조회", groupKey: "template" }]));
    }
    if (url.endsWith("/api/v1/admin/company-profile")) {
      return new Response(
        JSON.stringify({
          companyProfile: {
            id: "company-profile-001",
            companyName: "A&C기술사사무소",
            representativeName: "대표기술사",
            businessNumber: "000-00-00000",
            address: "서울",
            phone: "02-0000-0000",
            email: "office@anc.local",
            defaultMailFooter: "footer",
            updatedAt: "",
          },
        }),
      );
    }
    if (url.endsWith("/api/v1/admin/document-templates")) {
      return new Response(
        JSON.stringify([
          {
            template: {
              id: "document-template-sample-001",
              templateKey: "sample.template",
              name: "샘플 템플릿",
              documentType: "safety_report",
              status: "published",
              currentVersionId: "template-version-sample-001",
              publishedVersionId: "template-version-sample-001",
              createdAt: "",
              updatedAt: "",
            },
            currentVersion: {
              id: "template-version-sample-001",
              templateId: "document-template-sample-001",
              versionNo: 1,
              status: "published",
              bodyTemplate: "{{project.projectName}}",
              validationPassed: true,
              previewPassed: true,
              missingRequiredVariables: [],
              createdAt: "",
              updatedAt: "",
            },
            sectionCount: 1,
            variableCount: 1,
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/admin/document-templates/document-template-sample-001")) {
      return new Response(
        JSON.stringify({
          template: {
            id: "document-template-sample-001",
            templateKey: "sample.template",
            name: "샘플 템플릿",
            documentType: "safety_report",
            status: "published",
            currentVersionId: "template-version-sample-001",
            publishedVersionId: "template-version-sample-001",
            createdAt: "",
            updatedAt: "",
          },
          currentVersion: {
            id: "template-version-sample-001",
            templateId: "document-template-sample-001",
            versionNo: 1,
            status: "published",
            bodyTemplate: "{{project.projectName}}",
            validationPassed: true,
            previewPassed: true,
            missingRequiredVariables: [],
            createdAt: "",
            updatedAt: "",
          },
          versions: [],
          sections: [{ id: "template-section-001", versionId: "template-version-sample-001", key: "cover", title: "표지", body: "{{project.projectName}}", displayOrder: 1 }],
          variables: [{ id: "template-variable-001", versionId: "template-version-sample-001", variableKey: "project.projectName", label: "프로젝트명", dataPath: "project.projectName", sourceModel: "Project", dataType: "string", required: true, ownerSpecific: false, usedSectionKeys: ["cover"] }],
          loops: [],
          conditions: [],
        }),
      );
    }
    if (url.endsWith("/api/v1/admin/document-templates/document-template-sample-001/versions")) {
      return new Response(
        JSON.stringify([
          {
            id: "template-version-sample-001",
            templateId: "document-template-sample-001",
            versionNo: 1,
            status: "published",
            bodyTemplate: "{{project.projectName}}",
            validationPassed: true,
            previewPassed: true,
            missingRequiredVariables: [],
            createdAt: "",
            updatedAt: "",
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/admin/template-versions/template-version-sample-001/variables")) {
      return new Response(
        JSON.stringify([
          {
            id: "template-variable-001",
            versionId: "template-version-sample-001",
            variableKey: "project.projectName",
            label: "프로젝트명",
            dataPath: "project.projectName",
            sourceModel: "Project",
            dataType: "string",
            required: true,
            ownerSpecific: false,
            usedSectionKeys: ["cover"],
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/admin/template-versions/template-version-sample-001/preview")) {
      return new Response(JSON.stringify({ previewRun: { id: "preview-001" }, missingFields: [], previewText: "샘플 미리보기" }));
    }
    if (url.endsWith("/api/v1/admin/checklist-templates")) {
      return new Response(
        JSON.stringify([
          {
            id: "checklist-template-sample-001",
            name: "샘플 체크리스트",
            documentType: "checklist",
            version: "v1",
            status: "published",
            createdAt: "",
            updatedAt: "",
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/admin/checklist-templates/checklist-template-sample-001")) {
      return new Response(
        JSON.stringify({
          template: {
            id: "checklist-template-sample-001",
            name: "샘플 체크리스트",
            documentType: "checklist",
            version: "v1",
            status: "published",
            createdAt: "",
            updatedAt: "",
          },
          categories: [],
          items: [
            {
              id: "checklist-item-001",
              templateId: "checklist-template-sample-001",
              categoryId: "category-001",
              categoryKey: "documents",
              title: "보고서 매핑 항목",
              reportLabel: "표지",
              defaultApplicability: true,
              isRequired: true,
              findingRequiredWhen: "never",
              sourceSectionKey: "cover",
              displayOrder: 1,
            },
          ],
        }),
      );
    }
    if (url.endsWith("/api/v1/admin/phrases")) {
      return new Response(JSON.stringify([{ id: "phrase-001", phraseType: "standard_phrase", title: "문구", body: "본문", tags: [], status: "published", createdAt: "", updatedAt: "" }]));
    }
    if (url.endsWith("/api/v1/admin/legal-clauses")) {
      return new Response(JSON.stringify([{ id: "legal-001", clauseCode: "LEGAL", title: "법령", body: "본문", status: "approved", createdAt: "", updatedAt: "" }]));
    }
    if (url.endsWith("/api/v1/admin/prompts")) {
      return new Response(
        JSON.stringify([
          {
            prompt: {
              id: "prompt-template-sample-001",
              promptKey: "sample.prompt",
              name: "샘플 프롬프트",
              promptType: "service_ai",
              featureId: "admin.template.prompt",
              status: "published",
              currentVersionId: "prompt-version-sample-001",
              publishedVersionId: "prompt-version-sample-001",
              createdAt: "",
              updatedAt: "",
            },
            currentVersion: {
              id: "prompt-version-sample-001",
              promptId: "prompt-template-sample-001",
              versionNo: 1,
              status: "published",
              systemMessage: "system",
              userMessageTemplate: "user",
              inputSchema: { type: "object" },
              outputSchema: { type: "object" },
              guardrails: ["Do not invent facts"],
              forbiddenBehaviors: ["invent_legal_text"],
              createdAt: "",
              updatedAt: "",
            },
            testCaseCount: 1,
            runLogCount: 1,
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/admin/prompts/prompt-template-sample-001")) {
      return new Response(
        JSON.stringify({
          prompt: {
            id: "prompt-template-sample-001",
            promptKey: "sample.prompt",
            name: "샘플 프롬프트",
            promptType: "service_ai",
            featureId: "admin.template.prompt",
            status: "published",
            currentVersionId: "prompt-version-sample-001",
            publishedVersionId: "prompt-version-sample-001",
            createdAt: "",
            updatedAt: "",
          },
          currentVersion: {
            id: "prompt-version-sample-001",
            promptId: "prompt-template-sample-001",
            versionNo: 1,
            status: "published",
            systemMessage: "system",
            userMessageTemplate: "user",
            inputSchema: { type: "object" },
            outputSchema: { type: "object" },
            guardrails: ["Do not invent facts"],
            forbiddenBehaviors: ["invent_legal_text"],
            createdAt: "",
            updatedAt: "",
          },
          versions: [],
          testCases: [{ id: "prompt-test-case-001", promptId: "prompt-template-sample-001", name: "기본", inputFixture: {}, expectedContains: ["draft"], expectedMissing: [], createdAt: "", updatedAt: "" }],
          runLogs: [{ id: "prompt-run-log-001", promptVersionId: "prompt-version-sample-001", inputFixture: {}, outputText: "{\"draft\":\"ok\"}", schemaValid: true, forbiddenBehaviorHits: [], passed: true, createdAt: "" }],
        }),
      );
    }
    if (url.endsWith("/api/v1/admin/prompts/prompt-template-sample-001/versions")) {
      return new Response(
        JSON.stringify([
          {
            id: "prompt-version-sample-001",
            promptId: "prompt-template-sample-001",
            versionNo: 1,
            status: "published",
            systemMessage: "system",
            userMessageTemplate: "user",
            inputSchema: { type: "object" },
            outputSchema: { type: "object" },
            guardrails: ["Do not invent facts"],
            forbiddenBehaviors: ["invent_legal_text"],
            lastTestRunAt: "",
            createdAt: "",
            updatedAt: "",
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/admin/prompts/prompt-template-sample-001/test-cases")) {
      return new Response(
        JSON.stringify([
          {
            id: "prompt-test-case-001",
            promptId: "prompt-template-sample-001",
            name: "기본",
            inputFixture: {},
            expectedContains: ["draft"],
            expectedMissing: [],
            createdAt: "",
            updatedAt: "",
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/admin/prompt-versions/prompt-version-sample-001")) {
      return new Response(
        JSON.stringify({
          version: {
            id: "prompt-version-sample-001",
            promptId: "prompt-template-sample-001",
            versionNo: 1,
            status: "published",
            systemMessage: "system",
            userMessageTemplate: "user",
            inputSchema: { type: "object" },
            outputSchema: { type: "object" },
            guardrails: ["Do not invent facts"],
            forbiddenBehaviors: ["invent_legal_text"],
            lastTestRunAt: "",
            createdAt: "",
            updatedAt: "",
          },
          runLogs: [
            {
              id: "prompt-run-log-001",
              promptVersionId: "prompt-version-sample-001",
              inputFixture: {},
              outputText: "{\"draft\":\"ok\"}",
              schemaValid: true,
              forbiddenBehaviorHits: [],
              passed: true,
              createdAt: "",
            },
          ],
        }),
      );
    }
    if (url.endsWith("/api/v1/admin/mail-templates")) {
      return new Response(JSON.stringify([{ id: "mail-template-001", name: "제출 메일", templateType: "submission_mail", subjectTemplate: "제목", bodyTemplate: "본문", variables: ["document.title"], createdAt: "", updatedAt: "" }]));
    }
    if (url.endsWith("/api/v1/admin/mail-templates/mail-template-001")) {
      return new Response(JSON.stringify({ template: { id: "mail-template-001", name: "제출 메일", templateType: "submission_mail", subjectTemplate: "제목", bodyTemplate: "본문", variables: ["document.title"], createdAt: "", updatedAt: "" } }));
    }
    if (url.endsWith("/api/v1/admin/approval-templates")) {
      return new Response(
        JSON.stringify([
          {
            template: {
              id: "approval-template-safety-report-001",
              name: "안전보고서 결재선",
              documentType: "safety_report",
              status: "published",
              createdAt: "",
              updatedAt: "",
            },
            steps: [],
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/admin/approval-templates/approval-template-safety-report-001")) {
      return new Response(
        JSON.stringify({
          template: {
            id: "approval-template-safety-report-001",
            name: "안전보고서 결재선",
            documentType: "safety_report",
            status: "published",
            createdAt: "",
            updatedAt: "",
          },
          steps: [],
        }),
      );
    }
    if (url.endsWith("/api/v1/admin/signature-assets")) {
      return new Response(
        JSON.stringify([
          {
            id: "signature-asset-sample-001",
            label: "대표 서명",
            assetType: "signature",
            status: "active",
            fileId: "file-signature-001",
            ownerPartyId: null,
            createdAt: "",
            updatedAt: "",
          },
          {
            id: "signature-asset-sample-002",
            label: "회사 직인",
            assetType: "seal",
            status: "active",
            fileId: "file-seal-001",
            ownerPartyId: null,
            createdAt: "",
            updatedAt: "",
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/admin/signature-assets/signature-asset-sample-001")) {
      return new Response(
        JSON.stringify({
          signatureAsset: {
            id: "signature-asset-sample-001",
            label: "대표 서명",
            assetType: "signature",
            status: "active",
            fileId: "file-signature-001",
            ownerPartyId: null,
            createdAt: "",
            updatedAt: "",
          },
        }),
      );
    }
    if (url.endsWith("/api/v1/admin/webhard-policies")) {
      return new Response(JSON.stringify({ policy: { id: "policy-001", defaultRootFolderName: "루트", generatedDocumentsFolderName: "최종본", submissionFolderName: "제출본", sharedLinkExpiryDays: 14, requireLockedFinalFiles: true, updatedAt: "" } }));
    }
    if (url.includes("/api/v1/admin/audit-logs")) {
      return new Response(JSON.stringify([{ id: "audit-001", actorUserId: "user-admin-001", action: "template_version.published", targetType: "template_version", targetId: "template-version-sample-001", targetName: "샘플 템플릿", reason: "발행", changedFields: ["status"], createdAt: "" }]));
    }
    return new Response(JSON.stringify({}));
  };

  const adminDashboard = await loadAdminDashboardPageData(adminFetch);
  assert.equal(adminDashboard.dataSource, "api");
  const adminUsers = await loadAdminUsersPageData(adminFetch);
  assert.equal(adminUsers.dataSource, "api");
  const adminRoles = await loadAdminRolesPageData(adminFetch);
  assert.equal(adminRoles.dataSource, "api");
  const adminCompany = await loadAdminCompanyPageData(adminFetch);
  assert.equal(adminCompany.dataSource, "api");
  const adminTemplates = await loadAdminTemplatesPageData(adminFetch);
  assert.equal(adminTemplates.dataSource, "api");
  const adminTemplateDetail = await loadAdminTemplateDetailPageData("document-template-sample-001", adminFetch);
  assert.equal(adminTemplateDetail.dataSource, "api");
  const adminTemplateVersions = await loadAdminTemplateVersionsPageData("document-template-sample-001", adminFetch);
  assert.equal(adminTemplateVersions.dataSource, "api");
  const adminTemplateVariables = await loadAdminTemplateVariablesPageData("document-template-sample-001", adminFetch);
  assert.equal(adminTemplateVariables.dataSource, "api");
  const adminTemplatePreview = await loadAdminTemplatePreviewPageData("document-template-sample-001", adminFetch);
  assert.equal(adminTemplatePreview.dataSource, "api");
  const adminChecklists = await loadAdminChecklistsPageData(adminFetch);
  assert.equal(adminChecklists.dataSource, "api");
  const adminChecklistDetail = await loadAdminChecklistTemplateDetailPageData("checklist-template-sample-001", adminFetch);
  assert.equal(adminChecklistDetail.dataSource, "api");
  const adminPhrases = await loadAdminPhrasesPageData(adminFetch);
  assert.equal(adminPhrases.dataSource, "api");
  const adminLegalClauses = await loadAdminLegalClausesPageData(adminFetch);
  assert.equal(adminLegalClauses.dataSource, "api");
  const adminPrompts = await loadAdminPromptsPageData(adminFetch);
  assert.equal(adminPrompts.dataSource, "api");
  const adminPromptDetail = await loadAdminPromptDetailPageData("prompt-template-sample-001", adminFetch);
  assert.equal(adminPromptDetail.dataSource, "api");
  const adminPromptVersions = await loadAdminPromptVersionsPageData("prompt-template-sample-001", adminFetch);
  assert.equal(adminPromptVersions.dataSource, "api");
  const adminPromptTestCases = await loadAdminPromptTestCasesPageData("prompt-template-sample-001", adminFetch);
  assert.equal(adminPromptTestCases.dataSource, "api");
  const adminPromptRun = await loadAdminPromptRunPageData("prompt-template-sample-001", adminFetch);
  assert.equal(adminPromptRun.dataSource, "api");
  const adminMailTemplates = await loadAdminMailTemplatesPageData(adminFetch);
  assert.equal(adminMailTemplates.dataSource, "api");
  const adminApprovalTemplates = await loadAdminApprovalTemplatesPageData(adminFetch);
  assert.equal(adminApprovalTemplates.dataSource, "api");
  const adminApprovalTemplateDetail = await loadAdminApprovalTemplateDetailPageData("approval-template-safety-report-001", adminFetch);
  assert.equal(adminApprovalTemplateDetail.dataSource, "api");
  const adminSignatureAssets = await loadAdminSignatureAssetsPageData(adminFetch);
  assert.equal(adminSignatureAssets.dataSource, "api");
  const adminSignatureAssetDetail = await loadAdminSignatureAssetDetailPageData("signature-asset-sample-001", adminFetch);
  assert.equal(adminSignatureAssetDetail.dataSource, "api");
  const adminWebhardPolicy = await loadAdminWebhardPolicyPageData(adminFetch);
  assert.equal(adminWebhardPolicy.dataSource, "api");
  const adminAuditLogs = await loadAdminAuditLogsPageData(adminFetch);
  assert.equal(adminAuditLogs.dataSource, "api");
  assert.ok(adminLoaderCalls.some((call) => call.endsWith("/api/v1/admin/summary")));
  assert.ok(adminLoaderCalls.some((call) => call.endsWith("/api/v1/admin/document-templates")));
  assert.ok(adminLoaderCalls.some((call) => call.endsWith("/api/v1/admin/document-templates/document-template-sample-001/versions")));
  assert.ok(adminLoaderCalls.some((call) => call.endsWith("/api/v1/admin/template-versions/template-version-sample-001/variables")));
  assert.ok(adminLoaderCalls.some((call) => call.endsWith("/api/v1/admin/prompts")));
  assert.ok(adminLoaderCalls.some((call) => call.endsWith("/api/v1/admin/prompts/prompt-template-sample-001/versions")));
  assert.ok(adminLoaderCalls.some((call) => call.endsWith("/api/v1/admin/prompts/prompt-template-sample-001/test-cases")));
  assert.ok(adminLoaderCalls.some((call) => call.endsWith("/api/v1/admin/checklist-templates")));
  assert.ok(adminLoaderCalls.some((call) => call.endsWith("/api/v1/admin/checklist-templates/checklist-template-sample-001")));
  assert.ok(adminLoaderCalls.some((call) => call.endsWith("/api/v1/admin/approval-templates")));
  assert.ok(adminLoaderCalls.some((call) => call.endsWith("/api/v1/admin/signature-assets")));

  const adminActionCalls: Array<{ url: string; method: string }> = [];
  const adminActionFetch: typeof fetch = async (input, init) => {
    adminActionCalls.push({ url: String(input), method: init?.method ?? "GET" });
    return new Response(JSON.stringify({}));
  };

  await createAdminUserAction({ name: "관리자", email: "admin@anc.local" }, adminActionFetch);
  await updateAdminRolePermissionsAction("role-001", { permissionKeys: ["template.read"] }, adminActionFetch);
  await updateAdminCompanyProfileAction({ companyName: "A&C ERP" }, adminActionFetch);
  await createAdminDocumentTemplateAction({ templateKey: "draft.key", name: "초안 템플릿", documentType: "safety_report" }, adminActionFetch);
  await createAdminTemplateVersionAction("document-template-sample-001", { bodyTemplate: "{{project.projectName}}" }, adminActionFetch);
  await extractAdminTemplateVariablesAction("template-version-sample-001", adminActionFetch);
  await previewAdminTemplateVersionAction("template-version-sample-001", { sampleName: "draft" }, adminActionFetch);
  await validateAdminTemplateVersionAction("template-version-sample-001", adminActionFetch);
  await reviewAdminTemplateVersionAction("template-version-sample-001", { reason: "review" }, adminActionFetch);
  await publishAdminTemplateVersionAction("template-version-sample-001", { reason: "publish" }, adminActionFetch);
  await rollbackAdminTemplateVersionAction("template-version-sample-001", { reason: "rollback" }, adminActionFetch);
  await publishAdminChecklistTemplateAction("checklist-template-sample-001", adminActionFetch);
  await createAdminPhraseAction({ phraseType: "standard_phrase", title: "문구", body: "본문" }, adminActionFetch);
  await publishAdminPhraseAction("phrase-001", adminActionFetch);
  await createAdminLegalClauseAction({ clauseCode: "LEGAL", title: "법령", body: "본문", changeReason: "등록", hasLegalPermission: true }, adminActionFetch);
  await updateAdminLegalClauseAction("legal-001", { body: "수정", changeReason: "검토", hasLegalPermission: true }, adminActionFetch);
  await publishAdminLegalClauseAction("legal-001", { reason: "publish" }, adminActionFetch);
  await createAdminPromptAction({ promptKey: "sample", name: "샘플", promptType: "service_ai", featureId: "admin.template.prompt" }, adminActionFetch);
  await createAdminPromptVersionAction("prompt-template-sample-001", { systemMessage: "system" }, adminActionFetch);
  await runAdminPromptVersionAction("prompt-version-sample-001", { inputFixture: { promptId: "prompt-template-sample-001" } }, adminActionFetch);
  await runAdminPromptTestCasesAction("prompt-version-sample-001", adminActionFetch);
  await publishAdminPromptVersionAction("prompt-version-sample-001", { reason: "publish" }, adminActionFetch);
  await rollbackAdminPromptVersionAction("prompt-version-sample-001", { reason: "rollback" }, adminActionFetch);
  await createAdminPromptTestCaseAction("prompt-template-sample-001", { name: "기본", inputFixture: {}, expectedContains: ["draft"], expectedMissing: [] }, adminActionFetch);
  await updateAdminMailTemplateAction("mail-template-001", { subjectTemplate: "관리자 제목" }, adminActionFetch);
  await updateAdminApprovalTemplateAction("approval-template-safety-report-001", { name: "관리자 결재선" }, adminActionFetch);
  await updateAdminSignatureAssetAction("signature-asset-sample-001", { status: "active" }, adminActionFetch);
  await updateAdminWebhardPolicyAction({ sharedLinkExpiryDays: 7 }, adminActionFetch);

  assert.ok(adminActionCalls.some((call) => call.method === "POST" && call.url.endsWith("/api/v1/admin/users")));
  assert.ok(adminActionCalls.some((call) => call.method === "PATCH" && call.url.endsWith("/api/v1/admin/roles/role-001/permissions")));
  assert.ok(adminActionCalls.some((call) => call.method === "POST" && call.url.endsWith("/api/v1/admin/template-versions/template-version-sample-001/publish")));
  assert.ok(adminActionCalls.some((call) => call.method === "POST" && call.url.endsWith("/api/v1/admin/prompt-versions/prompt-version-sample-001/run")));
  assert.ok(adminActionCalls.some((call) => call.method === "PATCH" && call.url.endsWith("/api/v1/admin/mail-templates/mail-template-001")));
  assert.ok(adminActionCalls.some((call) => call.method === "PATCH" && call.url.endsWith("/api/v1/admin/approval-templates/approval-template-safety-report-001")));
  assert.ok(adminActionCalls.some((call) => call.method === "PATCH" && call.url.endsWith("/api/v1/admin/signature-assets/signature-asset-sample-001")));
  assert.ok(adminActionCalls.some((call) => call.method === "PATCH" && call.url.endsWith("/api/v1/admin/webhard-policies")));

  const safetyManagementPlanLoaderCalls: string[] = [];
  const safetyManagementPlanFetch: typeof fetch = async (input) => {
    const url = String(input);
    safetyManagementPlanLoaderCalls.push(url);
    if (url.endsWith("/api/v1/projects/project-sample-001/safety-management-plans")) {
      return new Response(
        JSON.stringify([
          {
            plan: {
              id: "safety-management-plan-sample-001",
              projectId: "project-sample-001",
              title: "안전관리계획서",
              status: "draft",
              templateId: "template-safety-management-plan-v1",
              revisionNo: 1,
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            missingRequiredCount: 0,
            warningCount: 1,
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/safety-management-plans/safety-management-plan-sample-001")) {
      return new Response(JSON.stringify(getSampleSafetyManagementPlanDetail("safety-management-plan-sample-001")));
    }
    if (url.endsWith("/api/v1/safety-management-plans/safety-management-plan-sample-001/validate")) {
      return new Response(
        JSON.stringify({
          planId: "safety-management-plan-sample-001",
          missingFields: [],
          warnings: [],
          hasDanger: false,
        }),
      );
    }
    return new Response(JSON.stringify({}));
  };

  const safetyManagementPlanListData = await loadProjectSafetyManagementPlansPageData(
    "project-sample-001",
    safetyManagementPlanFetch,
  );
  assert.equal(safetyManagementPlanListData.dataSource, "api");
  const safetyManagementPlanDetailData = await loadSafetyManagementPlanDetailPageData(
    "safety-management-plan-sample-001",
    safetyManagementPlanFetch,
  );
  assert.equal(safetyManagementPlanDetailData.dataSource, "api");
  assert.ok(
    safetyManagementPlanLoaderCalls.some((call) =>
      call.endsWith("/api/v1/projects/project-sample-001/safety-management-plans"),
    ),
  );

  const safetyManagementPlanActionCalls: Array<{ url: string; method: string }> = [];
  const safetyManagementPlanActionFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    safetyManagementPlanActionCalls.push({ url, method });
    return new Response(JSON.stringify({ plan: { id: "safety-management-plan-sample-001" }, items: [] }));
  };

  await createSafetyManagementPlanDraftAction(
    "project-sample-001",
    { projectId: "project-sample-001", templateId: "template-safety-management-plan-v1" },
    safetyManagementPlanActionFetch,
  );
  await saveSafetyManagementPlanSectionDraft(
    "safety-management-plan-sample-001",
    { sectionKey: "cover", content: { summary: "updated" } },
    safetyManagementPlanActionFetch,
  );
  await regenerateSafetyManagementPlanSectionDraft(
    "safety-management-plan-sample-001",
    "cover",
    safetyManagementPlanActionFetch,
  );
  await refreshSafetyManagementPlanLinkedDataDraft("safety-management-plan-sample-001", safetyManagementPlanActionFetch);
  await validateSafetyManagementPlanDraft("safety-management-plan-sample-001", safetyManagementPlanActionFetch);
  await createSafetyManagementWorkTypeDraft(
    "safety-management-plan-sample-001",
    { name: "신규 공종" },
    safetyManagementPlanActionFetch,
  );
  await createSafetyManagementRiskDraft(
    "safety-management-plan-sample-001",
    { hazard: "draft", reductionMeasure: "draft" },
    safetyManagementPlanActionFetch,
  );
  await generateSafetyManagementRisksFromWorkTypesDraft(
    "safety-management-plan-sample-001",
    safetyManagementPlanActionFetch,
  );
  await importSafetyManagementRisksFromChecklistDraft("safety-management-plan-sample-001", safetyManagementPlanActionFetch);
  await updateSafetyManagementOrganizationDraft(
    "safety-management-plan-sample-001",
    { responsibilities: [{ role: "총괄", responsibility: "검토" }] },
    safetyManagementPlanActionFetch,
  );
  await updateSafetyManagementEducationDraft(
    "safety-management-plan-sample-001",
    { items: [{ educationType: "정기교육", target: "근로자", cycle: "월 1회", content: "공종 교육", recordMethod: "서명" }] },
    safetyManagementPlanActionFetch,
  );
  await updateSafetyManagementEmergencyDraft(
    "safety-management-plan-sample-001",
    { contacts: [{ type: "비상", organization: "현장팀", note: "연락 체계" }] },
    safetyManagementPlanActionFetch,
  );
  await linkSafetyManagementAttachmentDraft(
    "safety-management-plan-sample-001",
    {
      fileId: "file-asset-001",
      fileName: "schedule.pdf",
      storagePath: "/project/08_plan/schedule.pdf",
      attachmentType: "schedule",
    },
    safetyManagementPlanActionFetch,
  );
  await exportSafetyManagementPlanDraft("safety-management-plan-sample-001", {}, safetyManagementPlanActionFetch);

  assert.ok(
    safetyManagementPlanActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/projects/project-sample-001/safety-management-plans"),
    ),
  );
  assert.ok(
    safetyManagementPlanActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-management-plans/safety-management-plan-sample-001/sections/cover/regenerate"),
    ),
  );
  assert.ok(
    safetyManagementPlanActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-management-plans/safety-management-plan-sample-001/validate"),
    ),
  );
  assert.ok(
    safetyManagementPlanActionCalls.some(
      (call) =>
        call.method === "PATCH" &&
        call.url.endsWith("/api/v1/safety-management-plans/safety-management-plan-sample-001/organization"),
    ),
  );
  assert.ok(
    safetyManagementPlanActionCalls.some(
      (call) =>
        call.method === "PATCH" &&
        call.url.endsWith("/api/v1/safety-management-plans/safety-management-plan-sample-001/education"),
    ),
  );
  assert.ok(
    safetyManagementPlanActionCalls.some(
      (call) =>
        call.method === "PATCH" &&
        call.url.endsWith("/api/v1/safety-management-plans/safety-management-plan-sample-001/emergency"),
    ),
  );
  assert.ok(
    safetyManagementPlanActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-management-plans/safety-management-plan-sample-001/attachments/link"),
    ),
  );
  assert.ok(
    safetyManagementPlanActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-management-plans/safety-management-plan-sample-001/risks/generate-from-work-types"),
    ),
  );

  const safetyHealthLedgerLoaderCalls: string[] = [];
  const safetyHealthLedgerFetch: typeof fetch = async (input) => {
    const url = String(input);
    safetyHealthLedgerLoaderCalls.push(url);
    if (url.endsWith("/api/v1/projects/project-sample-001/safety-health-ledgers")) {
      return new Response(
        JSON.stringify([
          {
            ledger: {
              id: "safety-health-ledger-sample-001",
              projectId: "project-sample-001",
              templateId: "template-safety-health-ledger-v1",
              title: "프로젝트 안전보건대장",
              status: "review",
              currentVersionNo: 1,
              createdAt: "2026-05-10T09:00:00+09:00",
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
            missingRequiredCount: 0,
            warningCount: 1,
            latestVersion: {
              id: "safety-health-ledger-version-sample-001",
              ledgerId: "safety-health-ledger-sample-001",
              versionNo: 1,
              snapshot: {},
              createdBy: "system",
              createdAt: "2026-05-10T09:00:00+09:00",
              changeSummary: "초안 생성",
            },
          },
        ]),
      );
    }
    if (url.endsWith("/api/v1/safety-health-ledgers/safety-health-ledger-sample-001")) {
      return new Response(
        JSON.stringify({
          ledger: {
            id: "safety-health-ledger-sample-001",
            projectId: "project-sample-001",
            templateId: "template-safety-health-ledger-v1",
            title: "프로젝트 안전보건대장",
            status: "review",
            currentVersionNo: 1,
            createdAt: "2026-05-10T09:00:00+09:00",
            updatedAt: "2026-05-10T09:00:00+09:00",
          },
          snapshot: {
            meta: {
              projectId: "project-sample-001",
              projectName: "리움미술관 승강기 교체공사",
              siteName: "리움미술관",
              siteAddress: "서울시 용산구 한남동",
              constructionType: "승강기 교체공사",
              ownerNames: ["삼성문화재단"],
              contractorName: "현대엘리베이터(주)",
              engineerName: "A&C 기술사사무소",
              constructionStartDate: "2026-05-20",
              constructionEndDate: "2026-08-30",
              latestInspectionRoundNo: 1,
              latestUpdatedAt: "2026-05-10T09:00:00+09:00",
              sourcePlanId: "safety-management-plan-sample-001",
              draftWatermark: "AI DRAFT",
            },
            sections: [
              {
                id: "safety-health-ledger-sample-001-basic_info",
                ledgerId: "safety-health-ledger-sample-001",
                key: "basic_info",
                title: "기본정보",
                order: 1,
                status: "review",
                content: { summary: "프로젝트 누적 기본정보" },
                sourceLinks: [],
                updatedAt: "2026-05-10T09:00:00+09:00",
              },
            ],
            riskItems: [],
            measures: [],
            inspectionHistory: [],
            findingHistory: [],
            safetyCostHistory: [],
            attachments: [],
            missingFields: [],
            reviewWarnings: [],
            sourceLinks: [],
          },
          sections: [
            {
              id: "safety-health-ledger-sample-001-basic_info",
              ledgerId: "safety-health-ledger-sample-001",
              key: "basic_info",
              title: "기본정보",
              order: 1,
              status: "review",
              content: { summary: "프로젝트 누적 기본정보" },
              sourceLinks: [],
              updatedAt: "2026-05-10T09:00:00+09:00",
            },
          ],
          versions: [],
          riskItems: [],
          measures: [],
          inspectionHistory: [],
          findingHistory: [],
          safetyCostHistory: [],
          attachments: [],
          missingFields: [],
          warnings: [],
          exportedFile: null,
        }),
      );
    }
    if (url.endsWith("/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/validate")) {
      return new Response(
        JSON.stringify({
          ledgerId: "safety-health-ledger-sample-001",
          missingFields: [],
          warnings: [],
          hasDanger: false,
        }),
      );
    }
    return new Response(JSON.stringify({}));
  };

  const safetyHealthLedgerListData = await loadProjectSafetyHealthLedgersPageData(
    "project-sample-001",
    safetyHealthLedgerFetch,
  );
  assert.equal(safetyHealthLedgerListData.dataSource, "api");
  const safetyHealthLedgerDetailData = await loadSafetyHealthLedgerDetailPageData(
    "safety-health-ledger-sample-001",
    safetyHealthLedgerFetch,
  );
  assert.equal(safetyHealthLedgerDetailData.dataSource, "api");
  assert.ok(
    safetyHealthLedgerLoaderCalls.some((call) =>
      call.endsWith("/api/v1/projects/project-sample-001/safety-health-ledgers"),
    ),
  );

  const safetyHealthLedgerActionCalls: Array<{ url: string; method: string }> = [];
  const safetyHealthLedgerActionFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    safetyHealthLedgerActionCalls.push({ url, method });
    return new Response(JSON.stringify({ ledger: { id: "safety-health-ledger-sample-001" }, items: [] }));
  };

  await createSafetyHealthLedgerDraftAction(
    "project-sample-001",
    { projectId: "project-sample-001", templateId: "template-safety-health-ledger-v1" },
    safetyHealthLedgerActionFetch,
  );
  await saveSafetyHealthLedgerSectionDraft(
    "safety-health-ledger-sample-001",
    "basic_info",
    { sectionKey: "basic_info", content: { summary: "updated" } },
    safetyHealthLedgerActionFetch,
  );
  await regenerateSafetyHealthLedgerSectionDraft(
    "safety-health-ledger-sample-001",
    "basic_info",
    safetyHealthLedgerActionFetch,
  );
  await validateSafetyHealthLedgerDraft("safety-health-ledger-sample-001", safetyHealthLedgerActionFetch);
  await importSafetyHealthLedgerRisksFromPlanDraft(
    "safety-health-ledger-sample-001",
    safetyHealthLedgerActionFetch,
  );
  await detectSafetyHealthLedgerRecurrenceDraft(
    "safety-health-ledger-sample-001",
    safetyHealthLedgerActionFetch,
  );
  await createSafetyHealthLedgerRiskDraft(
    "safety-health-ledger-sample-001",
    { hazardDescription: "추락 위험" },
    safetyHealthLedgerActionFetch,
  );
  await createSafetyHealthLedgerMeasureDraft(
    "safety-health-ledger-sample-001",
    { title: "방호 난간", description: "개구부 방호 조치" },
    safetyHealthLedgerActionFetch,
  );
  await syncSafetyHealthLedgerInspectionHistoryDraft(
    "safety-health-ledger-sample-001",
    safetyHealthLedgerActionFetch,
  );
  await syncSafetyHealthLedgerFindingHistoryDraft(
    "safety-health-ledger-sample-001",
    safetyHealthLedgerActionFetch,
  );
  await syncSafetyHealthLedgerSafetyCostHistoryDraft(
    "safety-health-ledger-sample-001",
    safetyHealthLedgerActionFetch,
  );
  await linkSafetyHealthLedgerAttachmentDraft(
    "safety-health-ledger-sample-001",
    {
      fileId: "file-asset-001",
      fileName: "ledger.pdf",
      storagePath: "/project/09_ledger/ledger.pdf",
      attachmentType: "ledger",
    },
    safetyHealthLedgerActionFetch,
  );
  await exportSafetyHealthLedgerDraft("safety-health-ledger-sample-001", {}, safetyHealthLedgerActionFetch);

  assert.ok(
    safetyHealthLedgerActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/projects/project-sample-001/safety-health-ledgers"),
    ),
  );
  assert.ok(
    safetyHealthLedgerActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/sections/basic_info/regenerate"),
    ),
  );
  assert.ok(
    safetyHealthLedgerActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/validate"),
    ),
  );
  assert.ok(
    safetyHealthLedgerActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/inspection-history/sync"),
    ),
  );
  assert.ok(
    safetyHealthLedgerActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/attachments"),
    ),
  );
  assert.ok(
    safetyHealthLedgerActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/export"),
    ),
  );

  assert.ok(
    safetyReportActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-reports/doc-sample-001/sections/cover/regenerate"),
    ),
  );
  assert.ok(
    safetyReportActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-reports/doc-sample-001/refresh-linked-data"),
    ),
  );
  assert.ok(
    safetyReportActionCalls.some(
      (call) =>
        call.method === "POST" && call.url.endsWith("/api/v1/safety-reports/doc-sample-001/export"),
    ),
  );
  assert.ok(
    safetyReportActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-reports/doc-sample-001/mark-submitted"),
    ),
  );
  assert.ok(
    safetyReportActionCalls.some(
      (call) =>
        call.method === "POST" &&
        call.url.endsWith("/api/v1/safety-reports/doc-sample-001/link-owner-report-task"),
    ),
  );
  assert.ok(
    safetyReportActionCalls.some(
      (call) =>
        call.method === "GET" &&
        call.url.endsWith("/api/v1/inspection-rounds/round-sample-001/safety-report-required-data"),
    ),
  );
  assert.ok(
    safetyReportActionCalls.some(
      (call) =>
        call.method === "GET" &&
        call.url.endsWith("/api/v1/inspection-rounds/round-sample-001/owner-report-branches"),
    ),
  );
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
