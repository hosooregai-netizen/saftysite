export type RootEntity = "Project";

export type ProjectStatus =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type OrganizationType =
  | "owner"
  | "contractor"
  | "engineer"
  | "subcontractor"
  | "authority"
  | "other";

export type ProjectPartyRole = OrganizationType;

export type HealthCheckResponse = {
  status: "ok";
  service: "anc-erp-server";
  rootEntity: RootEntity;
  version: string;
};

export type BootstrapSampleIds = {
  projectId: string;
  inspectionRoundId: string;
  documentId: string;
};

export type BootstrapSummaryResponse = {
  rootEntity: RootEntity;
  hierarchy: {
    Project: string[];
    InspectionRound: string[];
    DocumentInstance: string[];
  };
  sampleIds: BootstrapSampleIds;
};

export type Project = {
  id: string;
  projectCode?: string | null;
  projectName: string;
  siteName: string;
  siteAddress: string;
  constructionType: string;
  constructionDescription?: string | null;
  totalAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  actualStartDate?: string | null;
  progressRate?: number | null;
  inspectionCycleText?: string | null;
  totalInspectionRounds?: number | null;
  status: ProjectStatus;
  memo?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

export type Organization = {
  id: string;
  name: string;
  type: OrganizationType;
  businessNumber?: string | null;
  representativeName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectParty = {
  id: string;
  projectId: string;
  organizationId: string;
  role: ProjectPartyRole;
  shareRatio?: number | null;
  shareAmount?: number | null;
  requiresSeparateReport: boolean;
  reportRecipient: boolean;
  invoiceRecipient: boolean;
  displayOrder: number;
  note?: string | null;
  ownerPartyId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Contact = {
  id: string;
  projectId: string;
  organizationId: string;
  name: string;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  roleDescription?: string | null;
  isPrimary?: boolean;
  receivesReport?: boolean;
  receivesActionRequest?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InspectionScheduleStatus = "draft" | "active" | "completed" | "archived";
export type InspectionScheduleBasisType = "project_period" | "contract_period" | "manual";
export type InspectionRoundStatus =
  | "planned"
  | "scheduled"
  | "in_progress"
  | "checked"
  | "review"
  | "report_ready"
  | "submitted"
  | "closed"
  | "cancelled";
export type OwnerReportTaskStatus =
  | "not_started"
  | "drafting"
  | "review"
  | "exported"
  | "submitted"
  | "confirmed"
  | "cancelled";
export type InspectionTaskType =
  | "schedule_confirm"
  | "owner_coordination"
  | "contractor_coordination"
  | "prepare_materials"
  | "site_inspection"
  | "checklist_input"
  | "finding_summary"
  | "photo_ledger"
  | "report_draft"
  | "internal_review"
  | "owner_submission"
  | "follow_up";
export type InspectionTaskStatus = "todo" | "in_progress" | "done" | "blocked" | "cancelled";

export type InspectionSchedule = {
  id: string;
  projectId: string;
  contractId?: string | null;
  scheduleName: string;
  basisType: InspectionScheduleBasisType;
  cycleText: string;
  totalRounds: number;
  startDate?: string | null;
  endDate?: string | null;
  status: InspectionScheduleStatus;
  createdAt: string;
  updatedAt: string;
};

export type InspectionRound = {
  id: string;
  projectId: string;
  name: string;
  status: InspectionRoundStatus;
  scheduleId?: string | null;
  roundNo?: number;
  documentNo?: string | null;
  plannedMonth?: string | null;
  plannedDate?: string | null;
  actualInspectionDate?: string | null;
  inspectorUserId?: string | null;
  confirmerContactId?: string | null;
  contractorContactId?: string | null;
  reportDueDate?: string | null;
  milestoneLabel?: string | null;
  memo?: string | null;
  createdAt?: string;
  updatedAt?: string;
  nextInspectionDate?: string | null;
  documentInstances: DocumentInstance[];
};

export type InspectionOwnerReportTask = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId: string;
  ownerDisplayName?: string | null;
  documentInstanceId?: string | null;
  status: OwnerReportTaskStatus;
  exportedFileId?: string | null;
  submittedAt?: string | null;
  mailThreadId?: string | null;
  submissionId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InspectionTask = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  taskType: InspectionTaskType;
  title: string;
  dueDate?: string | null;
  assigneeId?: string | null;
  status: InspectionTaskStatus;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkScheduleAttachment = {
  id: string;
  projectId: string;
  inspectionRoundId?: string | null;
  fileId: string;
  fileName: string;
  storagePath: string;
  attachmentType: string;
  sourceLabel?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InspectionRescheduleLog = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  previousPlannedDate?: string | null;
  nextPlannedDate?: string | null;
  previousActualInspectionDate?: string | null;
  nextActualInspectionDate?: string | null;
  reason: string;
  requestedBy?: string | null;
  approvedBy?: string | null;
  mailThreadId?: string | null;
  fileId?: string | null;
  createdAt: string;
};

export type InspectionRoundMilestone = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  label: string;
  linkedContractId?: string | null;
  createdAt: string;
};

export type DocumentInstance = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId: string;
  title: string;
  status: string;
  ownerReportTaskId?: string | null;
  templateId?: string | null;
  documentType?: string;
  documentNo?: string | null;
  roundNo?: number;
  contentSnapshot?: SafetyReportSnapshot | Record<string, unknown> | null;
  latestVersionNo?: number;
  exportedFileId?: string | null;
  submittedAt?: string | null;
  mailThreadId?: string | null;
  submissionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DocumentVersion = {
  id: string;
  documentId: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId?: string | null;
  sourcePhotoLedgerId?: string | null;
  sectionKey?: string | null;
  versionNo?: number;
  contentSnapshot?: SafetyReportSnapshot | Record<string, unknown> | null;
  createdBy?: string;
  createdAt: string;
  changeSummary?: string | null;
};

export type ProjectRelatedCounts = {
  projectId: string;
  contracts: number;
  inspectionRounds: number;
  documents: number;
  files: number;
  mailThreads: number;
  openFindings: number;
};

export type MissingField = {
  field: string;
  message: string;
  severity: "required" | "recommended";
  label?: string | null;
  sectionKey?: string | null;
  reason?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
};

export type SourceLink = {
  id: string;
  sectionKey: string;
  sourceEntityType: string;
  sourceEntityId: string;
  sourceLabel: string;
  sourceUpdatedAt?: string | null;
  linkedAt: string;
};

export type ReviewWarning = {
  type:
    | "missing_required_data"
    | "owner_specific_data_mismatch"
    | "stale_linked_data"
    | "photo_pair_missing"
    | "safety_cost_rate_mismatch"
    | "checklist_finding_mismatch"
    | "legal_text_review_required"
    | "missing_export_file";
  message: string;
  severity: "info" | "warning" | "danger";
  sectionKey?: string | null;
};

export type SafetyReportMeta = {
  documentId: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId: string;
  ownerDisplayName: string;
  templateId: string;
  generatedMode: "from_linked_data" | "blank" | "clone_from_existing";
  draftWatermark: string;
};

export type SafetyReportSection = {
  id: string;
  key: string;
  title: string;
  status: "not_started" | "ai_draft" | "edited" | "review" | "confirmed" | "locked";
  order: number;
  content: Record<string, unknown>;
  sourceEntityRefs: SourceLink[];
  updatedAt: string;
};

export type SafetyReportSnapshot = {
  meta: SafetyReportMeta;
  variables: Record<string, unknown>;
  sections: SafetyReportSection[];
  missingFields: MissingField[];
  reviewWarnings: ReviewWarning[];
  sourceLinks: SourceLink[];
};

export type SafetyReportVersion = {
  id: string;
  documentId: string;
  versionNo: number;
  contentSnapshot: SafetyReportSnapshot;
  createdBy: string;
  createdAt: string;
  changeSummary?: string | null;
};

export type SafetyReportExportJob = {
  id: string;
  documentId: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId: string;
  status: string;
  fileId?: string | null;
  storagePath?: string | null;
  createdAt: string;
  completedAt?: string | null;
};

export type SafetyReportListItem = {
  document: DocumentInstance;
  ownerDisplayName: string;
  inspectionRoundName: string;
  missingRequiredCount: number;
  warningCount: number;
  linkedOwnerReportTask?: InspectionOwnerReportTask | null;
  latestVersion?: SafetyReportVersion | null;
};

export type SafetyReportDetailResponse = {
  document: DocumentInstance;
  snapshot: SafetyReportSnapshot;
  sections: SafetyReportSection[];
  versions: SafetyReportVersion[];
  missingFields: MissingField[];
  warnings: ReviewWarning[];
  linkedOwnerReportTask?: InspectionOwnerReportTask | null;
  linkedDataSummary: {
    checklistResults: number;
    findings: number;
    photoLedgers: number;
    safetyCostUsages: number;
    attachments: number;
  };
  exportedFile?: FileAsset | null;
};

export type SafetyReportMutationResponse = {
  document: DocumentInstance;
  snapshot: SafetyReportSnapshot;
  warnings: ReviewWarning[];
  missingFields: MissingField[];
  version?: SafetyReportVersion | null;
};

export type SafetyReportRequiredDataResponse = {
  projectId: string;
  inspectionRoundId: string;
  ownerBranches: Array<{
    ownerPartyId: string;
    ownerDisplayName: string;
    ownerReportTaskId?: string | null;
  }>;
  requiredData: MissingField[];
  warnings: ReviewWarning[];
};

export type SafetyReportVariablesResponse = {
  documentId: string;
  variables: Record<string, unknown>;
  sourceLinks: SourceLink[];
};

export type SafetyReportLinkedDataResponse = {
  documentId: string;
  sectionKey: string;
  items: Record<string, unknown>[];
};

export type SafetyReportExportResponse = {
  document: DocumentInstance;
  exportJob: SafetyReportExportJob;
  fileAsset: FileAsset;
  version: SafetyReportVersion;
};

export type SafetyReportSubmissionResponse = {
  document: DocumentInstance;
  ownerReportTask?: InspectionOwnerReportTask | null;
  mailThreadId?: string | null;
  submissionId?: string | null;
  mailThread?: MailThread | null;
  submission?: Submission | null;
};

export type SafetyManagementPlan = {
  id: string;
  projectId: string;
  title: string;
  status: string;
  templateId: string;
  contractId?: string | null;
  inspectionRoundId?: string | null;
  revisionNo: number;
  revisionReason?: string | null;
  contentSnapshot?: SafetyManagementPlanSnapshot | Record<string, unknown> | null;
  latestVersionNo?: number;
  exportedFileId?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

export type SafetyManagementProjectSnapshot = {
  projectId: string;
  projectName: string;
  siteName: string;
  siteAddress: string;
  constructionType: string;
  contractorName?: string | null;
  ownerName?: string | null;
  contractTitle?: string | null;
  contractPeriodText?: string | null;
  sourceUpdatedAt?: string | null;
};

export type SafetyManagementPlanMeta = {
  planId: string;
  projectId: string;
  templateId: string;
  contractId?: string | null;
  inspectionRoundId?: string | null;
  generatedMode: string;
  draftWatermark: string;
};

export type SafetyManagementPlanSection = {
  id: string;
  key:
    | "cover"
    | "project_overview"
    | "work_types"
    | "risk_register"
    | "safety_organization"
    | "safety_education"
    | "emergency_response"
    | "inspection_plan"
    | "attachments";
  title: string;
  status: "not_started" | "ai_draft" | "edited" | "review" | "confirmed" | "locked";
  order: number;
  content: Record<string, unknown>;
  sourceEntityRefs: SourceLink[];
  updatedAt: string;
};

export type SafetyManagementPlanSnapshot = {
  meta: SafetyManagementPlanMeta;
  projectSnapshot: SafetyManagementProjectSnapshot;
  variables: Record<string, unknown>;
  sections: SafetyManagementPlanSection[];
  missingFields: MissingField[];
  reviewWarnings: ReviewWarning[];
  sourceLinks: SourceLink[];
};

export type SafetyManagementPlanVersion = {
  id: string;
  planId: string;
  versionNo: number;
  contentSnapshot: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  changeSummary?: string | null;
};

export type SafetyManagementWorkType = {
  id: string;
  planId: string;
  name: string;
  description?: string | null;
  processOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SafetyManagementRiskItem = {
  id: string;
  planId: string;
  workTypeId?: string | null;
  workTypeName?: string | null;
  hazard: string;
  riskCause?: string | null;
  reductionMeasure: string;
  riskLevel: string;
  sourceType?: string | null;
  sourceId?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type SafetyOrganizationPlan = {
  planId: string;
  organizationChartFileId?: string | null;
  responsibilities: Array<{
    role: string;
    organizationId?: string | null;
    name?: string | null;
    responsibility: string;
  }>;
  updatedAt: string;
};

export type SafetyEducationPlan = {
  planId: string;
  items: Array<{
    educationType: string;
    target: string;
    cycle: string;
    content: string;
    recordMethod: string;
  }>;
  updatedAt: string;
};

export type SafetyEmergencyPlan = {
  planId: string;
  contacts: Array<{
    type: string;
    name?: string | null;
    phone?: string | null;
    organization?: string | null;
    note?: string | null;
  }>;
  updatedAt: string;
};

export type SafetyManagementPlanAttachment = {
  id: string;
  planId: string;
  fileId: string;
  fileName: string;
  storagePath: string;
  attachmentType: string;
  sourceLabel?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SafetyManagementExportJob = {
  id: string;
  planId: string;
  projectId: string;
  status: string;
  fileId?: string | null;
  storagePath?: string | null;
  createdAt: string;
  completedAt?: string | null;
};

export type SafetyManagementPlanListItem = {
  plan: SafetyManagementPlan;
  inspectionRoundName?: string | null;
  missingRequiredCount: number;
  warningCount: number;
  latestVersion?: SafetyManagementPlanVersion | null;
};

export type SafetyManagementPlanDetailResponse = {
  plan: SafetyManagementPlan;
  snapshot: SafetyManagementPlanSnapshot;
  sections: SafetyManagementPlanSection[];
  versions: SafetyManagementPlanVersion[];
  workTypes: SafetyManagementWorkType[];
  riskItems: SafetyManagementRiskItem[];
  organization?: SafetyOrganizationPlan | null;
  education?: SafetyEducationPlan | null;
  emergency?: SafetyEmergencyPlan | null;
  attachments: SafetyManagementPlanAttachment[];
  missingFields: MissingField[];
  warnings: ReviewWarning[];
  exportedFile?: FileAsset | null;
};

export type SafetyManagementPlanMutationResponse = {
  plan: SafetyManagementPlan;
  snapshot: SafetyManagementPlanSnapshot;
  warnings: ReviewWarning[];
  missingFields: MissingField[];
  version?: SafetyManagementPlanVersion | null;
};

export type SafetyManagementPlanValidationResponse = {
  planId: string;
  missingFields: MissingField[];
  warnings: ReviewWarning[];
  hasDanger: boolean;
};

export type SafetyManagementPlanExportResponse = {
  plan: SafetyManagementPlan;
  exportJob: SafetyManagementExportJob;
  fileAsset: FileAsset;
  version: SafetyManagementPlanVersion;
};

export type SafetyManagementWorkTypeMutationResponse = {
  workType: SafetyManagementWorkType;
  items: SafetyManagementWorkType[];
};

export type SafetyManagementRiskMutationResponse = {
  riskItem: SafetyManagementRiskItem;
  items: SafetyManagementRiskItem[];
};

export type SafetyManagementAttachmentMutationResponse = {
  attachment: SafetyManagementPlanAttachment;
  items: SafetyManagementPlanAttachment[];
};

export type SafetyHealthLedgerStatus =
  | "draft"
  | "review"
  | "confirmed"
  | "exported"
  | "archived";

export type SafetyHealthLedger = {
  id: string;
  projectId: string;
  templateId: string;
  title: string;
  status: SafetyHealthLedgerStatus;
  currentVersionNo: number;
  latestSnapshot?: Record<string, unknown> | null;
  exportedFileId?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

export type LedgerMeta = {
  projectId: string;
  projectName: string;
  siteName?: string | null;
  siteAddress?: string | null;
  constructionType?: string | null;
  ownerNames: string[];
  contractorName?: string | null;
  engineerName?: string | null;
  constructionStartDate?: string | null;
  constructionEndDate?: string | null;
  latestInspectionRoundNo?: number | null;
  latestUpdatedAt?: string | null;
  sourcePlanId?: string | null;
  draftWatermark: string;
};

export type SafetyHealthLedgerSection = {
  id: string;
  ledgerId: string;
  key:
    | "basic_info"
    | "project_summary"
    | "stakeholders"
    | "hazard_risk_register"
    | "risk_reduction_measures"
    | "design_stage_review"
    | "construction_stage_review"
    | "inspection_history"
    | "finding_history"
    | "corrective_action_history"
    | "safety_cost_history"
    | "attachments"
    | "revision_history";
  title: string;
  order: number;
  status: "not_started" | "ai_draft" | "edited" | "review" | "confirmed" | "locked";
  content: Record<string, unknown>;
  sourceLinks: SourceLink[];
  updatedAt: string;
};

export type LedgerRiskItem = {
  id: string;
  ledgerId: string;
  projectId: string;
  sourceType?: "safety_management_plan" | "checklist" | "finding" | "manual" | null;
  sourceId?: string | null;
  workType?: string | null;
  workDescription?: string | null;
  hazardDescription: string;
  riskType?: string | null;
  riskLevel?: "low" | "medium" | "high" | "critical" | null;
  reductionMeasureSummary?: string | null;
  responsibleOrganizationId?: string | null;
  relatedChecklistItemIds: string[];
  relatedFindingIds: string[];
  recurrenceCount: number;
  status: "identified" | "planned" | "in_control" | "needs_action" | "repeated" | "closed";
  firstDetectedAt?: string | null;
  lastDetectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LedgerRiskReductionMeasure = {
  id: string;
  ledgerId: string;
  riskItemId?: string | null;
  title: string;
  description: string;
  responsibleOrganizationId?: string | null;
  status: string;
  dueDate?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LedgerInspectionHistory = {
  id: string;
  ledgerId: string;
  projectId: string;
  inspectionRoundId: string;
  roundNo?: number | null;
  documentNo?: string | null;
  inspectionDate?: string | null;
  inspectorName?: string | null;
  ownerReportSubmittedCount: number;
  checklistSessionId?: string | null;
  checklistSummary?: string | null;
  cautionCount: number;
  badCount: number;
  findingCount: number;
  actionCompletedCount: number;
  openFindingCount: number;
  linkedReportIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type LedgerFindingHistory = {
  id: string;
  ledgerId: string;
  projectId: string;
  inspectionRoundId: string;
  findingId: string;
  correctiveActionId?: string | null;
  ownerPartyId?: string | null;
  title: string;
  riskType?: string | null;
  responsibleOrganizationId?: string | null;
  status: string;
  requiredAction?: string | null;
  actionDetail?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  recurrenceCount: number;
  reportInclude: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LedgerSafetyCostHistory = {
  id: string;
  ledgerId: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId: string;
  usageId: string;
  basisMonth?: string | null;
  calculatedAmount?: number | null;
  usedAmount?: number | null;
  usedRateCalculated?: number | null;
  appropriatenessStatus?: string | null;
  reportLinked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LedgerAttachment = {
  id: string;
  ledgerId: string;
  projectId: string;
  fileId: string;
  fileName: string;
  storagePath: string;
  attachmentType: string;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  sourceLabel?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SafetyHealthLedgerSnapshot = {
  meta: LedgerMeta;
  sections: SafetyHealthLedgerSection[];
  riskItems: LedgerRiskItem[];
  measures: LedgerRiskReductionMeasure[];
  inspectionHistory: LedgerInspectionHistory[];
  findingHistory: LedgerFindingHistory[];
  safetyCostHistory: LedgerSafetyCostHistory[];
  attachments: LedgerAttachment[];
  missingFields: MissingField[];
  reviewWarnings: ReviewWarning[];
  sourceLinks: SourceLink[];
};

export type SafetyHealthLedgerVersion = {
  id: string;
  ledgerId: string;
  versionNo: number;
  snapshot: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  changeSummary?: string | null;
};

export type SafetyHealthLedgerExportJob = {
  id: string;
  ledgerId: string;
  projectId: string;
  status: string;
  fileId?: string | null;
  storagePath?: string | null;
  createdAt: string;
  completedAt?: string | null;
};

export type SafetyHealthLedgerListItem = {
  ledger: SafetyHealthLedger;
  missingRequiredCount: number;
  warningCount: number;
  latestVersion?: SafetyHealthLedgerVersion | null;
};

export type SafetyHealthLedgerDetailResponse = {
  ledger: SafetyHealthLedger;
  snapshot: SafetyHealthLedgerSnapshot;
  sections: SafetyHealthLedgerSection[];
  versions: SafetyHealthLedgerVersion[];
  riskItems: LedgerRiskItem[];
  measures: LedgerRiskReductionMeasure[];
  inspectionHistory: LedgerInspectionHistory[];
  findingHistory: LedgerFindingHistory[];
  safetyCostHistory: LedgerSafetyCostHistory[];
  attachments: LedgerAttachment[];
  missingFields: MissingField[];
  warnings: ReviewWarning[];
  exportedFile?: FileAsset | null;
};

export type SafetyHealthLedgerMutationResponse = {
  ledger: SafetyHealthLedger;
  snapshot: SafetyHealthLedgerSnapshot;
  warnings: ReviewWarning[];
  missingFields: MissingField[];
  version?: SafetyHealthLedgerVersion | null;
};

export type SafetyHealthLedgerValidationResponse = {
  ledgerId: string;
  missingFields: MissingField[];
  warnings: ReviewWarning[];
  hasDanger: boolean;
};

export type SafetyHealthLedgerExportResponse = {
  ledger: SafetyHealthLedger;
  exportJob: SafetyHealthLedgerExportJob;
  fileAsset: FileAsset;
  version: SafetyHealthLedgerVersion;
};

export type LedgerRiskMutationResponse = {
  riskItem: LedgerRiskItem;
  items: LedgerRiskItem[];
  snapshot?: SafetyHealthLedgerSnapshot;
};

export type LedgerMeasureMutationResponse = {
  measure: LedgerRiskReductionMeasure;
  items: LedgerRiskReductionMeasure[];
  snapshot?: SafetyHealthLedgerSnapshot;
};

export type LedgerAttachmentMutationResponse = {
  attachment: LedgerAttachment;
  items: LedgerAttachment[];
  snapshot?: SafetyHealthLedgerSnapshot;
};

export type LedgerSyncResponse = {
  createdCount: number;
  items: Array<Record<string, unknown>>;
  version?: SafetyHealthLedgerVersion | null;
  snapshot?: SafetyHealthLedgerSnapshot;
};

export type ProjectRequirementStatus = {
  projectId: string;
  forSafetyReport: MissingField[];
  forContract: MissingField[];
  forInspectionRound: MissingField[];
  forMailSubmission: MissingField[];
  warnings: string[];
};

export type ProjectActivityLog = {
  id: string;
  projectId: string;
  action: string;
  summary: string;
  fieldNames: string[];
  createdAt: string;
};

export type ProjectListItem = {
  project: Project;
  ownerNames: string[];
  contractorNames: string[];
  relatedCounts: ProjectRelatedCounts;
  nextInspectionDate?: string | null;
  lastActivity?: string | null;
};

export type ProjectAggregateResponse = {
  project: Project;
  organizations: Organization[];
  projectParties: ProjectParty[];
  contacts: Contact[];
  inspectionRounds: InspectionRound[];
  relatedCounts: ProjectRelatedCounts;
  activityLogs: ProjectActivityLog[];
};

export type ProjectSummaryResponse = {
  projectId: string;
  projectName: string;
  siteAddress: string;
  status: ProjectStatus;
  progressRate?: number | null;
  totalAmount?: number | null;
  inspectionCycleText?: string | null;
  totalInspectionRounds?: number | null;
  ownerCount: number;
  reportTargetOwnerCount: number;
  nextInspectionDate?: string | null;
  relatedCounts: ProjectRelatedCounts;
};

export type OrganizationMutationResponse = {
  organization: Organization;
  warnings: string[];
};

export type ProjectMutationResponse = {
  project?: Project;
  warnings?: string[];
  activityLog?: ProjectActivityLog;
  pendingEvents?: string[];
  archivedBecause?: string;
  deleted?: boolean;
  deletedBecause?: string;
};

export type ProjectPartyMutationResponse = {
  projectParty: ProjectParty;
  warnings: string[];
  activityLog?: ProjectActivityLog;
};

export type ContactMutationResponse = {
  contact: Contact;
  warnings: string[];
  activityLog?: ProjectActivityLog;
};

export type ProjectPartyWithOrganization = ProjectParty & {
  organization: Organization | null;
};

export type ContactWithOrganization = Contact & {
  organization: Organization | null;
};

export type ProjectPartyShareCalculationResponse = {
  projectId: string;
  shareRatioSum: number;
  shareAmountSum: number;
  warnings: string[];
};

export type ExtractedProject = {
  projectName?: string | null;
  siteName?: string | null;
  siteAddress?: string | null;
  constructionType?: string | null;
  constructionDescription?: string | null;
  totalAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  actualStartDate?: string | null;
  progressRate?: number | null;
  inspectionCycleText?: string | null;
  totalInspectionRounds?: number | null;
  status?: ProjectStatus | null;
  memo?: string | null;
};

export type ExtractedOrganization = {
  name: string;
  type: OrganizationType;
  representativeName?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type ExtractedProjectParty = {
  organizationName: string;
  role: ProjectPartyRole;
  shareRatio?: number | null;
  shareAmount?: number | null;
  requiresSeparateReport?: boolean | null;
  reportRecipient?: boolean | null;
  invoiceRecipient?: boolean | null;
};

export type ExtractedContact = {
  organizationName: string;
  name: string;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  roleDescription?: string | null;
  receivesReport: boolean;
  receivesActionRequest: boolean;
};

export type ProjectExtractionResult = {
  project: ExtractedProject;
  organizations: ExtractedOrganization[];
  projectParties: ExtractedProjectParty[];
  contacts: ExtractedContact[];
  warnings: string[];
  isDraft: boolean;
};

export type ProjectExtractionValidationResult = {
  projectId: string;
  warnings: string[];
  isDraft: boolean;
};

export type ApiClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export type ContractStatus = "draft" | "sent" | "signed" | "archived";
export type ContractPartyRole =
  | "client"
  | "client_1"
  | "client_2"
  | "contractor"
  | "service_provider"
  | "payer"
  | "observer";
export type PaymentTermStatus =
  | "planned"
  | "requested"
  | "paid"
  | "overdue"
  | "cancelled";
export type EstimateStatus = "draft" | "sent" | "accepted" | "rejected" | "converted";

export type PaymentSplitItem = {
  organizationId: string;
  projectPartyId?: string | null;
  label: string;
  ratio: number;
  amount: number;
};

export type PaymentTerm = {
  id: string;
  contractId: string;
  label: string;
  triggerText: string;
  dueDate?: string | null;
  amount: number;
  ratio?: number | null;
  status: PaymentTermStatus;
  requestDate?: string | null;
  paidDate?: string | null;
  evidenceFileId?: string | null;
  splitItems: PaymentSplitItem[];
  createdAt: string;
  updatedAt: string;
};

export type Contract = {
  id: string;
  projectId: string;
  contractNo?: string | null;
  contractTitle: string;
  contractType: string;
  serviceName: string;
  serviceScope: string;
  contractAmount: number;
  vatIncluded: boolean;
  vatAmount?: number | null;
  supplyAmount?: number | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  constructionStartDate?: string | null;
  constructionEndDate?: string | null;
  deliverables: string[];
  inspectionCount?: number | null;
  paymentSummary?: string | null;
  status: ContractStatus;
  finalFileId?: string | null;
  signedFileId?: string | null;
  latestVersionId?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

export type ContractParty = {
  id: string;
  contractId: string;
  organizationId: string;
  projectPartyId?: string | null;
  role: ContractPartyRole;
  displayName: string;
  representativeName?: string | null;
  businessNumber?: string | null;
  address?: string | null;
  phone?: string | null;
  shareRatio?: number | null;
  shareAmount?: number | null;
  paymentRequired: boolean;
  signingRequired: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ContractVersion = {
  id: string;
  contractId: string;
  versionNo: number;
  draftText: string;
  templateKey: string;
  isDraft: boolean;
  missingFields: string[];
  createdAt: string;
};

export type ContractChange = {
  id: string;
  contractId: string;
  summary: string;
  changedFields: string[];
  createdAt: string;
};

export type FileAsset = {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  linkedEntityType: string;
  linkedEntityId: string;
  createdAt: string;
  folderId?: string | null;
  ownerPartyId?: string | null;
  inspectionRoundId?: string | null;
  originalFileName?: string | null;
  extension?: string | null;
  mimeType?: string | null;
  sizeBytes?: number;
  storageKey?: string | null;
  checksum?: string | null;
  source?: WebhardFileSource;
  status?: WebhardFileAssetStatus;
  tags?: string[];
  currentVersionId?: string | null;
  previewStatus?: "none" | "processing" | "ready" | "failed";
  uploadedBy?: string | null;
  updatedAt?: string;
  isLocked?: boolean;
};

export type FolderType =
  | "project_root"
  | "contract"
  | "owner_material"
  | "contractor_material"
  | "schedule"
  | "inspection"
  | "site_photo"
  | "draft_report"
  | "review_report"
  | "final_report"
  | "mail_attachment"
  | "trash"
  | "custom";

export type Folder = {
  id: string;
  projectId?: string | null;
  parentFolderId?: string | null;
  name: string;
  type: FolderType;
  path: string;
  displayOrder: number;
  isSystem: boolean;
  isArchived: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WebhardFolderNode = {
  folder: Folder;
  children: WebhardFolderNode[];
};

export type WebhardFileAssetStatus =
  | "active"
  | "archived"
  | "deleted"
  | "locked"
  | "processing"
  | "failed";

export type WebhardFileSource =
  | "upload"
  | "mail_attachment"
  | "generated_document"
  | "photo_capture"
  | "external_link"
  | "system";

export type FileVersionKind =
  | "original"
  | "working"
  | "review"
  | "final"
  | "signed"
  | "submitted"
  | "archived";

export type FileVersion = {
  id: string;
  fileId: string;
  versionNo: number;
  versionKind: FileVersionKind;
  fileName: string;
  storageKey: string;
  sizeBytes: number;
  checksum?: string | null;
  changeSummary?: string | null;
  createdBy?: string | null;
  createdAt: string;
};

export type FileEntityLink = {
  id: string;
  fileId: string;
  projectId?: string | null;
  entityType:
    | "project"
    | "contract"
    | "inspection_round"
    | "checklist_session"
    | "finding"
    | "corrective_action"
    | "evidence_photo"
    | "document_instance"
    | "safety_cost_usage"
    | "mail_message"
    | "submission"
    | "approval";
  entityId: string;
  relationType:
    | "source"
    | "attachment"
    | "exported_file"
    | "evidence"
    | "photo"
    | "final_output"
    | "signed_copy";
  createdAt: string;
};

export type ShareLinkPermission = "view" | "download" | "view_and_download";

export type ShareLink = {
  id: string;
  fileId?: string | null;
  folderId?: string | null;
  projectId?: string | null;
  tokenHash: string;
  title?: string | null;
  permission: ShareLinkPermission;
  expiresAt?: string | null;
  passwordHash?: string | null;
  isRevoked: boolean;
  createdBy?: string | null;
  createdAt: string;
  revokedAt?: string | null;
};

export type ShareLinkAccessLog = {
  id: string;
  shareLinkId: string;
  accessedAt: string;
  ipHash?: string | null;
  userAgent?: string | null;
  action: "view" | "download" | "denied" | "expired";
};

export type FileActivity = {
  id: string;
  fileId?: string | null;
  folderId?: string | null;
  projectId?: string | null;
  activityType:
    | "uploaded"
    | "downloaded"
    | "previewed"
    | "renamed"
    | "moved"
    | "copied"
    | "tagged"
    | "linked"
    | "unlinked"
    | "version_added"
    | "shared"
    | "share_revoked"
    | "archived"
    | "deleted"
    | "restored"
    | "locked";
  actorId?: string | null;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type FileClassificationSuggestion = {
  id: string;
  fileId: string;
  recommendedFolderId?: string | null;
  recommendedFolderPath?: string | null;
  recommendedTags: string[];
  recommendedEntityType?: string | null;
  recommendedEntityId?: string | null;
  confidence: number;
  needsConfirmation: boolean;
  rationale: string;
  createdAt: string;
};

export type StorageObject = {
  id: string;
  storageKey: string;
  absolutePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type UploadSession = {
  id: string;
  projectId: string;
  folderId: string;
  status: string;
  fileNames: string[];
  createdAt: string;
  completedAt?: string | null;
};

export type MailMessage = {
  id: string;
  projectId: string;
  threadId?: string | null;
  providerMessageId?: string | null;
  inspectionRoundId?: string | null;
  ownerPartyId?: string | null;
  subject?: string | null;
  fromAddress?: string | null;
  toAddresses?: string[];
  ccAddresses?: string[];
  bodyText?: string | null;
  direction?: "inbound" | "outbound";
  folder?: string;
  status?: string;
  isRead?: boolean;
  documentId?: string | null;
  submissionId?: string | null;
  receivedAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
};

export type FolderMutationResponse = {
  folder: Folder;
  tree?: WebhardFolderNode[];
};

export type FileMutationResponse = {
  file: FileAsset;
  currentVersion?: FileVersion | null;
  activity?: FileActivity | null;
  suggestion?: FileClassificationSuggestion | null;
};

export type FileDetailResponse = {
  file: FileAsset;
  folder?: Folder | null;
  versions: FileVersion[];
  links: FileEntityLink[];
  shareLinks: ShareLink[];
  activities: FileActivity[];
  suggestion?: FileClassificationSuggestion | null;
};

export type FileVersionMutationResponse = {
  file: FileAsset;
  version: FileVersion;
  versions: FileVersion[];
  activity?: FileActivity | null;
};

export type ShareLinkMutationResponse = {
  shareLink: ShareLink;
  publicUrl: string;
  activity?: FileActivity | null;
};

export type FileLinkMutationResponse = {
  link: FileEntityLink;
  links: FileEntityLink[];
  activity?: FileActivity | null;
};

export type FileClassificationResponse = {
  fileId: string;
  suggestion: FileClassificationSuggestion;
};

export type PublicShareResponse = {
  shareLink: ShareLink;
  file?: FileAsset | null;
  folder?: Folder | null;
  files: FileAsset[];
  accessLog?: ShareLinkAccessLog | null;
  downloadAllowed: boolean;
};

export type MailAttachmentSaveSuggestionResponse = {
  projectId: string;
  folder: Folder;
  suggestedTags: string[];
  linkedEntityType: string;
  linkedEntityId: string;
};

export type MailAttachmentSaveResponse = {
  file: FileAsset;
  link: FileEntityLink;
  activity?: FileActivity | null;
};

export type WebhardSearchResponse = {
  items: FileAsset[];
  totalCount: number;
};

export type WebhardStorageUsageResponse = {
  totalFiles: number;
  activeFiles: number;
  deletedFiles: number;
  lockedFiles: number;
  totalSizeBytes: number;
  projectId?: string | null;
};

export type MailThread = {
  id: string;
  projectId: string;
  providerThreadId?: string | null;
  inspectionRoundId?: string | null;
  ownerPartyId?: string | null;
  subject: string;
  participantContactIds: string[];
  linkedFindingIds: string[];
  status?: string;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MailAccount = {
  id: string;
  provider: string;
  mode: "guest_draft_mode" | "connected_oauth_mode";
  email: string;
  displayName: string;
  projectId?: string | null;
  status: string;
  isConnected: boolean;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MailAttachment = {
  id: string;
  messageId: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  savedFileId?: string | null;
  linkedFileId?: string | null;
  createdAt: string;
};

export type MailEntityLink = {
  id: string;
  projectId: string;
  threadId?: string | null;
  messageId?: string | null;
  entityType: string;
  entityId: string;
  relationType: string;
  confirmed: boolean;
  createdAt: string;
};

export type MailDraft = {
  id: string;
  draftType: string;
  mode: "guest_draft_mode" | "connected_oauth_mode";
  projectId?: string | null;
  inspectionRoundId?: string | null;
  ownerPartyId?: string | null;
  documentId?: string | null;
  submissionId?: string | null;
  findingIds: string[];
  contractId?: string | null;
  estimateId?: string | null;
  accountId?: string | null;
  threadId?: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  body: string;
  attachmentFileIds: string[];
  templateId?: string | null;
  aiDraftText?: string | null;
  validationWarnings: string[];
  createdAt: string;
  updatedAt: string;
  sentAt?: string | null;
};

export type MailTemplate = {
  id: string;
  name: string;
  templateType: string;
  subjectTemplate: string;
  bodyTemplate: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
};

export type MailSignature = {
  id: string;
  label: string;
  content: string;
  accountId?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MailSyncJob = {
  id: string;
  accountId: string;
  status: string;
  summary: string;
  startedAt: string;
  completedAt?: string | null;
};

export type MailThreadDetailResponse = {
  thread: MailThread;
  messages: MailMessage[];
  attachments: MailAttachment[];
  links: MailEntityLink[];
};

export type MailThreadListItem = {
  thread: MailThread;
  latestMessage?: MailMessage | null;
  unreadCount: number;
  links: MailEntityLink[];
};

export type MailMessageDetailResponse = {
  message: MailMessage;
  attachments: MailAttachment[];
  links: MailEntityLink[];
};

export type MailDraftValidationResponse = {
  draftId: string;
  recipientsValid: boolean;
  missingFields: string[];
  warnings: string[];
  sendBlocked: boolean;
  draft: MailDraft;
};

export type MailDraftMutationResponse = {
  draft?: MailDraft | null;
  mailThread?: MailThread | null;
  message?: MailMessage | null;
  submission?: Submission | null;
  document?: DocumentInstance | null;
  ownerReportTask?: InspectionOwnerReportTask | null;
  sendMode?: string | null;
  warnings: string[];
  auditLog?: AuditLog | null;
};

export type MailAttachmentMutationResponse = {
  attachment: MailAttachment;
  file?: FileAsset | null;
  version?: FileVersion | null;
  link?: FileEntityLink | null;
  activity?: FileActivity | null;
  auditLog?: AuditLog | null;
};

export type MailSyncResponse = {
  account: MailAccount;
  job: MailSyncJob;
  threads: MailThread[];
  messages: MailMessage[];
  auditLog?: AuditLog | null;
};

export type MailTemplateMutationResponse = {
  template: MailTemplate;
};

export type MailSignatureMutationResponse = {
  signature: MailSignature;
};

export type Submission = {
  id: string;
  documentId: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId: string;
  exportedFileId: string;
  mailThreadId: string;
  submittedAt: string;
  status: string;
  packageId?: string | null;
  channel?: string | null;
  finalFileId?: string | null;
  externalReference?: string | null;
  memo?: string | null;
  receiptConfirmedAt?: string | null;
  revisionRequestedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContractFileLink = {
  id: string;
  fileId: string;
  contractId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  fileCategory: string;
  isFinal: boolean;
  isSigned: boolean;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  fieldNames: string[];
  createdAt: string;
};

export type ApprovalWorkflow = {
  id: string;
  documentId: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId: string;
  title: string;
  status: string;
  templateId?: string | null;
  currentStepOrder: number;
  requestedBy?: string | null;
  requestedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalStep = {
  id: string;
  workflowId: string;
  stepOrder: number;
  role: string;
  assigneeUserId?: string | null;
  assigneeLabel?: string | null;
  status: string;
  required: boolean;
  actedAt?: string | null;
  comment?: string | null;
  delegatedToUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalComment = {
  id: string;
  workflowId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
  stepId?: string | null;
};

export type ApprovalTemplate = {
  id: string;
  name: string;
  documentType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalTemplateStep = {
  id: string;
  templateId: string;
  stepOrder: number;
  role: string;
  required: boolean;
  defaultAssigneeLabel?: string | null;
};

export type SignatureAsset = {
  id: string;
  label: string;
  assetType: string;
  fileId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type SignatureTask = {
  id: string;
  documentId: string;
  projectId: string;
  ownerPartyId: string;
  taskType: string;
  title: string;
  status: string;
  required: boolean;
  signatureAssetId?: string | null;
  signedFileId?: string | null;
  waivedReason?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinalDocumentPackage = {
  id: string;
  documentId: string;
  projectId: string;
  ownerPartyId: string;
  mainFileId: string;
  signedFileId?: string | null;
  attachmentFileIds: string[];
  status: string;
  finalizedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionAttachment = {
  id: string;
  submissionId: string;
  fileId: string;
  label: string;
  attachmentType: string;
  createdAt: string;
};

export type SubmissionRecipient = {
  id: string;
  submissionId: string;
  name: string;
  email: string;
  ownerPartyId?: string | null;
  organizationName?: string | null;
  roleLabel?: string | null;
  createdAt: string;
};

export type SubmissionValidationWarning = {
  code: string;
  message: string;
  severity: string;
  field?: string | null;
};

export type SubmissionStatusEvent = {
  id: string;
  submissionId: string;
  status: string;
  summary: string;
  createdAt: string;
};

export type ApprovalListItem = {
  workflow: ApprovalWorkflow;
  document: DocumentInstance;
  currentStep?: ApprovalStep | null;
  pendingRequiredCount: number;
};

export type ApprovalWorkflowDetailResponse = {
  workflow?: ApprovalWorkflow | null;
  document: DocumentInstance;
  steps: ApprovalStep[];
  comments: ApprovalComment[];
  auditLogs: AuditLog[];
};

export type ApprovalMutationResponse = ApprovalWorkflowDetailResponse & {
  auditLog?: AuditLog | null;
};

export type SignatureTaskListResponse = {
  document: DocumentInstance;
  tasks: SignatureTask[];
};

export type SignatureTaskMutationResponse = {
  task: SignatureTask;
  tasks: SignatureTask[];
};

export type SignatureAssetMutationResponse = {
  signatureAsset: SignatureAsset;
};

export type SubmissionReadinessResponse = {
  document: DocumentInstance;
  workflow?: ApprovalWorkflow | null;
  signatureTasks: SignatureTask[];
  package?: FinalDocumentPackage | null;
  warnings: SubmissionValidationWarning[];
  ready: boolean;
};

export type SubmissionPackageMutationResponse = {
  package: FinalDocumentPackage;
  warnings: SubmissionValidationWarning[];
  ready?: boolean;
};

export type SubmissionDetailResponse = {
  submission: Submission;
  document: DocumentInstance;
  package?: FinalDocumentPackage | null;
  recipients: SubmissionRecipient[];
  attachments: SubmissionAttachment[];
  events: SubmissionStatusEvent[];
  auditLogs: AuditLog[];
};

export type SubmissionMutationResponse = SubmissionDetailResponse & {
  mailThread?: MailThread | null;
  mailMessage?: MailMessage | null;
  event?: SubmissionStatusEvent | null;
  auditLog?: AuditLog | null;
};

export type ApprovalTemplateDetailResponse = {
  template: ApprovalTemplate;
  steps: ApprovalTemplateStep[];
};

export type EstimateItem = {
  id: string;
  label: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
};

export type Estimate = {
  id: string;
  projectId: string;
  estimateNo?: string | null;
  title: string;
  serviceName: string;
  validUntil?: string | null;
  status: EstimateStatus;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  items: EstimateItem[];
  finalFileId?: string | null;
  createdAt: string;
  updatedAt: string;
  convertedContractId?: string | null;
};

export type ContractListItem = {
  contract: Contract;
  clientNames: string[];
  paymentTermCount: number;
  versionCount: number;
  warnings: string[];
};

export type ContractDetailResponse = {
  contract: Contract;
  project: Project;
  parties: Array<ContractParty & { organization: Organization | null }>;
  paymentTerms: PaymentTerm[];
  versions: ContractVersion[];
  changes: ContractChange[];
  files: ContractFileLink[];
  auditLogs: AuditLog[];
  warnings: string[];
};

export type ContractMutationResponse = {
  contract: Contract;
  warnings?: string[];
  auditLog?: AuditLog;
};

export type ContractPartyMutationResponse = {
  contractParty: ContractParty;
  warnings: string[];
};

export type PaymentTermMutationResponse = {
  paymentTerm: PaymentTerm;
  warnings: string[];
};

export type ContractPreviewResponse = {
  contractId: string;
  templateKey: string;
  draftText: string;
  missingFields: string[];
  warnings: string[];
  isDraft: boolean;
};

export type ContractGenerateResponse = {
  version: ContractVersion;
  warnings: string[];
  auditLog: AuditLog;
};

export type ContractExportResponse = {
  contractId: string;
  latestVersionId: string;
  file: ContractFileLink;
  usedLatestVersion: boolean;
};

export type PaymentSplitCalculationResponse = {
  contractId: string;
  paymentTermAmount: number;
  splitItems: PaymentSplitItem[];
  warnings: string[];
  totalRatio: number;
  totalAmount: number;
};

export type ContractFileMutationResponse = {
  contract?: Contract;
  file: ContractFileLink;
};

export type EstimateListItem = {
  estimate: Estimate;
  itemCount: number;
};

export type EstimateMutationResponse = {
  estimate: Estimate;
  contract?: Contract;
};

export type EstimateDraftResponse = {
  estimateId: string;
  draftText: string;
  isDraft: boolean;
};

export type EstimateExportResponse = {
  estimateId: string;
  fileName: string;
  isDraft: boolean;
};

export type InspectionSchedulePreviewResponse = {
  projectId: string;
  scheduleDraft: {
    scheduleName: string;
    basisType: InspectionScheduleBasisType;
    cycleText: string;
    totalRounds: number;
    contractId?: string | null;
  };
  rounds: Array<{
    roundNo: number;
    name: string;
    plannedMonth?: string | null;
    plannedDate?: string | null;
    actualInspectionDate?: string | null;
    documentNo: string;
    milestoneLabel?: string | null;
    reportDueDate?: string | null;
    status: InspectionRoundStatus;
  }>;
  ownerReportTasks: Array<{
    roundNo: number;
    ownerPartyId: string;
    status: OwnerReportTaskStatus;
  }>;
  warnings: string[];
  isDraft: boolean;
};

export type InspectionScheduleMutationResponse = {
  schedule: InspectionSchedule;
  rounds?: InspectionRound[];
  ownerReportTasks?: InspectionOwnerReportTask[];
  tasks?: InspectionTask[];
  warnings: string[];
  isDraft?: boolean;
};

export type InspectionRoundListItem = {
  round: InspectionRound;
  ownerReportTasks: InspectionOwnerReportTask[];
  openTaskCount: number;
  reportTargetCount: number;
  warnings: string[];
};

export type InspectionRoundDetailResponse = {
  round: InspectionRound;
  project: Project;
  schedule?: InspectionSchedule | null;
  ownerReportTasks: InspectionOwnerReportTask[];
  tasks: InspectionTask[];
  attachments: WorkScheduleAttachment[];
  rescheduleLogs: InspectionRescheduleLog[];
  auditLogs: AuditLog[];
  milestone?: InspectionRoundMilestone | null;
  warnings: string[];
};

export type InspectionRoundMutationResponse = {
  round: InspectionRound;
  warnings: string[];
  auditLog?: AuditLog;
};

export type InspectionOwnerReportTaskMutationResponse = {
  ownerReportTask: InspectionOwnerReportTask;
  warnings: string[];
};

export type InspectionTaskMutationResponse = {
  task: InspectionTask;
  warnings: string[];
};

export type WorkScheduleAttachmentMutationResponse = {
  attachment: WorkScheduleAttachment;
  warnings: string[];
};

export type InspectionRescheduleMutationResponse = {
  round: InspectionRound;
  rescheduleLog: InspectionRescheduleLog;
  warnings: string[];
};

export type InspectionCalendarRoundsResponse = {
  dateFrom?: string | null;
  dateTo?: string | null;
  rounds: InspectionRoundListItem[];
};

export type InspectionCalendarTasksResponse = {
  dateFrom?: string | null;
  dateTo?: string | null;
  tasks: InspectionTask[];
};

export type ChecklistTemplateStatus = "draft" | "published" | "archived";
export type ChecklistCategoryKey =
  | "common"
  | "architecture_civil"
  | "construction_machine"
  | "risk_reduction"
  | "additional_hazard"
  | "custom";
export type ChecklistSessionStatus =
  | "not_started"
  | "in_progress"
  | "paused"
  | "completed"
  | "reviewed"
  | "locked";
export type ChecklistResultValue =
  | "not_checked"
  | "good"
  | "caution"
  | "bad"
  | "not_applicable";
export type FindingCandidateStatus =
  | "candidate"
  | "accepted"
  | "dismissed"
  | "converted";

export type FindingStatus =
  | "open"
  | "action_requested"
  | "action_submitted"
  | "verification_requested"
  | "verified"
  | "closed"
  | "rejected"
  | "cancelled";

export type FindingRiskType =
  | "fall"
  | "electric"
  | "fire"
  | "struck_by"
  | "caught_between"
  | "chemical"
  | "health"
  | "equipment"
  | "document"
  | "other";

export type CorrectiveActionStatus =
  | "draft"
  | "submitted"
  | "verification_requested"
  | "verified"
  | "rejected"
  | "cancelled";

export type EvidencePhotoType =
  | "finding_photo"
  | "action_photo"
  | "site_context_photo"
  | "detail_photo"
  | "schedule_photo"
  | "other";

export type PhotoLedgerStatus = "draft" | "review" | "confirmed" | "exported";

export type ChecklistTemplate = {
  id: string;
  name: string;
  description?: string | null;
  projectType?: string | null;
  documentType: string;
  version: string;
  status: ChecklistTemplateStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistCategory = {
  id: string;
  templateId: string;
  key: ChecklistCategoryKey;
  title: string;
  displayOrder: number;
};

export type ChecklistItem = {
  id: string;
  templateId: string;
  categoryId: string;
  categoryKey: ChecklistCategoryKey;
  discipline?: string | null;
  title: string;
  detail?: string | null;
  reportLabel?: string | null;
  defaultApplicability: boolean;
  isRequired: boolean;
  findingRequiredWhen: string;
  sourceSectionKey?: string | null;
  displayOrder: number;
};

export type ChecklistSession = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId?: string | null;
  templateId: string;
  templateVersion: string;
  inspectorUserId?: string | null;
  inspectionDate?: string | null;
  status: ChecklistSessionStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  reviewedAt?: string | null;
  lockedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  resultCount?: number;
  completedCount?: number;
  progressRate?: number;
};

export type ChecklistResult = {
  id: string;
  sessionId: string;
  projectId: string;
  inspectionRoundId: string;
  checklistItemId: string;
  result: ChecklistResultValue;
  comment?: string | null;
  reportComment?: string | null;
  actionRequired: boolean;
  responsiblePartyId?: string | null;
  dueDate?: string | null;
  photoIds: string[];
  findingCandidateId?: string | null;
  findingId?: string | null;
  reportMappingStatus: "not_mapped" | "mapped" | "excluded";
  createdAt: string;
  updatedAt: string;
  item?: ChecklistItem;
};

export type FindingCandidate = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  sessionId: string;
  checklistResultId: string;
  title: string;
  detail: string;
  riskType?: string | null;
  requiredAction: string;
  status: FindingCandidateStatus;
  convertedFindingId?: string | null;
  dismissedReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Finding = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId?: string | null;
  title: string;
  detail: string;
  riskType?: FindingRiskType | null;
  requiredAction: string;
  responsiblePartyId?: string | null;
  dueDate?: string | null;
  status: FindingStatus;
  sourceType?: string | null;
  sourceId?: string | null;
  checklistResultId?: string | null;
  additionalHazardItemId?: string | null;
  riskReductionItemId?: string | null;
  reportInclude: boolean;
  reportOrder?: number | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CorrectiveAction = {
  id: string;
  findingId: string;
  projectId: string;
  inspectionRoundId: string;
  actionDetail: string;
  actionDate?: string | null;
  actionOrganizationId?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  verificationComment?: string | null;
  rejectedReason?: string | null;
  status: CorrectiveActionStatus;
  createdAt: string;
  updatedAt: string;
};

export type PhotoMarkupShape = {
  id: string;
  shapeType: string;
  x: number;
  y: number;
  width?: number | null;
  height?: number | null;
  color: string;
  strokeStyle: string;
  text?: string | null;
};

export type PhotoMarkupInfo = {
  id: string;
  photoId: string;
  shapes: PhotoMarkupShape[];
  createdAt: string;
  updatedAt: string;
};

export type EvidencePhoto = {
  id: string;
  projectId: string;
  inspectionRoundId?: string | null;
  ownerPartyId?: string | null;
  findingId?: string | null;
  correctiveActionId?: string | null;
  fileId: string;
  photoType: EvidencePhotoType;
  fileName: string;
  storagePath: string;
  caption?: string | null;
  takenAt?: string | null;
  uploadedBy?: string | null;
  representative: boolean;
  reportInclude: boolean;
  markupInfo?: PhotoMarkupInfo | null;
  createdAt: string;
  updatedAt: string;
};

export type PhotoLedger = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId?: string | null;
  documentId?: string | null;
  title: string;
  status: PhotoLedgerStatus;
  layoutMode: "one_entry_per_page" | "two_entries_per_page";
  createdAt: string;
  updatedAt: string;
  syncedAt?: string | null;
};

export type PhotoLedgerEntry = {
  id: string;
  photoLedgerId: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId?: string | null;
  findingId: string;
  correctiveActionId?: string | null;
  findingPhotoId?: string | null;
  actionPhotoId?: string | null;
  findingCaption?: string | null;
  actionCaption?: string | null;
  displayOrder: number;
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PhotoLedgerWarning = {
  id: string;
  photoLedgerId: string;
  entryId?: string | null;
  code: string;
  severity: "info" | "warning" | "danger";
  message: string;
  createdAt: string;
};

export type FindingTimelineEvent = {
  id: string;
  findingId: string;
  eventType: string;
  summary: string;
  createdAt: string;
};

export type ActionRequestMailDraft = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  findingIds: string[];
  ownerPartyId?: string | null;
  contractorContactId?: string | null;
  subject: string;
  body: string;
  attachmentFileIds: string[];
  mailThreadId?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RiskReductionChecklistItem = {
  id: string;
  sessionId: string;
  no: number;
  field: string;
  workType: string;
  contractorPlan?: string | null;
  checkPoint?: string | null;
  result: ChecklistResultValue;
  implementationStatus: string;
  note?: string | null;
  photoIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdditionalHazardItem = {
  id: string;
  sessionId: string;
  no: number;
  hazardDescription: string;
  contractorPlan?: string | null;
  checkPoint?: string | null;
  implementationStatus: string;
  note?: string | null;
  photoIds: string[];
  findingCandidateId?: string | null;
  findingId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistPhoto = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  sessionId: string;
  checklistResultId?: string | null;
  additionalHazardId?: string | null;
  fileId: string;
  fileName: string;
  storagePath: string;
  caption?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistMobileDraft = {
  id: string;
  sessionId: string;
  clientVersion: number;
  draftVersion: number;
  payload: Record<string, unknown>;
  conflictDetected: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistReportMapping = {
  id: string;
  sessionId: string;
  documentId?: string | null;
  sourceSectionKey: string;
  reportLabel: string;
  rowSummary: string;
  stale: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistSessionDetailResponse = {
  session: ChecklistSession;
  template: ChecklistTemplate;
  categories: ChecklistCategory[];
  results: ChecklistResult[];
  findingCandidates: FindingCandidate[];
  riskReductionItems: RiskReductionChecklistItem[];
  additionalHazards: AdditionalHazardItem[];
  photos: ChecklistPhoto[];
  reportMappings: ChecklistReportMapping[];
  mobileDrafts: ChecklistMobileDraft[];
  auditLogs: AuditLog[];
  warnings: string[];
};

export type ChecklistTemplateDetailResponse = {
  template: ChecklistTemplate;
  categories: ChecklistCategory[];
  items: ChecklistItem[];
};

export type ChecklistTemplateMutationResponse = {
  template: ChecklistTemplate;
  warnings: string[];
};

export type ChecklistItemMutationResponse = {
  item: ChecklistItem;
  warnings: string[];
};

export type ChecklistSessionMutationResponse = {
  session: ChecklistSession;
  results?: ChecklistResult[];
  riskReductionItems?: RiskReductionChecklistItem[];
  auditLog?: AuditLog;
  warnings: string[];
};

export type ChecklistResultMutationResponse = {
  result: ChecklistResult;
  warnings: string[];
};

export type ChecklistValidationResponse = {
  sessionId: string;
  missingRequiredItems: string[];
  warnings: string[];
  isValid: boolean;
};

export type FindingCandidateMutationResponse = {
  findingCandidate: FindingCandidate;
  finding?: Finding;
  warnings: string[];
};

export type ChecklistPhotoMutationResponse = {
  photo: ChecklistPhoto;
  warnings: string[];
};

export type AdditionalHazardMutationResponse = {
  additionalHazard: AdditionalHazardItem;
  warnings: string[];
};

export type ChecklistReportMappingResponse = {
  sessionId: string;
  reportMappings: ChecklistReportMapping[];
  warnings?: string[];
};

export type ChecklistMobileDraftMutationResponse = {
  mobileDraft: ChecklistMobileDraft;
  warnings?: string[];
};

export type FindingListItem = {
  finding: Finding;
  ownerDisplayName?: string | null;
  responsibleOrganizationName?: string | null;
  findingPhotoCount: number;
  actionPhotoCount: number;
  correctiveActionStatus?: CorrectiveActionStatus | null;
  warnings: string[];
};

export type FindingDetailResponse = {
  finding: Finding;
  correctiveActions: CorrectiveAction[];
  photos: EvidencePhoto[];
  timeline: FindingTimelineEvent[];
  warnings: string[];
};

export type FindingMutationResponse = {
  finding: Finding;
  warnings: string[];
  auditLog?: AuditLog;
};

export type CorrectiveActionMutationResponse = {
  correctiveAction: CorrectiveAction;
  warnings: string[];
};

export type EvidencePhotoMutationResponse = {
  photo: EvidencePhoto;
  warnings: string[];
};

export type PhotoLedgerDetailResponse = {
  photoLedger: PhotoLedger;
  entries: PhotoLedgerEntry[];
  findings: Finding[];
  correctiveActions: CorrectiveAction[];
  photos: EvidencePhoto[];
  warnings: PhotoLedgerWarning[];
};

export type PhotoLedgerMutationResponse = {
  photoLedger: PhotoLedger;
  warnings: string[];
};

export type PhotoLedgerEntryMutationResponse = {
  entry: PhotoLedgerEntry;
  warnings: string[];
};

export type PhotoLedgerValidationResponse = {
  photoLedgerId: string;
  warnings: PhotoLedgerWarning[];
  hasDanger: boolean;
};

export type PhotoLedgerExportResponse = {
  photoLedgerId: string;
  exportedFileId: string;
  usedConfirmedEntries: boolean;
  warningCount: number;
};

export type PhotoLedgerSyncResponse = {
  photoLedgerId: string;
  documentId: string;
  documentVersionId: string;
  sectionKey: "photo_ledger";
  warnings: string[];
  documentVersion?: DocumentVersion;
};

export type ActionRequestMailDraftResponse = {
  mailDraft: ActionRequestMailDraft;
  mailThread?: MailThread;
  warnings: string[];
};

export type DocumentPhotoLedgerSectionResponse = {
  documentId: string;
  section: {
    documentId: string;
    documentVersionId: string;
    sectionKey: "photo_ledger";
    photoLedgerId: string;
    entryIds: string[];
    updatedAt: string;
  };
  documentVersion?: DocumentVersion;
  photoLedger: PhotoLedger;
  entries: PhotoLedgerEntry[];
  findings: Finding[];
  correctiveActions: CorrectiveAction[];
  photos: EvidencePhoto[];
  warnings: PhotoLedgerWarning[];
};

export type SafetyCostUsageStatus =
  | "draft"
  | "needs_evidence"
  | "review"
  | "confirmed"
  | "synced_to_report"
  | "rejected"
  | "archived";

export type SafetyCostAppropriatenessStatus =
  | "not_reviewed"
  | "appropriate"
  | "needs_review"
  | "insufficient_evidence"
  | "inappropriate";

export type SafetyCostEvidenceType =
  | "safety_cost_usage_statement"
  | "receipt"
  | "invoice"
  | "photo_evidence"
  | "internal_summary"
  | "owner_submitted_file"
  | "other";

export type SafetyCostUsage = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId: string;
  calculatedAmount: number;
  usedAmount: number;
  usedRateCalculated: number;
  userEnteredRate?: number | null;
  basisMonth?: string | null;
  basisDate?: string | null;
  basisDocumentText?: string | null;
  appropriatenessComment?: string | null;
  appropriatenessStatus: SafetyCostAppropriatenessStatus;
  status: SafetyCostUsageStatus;
  confirmedBy?: string | null;
  confirmedAt?: string | null;
  reportInclude: boolean;
  syncedDocumentId?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

export type SafetyCostEvidence = {
  id: string;
  safetyCostUsageId: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId: string;
  fileId: string;
  evidenceType: SafetyCostEvidenceType;
  fileName: string;
  storagePath: string;
  issuedDate?: string | null;
  submittedBy?: string | null;
  memo?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SafetyCostReview = {
  id: string;
  safetyCostUsageId: string;
  reviewerId: string;
  reviewedAt: string;
  reviewComment: string;
  appropriatenessStatus: SafetyCostAppropriatenessStatus;
  aiDraftComment?: string | null;
};

export type SafetyCostHistoryEvent = {
  id: string;
  safetyCostUsageId: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId: string;
  eventType: string;
  summary: string;
  changedFields: string[];
  fileId?: string | null;
  createdAt: string;
};

export type SafetyCostValidationWarning = {
  type:
    | "rate_mismatch"
    | "used_amount_exceeds_calculated"
    | "missing_basis_month"
    | "missing_basis_document"
    | "missing_evidence"
    | "owner_mismatch"
    | "not_confirmed";
  severity: "info" | "warning" | "danger";
  message: string;
};

export type SafetyCostReportMapping = {
  id: string;
  safetyCostUsageId: string;
  documentId: string;
  projectSummaryPhrase: string;
  implementationBudgetPhrase: string;
  sectionKey: "safety_cost_usage";
  documentVersionId?: string | null;
  syncedAt: string;
};

export type SafetyCostUsageListItem = {
  usage: SafetyCostUsage;
  ownerDisplayName: string;
  evidenceCount: number;
  warnings: SafetyCostValidationWarning[];
};

export type SafetyCostOwnerMatrixRow = {
  ownerPartyId: string;
  ownerDisplayName: string;
  usage?: SafetyCostUsage | null;
  warnings: SafetyCostValidationWarning[];
  evidenceCount: number;
};

export type SafetyCostUsageDetailResponse = {
  usage: SafetyCostUsage;
  ownerDisplayName: string;
  evidenceItems: SafetyCostEvidence[];
  reviews: SafetyCostReview[];
  history: SafetyCostHistoryEvent[];
  warnings: SafetyCostValidationWarning[];
  reportMapping?: SafetyCostReportMapping | null;
  documentVersion?: DocumentVersion | null;
};

export type SafetyCostUsageMutationResponse = {
  usage: SafetyCostUsage;
  warnings: SafetyCostValidationWarning[];
  historyEvent?: SafetyCostHistoryEvent;
  auditLog?: AuditLog | null;
};

export type SafetyCostEvidenceMutationResponse = {
  evidence: SafetyCostEvidence;
  warnings: SafetyCostValidationWarning[];
};

export type SafetyCostReviewMutationResponse = {
  usage: SafetyCostUsage;
  review: SafetyCostReview;
  warnings: SafetyCostValidationWarning[];
};

export type SafetyCostRateCalculationResponse = {
  usageId: string;
  usedRateCalculated: number;
  warnings: SafetyCostValidationWarning[];
};

export type SafetyCostValidationResponse = {
  usageId: string;
  warnings: SafetyCostValidationWarning[];
  hasDanger: boolean;
};

export type SafetyCostOwnerMatrixResponse = {
  projectId: string;
  rows: SafetyCostOwnerMatrixRow[];
};

export type SafetyCostSyncResponse = {
  usage: SafetyCostUsage;
  reportMapping: SafetyCostReportMapping;
  documentVersion: DocumentVersion;
  documentVersionId: string;
  documentId: string;
  sectionKey: "safety_cost_usage";
  section: {
    documentId: string;
    documentVersionId: string;
    sectionKey: "safety_cost_usage";
    safetyCostUsageId: string;
    projectSummaryPhrase: string;
    implementationBudgetPhrase: string;
    updatedAt: string;
  };
  warnings: SafetyCostValidationWarning[];
};

export type DocumentSafetyCostUsageResponse = {
  documentId: string;
  section: {
    documentId: string;
    documentVersionId?: string | null;
    sectionKey: "safety_cost_usage";
    safetyCostUsageId: string;
    projectSummaryPhrase: string;
    implementationBudgetPhrase: string;
    updatedAt: string;
  };
  documentVersion?: DocumentVersion | null;
  usage: SafetyCostUsage;
  evidenceItems: SafetyCostEvidence[];
  reviews: SafetyCostReview[];
  warnings: SafetyCostValidationWarning[];
  reportMapping?: SafetyCostReportMapping | null;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  position?: string | null;
  status: "active" | "invited" | "disabled" | "deleted";
  roleIds: string[];
  projectAccessPolicy: "all" | "assigned_only" | "none";
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Permission = {
  id: string;
  key: string;
  name: string;
  groupKey: string;
  description?: string | null;
};

export type Role = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  permissionKeys: string[];
  systemRole: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CompanyProfile = {
  id: string;
  companyName: string;
  representativeName: string;
  businessNumber: string;
  address: string;
  phone: string;
  email: string;
  logoFileId?: string | null;
  sealFileId?: string | null;
  engineerLicenseLabel?: string | null;
  defaultSignatureText?: string | null;
  defaultDocumentFooter?: string | null;
  defaultMailFooter?: string | null;
  updatedAt: string;
};

export type DocumentTemplate = {
  id: string;
  templateKey: string;
  name: string;
  documentType: string;
  status: "draft" | "review" | "published" | "deprecated" | "archived";
  currentVersionId?: string | null;
  publishedVersionId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TemplateVersion = {
  id: string;
  templateId: string;
  versionNo: number;
  status: "draft" | "review" | "published" | "deprecated" | "archived";
  bodyTemplate: string;
  changeSummary?: string | null;
  reviewNote?: string | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  validationPassed: boolean;
  previewPassed: boolean;
  missingRequiredVariables: string[];
  createdAt: string;
  updatedAt: string;
};

export type TemplateSection = {
  id: string;
  versionId: string;
  key: string;
  title: string;
  body: string;
  displayOrder: number;
};

export type TemplateVariable = {
  id: string;
  versionId: string;
  variableKey: string;
  label: string;
  dataPath: string;
  sourceModel: string;
  dataType: string;
  required: boolean;
  ownerSpecific: boolean;
  exampleValue?: string | null;
  usedSectionKeys: string[];
};

export type TemplateLoop = {
  id: string;
  versionId: string;
  loopKey: string;
  dataPath: string;
  alias: string;
  usedSectionKeys: string[];
};

export type TemplateCondition = {
  id: string;
  versionId: string;
  conditionKey: string;
  expression: string;
  usedSectionKeys: string[];
};

export type TemplatePreviewRun = {
  id: string;
  versionId: string;
  previewText: string;
  missingFields: MissingField[];
  sampleName?: string | null;
  createdAt: string;
};

export type Phrase = {
  id: string;
  phraseType: string;
  title: string;
  body: string;
  tags: string[];
  status: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LegalClause = {
  id: string;
  clauseCode: string;
  title: string;
  body: string;
  status: string;
  changeReason?: string | null;
  requestedReviewAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PromptTemplate = {
  id: string;
  promptKey: string;
  name: string;
  promptType: string;
  featureId: string;
  status: string;
  currentVersionId?: string | null;
  publishedVersionId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PromptVersion = {
  id: string;
  promptId: string;
  versionNo: number;
  status: string;
  systemMessage: string;
  userMessageTemplate: string;
  inputSchema?: Record<string, unknown> | null;
  outputSchema?: Record<string, unknown> | null;
  guardrails: string[];
  forbiddenBehaviors: string[];
  reviewNote?: string | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  lastTestRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PromptTestCase = {
  id: string;
  promptId: string;
  name: string;
  inputFixture: Record<string, unknown>;
  expectedContains: string[];
  expectedMissing: string[];
  createdAt: string;
  updatedAt: string;
};

export type PromptRunLog = {
  id: string;
  promptVersionId: string;
  testCaseId?: string | null;
  inputFixture: Record<string, unknown>;
  outputText: string;
  schemaValid: boolean;
  forbiddenBehaviorHits: string[];
  passed: boolean;
  createdAt: string;
};

export type WebhardPolicy = {
  id: string;
  defaultRootFolderName: string;
  generatedDocumentsFolderName: string;
  submissionFolderName: string;
  sharedLinkExpiryDays: number;
  requireLockedFinalFiles: boolean;
  updatedAt: string;
};

export type AdminAuditLog = {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  reason: string;
  changedFields: string[];
  createdAt: string;
};

export type AdminDashboardSummaryResponse = {
  counts: {
    users: number;
    activeTemplates: number;
    reviewTemplates: number;
    publishedPrompts: number;
    failedPromptTests: number;
  };
  recentLegalChanges: AdminAuditLog[];
  recentAuditLogs: AdminAuditLog[];
  warnings: Array<{ code: string; message: string; severity: string }>;
};

export type DocumentTemplateListItem = {
  template: DocumentTemplate;
  currentVersion?: TemplateVersion | null;
  sectionCount: number;
  variableCount: number;
};

export type DocumentTemplateDetailResponse = {
  template: DocumentTemplate;
  currentVersion?: TemplateVersion | null;
  versions: TemplateVersion[];
  sections: TemplateSection[];
  variables: TemplateVariable[];
  loops: TemplateLoop[];
  conditions: TemplateCondition[];
};

export type PromptListItem = {
  prompt: PromptTemplate;
  currentVersion?: PromptVersion | null;
  testCaseCount: number;
  runLogCount: number;
};

export type PromptDetailResponse = {
  prompt: PromptTemplate;
  currentVersion?: PromptVersion | null;
  versions: PromptVersion[];
  testCases: PromptTestCase[];
  runLogs: PromptRunLog[];
};

export type DashboardWidget = {
  id: string;
  title: string;
  widgetType: string;
  route: string;
  scope: string;
  projectId?: string | null;
  ownerPartyId?: string | null;
  displayOrder: number;
  settings: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSnapshot = {
  id: string;
  scope: string;
  projectId?: string | null;
  snapshotDate: string;
  metrics: Record<string, unknown>[];
  alerts: string[];
  createdAt: string;
};

export type DashboardMetric = {
  id: string;
  metricKey: string;
  label: string;
  value: number;
  unit?: string | null;
  trend?: string | null;
  status: string;
  route?: string | null;
  projectId?: string | null;
  ownerPartyId?: string | null;
  inspectionRoundId?: string | null;
  documentId?: string | null;
  submissionId?: string | null;
  fileId?: string | null;
  mailThreadId?: string | null;
  metadata: Record<string, unknown>;
};

export type ProjectHealthMetric = {
  id: string;
  projectId: string;
  projectName: string;
  riskScore: number;
  openFindings: number;
  pendingApprovals: number;
  overdueReports: number;
  submissionLagCount: number;
  safetyCostWarningCount: number;
  healthStatus: string;
  updatedAt: string;
};

export type OwnerReportStatusSummary = {
  id: string;
  projectId: string;
  inspectionRoundId: string;
  ownerPartyId: string;
  ownerDisplayName: string;
  status: string;
  documentId?: string | null;
  submissionId?: string | null;
  mailThreadId?: string | null;
  dueDate?: string | null;
  submittedAt?: string | null;
};

export type FindingAgingBucket = {
  id: string;
  projectId: string;
  bucketKey: string;
  label: string;
  count: number;
  findingIds: string[];
};

export type StatisticsMetric = {
  id: string;
  seriesKey: string;
  label: string;
  x: string;
  y: number;
  projectId?: string | null;
  ownerPartyId?: string | null;
  inspectionRoundId?: string | null;
  basisDate?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  calculationNote?: string | null;
  sourceModels: string[];
  metadata: Record<string, unknown>;
};

export type DashboardAlert = {
  id: string;
  alertKey: string;
  scope: string;
  severity: string;
  title: string;
  message: string;
  route: string;
  status: string;
  projectId?: string | null;
  ownerPartyId?: string | null;
  inspectionRoundId?: string | null;
  documentId?: string | null;
  submissionId?: string | null;
  acknowledgedAt?: string | null;
  dismissedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AlertRule = {
  id: string;
  ruleKey: string;
  name: string;
  description: string;
  severity: string;
  enabled: boolean;
  threshold?: number | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardInsightRun = {
  id: string;
  insightType: string;
  scope: string;
  projectId?: string | null;
  title: string;
  summaryText: string;
  sourceMetricKeys: string[];
  warnings: string[];
  createdAt: string;
};

export type DashboardOverviewResponse = {
  generatedAt: string;
  metrics: DashboardMetric[];
  todayInspections: InspectionRound[];
  upcomingInspections: InspectionRound[];
  reportDueItems: OwnerReportStatusSummary[];
  openFindings: Array<Record<string, unknown>>;
  safetyCostWarnings: Array<Record<string, unknown>>;
  pendingApprovals: Array<Record<string, unknown>>;
  submissionStatuses: OwnerReportStatusSummary[];
  mailFileActivity: {
    messages: MailMessage[];
    files: FileActivity[];
    unclassifiedMailCount: number;
    unclassifiedMessages?: MailMessage[];
  };
  widgets: DashboardWidget[];
  alerts: DashboardAlert[];
  snapshot: DashboardSnapshot;
};

export type DashboardMyWorkResponse = {
  generatedAt: string;
  tasks: InspectionTask[];
  upcomingInspections: InspectionRound[];
  pendingApprovals: Array<Record<string, unknown>>;
  openFindings: Array<Record<string, unknown>>;
};

export type ProjectDashboardResponse = {
  project: Project;
  healthMetric: ProjectHealthMetric;
  ownerReportMatrix: OwnerReportStatusSummary[];
  findingAging: FindingAgingBucket[];
  openFindings: Array<Record<string, unknown>>;
  safetyCostWarnings: Array<Record<string, unknown>>;
  pendingApprovals: Array<Record<string, unknown>>;
  mailFileActivity: {
    messages: MailMessage[];
    files: FileActivity[];
    unclassifiedMailCount: number;
    unclassifiedMessages?: MailMessage[];
  };
};
