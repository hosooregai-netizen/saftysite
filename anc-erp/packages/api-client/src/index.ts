import type {
  AdditionalHazardMutationResponse,
  ApiClientOptions,
  BootstrapSummaryResponse,
  ChecklistItem,
  ChecklistItemMutationResponse,
  ChecklistMobileDraftMutationResponse,
  ChecklistPhoto,
  ChecklistPhotoMutationResponse,
  ChecklistReportMappingResponse,
  ChecklistResult,
  ChecklistResultMutationResponse,
  ChecklistSession,
  ChecklistSessionDetailResponse,
  ChecklistSessionMutationResponse,
  ChecklistTemplate,
  ChecklistTemplateDetailResponse,
  ChecklistTemplateMutationResponse,
  ChecklistValidationResponse,
  ContactMutationResponse,
  ContactWithOrganization,
  ContractDetailResponse,
  ContractExportResponse,
  ContractFileLink,
  ContractFileMutationResponse,
  ContractGenerateResponse,
  ContractListItem,
  ContractMutationResponse,
  ContractPartyMutationResponse,
  ContractPreviewResponse,
  EstimateDraftResponse,
  EstimateExportResponse,
  EstimateListItem,
  EstimateMutationResponse,
  EvidencePhoto,
  EvidencePhotoMutationResponse,
  CorrectiveAction,
  CorrectiveActionMutationResponse,
  DocumentPhotoLedgerSectionResponse,
  PhotoLedger,
  PhotoLedgerDetailResponse,
  PhotoLedgerEntry,
  PhotoLedgerEntryMutationResponse,
  PhotoLedgerExportResponse,
  PhotoLedgerMutationResponse,
  PhotoLedgerSyncResponse,
  PhotoLedgerValidationResponse,
  ActionRequestMailDraft,
  ActionRequestMailDraftResponse,
  Finding,
  FindingDetailResponse,
  FindingListItem,
  FindingMutationResponse,
  FindingCandidate,
  FindingCandidateMutationResponse,
  HealthCheckResponse,
  InspectionCalendarRoundsResponse,
  InspectionCalendarTasksResponse,
  InspectionRescheduleMutationResponse,
  InspectionOwnerReportTask,
  InspectionOwnerReportTaskMutationResponse,
  InspectionRoundDetailResponse,
  InspectionRoundListItem,
  InspectionRoundMutationResponse,
  InspectionSchedule,
  InspectionScheduleMutationResponse,
  InspectionSchedulePreviewResponse,
  InspectionTaskMutationResponse,
  InspectionTask,
  Organization,
  OrganizationMutationResponse,
  PaymentSplitCalculationResponse,
  PaymentTermMutationResponse,
  ProjectActivityLog,
  ProjectAggregateResponse,
  ProjectExtractionResult,
  ProjectExtractionValidationResult,
  ProjectListItem,
  ProjectMutationResponse,
  ProjectPartyMutationResponse,
  ProjectPartyShareCalculationResponse,
  ProjectPartyWithOrganization,
  ProjectRelatedCounts,
  ProjectRequirementStatus,
  ProjectSummaryResponse,
  SafetyCostEvidence,
  SafetyCostEvidenceMutationResponse,
  SafetyCostHistoryEvent,
  SafetyCostOwnerMatrixResponse,
  SafetyCostRateCalculationResponse,
  SafetyCostReviewMutationResponse,
  SafetyCostSyncResponse,
  SafetyCostUsageDetailResponse,
  SafetyCostUsageListItem,
  SafetyCostUsageMutationResponse,
  SafetyCostValidationResponse,
  DocumentSafetyCostUsageResponse,
  FileAsset,
  SafetyEducationPlan,
  SafetyEmergencyPlan,
  SafetyManagementAttachmentMutationResponse,
  SafetyManagementPlanAttachment,
  SafetyManagementPlanDetailResponse,
  SafetyManagementPlanExportResponse,
  SafetyManagementPlanListItem,
  SafetyManagementPlanMutationResponse,
  SafetyManagementPlanValidationResponse,
  SafetyManagementRiskItem,
  SafetyManagementRiskMutationResponse,
  SafetyManagementWorkType,
  SafetyManagementWorkTypeMutationResponse,
  SafetyOrganizationPlan,
  SafetyHealthLedgerDetailResponse,
  SafetyHealthLedgerExportResponse,
  SafetyHealthLedgerListItem,
  SafetyHealthLedgerMutationResponse,
  SafetyHealthLedgerValidationResponse,
  LedgerAttachment,
  LedgerAttachmentMutationResponse,
  LedgerFindingHistory,
  LedgerInspectionHistory,
  LedgerMeasureMutationResponse,
  LedgerRiskItem,
  LedgerRiskMutationResponse,
  LedgerRiskReductionMeasure,
  LedgerSafetyCostHistory,
  LedgerSyncResponse,
  SafetyHealthLedgerVersion,
  WorkScheduleAttachment,
  WorkScheduleAttachmentMutationResponse,
  SafetyReportDetailResponse,
  SafetyReportExportResponse,
  SafetyReportLinkedDataResponse,
  SafetyReportListItem,
  SafetyReportMutationResponse,
  SafetyReportRequiredDataResponse,
  SafetyReportSubmissionResponse,
  SafetyReportVariablesResponse,
  FileActivity,
  FileClassificationResponse,
  FileDetailResponse,
  FileEntityLink,
  FileLinkMutationResponse,
  FileMutationResponse,
  FileVersion,
  FileVersionMutationResponse,
  Folder,
  FolderMutationResponse,
  MailAttachmentSaveResponse,
  MailAttachmentSaveSuggestionResponse,
  MailAccount,
  MailAttachment,
  MailAttachmentMutationResponse,
  MailDraft,
  MailDraftMutationResponse,
  MailDraftValidationResponse,
  MailMessage,
  MailMessageDetailResponse,
  MailSignature,
  MailSignatureMutationResponse,
  MailSyncJob,
  MailSyncResponse,
  MailTemplate,
  MailTemplateMutationResponse,
  MailThread,
  MissingField,
  PublicShareResponse,
  ShareLink,
  ShareLinkMutationResponse,
  WebhardFolderNode,
  WebhardSearchResponse,
  WebhardStorageUsageResponse,
  MailThreadDetailResponse,
  MailThreadListItem,
  ApprovalListItem,
  ApprovalMutationResponse,
  ApprovalTemplateDetailResponse,
  ApprovalWorkflowDetailResponse,
  FinalDocumentPackage,
  SignatureAsset,
  SignatureAssetMutationResponse,
  SignatureTaskListResponse,
  SignatureTaskMutationResponse,
  SubmissionDetailResponse,
  SubmissionMutationResponse,
  SubmissionPackageMutationResponse,
  SubmissionReadinessResponse,
  Submission,
  AdminAuditLog,
  AdminDashboardSummaryResponse,
  AlertRule,
  AdminUser,
  CompanyProfile,
  DashboardAlert,
  DashboardInsightRun,
  DashboardMetric,
  DashboardMyWorkResponse,
  DashboardOverviewResponse,
  DashboardSnapshot,
  DashboardWidget,
  DocumentTemplateDetailResponse,
  DocumentTemplateListItem,
  FindingAgingBucket,
  LegalClause,
  OwnerReportStatusSummary,
  ProjectDashboardResponse,
  ProjectHealthMetric,
  Permission,
  Phrase,
  PromptDetailResponse,
  PromptListItem,
  PromptRunLog,
  PromptVersion,
  PromptTestCase,
  Role,
  StatisticsMetric,
  TemplatePreviewRun,
  TemplateSection,
  TemplateVariable,
  TemplateVersion,
  WebhardPolicy,
} from "../../contracts/src";

export function getDefaultAncErpApiBaseUrl() {
  return "http://localhost:8010";
}

async function parseJson<T>(response: Response) {
  return (await response.json()) as T;
}

export function createAncErpApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    baseUrl,
    async getHealth() {
      const response = await fetchImpl(`${baseUrl}/health`);
      return parseJson<HealthCheckResponse>(response);
    },
    async getBootstrapSummary() {
      const response = await fetchImpl(`${baseUrl}/api/v1/bootstrap/summary`);
      return parseJson<BootstrapSummaryResponse>(response);
    },
    async listProjects() {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects`);
      return parseJson<ProjectListItem[]>(response);
    },
    async createProject(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ProjectMutationResponse>(response);
    },
    async getProject(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}`);
      return parseJson<ProjectAggregateResponse>(response);
    },
    async updateProject(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ProjectMutationResponse>(response);
    },
    async deleteProject(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}`, {
        method: "DELETE",
      });
      return parseJson<ProjectMutationResponse>(response);
    },
    async getProjectSummary(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/summary`);
      return parseJson<ProjectSummaryResponse>(response);
    },
    async listMailAccounts() {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/accounts`);
      return parseJson<MailAccount[]>(response);
    },
    async createGuestMailAccount(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/accounts/guest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ account: MailAccount }>(response);
    },
    async getMailAccount(accountId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/accounts/${accountId}`);
      return parseJson<{ account: MailAccount }>(response);
    },
    async updateMailAccount(accountId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ account: MailAccount }>(response);
    },
    async deleteMailAccount(accountId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/accounts/${accountId}`, { method: "DELETE" });
      return parseJson<{ deleted: boolean; accountId: string }>(response);
    },
    async startGoogleMailOAuth() {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/oauth/google/start`, { method: "POST" });
      return parseJson<{ provider: string; authUrl: string; mode: string }>(response);
    },
    async completeGoogleMailOAuth() {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/oauth/google/callback`);
      return parseJson<{ connected: boolean; account?: MailAccount | null }>(response);
    },
    async disconnectMailAccount(accountId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/accounts/${accountId}/disconnect`, { method: "POST" });
      return parseJson<{ account: MailAccount }>(response);
    },
    async syncMailAccount(accountId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/accounts/${accountId}/sync`, { method: "POST" });
      return parseJson<MailSyncResponse>(response);
    },
    async listMailSyncJobs(accountId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/accounts/${accountId}/sync-jobs`);
      return parseJson<MailSyncJob[]>(response);
    },
    async listMailThreads(params?: { projectId?: string; folder?: string }) {
      const query = new URLSearchParams();
      if (params?.projectId) query.set("project_id", params.projectId);
      if (params?.folder) query.set("folder", params.folder);
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/threads${query.toString() ? `?${query.toString()}` : ""}`);
      return parseJson<MailThreadListItem[]>(response);
    },
    async getMailThread(threadId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/threads/${threadId}`);
      return parseJson<MailThreadDetailResponse>(response);
    },
    async updateMailThread(threadId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/threads/${threadId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ thread: MailThread }>(response);
    },
    async archiveMailThread(threadId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/threads/${threadId}/archive`, { method: "POST" });
      return parseJson<{ thread: MailThread }>(response);
    },
    async listMailMessages(params?: { projectId?: string; folder?: string }) {
      const query = new URLSearchParams();
      if (params?.projectId) query.set("project_id", params.projectId);
      if (params?.folder) query.set("folder", params.folder);
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/messages${query.toString() ? `?${query.toString()}` : ""}`);
      return parseJson<MailMessage[]>(response);
    },
    async getMailMessage(messageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/messages/${messageId}`);
      return parseJson<MailMessageDetailResponse>(response);
    },
    async updateMailMessage(messageId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/messages/${messageId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ message: MailMessage }>(response);
    },
    async markMailMessageRead(messageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/messages/${messageId}/mark-read`, { method: "POST" });
      return parseJson<{ message: MailMessage }>(response);
    },
    async linkMailMessageEntity(messageId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/messages/${messageId}/link-entity`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ message: MailMessage; link: unknown; links: unknown[] }>(response);
    },
    async classifyMailMessage(messageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/messages/${messageId}/classify`, { method: "POST" });
      return parseJson<{ message: MailMessage; links: unknown[]; warnings: string[] }>(response);
    },
    async createMailDraft(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/drafts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<MailDraftMutationResponse>(response);
    },
    async getMailDraft(draftId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/drafts/${draftId}`);
      return parseJson<{ draft: MailDraft }>(response);
    },
    async updateMailDraft(draftId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<MailDraftMutationResponse>(response);
    },
    async generateMailDraft(draftId: string, payload: Record<string, unknown> = {}) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/drafts/${draftId}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<MailDraftMutationResponse>(response);
    },
    async validateMailDraft(draftId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/drafts/${draftId}/validate`, { method: "POST" });
      return parseJson<MailDraftValidationResponse>(response);
    },
    async sendMailDraft(draftId: string, payload: Record<string, unknown> = {}) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/drafts/${draftId}/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<MailDraftMutationResponse>(response);
    },
    async sendMail(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<MailDraftMutationResponse>(response);
    },
    async listMailAttachments(messageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/messages/${messageId}/attachments`);
      return parseJson<MailAttachment[]>(response);
    },
    async saveMailboxAttachmentToWebhard(attachmentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/attachments/${attachmentId}/save-to-webhard`, { method: "POST" });
      return parseJson<MailAttachmentMutationResponse>(response);
    },
    async saveMailboxAttachmentsBulkToWebhard(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/attachments/save-bulk-to-webhard`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ items: MailAttachmentMutationResponse[] }>(response);
    },
    async linkMailboxAttachmentFile(attachmentId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/attachments/${attachmentId}/link-file`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ attachment: MailAttachment }>(response);
    },
    async draftDocumentSubmissionMail(documentId: string, payload: Record<string, unknown> = {}) {
      const response = await fetchImpl(`${baseUrl}/api/v1/documents/${documentId}/submission-mail/draft`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<MailDraftMutationResponse>(response);
    },
    async draftMaterialRequestMail(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/material-request-mail/draft`, { method: "POST" });
      return parseJson<MailDraftMutationResponse>(response);
    },
    async draftScheduleCoordinationMail(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/schedule-coordination-mail/draft`, { method: "POST" });
      return parseJson<MailDraftMutationResponse>(response);
    },
    async draftContractSendMail(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/send-mail/draft`, { method: "POST" });
      return parseJson<MailDraftMutationResponse>(response);
    },
    async draftEstimateSendMail(estimateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/estimates/${estimateId}/send-mail/draft`, { method: "POST" });
      return parseJson<MailDraftMutationResponse>(response);
    },
    async listMailTemplates() {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/templates`);
      return parseJson<MailTemplate[]>(response);
    },
    async createMailTemplate(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/templates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<MailTemplateMutationResponse>(response);
    },
    async getMailTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/templates/${templateId}`);
      return parseJson<{ template: MailTemplate }>(response);
    },
    async updateMailTemplate(templateId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/templates/${templateId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<MailTemplateMutationResponse>(response);
    },
    async deleteMailTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/templates/${templateId}`, { method: "DELETE" });
      return parseJson<{ deleted: boolean; templateId: string }>(response);
    },
    async listMailSignatures() {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/signatures`);
      return parseJson<MailSignature[]>(response);
    },
    async createMailSignature(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/signatures`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<MailSignatureMutationResponse>(response);
    },
    async updateMailSignature(signatureId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/signatures/${signatureId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<MailSignatureMutationResponse>(response);
    },
    async listApprovalWorkflows() {
      const response = await fetchImpl(`${baseUrl}/api/v1/approvals`);
      return parseJson<ApprovalListItem[]>(response);
    },
    async listApprovalInbox() {
      const response = await fetchImpl(`${baseUrl}/api/v1/approvals/inbox`);
      return parseJson<ApprovalListItem[]>(response);
    },
    async listRequestedApprovals() {
      const response = await fetchImpl(`${baseUrl}/api/v1/approvals/requested`);
      return parseJson<ApprovalListItem[]>(response);
    },
    async createApprovalWorkflow(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/approval-workflows`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ApprovalMutationResponse>(response);
    },
    async getApprovalWorkflow(workflowId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/approval-workflows/${workflowId}`);
      return parseJson<ApprovalWorkflowDetailResponse>(response);
    },
    async updateApprovalWorkflow(workflowId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/approval-workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ApprovalWorkflowDetailResponse>(response);
    },
    async requestDocumentApproval(documentId: string, payload: Record<string, unknown> = {}) {
      const response = await fetchImpl(`${baseUrl}/api/v1/documents/${documentId}/approval/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ApprovalMutationResponse>(response);
    },
    async getDocumentApproval(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/documents/${documentId}/approval`);
      return parseJson<ApprovalWorkflowDetailResponse>(response);
    },
    async approveApprovalStep(stepId: string, payload: Record<string, unknown> = {}) {
      const response = await fetchImpl(`${baseUrl}/api/v1/approval-steps/${stepId}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ApprovalWorkflowDetailResponse>(response);
    },
    async rejectApprovalStep(stepId: string, payload: Record<string, unknown> = {}) {
      const response = await fetchImpl(`${baseUrl}/api/v1/approval-steps/${stepId}/reject`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ApprovalWorkflowDetailResponse>(response);
    },
    async requestApprovalStepChanges(stepId: string, payload: Record<string, unknown> = {}) {
      const response = await fetchImpl(`${baseUrl}/api/v1/approval-steps/${stepId}/request-changes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ApprovalWorkflowDetailResponse>(response);
    },
    async listSignatureAssets() {
      const response = await fetchImpl(`${baseUrl}/api/v1/signature-assets`);
      return parseJson<SignatureAsset[]>(response);
    },
    async createSignatureAsset(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/signature-assets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SignatureAssetMutationResponse>(response);
    },
    async getSignatureAsset(assetId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/signature-assets/${assetId}`);
      return parseJson<{ signatureAsset: SignatureAsset }>(response);
    },
    async updateSignatureAsset(assetId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/signature-assets/${assetId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SignatureAssetMutationResponse>(response);
    },
    async listDocumentSignatureTasks(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/documents/${documentId}/signature-tasks`);
      return parseJson<SignatureTaskListResponse>(response);
    },
    async createDocumentSignatureTask(documentId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/documents/${documentId}/signature-tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SignatureTaskMutationResponse>(response);
    },
    async updateSignatureTask(taskId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/signature-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SignatureTaskMutationResponse>(response);
    },
    async completeSignatureTask(taskId: string, payload: Record<string, unknown> = {}) {
      const response = await fetchImpl(`${baseUrl}/api/v1/signature-tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SignatureTaskMutationResponse>(response);
    },
    async waiveSignatureTask(taskId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/signature-tasks/${taskId}/waive`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SignatureTaskMutationResponse>(response);
    },
    async uploadSignedDocumentFile(documentId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/documents/${documentId}/signed-files/upload`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ fileAsset: FileAsset; tasks: unknown[] }>(response);
    },
    async getDocumentSubmissionReadiness(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/documents/${documentId}/submission-readiness`);
      return parseJson<SubmissionReadinessResponse>(response);
    },
    async createSubmissionPackage(documentId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/documents/${documentId}/submission-packages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SubmissionPackageMutationResponse>(response);
    },
    async getSubmissionPackage(packageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submission-packages/${packageId}`);
      return parseJson<{ package: FinalDocumentPackage }>(response);
    },
    async updateSubmissionPackage(packageId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submission-packages/${packageId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ package: FinalDocumentPackage }>(response);
    },
    async validateSubmissionPackage(packageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submission-packages/${packageId}/validate`, { method: "POST" });
      return parseJson<SubmissionPackageMutationResponse>(response);
    },
    async finalizeSubmissionPackage(packageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submission-packages/${packageId}/finalize`, { method: "POST" });
      return parseJson<SubmissionPackageMutationResponse>(response);
    },
    async listProjectSubmissions(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/submissions`);
      return parseJson<Array<{ submission: Submission } & Record<string, unknown>>>(response);
    },
    async createProjectSubmission(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/submissions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SubmissionMutationResponse>(response);
    },
    async getSubmission(submissionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submissions/${submissionId}`);
      return parseJson<SubmissionDetailResponse>(response);
    },
    async updateSubmission(submissionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SubmissionDetailResponse>(response);
    },
    async sendSubmissionMail(submissionId: string, payload: Record<string, unknown> = {}) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submissions/${submissionId}/send-mail`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SubmissionMutationResponse>(response);
    },
    async markSubmissionManualSubmitted(submissionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submissions/${submissionId}/mark-manual-submitted`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SubmissionDetailResponse>(response);
    },
    async confirmSubmissionOwnerReceipt(submissionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submissions/${submissionId}/confirm-owner-receipt`, { method: "POST" });
      return parseJson<SubmissionDetailResponse>(response);
    },
    async requestSubmissionRevision(submissionId: string, payload: Record<string, unknown> = {}) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submissions/${submissionId}/request-revision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SubmissionDetailResponse>(response);
    },
    async resubmitSubmission(submissionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submissions/${submissionId}/resubmit`, { method: "POST" });
      return parseJson<SubmissionDetailResponse>(response);
    },
    async archiveSubmission(submissionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/submissions/${submissionId}/archive`, { method: "POST" });
      return parseJson<SubmissionDetailResponse>(response);
    },
    async listApprovalTemplates() {
      const response = await fetchImpl(`${baseUrl}/api/v1/approval-templates`);
      return parseJson<ApprovalTemplateDetailResponse[]>(response);
    },
    async createApprovalTemplate(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/approval-templates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ApprovalTemplateDetailResponse>(response);
    },
    async getApprovalTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/approval-templates/${templateId}`);
      return parseJson<ApprovalTemplateDetailResponse>(response);
    },
    async updateApprovalTemplate(templateId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/approval-templates/${templateId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ApprovalTemplateDetailResponse>(response);
    },
    async publishApprovalTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/approval-templates/${templateId}/publish`, { method: "POST" });
      return parseJson<ApprovalTemplateDetailResponse>(response);
    },
    async listProjectSafetyReports(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/safety-reports`);
      return parseJson<SafetyReportListItem[]>(response);
    },
    async listProjectSafetyManagementPlans(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/safety-management-plans`);
      return parseJson<SafetyManagementPlanListItem[]>(response);
    },
    async createProjectSafetyManagementPlan(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/safety-management-plans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyManagementPlanMutationResponse>(response);
    },
    async getSafetyManagementPlan(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}`);
      return parseJson<SafetyManagementPlanDetailResponse>(response);
    },
    async updateSafetyManagementPlan(planId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyManagementPlanMutationResponse>(response);
    },
    async deleteSafetyManagementPlan(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; planId: string }>(response);
    },
    async listProjectSafetyHealthLedgers(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/safety-health-ledgers`);
      return parseJson<SafetyHealthLedgerListItem[]>(response);
    },
    async createProjectSafetyHealthLedger(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/safety-health-ledgers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyHealthLedgerMutationResponse>(response);
    },
    async getSafetyHealthLedger(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}`);
      return parseJson<SafetyHealthLedgerDetailResponse>(response);
    },
    async updateSafetyHealthLedger(ledgerId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyHealthLedgerMutationResponse>(response);
    },
    async deleteSafetyHealthLedger(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; ledgerId: string }>(response);
    },
    async generateSafetyHealthLedger(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/generate`, {
        method: "POST",
      });
      return parseJson<SafetyHealthLedgerMutationResponse>(response);
    },
    async validateSafetyHealthLedger(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/validate`, {
        method: "POST",
      });
      return parseJson<SafetyHealthLedgerValidationResponse>(response);
    },
    async confirmSafetyHealthLedger(ledgerId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyHealthLedgerMutationResponse>(response);
    },
    async exportSafetyHealthLedger(ledgerId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyHealthLedgerExportResponse>(response);
    },
    async archiveSafetyHealthLedger(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/archive`, {
        method: "POST",
      });
      return parseJson<{ ledgerId: string; archived: boolean }>(response);
    },
    async listSafetyHealthLedgerSections(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/sections`);
      return parseJson<Array<Record<string, unknown>>>(response);
    },
    async saveSafetyHealthLedgerSection(ledgerId: string, sectionKey: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/sections/${sectionKey}/save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyHealthLedgerMutationResponse>(response);
    },
    async regenerateSafetyHealthLedgerSection(ledgerId: string, sectionKey: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/sections/${sectionKey}/regenerate`, {
        method: "POST",
      });
      return parseJson<SafetyHealthLedgerMutationResponse>(response);
    },
    async listSafetyHealthLedgerRisks(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/risks`);
      return parseJson<LedgerRiskItem[]>(response);
    },
    async createSafetyHealthLedgerRisk(ledgerId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/risks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<LedgerRiskMutationResponse>(response);
    },
    async updateSafetyHealthLedgerRisk(riskItemId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledger-risks/${riskItemId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<LedgerRiskMutationResponse>(response);
    },
    async deleteSafetyHealthLedgerRisk(riskItemId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledger-risks/${riskItemId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; riskItemId: string }>(response);
    },
    async importSafetyHealthLedgerRisksFromPlan(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/risks/import-from-plan`, {
        method: "POST",
      });
      return parseJson<{ createdCount: number; riskItems: LedgerRiskItem[]; measures: LedgerRiskReductionMeasure[] }>(response);
    },
    async detectSafetyHealthLedgerRecurrence(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/risks/detect-recurrence`, {
        method: "POST",
      });
      return parseJson<{ repeatedCount: number; items: LedgerRiskItem[] }>(response);
    },
    async listSafetyHealthLedgerMeasures(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/measures`);
      return parseJson<LedgerRiskReductionMeasure[]>(response);
    },
    async createSafetyHealthLedgerMeasure(ledgerId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/measures`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<LedgerMeasureMutationResponse>(response);
    },
    async updateSafetyHealthLedgerMeasure(measureId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledger-measures/${measureId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<LedgerMeasureMutationResponse>(response);
    },
    async deleteSafetyHealthLedgerMeasure(measureId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledger-measures/${measureId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; measureId: string }>(response);
    },
    async listSafetyHealthLedgerInspectionHistory(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/inspection-history`);
      return parseJson<LedgerInspectionHistory[]>(response);
    },
    async syncSafetyHealthLedgerInspectionHistory(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/inspection-history/sync`, {
        method: "POST",
      });
      return parseJson<LedgerSyncResponse>(response);
    },
    async listSafetyHealthLedgerFindingHistory(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/finding-history`);
      return parseJson<LedgerFindingHistory[]>(response);
    },
    async syncSafetyHealthLedgerFindingHistory(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/finding-history/sync`, {
        method: "POST",
      });
      return parseJson<LedgerSyncResponse>(response);
    },
    async listSafetyHealthLedgerSafetyCostHistory(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/safety-cost-history`);
      return parseJson<LedgerSafetyCostHistory[]>(response);
    },
    async syncSafetyHealthLedgerSafetyCostHistory(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/safety-cost-history/sync`, {
        method: "POST",
      });
      return parseJson<LedgerSyncResponse>(response);
    },
    async listSafetyHealthLedgerAttachments(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/attachments`);
      return parseJson<LedgerAttachment[]>(response);
    },
    async linkSafetyHealthLedgerAttachment(ledgerId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/attachments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<LedgerAttachmentMutationResponse>(response);
    },
    async deleteSafetyHealthLedgerAttachment(attachmentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledger-attachments/${attachmentId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; attachmentId: string }>(response);
    },
    async listSafetyHealthLedgerVersions(ledgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/versions`);
      return parseJson<SafetyHealthLedgerVersion[]>(response);
    },
    async createSafetyHealthLedgerVersion(ledgerId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-health-ledgers/${ledgerId}/versions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ version: SafetyHealthLedgerVersion; items: SafetyHealthLedgerVersion[] }>(response);
    },
    async generateSafetyManagementPlan(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/generate`, {
        method: "POST",
      });
      return parseJson<SafetyManagementPlanMutationResponse>(response);
    },
    async validateSafetyManagementPlan(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/validate`, {
        method: "POST",
      });
      return parseJson<SafetyManagementPlanValidationResponse>(response);
    },
    async saveSafetyManagementPlanSection(planId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/save-section`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyManagementPlanMutationResponse>(response);
    },
    async regenerateSafetyManagementPlanSection(planId: string, sectionKey: string) {
      const response = await fetchImpl(
        `${baseUrl}/api/v1/safety-management-plans/${planId}/sections/${sectionKey}/regenerate`,
        { method: "POST" },
      );
      return parseJson<SafetyManagementPlanMutationResponse>(response);
    },
    async confirmSafetyManagementPlan(planId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyManagementPlanMutationResponse>(response);
    },
    async exportSafetyManagementPlan(planId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyManagementPlanExportResponse>(response);
    },
    async refreshSafetyManagementPlanLinkedData(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/refresh-linked-data`, {
        method: "POST",
      });
      return parseJson<SafetyManagementPlanMutationResponse>(response);
    },
    async listSafetyManagementWorkTypes(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/work-types`);
      return parseJson<SafetyManagementWorkType[]>(response);
    },
    async createSafetyManagementWorkType(planId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/work-types`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyManagementWorkTypeMutationResponse>(response);
    },
    async updateSafetyManagementWorkType(workTypeId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-work-types/${workTypeId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyManagementWorkTypeMutationResponse>(response);
    },
    async deleteSafetyManagementWorkType(workTypeId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-work-types/${workTypeId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; workTypeId: string }>(response);
    },
    async listSafetyManagementRisks(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/risks`);
      return parseJson<SafetyManagementRiskItem[]>(response);
    },
    async createSafetyManagementRisk(planId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/risks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyManagementRiskMutationResponse>(response);
    },
    async updateSafetyManagementRisk(riskItemId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-risks/${riskItemId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyManagementRiskMutationResponse>(response);
    },
    async deleteSafetyManagementRisk(riskItemId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-risks/${riskItemId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; riskItemId: string }>(response);
    },
    async generateSafetyManagementRisksFromWorkTypes(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/risks/generate-from-work-types`, {
        method: "POST",
      });
      return parseJson<{ createdCount: number; items: SafetyManagementRiskItem[] }>(response);
    },
    async importSafetyManagementRisksFromChecklist(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/risks/import-from-checklist`, {
        method: "POST",
      });
      return parseJson<{ createdCount: number; items: SafetyManagementRiskItem[] }>(response);
    },
    async getSafetyManagementPlanOrganization(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/organization`);
      return parseJson<SafetyOrganizationPlan>(response);
    },
    async updateSafetyManagementPlanOrganization(planId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/organization`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyOrganizationPlan>(response);
    },
    async getSafetyManagementPlanEducation(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/education`);
      return parseJson<SafetyEducationPlan>(response);
    },
    async updateSafetyManagementPlanEducation(planId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/education`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyEducationPlan>(response);
    },
    async getSafetyManagementPlanEmergency(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/emergency`);
      return parseJson<SafetyEmergencyPlan>(response);
    },
    async updateSafetyManagementPlanEmergency(planId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/emergency`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyEmergencyPlan>(response);
    },
    async listSafetyManagementPlanAttachments(planId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/attachments`);
      return parseJson<SafetyManagementPlanAttachment[]>(response);
    },
    async linkSafetyManagementPlanAttachment(planId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plans/${planId}/attachments/link`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyManagementAttachmentMutationResponse>(response);
    },
    async deleteSafetyManagementPlanAttachment(attachmentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-management-plan-attachments/${attachmentId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; attachmentId: string }>(response);
    },
    async getProjectRequirements(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/requirements`);
      return parseJson<ProjectRequirementStatus>(response);
    },
    async getProjectRelatedCounts(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/related-counts`);
      return parseJson<ProjectRelatedCounts>(response);
    },
    async getProjectHistory(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/history`);
      return parseJson<ProjectActivityLog[]>(response);
    },
    async listProjectSafetyCostUsages(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/safety-cost-usages`);
      return parseJson<SafetyCostUsageListItem[]>(response);
    },
    async getProjectSafetyCostOwnerMatrix(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/safety-cost-usages/owner-matrix`);
      return parseJson<SafetyCostOwnerMatrixResponse>(response);
    },
    async listInspectionRoundSafetyCostUsages(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/safety-cost-usages`);
      return parseJson<SafetyCostUsageListItem[]>(response);
    },
    async createInspectionRoundSafetyCostUsage(inspectionRoundId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/safety-cost-usages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyCostUsageMutationResponse>(response);
    },
    async getSafetyCostUsage(usageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}`);
      return parseJson<SafetyCostUsageDetailResponse>(response);
    },
    async updateSafetyCostUsage(usageId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyCostUsageMutationResponse>(response);
    },
    async deleteSafetyCostUsage(usageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; usageId: string }>(response);
    },
    async calculateSafetyCostRate(usageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}/calculate-rate`, {
        method: "POST",
      });
      return parseJson<SafetyCostRateCalculationResponse>(response);
    },
    async validateSafetyCostUsage(usageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}/validate`, {
        method: "POST",
      });
      return parseJson<SafetyCostValidationResponse>(response);
    },
    async generateSafetyCostComment(usageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}/generate-comment`, {
        method: "POST",
      });
      return parseJson<SafetyCostReviewMutationResponse>(response);
    },
    async reviewSafetyCostUsage(usageId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyCostReviewMutationResponse>(response);
    },
    async confirmSafetyCostUsage(usageId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyCostUsageMutationResponse>(response);
    },
    async syncSafetyCostUsageToReport(usageId: string, payload: { documentId: string }) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}/sync-to-report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyCostSyncResponse>(response);
    },
    async listSafetyCostEvidence(usageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}/evidence`);
      return parseJson<SafetyCostEvidence[]>(response);
    },
    async uploadSafetyCostEvidence(usageId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}/evidence/upload`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyCostEvidenceMutationResponse>(response);
    },
    async linkSafetyCostEvidenceFile(usageId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}/evidence/link-file`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyCostEvidenceMutationResponse>(response);
    },
    async updateSafetyCostEvidence(evidenceId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-evidence/${evidenceId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyCostEvidenceMutationResponse>(response);
    },
    async deleteSafetyCostEvidence(evidenceId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-evidence/${evidenceId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; evidenceId: string }>(response);
    },
    async getSafetyCostHistory(usageId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-cost-usages/${usageId}/history`);
      return parseJson<SafetyCostHistoryEvent[]>(response);
    },
    async getDocumentSafetyCostUsage(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/documents/${documentId}/safety-cost-usage`);
      return parseJson<DocumentSafetyCostUsageResponse>(response);
    },
    async refreshDocumentSafetyCostUsage(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/documents/${documentId}/safety-cost-usage/refresh`, {
        method: "POST",
      });
      return parseJson<SafetyCostSyncResponse>(response);
    },
    async listOrganizations() {
      const response = await fetchImpl(`${baseUrl}/api/v1/organizations`);
      return parseJson<Organization[]>(response);
    },
    async createOrganization(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/organizations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<OrganizationMutationResponse>(response);
    },
    async listProjectParties(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/parties`);
      return parseJson<ProjectPartyWithOrganization[]>(response);
    },
    async createProjectParty(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/parties`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ProjectPartyMutationResponse>(response);
    },
    async calculateProjectPartyShare(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/parties/calculate-share`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ProjectPartyShareCalculationResponse>(response);
    },
    async listContacts(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/contacts`);
      return parseJson<ContactWithOrganization[]>(response);
    },
    async createContact(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/contacts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ContactMutationResponse>(response);
    },
    async extractProjectFromDocument(sourceText: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/extract-from-document`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceText }),
      });
      return parseJson<ProjectExtractionResult>(response);
    },
    async validateExtractedInfo(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/validate-extracted-info`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ProjectExtractionValidationResult>(response);
    },
    async applyExtractedInfo(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/apply-extracted-info`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ProjectAggregateResponse>(response);
    },
    async listInspectionSchedules(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/inspection-schedules`);
      return parseJson<InspectionSchedule[]>(response);
    },
    async createInspectionSchedule(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/inspection-schedules`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionScheduleMutationResponse>(response);
    },
    async getInspectionSchedule(scheduleId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-schedules/${scheduleId}`);
      return parseJson<{ schedule: InspectionSchedule; rounds: InspectionRoundListItem["round"][] }>(response);
    },
    async updateInspectionSchedule(scheduleId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-schedules/${scheduleId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionScheduleMutationResponse>(response);
    },
    async deleteInspectionSchedule(scheduleId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-schedules/${scheduleId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async previewInspectionSchedule(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/inspection-schedules/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionSchedulePreviewResponse>(response);
    },
    async generateInspectionSchedule(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/inspection-schedules/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionScheduleMutationResponse>(response);
    },
    async listInspectionRounds(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/inspection-rounds`);
      return parseJson<InspectionRoundListItem[]>(response);
    },
    async createInspectionRound(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/inspection-rounds`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionRoundMutationResponse>(response);
    },
    async getInspectionRound(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}`);
      return parseJson<InspectionRoundDetailResponse>(response);
    },
    async updateInspectionRound(inspectionRoundId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionRoundMutationResponse>(response);
    },
    async deleteInspectionRound(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async confirmInspectionRoundDate(inspectionRoundId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/confirm-date`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionRoundMutationResponse>(response);
    },
    async rescheduleInspectionRound(inspectionRoundId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/reschedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionRescheduleMutationResponse>(response);
    },
    async closeInspectionRound(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/close`, {
        method: "POST",
      });
      return parseJson<InspectionRoundMutationResponse>(response);
    },
    async listOwnerReportTasks(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/owner-report-tasks`);
      return parseJson<InspectionOwnerReportTask[]>(response);
    },
    async generateOwnerReportTasks(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/owner-report-tasks/generate`, {
        method: "POST",
      });
      return parseJson<{ ownerReportTasks: InspectionOwnerReportTask[]; warnings: string[] }>(response);
    },
    async updateOwnerReportTask(taskId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/owner-report-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionOwnerReportTaskMutationResponse>(response);
    },
    async linkOwnerReportDocument(taskId: string, payload: { documentInstanceId: string }) {
      const response = await fetchImpl(`${baseUrl}/api/v1/owner-report-tasks/${taskId}/link-document`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionOwnerReportTaskMutationResponse>(response);
    },
    async markOwnerReportExported(taskId: string, payload: { exportedFileId: string }) {
      const response = await fetchImpl(`${baseUrl}/api/v1/owner-report-tasks/${taskId}/mark-exported`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionOwnerReportTaskMutationResponse>(response);
    },
    async markOwnerReportSubmitted(taskId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/owner-report-tasks/${taskId}/mark-submitted`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionOwnerReportTaskMutationResponse>(response);
    },
    async createSafetyReportDraft(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/draft`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyReportMutationResponse>(response);
    },
    async getSafetyReport(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}`);
      return parseJson<SafetyReportDetailResponse>(response);
    },
    async updateSafetyReport(documentId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyReportMutationResponse>(response);
    },
    async deleteSafetyReport(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; documentId: string }>(response);
    },
    async generateSafetyReport(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/generate`, {
        method: "POST",
      });
      return parseJson<SafetyReportMutationResponse>(response);
    },
    async validateSafetyReport(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/validate`, {
        method: "POST",
      });
      return parseJson<{
        documentId: string;
        missingFields: unknown[];
        warnings: unknown[];
        hasDanger: boolean;
      }>(response);
    },
    async saveSafetyReportSection(documentId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/save-section`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyReportMutationResponse>(response);
    },
    async regenerateSafetyReportSection(documentId: string, sectionKey: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/sections/${sectionKey}/regenerate`, {
        method: "POST",
      });
      return parseJson<SafetyReportMutationResponse>(response);
    },
    async confirmSafetyReport(documentId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyReportMutationResponse>(response);
    },
    async exportSafetyReport(documentId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyReportExportResponse>(response);
    },
    async cloneSafetyReportForOwner(documentId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/clone-for-owner`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyReportMutationResponse>(response);
    },
    async getSafetyReportRequiredData(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/safety-report-required-data`);
      return parseJson<SafetyReportRequiredDataResponse>(response);
    },
    async getSafetyReportOwnerReportBranches(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/owner-report-branches`);
      return parseJson<SafetyReportRequiredDataResponse["ownerBranches"]>(response);
    },
    async getSafetyReportMissingFields(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/missing-fields`);
      return parseJson<ProjectRequirementStatus["forSafetyReport"]>(response);
    },
    async getSafetyReportVariables(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/variables`);
      return parseJson<SafetyReportVariablesResponse>(response);
    },
    async getSafetyReportChecklistResults(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/checklist-results`);
      return parseJson<SafetyReportLinkedDataResponse>(response);
    },
    async getSafetyReportFindings(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/findings`);
      return parseJson<SafetyReportLinkedDataResponse>(response);
    },
    async getSafetyReportPhotoLedger(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/photo-ledger`);
      return parseJson<SafetyReportLinkedDataResponse>(response);
    },
    async getSafetyReportSafetyCost(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/safety-cost`);
      return parseJson<SafetyReportLinkedDataResponse>(response);
    },
    async refreshSafetyReportLinkedData(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/refresh-linked-data`, {
        method: "POST",
      });
      return parseJson<SafetyReportMutationResponse>(response);
    },
    async linkSafetyReportOwnerTask(documentId: string, payload: { ownerReportTaskId: string }) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/link-owner-report-task`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyReportMutationResponse & { ownerReportTask: InspectionOwnerReportTask }>(response);
    },
    async markSafetyReportSubmitted(documentId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/safety-reports/${documentId}/mark-submitted`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SafetyReportSubmissionResponse>(response);
    },
    async listInspectionTasks(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/tasks`);
      return parseJson<InspectionTask[]>(response);
    },
    async createInspectionTask(inspectionRoundId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionTaskMutationResponse>(response);
    },
    async updateInspectionTask(taskId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<InspectionTaskMutationResponse>(response);
    },
    async generateDefaultInspectionTasks(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/tasks/generate-defaults`, {
        method: "POST",
      });
      return parseJson<{ tasks: InspectionTask[]; warnings: string[] }>(response);
    },
    async listWorkScheduleAttachments(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/attachments`);
      return parseJson<WorkScheduleAttachment[]>(response);
    },
    async createWorkScheduleAttachment(inspectionRoundId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/attachments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<WorkScheduleAttachmentMutationResponse>(response);
    },
    async updateWorkScheduleAttachment(attachmentId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/work-schedule-attachments/${attachmentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<WorkScheduleAttachmentMutationResponse>(response);
    },
    async deleteWorkScheduleAttachment(attachmentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/work-schedule-attachments/${attachmentId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async getInspectionCalendarRounds(dateFrom?: string, dateTo?: string) {
      const query = new URLSearchParams();
      if (dateFrom) query.set("date_from", dateFrom);
      if (dateTo) query.set("date_to", dateTo);
      const response = await fetchImpl(`${baseUrl}/api/v1/calendar/inspection-rounds${query.size ? `?${query}` : ""}`);
      return parseJson<InspectionCalendarRoundsResponse>(response);
    },
    async getInspectionCalendarTasks(dateFrom?: string, dateTo?: string) {
      const query = new URLSearchParams();
      if (dateFrom) query.set("date_from", dateFrom);
      if (dateTo) query.set("date_to", dateTo);
      const response = await fetchImpl(`${baseUrl}/api/v1/calendar/inspection-tasks${query.size ? `?${query}` : ""}`);
      return parseJson<InspectionCalendarTasksResponse>(response);
    },
    async listChecklistTemplates() {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-templates`);
      return parseJson<ChecklistTemplate[]>(response);
    },
    async createChecklistTemplate(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-templates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistTemplateMutationResponse>(response);
    },
    async getChecklistTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-templates/${templateId}`);
      return parseJson<ChecklistTemplateDetailResponse>(response);
    },
    async updateChecklistTemplate(templateId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-templates/${templateId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistTemplateMutationResponse>(response);
    },
    async deleteChecklistTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-templates/${templateId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async publishChecklistTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-templates/${templateId}/publish`, {
        method: "POST",
      });
      return parseJson<ChecklistTemplateMutationResponse>(response);
    },
    async cloneChecklistTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-templates/${templateId}/clone`, {
        method: "POST",
      });
      return parseJson<ChecklistTemplateMutationResponse>(response);
    },
    async listChecklistTemplateItems(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-templates/${templateId}/items`);
      return parseJson<Array<ChecklistItem & { category?: Record<string, unknown> | null }>>(response);
    },
    async createChecklistTemplateItem(templateId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-templates/${templateId}/items`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistItemMutationResponse>(response);
    },
    async updateChecklistItem(itemId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-items/${itemId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistItemMutationResponse>(response);
    },
    async deleteChecklistItem(itemId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-items/${itemId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async reorderChecklistItems(templateId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-templates/${templateId}/items/reorder`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistItem[]>(response);
    },
    async listChecklistSessions(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/checklist-sessions`);
      return parseJson<ChecklistSession[]>(response);
    },
    async createChecklistSession(inspectionRoundId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/checklist-sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistSessionMutationResponse>(response);
    },
    async getChecklistSession(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}`);
      return parseJson<ChecklistSessionDetailResponse>(response);
    },
    async updateChecklistSession(sessionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistSessionMutationResponse>(response);
    },
    async startChecklistSession(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/start`, { method: "POST" });
      return parseJson<ChecklistSessionMutationResponse>(response);
    },
    async pauseChecklistSession(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/pause`, { method: "POST" });
      return parseJson<ChecklistSessionMutationResponse>(response);
    },
    async completeChecklistSession(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/complete`, { method: "POST" });
      return parseJson<ChecklistSessionMutationResponse>(response);
    },
    async reviewChecklistSession(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/review`, { method: "POST" });
      return parseJson<ChecklistSessionMutationResponse>(response);
    },
    async lockChecklistSession(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/lock`, { method: "POST" });
      return parseJson<ChecklistSessionMutationResponse>(response);
    },
    async listChecklistResults(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/results`);
      return parseJson<ChecklistResult[]>(response);
    },
    async createChecklistResult(sessionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/results`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistResultMutationResponse>(response);
    },
    async updateChecklistResult(resultId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-results/${resultId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistResultMutationResponse>(response);
    },
    async bulkSaveChecklistResults(sessionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/results/bulk-save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ results: ChecklistResult[]; warnings: string[] }>(response);
    },
    async fillChecklistResultsNotApplicable(sessionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/results/fill-not-applicable`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ results: ChecklistResult[]; warnings: string[] }>(response);
    },
    async validateChecklistResults(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/results/validate`, {
        method: "POST",
      });
      return parseJson<ChecklistValidationResponse>(response);
    },
    async listChecklistFindingCandidates(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/finding-candidates`);
      return parseJson<FindingCandidate[]>(response);
    },
    async createChecklistFindingCandidate(resultId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-results/${resultId}/finding-candidate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FindingCandidateMutationResponse>(response);
    },
    async acceptChecklistFindingCandidate(candidateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/finding-candidates/${candidateId}/accept`, { method: "POST" });
      return parseJson<FindingCandidateMutationResponse>(response);
    },
    async dismissChecklistFindingCandidate(candidateId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/finding-candidates/${candidateId}/dismiss`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FindingCandidateMutationResponse>(response);
    },
    async convertChecklistFindingCandidate(candidateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/finding-candidates/${candidateId}/convert-to-finding`, { method: "POST" });
      return parseJson<FindingCandidateMutationResponse>(response);
    },
    async createChecklistAdditionalHazard(sessionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/additional-hazards`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<AdditionalHazardMutationResponse>(response);
    },
    async updateChecklistAdditionalHazard(hazardId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/additional-hazards/${hazardId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<AdditionalHazardMutationResponse>(response);
    },
    async uploadChecklistPhoto(resultId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-results/${resultId}/photos/upload`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistPhotoMutationResponse>(response);
    },
    async listChecklistPhotos(resultId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-results/${resultId}/photos`);
      return parseJson<ChecklistPhoto[]>(response);
    },
    async linkChecklistPhoto(resultId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-results/${resultId}/photos/link`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistPhotoMutationResponse>(response);
    },
    async unlinkChecklistPhoto(photoId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-photos/${photoId}/unlink`, { method: "POST" });
      return parseJson<ChecklistPhotoMutationResponse>(response);
    },
    async getChecklistReportMapping(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/report-mapping`);
      return parseJson<ChecklistReportMappingResponse>(response);
    },
    async summarizeChecklistSession(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/summarize`, { method: "POST" });
      return parseJson<ChecklistReportMappingResponse>(response);
    },
    async syncChecklistSessionToReport(sessionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/sync-to-report`, { method: "POST" });
      return parseJson<ChecklistReportMappingResponse>(response);
    },
    async createChecklistMobileDraft(sessionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/mobile-drafts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistMobileDraftMutationResponse>(response);
    },
    async getChecklistMobileDraft(sessionId: string, draftId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/mobile-drafts/${draftId}`);
      return parseJson<ChecklistMobileDraftMutationResponse>(response);
    },
    async commitChecklistMobileDraft(sessionId: string, draftId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/checklist-sessions/${sessionId}/mobile-drafts/${draftId}/commit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ChecklistMobileDraftMutationResponse>(response);
    },
    async listProjectFindings(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/findings`);
      return parseJson<FindingListItem[]>(response);
    },
    async createProjectFinding(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/findings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FindingMutationResponse>(response);
    },
    async listInspectionRoundFindings(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/findings`);
      return parseJson<FindingListItem[]>(response);
    },
    async createInspectionRoundFinding(inspectionRoundId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/findings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FindingMutationResponse>(response);
    },
    async getFinding(findingId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}`);
      return parseJson<FindingDetailResponse>(response);
    },
    async updateFinding(findingId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FindingMutationResponse>(response);
    },
    async deleteFinding(findingId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; findingId: string }>(response);
    },
    async requestFindingAction(findingId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}/request-action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FindingMutationResponse>(response);
    },
    async verifyFinding(findingId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FindingMutationResponse>(response);
    },
    async rejectFinding(findingId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}/reject`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FindingMutationResponse>(response);
    },
    async closeFinding(findingId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}/close`, {
        method: "POST",
      });
      return parseJson<FindingMutationResponse>(response);
    },
    async linkFindingChecklistResult(findingId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}/link-checklist-result`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FindingMutationResponse>(response);
    },
    async linkFindingOwner(findingId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}/link-owner`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FindingMutationResponse>(response);
    },
    async listCorrectiveActions(findingId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}/actions`);
      return parseJson<CorrectiveAction[]>(response);
    },
    async createCorrectiveAction(findingId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<CorrectiveActionMutationResponse>(response);
    },
    async getCorrectiveAction(actionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/corrective-actions/${actionId}`);
      return parseJson<CorrectiveActionMutationResponse>(response);
    },
    async updateCorrectiveAction(actionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/corrective-actions/${actionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<CorrectiveActionMutationResponse>(response);
    },
    async deleteCorrectiveAction(actionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/corrective-actions/${actionId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async submitCorrectiveAction(actionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/corrective-actions/${actionId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<CorrectiveActionMutationResponse>(response);
    },
    async verifyCorrectiveAction(actionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/corrective-actions/${actionId}/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<CorrectiveActionMutationResponse>(response);
    },
    async rejectCorrectiveAction(actionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/corrective-actions/${actionId}/reject`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<CorrectiveActionMutationResponse>(response);
    },
    async listFindingPhotos(findingId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}/photos`);
      return parseJson<EvidencePhoto[]>(response);
    },
    async uploadFindingPhoto(findingId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}/photos/upload`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<EvidencePhotoMutationResponse>(response);
    },
    async linkFindingPhoto(findingId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/${findingId}/photos/link`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<EvidencePhotoMutationResponse>(response);
    },
    async updateEvidencePhoto(photoId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/evidence-photos/${photoId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<EvidencePhotoMutationResponse>(response);
    },
    async deleteEvidencePhoto(photoId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/evidence-photos/${photoId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async markupEvidencePhoto(photoId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/evidence-photos/${photoId}/markup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<EvidencePhotoMutationResponse>(response);
    },
    async setEvidencePhotoCaption(photoId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/evidence-photos/${photoId}/set-caption`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<EvidencePhotoMutationResponse>(response);
    },
    async setRepresentativeEvidencePhoto(photoId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/evidence-photos/${photoId}/set-representative`, {
        method: "POST",
      });
      return parseJson<EvidencePhotoMutationResponse>(response);
    },
    async listPhotoLedgers(inspectionRoundId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/photo-ledgers`);
      return parseJson<PhotoLedger[]>(response);
    },
    async createPhotoLedger(inspectionRoundId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/inspection-rounds/${inspectionRoundId}/photo-ledgers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<PhotoLedgerMutationResponse>(response);
    },
    async getPhotoLedger(photoLedgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledgers/${photoLedgerId}`);
      return parseJson<PhotoLedgerDetailResponse>(response);
    },
    async updatePhotoLedger(photoLedgerId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledgers/${photoLedgerId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<PhotoLedgerMutationResponse>(response);
    },
    async deletePhotoLedger(photoLedgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledgers/${photoLedgerId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async generatePhotoLedgerEntries(photoLedgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledgers/${photoLedgerId}/generate-entries`, {
        method: "POST",
      });
      return parseJson<{ photoLedger: PhotoLedger; entries: PhotoLedgerEntry[]; warnings: string[] }>(response);
    },
    async listPhotoLedgerEntries(photoLedgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledgers/${photoLedgerId}/entries`);
      return parseJson<PhotoLedgerEntry[]>(response);
    },
    async createPhotoLedgerEntry(photoLedgerId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledgers/${photoLedgerId}/entries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<PhotoLedgerEntryMutationResponse>(response);
    },
    async updatePhotoLedgerEntry(entryId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledger-entries/${entryId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<PhotoLedgerEntryMutationResponse>(response);
    },
    async deletePhotoLedgerEntry(entryId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledger-entries/${entryId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async reorderPhotoLedgerEntries(photoLedgerId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledgers/${photoLedgerId}/reorder`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<PhotoLedgerEntry[]>(response);
    },
    async validatePhotoLedger(photoLedgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledgers/${photoLedgerId}/validate`, {
        method: "POST",
      });
      return parseJson<PhotoLedgerValidationResponse>(response);
    },
    async exportPhotoLedger(photoLedgerId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledgers/${photoLedgerId}/export`, {
        method: "POST",
      });
      return parseJson<PhotoLedgerExportResponse>(response);
    },
    async syncPhotoLedgerToReport(photoLedgerId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/photo-ledgers/${photoLedgerId}/sync-to-report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<PhotoLedgerSyncResponse>(response);
    },
    async getDocumentPhotoLedgerSection(documentId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/documents/${documentId}/photo-ledger-section`);
      return parseJson<DocumentPhotoLedgerSectionResponse>(response);
    },
    async draftActionRequestMail(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/action-request-mail/draft`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ActionRequestMailDraftResponse>(response);
    },
    async sendActionRequestMail(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/findings/action-request-mail/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ActionRequestMailDraftResponse>(response);
    },
    async listContracts(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/contracts`);
      return parseJson<ContractListItem[]>(response);
    },
    async createContract(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/contracts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ContractMutationResponse>(response);
    },
    async getContract(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}`);
      return parseJson<ContractDetailResponse>(response);
    },
    async updateContract(contractId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ContractMutationResponse>(response);
    },
    async deleteContract(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async generateContract(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/generate`, {
        method: "POST",
      });
      return parseJson<ContractGenerateResponse>(response);
    },
    async previewContract(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/preview`, {
        method: "POST",
      });
      return parseJson<ContractPreviewResponse>(response);
    },
    async exportContract(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/export`, {
        method: "POST",
      });
      return parseJson<ContractExportResponse>(response);
    },
    async markContractSent(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/mark-sent`, {
        method: "POST",
      });
      return parseJson<ContractMutationResponse>(response);
    },
    async markContractSigned(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/mark-signed`, {
        method: "POST",
      });
      return parseJson<ContractMutationResponse>(response);
    },
    async listContractParties(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/parties`);
      return parseJson<Array<Record<string, unknown>>>(response);
    },
    async createContractParty(contractId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/parties`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ContractPartyMutationResponse>(response);
    },
    async updateContractParty(contractPartyId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contract-parties/${contractPartyId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ContractPartyMutationResponse>(response);
    },
    async deleteContractParty(contractPartyId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contract-parties/${contractPartyId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async applyProjectPartiesToContract(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/parties/apply-project-parties`, {
        method: "POST",
      });
      return parseJson<Array<Record<string, unknown>>>(response);
    },
    async listPaymentTerms(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/payment-terms`);
      return parseJson<Array<Record<string, unknown>>>(response);
    },
    async createPaymentTerm(contractId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/payment-terms`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<PaymentTermMutationResponse>(response);
    },
    async updatePaymentTerm(paymentTermId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/payment-terms/${paymentTermId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<PaymentTermMutationResponse>(response);
    },
    async deletePaymentTerm(paymentTermId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/payment-terms/${paymentTermId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async calculatePaymentSplit(contractId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/payment-terms/calculate-split`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<PaymentSplitCalculationResponse>(response);
    },
    async uploadContractFile(contractId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/files/upload`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ file: ContractFileLink }>(response);
    },
    async listContractFiles(contractId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/files`);
      return parseJson<ContractFileLink[]>(response);
    },
    async setFinalContractFile(contractId: string, fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/files/${fileId}/set-final`, {
        method: "POST",
      });
      return parseJson<ContractFileMutationResponse>(response);
    },
    async setSignedContractFile(contractId: string, fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/contracts/${contractId}/files/${fileId}/set-signed`, {
        method: "POST",
      });
      return parseJson<ContractFileMutationResponse>(response);
    },
    async listEstimates(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/estimates`);
      return parseJson<EstimateListItem[]>(response);
    },
    async createEstimate(projectId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/estimates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<EstimateMutationResponse>(response);
    },
    async getEstimate(estimateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/estimates/${estimateId}`);
      return parseJson<EstimateMutationResponse["estimate"]>(response);
    },
    async updateEstimate(estimateId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/estimates/${estimateId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<EstimateMutationResponse>(response);
    },
    async deleteEstimate(estimateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/estimates/${estimateId}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean }>(response);
    },
    async generateEstimate(estimateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/estimates/${estimateId}/generate`, {
        method: "POST",
      });
      return parseJson<EstimateDraftResponse>(response);
    },
    async exportEstimate(estimateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/estimates/${estimateId}/export`, {
        method: "POST",
      });
      return parseJson<EstimateExportResponse>(response);
    },
    async convertEstimateToContract(estimateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/estimates/${estimateId}/convert-to-contract`, {
        method: "POST",
      });
      return parseJson<EstimateMutationResponse>(response);
    },
    async listFolders(projectId?: string, parentFolderId?: string) {
      const params = new URLSearchParams();
      if (projectId) params.set("project_id", projectId);
      if (parentFolderId) params.set("parent_folder_id", parentFolderId);
      const response = await fetchImpl(`${baseUrl}/api/v1/folders${params.size ? `?${params}` : ""}`);
      return parseJson<Folder[]>(response);
    },
    async createFolder(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/folders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FolderMutationResponse>(response);
    },
    async getFolder(folderId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/folders/${folderId}`);
      return parseJson<Folder>(response);
    },
    async updateFolder(folderId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/folders/${folderId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FolderMutationResponse>(response);
    },
    async deleteFolder(folderId: string, adminOverride = false) {
      const response = await fetchImpl(`${baseUrl}/api/v1/folders/${folderId}?admin_override=${adminOverride ? "true" : "false"}`, {
        method: "DELETE",
      });
      return parseJson<{ deleted: boolean; folderId: string }>(response);
    },
    async bootstrapProjectFolders(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/folders/bootstrap`, {
        method: "POST",
      });
      return parseJson<{ projectId: string; folders: Folder[]; tree: WebhardFolderNode[] }>(response);
    },
    async moveFolder(folderId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/folders/${folderId}/move`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FolderMutationResponse>(response);
    },
    async getProjectFolderTree(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/folder-tree`);
      return parseJson<WebhardFolderNode[]>(response);
    },
    async listFiles(filters: {
      projectId?: string;
      folderId?: string;
      status?: string;
      tag?: string;
      linkedEntityType?: string;
      query?: string;
    } = {}) {
      const params = new URLSearchParams();
      if (filters.projectId) params.set("project_id", filters.projectId);
      if (filters.folderId) params.set("folder_id", filters.folderId);
      if (filters.status) params.set("status", filters.status);
      if (filters.tag) params.set("tag", filters.tag);
      if (filters.linkedEntityType) params.set("linked_entity_type", filters.linkedEntityType);
      if (filters.query) params.set("query", filters.query);
      const response = await fetchImpl(`${baseUrl}/api/v1/files${params.size ? `?${params}` : ""}`);
      return parseJson<FileAsset[]>(response);
    },
    async uploadFile(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/upload`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FileMutationResponse>(response);
    },
    async getFile(fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}`);
      return parseJson<FileDetailResponse>(response);
    },
    async updateFile(fileId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FileMutationResponse>(response);
    },
    async deleteFile(fileId: string, adminOverride = false) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}?admin_override=${adminOverride ? "true" : "false"}`, {
        method: "DELETE",
      });
      return parseJson<FileMutationResponse>(response);
    },
    async restoreFile(fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/restore`, { method: "POST" });
      return parseJson<FileMutationResponse>(response);
    },
    async archiveFile(fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/archive`, { method: "POST" });
      return parseJson<FileMutationResponse>(response);
    },
    async lockFile(fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/lock`, { method: "POST" });
      return parseJson<FileMutationResponse>(response);
    },
    async unlockFile(fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/unlock`, { method: "POST" });
      return parseJson<FileMutationResponse>(response);
    },
    async moveFile(fileId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/move`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FileMutationResponse>(response);
    },
    async copyFile(fileId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/copy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FileMutationResponse>(response);
    },
    async downloadFile(fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/download`);
      return parseJson<{ file: FileAsset; downloadPath: string }>(response);
    },
    async previewFile(fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/preview`);
      return parseJson<{ file: FileAsset; previewPath: string; previewStatus: string }>(response);
    },
    async bulkFileAction(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/bulk-action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ action: string; files: FileAsset[] }>(response);
    },
    async listFileVersions(fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/versions`);
      return parseJson<FileVersion[]>(response);
    },
    async addFileVersion(fileId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/versions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FileVersionMutationResponse>(response);
    },
    async downloadFileVersion(versionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/file-versions/${versionId}/download`);
      return parseJson<{ version: FileVersion; downloadPath: string }>(response);
    },
    async restoreFileVersionAsCurrent(versionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/file-versions/${versionId}/restore-as-current`, {
        method: "POST",
      });
      return parseJson<FileVersionMutationResponse>(response);
    },
    async listShareLinks(projectId?: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/share-links${projectId ? `?project_id=${projectId}` : ""}`);
      return parseJson<ShareLink[]>(response);
    },
    async createShareLink(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/share-links`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ShareLinkMutationResponse>(response);
    },
    async getShareLink(shareLinkId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/share-links/${shareLinkId}`);
      return parseJson<ShareLink>(response);
    },
    async updateShareLink(shareLinkId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/share-links/${shareLinkId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ShareLinkMutationResponse>(response);
    },
    async deleteShareLink(shareLinkId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/share-links/${shareLinkId}`, { method: "DELETE" });
      return parseJson<{ deleted: boolean; shareLinkId: string }>(response);
    },
    async revokeShareLink(shareLinkId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/share-links/${shareLinkId}/revoke`, { method: "POST" });
      return parseJson<ShareLinkMutationResponse>(response);
    },
    async getPublicShare(token: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/public/share/${token}`);
      return parseJson<PublicShareResponse>(response);
    },
    async downloadPublicShare(token: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/public/share/${token}/download`);
      return parseJson<PublicShareResponse>(response);
    },
    async listFileLinks(fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/links`);
      return parseJson<FileEntityLink[]>(response);
    },
    async createFileLink(fileId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/links`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FileLinkMutationResponse>(response);
    },
    async deleteFileLink(fileId: string, linkId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/links/${linkId}`, { method: "DELETE" });
      return parseJson<{ deleted: boolean; fileId: string; linkId: string }>(response);
    },
    async classifyFile(fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/classify`, { method: "POST" });
      return parseJson<FileClassificationResponse>(response);
    },
    async applyFileClassification(fileId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/apply-classification`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<FileMutationResponse>(response);
    },
    async getMailAttachmentSaveSuggestions(messageId: string, projectId: string) {
      const response = await fetchImpl(
        `${baseUrl}/api/v1/mail/messages/${messageId}/attachments/save-suggestions?project_id=${projectId}`,
      );
      return parseJson<MailAttachmentSaveSuggestionResponse>(response);
    },
    async saveMailAttachmentToWebhard(messageId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/mail/messages/${messageId}/attachments/save-to-webhard`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<MailAttachmentSaveResponse>(response);
    },
    async listFileActivities(fileId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/files/${fileId}/activities`);
      return parseJson<FileActivity[]>(response);
    },
    async listWebhardActivities(projectId?: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/webhard/activities${projectId ? `?project_id=${projectId}` : ""}`);
      return parseJson<FileActivity[]>(response);
    },
    async searchWebhard(filters: {
      projectId?: string;
      folderId?: string;
      tag?: string;
      linkedEntityType?: string;
      query?: string;
    } = {}) {
      const params = new URLSearchParams();
      if (filters.projectId) params.set("project_id", filters.projectId);
      if (filters.folderId) params.set("folder_id", filters.folderId);
      if (filters.tag) params.set("tag", filters.tag);
      if (filters.linkedEntityType) params.set("linked_entity_type", filters.linkedEntityType);
      if (filters.query) params.set("query", filters.query);
      const response = await fetchImpl(`${baseUrl}/api/v1/webhard/search${params.size ? `?${params}` : ""}`);
      return parseJson<WebhardSearchResponse>(response);
    },
    async getWebhardStorageUsage(projectId?: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/webhard/storage-usage${projectId ? `?project_id=${projectId}` : ""}`);
      return parseJson<WebhardStorageUsageResponse>(response);
    },
    async getDashboardOverview(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/overview${params.size ? `?${params}` : ""}`);
      return parseJson<DashboardOverviewResponse>(response);
    },
    async getDashboardMyWork(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/my-work${params.size ? `?${params}` : ""}`);
      return parseJson<DashboardMyWorkResponse>(response);
    },
    async getProjectDashboard(projectId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/projects/${projectId}/dashboard`);
      return parseJson<ProjectDashboardResponse>(response);
    },
    async listDashboardWidgets() {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/widgets`);
      return parseJson<DashboardWidget[]>(response);
    },
    async createDashboardWidget(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/widgets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ widget: DashboardWidget }>(response);
    },
    async updateDashboardWidget(widgetId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/widgets/${widgetId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ widget: DashboardWidget }>(response);
    },
    async deleteDashboardWidget(widgetId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/widgets/${widgetId}`, { method: "DELETE" });
      return parseJson<{ deleted: boolean; widgetId: string }>(response);
    },
    async reorderDashboardWidgets(widgetIds: string[]) {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/widgets/reorder`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ widgetIds }),
      });
      return parseJson<DashboardWidget[]>(response);
    },
    async listDashboardProjectHealthMetrics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/metrics/project-health${params.size ? `?${params}` : ""}`);
      return parseJson<ProjectHealthMetric[]>(response);
    },
    async listDashboardInspectionStatusMetrics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/metrics/inspection-status${params.size ? `?${params}` : ""}`);
      return parseJson<DashboardMetric[]>(response);
    },
    async listDashboardReportStatusMetrics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/metrics/report-status${params.size ? `?${params}` : ""}`);
      return parseJson<OwnerReportStatusSummary[]>(response);
    },
    async listDashboardFindingAgingMetrics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/metrics/finding-aging${params.size ? `?${params}` : ""}`);
      return parseJson<FindingAgingBucket[]>(response);
    },
    async listDashboardSafetyCostUsageMetrics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/metrics/safety-cost-usage${params.size ? `?${params}` : ""}`);
      return parseJson<Array<Record<string, unknown>>>(response);
    },
    async listDashboardApprovalQueueMetrics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/metrics/approval-queue${params.size ? `?${params}` : ""}`);
      return parseJson<Array<Record<string, unknown>>>(response);
    },
    async listDashboardMailFileActivityMetrics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/metrics/mail-file-activity${params.size ? `?${params}` : ""}`);
      return parseJson<{ messages: MailMessage[]; files: FileActivity[]; unclassifiedMailCount: number; unclassifiedMessages?: MailMessage[] }>(response);
    },
    async listDashboardSubmissionStatusMetrics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/metrics/submission-status${params.size ? `?${params}` : ""}`);
      return parseJson<OwnerReportStatusSummary[]>(response);
    },
    async listDashboardMonthlyInspectionStatistics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/statistics/monthly-inspections${params.size ? `?${params}` : ""}`);
      return parseJson<StatisticsMetric[]>(response);
    },
    async listDashboardMonthlySubmissionStatistics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/statistics/monthly-submissions${params.size ? `?${params}` : ""}`);
      return parseJson<StatisticsMetric[]>(response);
    },
    async listDashboardRiskTypeStatistics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/statistics/risk-types${params.size ? `?${params}` : ""}`);
      return parseJson<StatisticsMetric[]>(response);
    },
    async listDashboardFindingResolutionTimeStatistics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/statistics/finding-resolution-time${params.size ? `?${params}` : ""}`);
      return parseJson<StatisticsMetric[]>(response);
    },
    async listDashboardOwnerSubmissionLagStatistics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/statistics/owner-submission-lag${params.size ? `?${params}` : ""}`);
      return parseJson<StatisticsMetric[]>(response);
    },
    async listDashboardSafetyCostDistributionStatistics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/statistics/safety-cost-distribution${params.size ? `?${params}` : ""}`);
      return parseJson<StatisticsMetric[]>(response);
    },
    async listDashboardExportSummaryStatistics(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/statistics/export-summary${params.size ? `?${params}` : ""}`);
      return parseJson<StatisticsMetric[]>(response);
    },
    async listDashboardAlerts() {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/alerts`);
      return parseJson<DashboardAlert[]>(response);
    },
    async refreshDashboardAlerts(projectIds?: string[]) {
      const params = new URLSearchParams();
      if (projectIds && projectIds.length > 0) params.set("project_ids", projectIds.join(","));
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/alerts/refresh${params.size ? `?${params}` : ""}`, { method: "POST" });
      return parseJson<{ alerts: DashboardAlert[] }>(response);
    },
    async acknowledgeDashboardAlert(alertId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/alerts/${alertId}/acknowledge`, { method: "PATCH" });
      return parseJson<{ alert: DashboardAlert }>(response);
    },
    async dismissDashboardAlert(alertId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/alerts/${alertId}/dismiss`, { method: "PATCH" });
      return parseJson<{ alert: DashboardAlert }>(response);
    },
    async listDashboardAlertRules() {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/alert-rules`);
      return parseJson<AlertRule[]>(response);
    },
    async createDashboardAlertRule(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/alert-rules`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ alertRule: AlertRule }>(response);
    },
    async updateDashboardAlertRule(alertRuleId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/alert-rules/${alertRuleId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ alertRule: AlertRule }>(response);
    },
    async createDashboardInsightSummary(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/insights/summary`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ insightRun: DashboardInsightRun }>(response);
    },
    async createDashboardProjectRiskInsight(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/insights/project-risk`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ insightRun: DashboardInsightRun }>(response);
    },
    async createDashboardWeeklyBriefing(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/dashboard/insights/weekly-briefing`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ insightRun: DashboardInsightRun }>(response);
    },
    async getAdminSummary() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/summary`);
      return parseJson<AdminDashboardSummaryResponse>(response);
    },
    async listAdminUsers() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/users`);
      return parseJson<AdminUser[]>(response);
    },
    async createAdminUser(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/users`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ user: AdminUser }>(response);
    },
    async getAdminUser(userId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/users/${userId}`);
      return parseJson<{ user: AdminUser }>(response);
    },
    async updateAdminUser(userId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ user: AdminUser }>(response);
    },
    async deleteAdminUser(userId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/users/${userId}`, { method: "DELETE" });
      return parseJson<{ deleted: boolean; userId: string }>(response);
    },
    async listAdminRoles() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/roles`);
      return parseJson<Role[]>(response);
    },
    async createAdminRole(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/roles`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ role: Role }>(response);
    },
    async updateAdminRole(roleId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/roles/${roleId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ role: Role }>(response);
    },
    async deleteAdminRole(roleId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/roles/${roleId}`, { method: "DELETE" });
      return parseJson<{ deleted: boolean; roleId: string }>(response);
    },
    async listAdminPermissions() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/permissions`);
      return parseJson<Permission[]>(response);
    },
    async updateAdminRolePermissions(roleId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/roles/${roleId}/permissions`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ role: Role; auditLog: AdminAuditLog }>(response);
    },
    async getAdminCompanyProfile() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/company-profile`);
      return parseJson<{ companyProfile: CompanyProfile }>(response);
    },
    async updateAdminCompanyProfile(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/company-profile`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ companyProfile: CompanyProfile; auditLog: AdminAuditLog }>(response);
    },
    async uploadAdminCompanyLogo(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/company-profile/logo`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ companyProfile: CompanyProfile; fileAsset: FileAsset; auditLog: AdminAuditLog }>(response);
    },
    async uploadAdminCompanySeal(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/company-profile/seal`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ companyProfile: CompanyProfile; fileAsset: FileAsset; auditLog: AdminAuditLog }>(response);
    },
    async listAdminDocumentTemplates() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/document-templates`);
      return parseJson<DocumentTemplateListItem[]>(response);
    },
    async createAdminDocumentTemplate(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/document-templates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<DocumentTemplateDetailResponse>(response);
    },
    async getAdminDocumentTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/document-templates/${templateId}`);
      return parseJson<DocumentTemplateDetailResponse>(response);
    },
    async updateAdminDocumentTemplate(templateId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/document-templates/${templateId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<DocumentTemplateDetailResponse>(response);
    },
    async listAdminTemplateVersions(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/document-templates/${templateId}/versions`);
      return parseJson<TemplateVersion[]>(response);
    },
    async createAdminTemplateVersion(templateId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/document-templates/${templateId}/versions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ version: TemplateVersion }>(response);
    },
    async getAdminTemplateVersion(versionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/template-versions/${versionId}`);
      return parseJson<{
        version: TemplateVersion;
        sections: TemplateSection[];
        variables: TemplateVariable[];
        previewRuns: TemplatePreviewRun[];
      }>(response);
    },
    async updateAdminTemplateVersion(versionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/template-versions/${versionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{
        version: TemplateVersion;
        sections: TemplateSection[];
        variables: TemplateVariable[];
        previewRuns: TemplatePreviewRun[];
      }>(response);
    },
    async reviewAdminTemplateVersion(versionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/template-versions/${versionId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ version: TemplateVersion }>(response);
    },
    async publishAdminTemplateVersion(versionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/template-versions/${versionId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ version: TemplateVersion; auditLog: AdminAuditLog }>(response);
    },
    async rollbackAdminTemplateVersion(versionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/template-versions/${versionId}/rollback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ version: TemplateVersion; auditLog: AdminAuditLog }>(response);
    },
    async extractAdminTemplateVariables(versionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/template-versions/${versionId}/variables/extract`, { method: "POST" });
      return parseJson<{ variables: TemplateVariable[] }>(response);
    },
    async listAdminTemplateVariables(versionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/template-versions/${versionId}/variables`);
      return parseJson<TemplateVariable[]>(response);
    },
    async previewAdminTemplateVersion(versionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/template-versions/${versionId}/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ previewRun: TemplatePreviewRun; missingFields: MissingField[]; previewText: string }>(response);
    },
    async validateAdminTemplateVersion(versionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/template-versions/${versionId}/validate`, { method: "POST" });
      return parseJson<{ version: TemplateVersion; errors: Array<{ code: string; message: string }>; warnings: Array<{ code: string; message: string }> }>(response);
    },
    async getAdminTemplateImpact(versionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/template-versions/${versionId}/impact`);
      return parseJson<Record<string, unknown>>(response);
    },
    async listAdminChecklistTemplates() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/checklist-templates`);
      return parseJson<ChecklistTemplate[]>(response);
    },
    async getAdminChecklistTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/checklist-templates/${templateId}`);
      return parseJson<ChecklistTemplateDetailResponse>(response);
    },
    async publishAdminChecklistTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/checklist-templates/${templateId}/publish`, { method: "POST" });
      return parseJson<ChecklistTemplateMutationResponse>(response);
    },
    async listAdminPhrases() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/phrases`);
      return parseJson<Phrase[]>(response);
    },
    async createAdminPhrase(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/phrases`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ phrase: Phrase }>(response);
    },
    async publishAdminPhrase(phraseId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/phrases/${phraseId}/publish`, { method: "POST" });
      return parseJson<{ phrase: Phrase }>(response);
    },
    async listAdminLegalClauses() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/legal-clauses`);
      return parseJson<LegalClause[]>(response);
    },
    async createAdminLegalClause(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/legal-clauses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ legalClause: LegalClause }>(response);
    },
    async updateAdminLegalClause(clauseId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/legal-clauses/${clauseId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ legalClause: LegalClause; auditLog: AdminAuditLog }>(response);
    },
    async publishAdminLegalClause(clauseId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/legal-clauses/${clauseId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ legalClause: LegalClause; auditLog: AdminAuditLog }>(response);
    },
    async listAdminPrompts() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompts`);
      return parseJson<PromptListItem[]>(response);
    },
    async createAdminPrompt(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<PromptDetailResponse>(response);
    },
    async getAdminPrompt(promptId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompts/${promptId}`);
      return parseJson<PromptDetailResponse>(response);
    },
    async updateAdminPrompt(promptId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompts/${promptId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<PromptDetailResponse>(response);
    },
    async listAdminPromptVersions(promptId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompts/${promptId}/versions`);
      return parseJson<PromptVersion[]>(response);
    },
    async createAdminPromptVersion(promptId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompts/${promptId}/versions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ version: PromptVersion }>(response);
    },
    async getAdminPromptVersion(versionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompt-versions/${versionId}`);
      return parseJson<{ version: PromptVersion; runLogs: PromptRunLog[] }>(response);
    },
    async updateAdminPromptVersion(versionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompt-versions/${versionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ version: PromptVersion; runLogs: PromptRunLog[] }>(response);
    },
    async runAdminPromptVersion(versionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompt-versions/${versionId}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ runLog: PromptRunLog; output: Record<string, unknown> }>(response);
    },
    async runAdminPromptTestCases(versionId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompt-versions/${versionId}/run-test-cases`, { method: "POST" });
      return parseJson<{ results: Array<{ testCase: PromptTestCase; runLog: PromptRunLog; passed: boolean }>; version: PromptVersion }>(response);
    },
    async publishAdminPromptVersion(versionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompt-versions/${versionId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ version: PromptVersion; auditLog: AdminAuditLog }>(response);
    },
    async rollbackAdminPromptVersion(versionId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompt-versions/${versionId}/rollback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ version: PromptVersion; auditLog: AdminAuditLog }>(response);
    },
    async listAdminPromptTestCases(promptId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompts/${promptId}/test-cases`);
      return parseJson<PromptTestCase[]>(response);
    },
    async createAdminPromptTestCase(promptId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/prompts/${promptId}/test-cases`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ testCase: PromptTestCase; testCases: PromptTestCase[] }>(response);
    },
    async getAdminWebhardPolicy() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/webhard-policies`);
      return parseJson<{ policy: WebhardPolicy }>(response);
    },
    async updateAdminWebhardPolicy(payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/webhard-policies`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ policy: WebhardPolicy; auditLog: AdminAuditLog }>(response);
    },
    async listAdminMailTemplates() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/mail-templates`);
      return parseJson<MailTemplate[]>(response);
    },
    async getAdminMailTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/mail-templates/${templateId}`);
      return parseJson<{ template: MailTemplate }>(response);
    },
    async updateAdminMailTemplate(templateId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/mail-templates/${templateId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<{ template: MailTemplate }>(response);
    },
    async listAdminApprovalTemplates() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/approval-templates`);
      return parseJson<ApprovalTemplateDetailResponse[]>(response);
    },
    async getAdminApprovalTemplate(templateId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/approval-templates/${templateId}`);
      return parseJson<ApprovalTemplateDetailResponse>(response);
    },
    async updateAdminApprovalTemplate(templateId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/approval-templates/${templateId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<ApprovalMutationResponse>(response);
    },
    async listAdminSignatureAssets() {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/signature-assets`);
      return parseJson<SignatureAsset[]>(response);
    },
    async getAdminSignatureAsset(assetId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/signature-assets/${assetId}`);
      return parseJson<{ signatureAsset: SignatureAsset }>(response);
    },
    async updateAdminSignatureAsset(assetId: string, payload: Record<string, unknown>) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/signature-assets/${assetId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseJson<SignatureAssetMutationResponse>(response);
    },
    async listAdminAuditLogs(targetType?: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/audit-logs${targetType ? `?targetType=${targetType}` : ""}`);
      return parseJson<AdminAuditLog[]>(response);
    },
    async getAdminAuditLog(auditLogId: string) {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/audit-logs/${auditLogId}`);
      return parseJson<{ auditLog: AdminAuditLog }>(response);
    },
  };
}
