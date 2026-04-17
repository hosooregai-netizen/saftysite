export type UserRole = 'admin' | 'worker';

export type ReportType = 'technical_guidance' | 'quarterly_report' | 'bad_workplace';

export type QualityStatus = 'unchecked' | 'ok' | 'issue';

export type DispatchSignal = 'normal' | 'warning' | 'overdue' | 'sent';

export type SiteStatus = '운영중' | '준비중' | '종료 임박' | '휴면';

export type ScheduleStatus = 'unselected' | 'selected' | 'completed' | 'cancelled';

export type PhotoSourceKind = 'album_upload' | 'legacy_import';

export type BadWorkplaceSourceMode = 'previous_unresolved' | 'current_new_hazard';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
};

export type SiteSnapshot = {
  headquarterName: string;
  siteName: string;
  siteAddress: string;
  siteManagerName: string;
  siteManagerContact: string;
  assigneeName: string;
};

export type Site = {
  id: string;
  headquarterId: string;
  headquarterName: string;
  siteName: string;
  siteCode: string;
  managementNumber: string;
  projectKind: string;
  siteAddress: string;
  projectAmount: number;
  projectStartDate: string;
  projectEndDate: string;
  contractEndDate: string;
  lastVisitDate?: string;
  guidanceOfficerId?: string;
  guidanceOfficerName?: string;
  inspectorName?: string;
  assignedUserIds: string[];
  status: SiteStatus;
  siteManagerName: string;
  siteManagerContact: string;
  adminSiteSnapshot: SiteSnapshot;
  material: {
    quarterLabel: string;
    educationMissing: number;
    measurementMissing: number;
    educationStatus: string;
    measurementStatus: string;
  };
};

export type ScheduleRecord = {
  id: string;
  siteId: string;
  siteName: string;
  headquarterId: string;
  headquarterName: string;
  roundNo: number;
  totalRounds: number;
  plannedDate?: string;
  actualVisitDate?: string;
  windowStart: string;
  windowEnd: string;
  assigneeUserId?: string;
  assigneeName?: string;
  status: ScheduleStatus;
  selectionConfirmedAt?: string;
  selectionConfirmedByName?: string;
  selectionReasonLabel?: string;
  selectionReasonMemo?: string;
  isConflicted?: boolean;
  isOutOfWindow?: boolean;
  isOverdue?: boolean;
};

export type ReviewState = {
  qualityStatus: QualityStatus;
  checkerUserId?: string;
  ownerUserId?: string;
  note?: string;
  checkedAt?: string;
};

export type DispatchState = {
  sent: boolean;
  manualChecked?: boolean;
  smsSent?: boolean;
  phone?: string;
  message?: string;
  lastSentAt?: string;
  deadlineDate?: string;
};

export type Doc7Finding = {
  id: string;
  photoUrl?: string;
  photoUrl2?: string;
  location: string;
  accidentType: string;
  riskLevel: string;
  causativeAgentKey: string;
  hazardDescription: string;
  improvementPlan: string;
  improvementRequest: string;
  emphasis: string;
  legalReferenceId?: string;
  legalReferenceTitle: string;
  referenceLawTitles: string[];
  followUpStatus?: 'pending' | 'resolved' | 'open';
  followUpNote?: string;
};

export type SessionSummary = {
  overview: string;
  siteScene: string;
  previousGuidance: string;
  totalComment: string;
  deathFactors: string;
  futureProcess: string;
  riskAssessment: string;
  measurement: string;
  education: string;
  activity: string;
};

export type SessionReport = {
  id: string;
  reportKind: 'technical_guidance';
  siteId: string;
  siteName: string;
  reportTitle: string;
  visitDate: string;
  reportNumber: number;
  drafterName: string;
  reviewerName?: string;
  approverName?: string;
  updatedAt: string;
  lastAutosavedAt?: string;
  progress: number;
  status: string;
  dispatchCompleted?: boolean;
  dispatchCompletedAt?: string;
  summary: SessionSummary;
  document7Findings: Doc7Finding[];
  review: ReviewState;
  dispatch: DispatchState;
};

export type StatBucket = {
  label: string;
  value: number;
};

export type QuarterlyImplementationRow = {
  id: string;
  sourceSessionId: string;
  reportTitle: string;
  guidanceDate: string;
  findingCount: number;
  completionStatus: string;
};

export type QuarterlyReport = {
  id: string;
  reportKind: 'quarterly_report';
  siteId: string;
  title: string;
  quarterKey: string;
  year: number;
  quarter: number;
  periodStartDate: string;
  periodEndDate: string;
  generatedFromSessionIds: string[];
  explicitSelection: boolean;
  lastCalculatedAt?: string;
  drafter: string;
  reviewer: string;
  approver: string;
  updatedAt: string;
  siteSnapshot: SiteSnapshot;
  implementationRows: QuarterlyImplementationRow[];
  accidentStats: StatBucket[];
  causativeStats: StatBucket[];
  futurePlans: string[];
  majorMeasures: string[];
  opsAssetId?: string;
  opsAssetTitle?: string;
  opsAssetDescription?: string;
  opsAssetPreviewUrl?: string;
  review: ReviewState;
  dispatch: DispatchState;
  status: string;
  controllerReview?: string;
};

export type ViolationRow = {
  id: string;
  sourceFindingId?: string;
  legalReference: string;
  hazardFactor: string;
  improvementMeasure: string;
  guidanceDate: string;
  nonCompliance: string;
  confirmationDate?: string;
  accidentType: string;
  causativeAgentKey: string;
};

export type BadWorkplaceReport = {
  id: string;
  reportKind: 'bad_workplace';
  siteId: string;
  title: string;
  reportMonth: string;
  status: string;
  dispatchCompleted: boolean;
  controllerReview?: string;
  sourceMode: BadWorkplaceSourceMode;
  sourceSessionId?: string;
  sourceFindingIds: string[];
  guidanceDate?: string;
  confirmationDate?: string;
  progressRate: number;
  implementationCount: number;
  reporterUserId?: string;
  reporterName: string;
  receiverName: string;
  assigneeContact: string;
  agencyName: string;
  agencyRepresentative: string;
  notificationDate: string;
  attachmentDescription: string;
  siteSnapshot: SiteSnapshot;
  violations: ViolationRow[];
  updatedAt: string;
  review: ReviewState;
  dispatch: DispatchState;
};

export type PhotoAlbumItem = {
  id: string;
  siteId: string;
  siteName: string;
  headquarterId: string;
  headquarterName: string;
  previewUrl: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  capturedAt: string;
  createdAt: string;
  uploadedByUserId?: string;
  uploadedByName?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  sourceKind: PhotoSourceKind;
  sourceReportKey?: string;
  sourceDocumentKey?: string;
  sourceSlotKey?: string;
  sourceReportTitle?: string;
};

export type AppState = {
  currentUserId: string;
  users: User[];
  sites: Site[];
  schedules: ScheduleRecord[];
  sessions: SessionReport[];
  quarterlyReports: QuarterlyReport[];
  badWorkplaceReports: BadWorkplaceReport[];
  photos: PhotoAlbumItem[];
};

