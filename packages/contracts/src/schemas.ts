import { z } from 'zod';

export const fieldSourceSchema = z.enum(['manual', 'vision', 'ai_section', 'system']);
export const draftFieldSourceSchema = z.enum([
  'DATA',
  'AI_PHOTO',
  'RISK_LIBRARY',
  'USER_INPUT',
  'RULE_TEMPLATE',
]);
export const reviewQueueSectionSchema = z.enum([
  'reportMeta',
  'doc4',
  'doc5',
  'photoObservations',
  'dispatch',
  'other',
]);
export const reviewQueueSeveritySchema = z.enum(['required', 'warning', 'info']);
export const reportStatusSchema = z.enum(['draft', 'draft_ready', 'review_completed', 'exported']);
export const reviewStatusSchema = z.enum(['pending', 'reviewed', 'confirmed']);
export const previousImplementationStatusSchema = z.enum([
  'implemented',
  'partial',
  'not_implemented',
  '',
]);
export const notificationMethodSchema = z.enum([
  'direct',
  'registered_mail',
  'email',
  'mobile',
  'other',
  '',
]);
export const photoCategorySchema = z.enum([
  'site_overview',
  'hazard',
  'process',
  'followup',
  'measurement',
  'education',
  'activity',
]);
export const photoSourceStepSchema = z.enum([
  'step1_overview',
  'step2_hazard',
  'step3_followup',
  'step4_support',
  'step5_site_overview',
  'manual_override',
]);
export const wizardStepSchema = z.enum([
  'meta',
  'step1_overview',
  'step2_hazard',
  'review',
  'ai_generating',
  'workspace',
]);
export const workspaceEntryModeSchema = z.enum(['guided_photo_flow', 'direct_reopen']);
export const doc11Doc12AutofillModeSchema = z.enum(['resource_autofill', 'manual_override']);
export const photoStepBucketStatusSchema = z.enum(['pending', 'ready', 'reviewed', 'skipped']);
export const photoBucketRoleSchema = z.enum([
  'current_process_photo',
  'current_hazard_photo',
  'previous_guidance_check_photo',
  'education_support_photo',
  'site_overview_photo',
]);

export const reviewQueueItemSchema = z.object({
  id: z.string().default(''),
  section: reviewQueueSectionSchema.default('other'),
  field: z.string().default(''),
  fieldPath: z.string().min(1),
  label: z.string().min(1),
  value: z.string().optional(),
  currentValue: z.string().optional(),
  suggestedValue: z.string().optional(),
  source: draftFieldSourceSchema.optional(),
  confidence: z.number().min(0).max(1),
  reason: z.string().default(''),
  severity: reviewQueueSeveritySchema.default('warning'),
  needsReview: z.boolean().default(true),
  status: reviewStatusSchema,
  evidencePhotoIds: z.array(z.string()).default([]),
  resolved: z.boolean().default(false),
  notes: z.string().default(''),
});

export const reportMetaSchema = z.object({
  workspaceName: z.string().default(''),
  siteName: z.string().min(1),
  customerName: z.string().min(1),
  guidanceAgencyName: z.string().default(''),
  visitDate: z.string().min(1),
  drafterName: z.string().min(1),
  siteManagementNumber: z.string().default(''),
  businessStartNumber: z.string().default(''),
  constructionPeriod: z.string().default(''),
  constructionAmount: z.string().default(''),
  siteManagerName: z.string().default(''),
  corporationRegistrationNumber: z.string().default(''),
  businessRegistrationNumber: z.string().default(''),
  licenseNumber: z.string().default(''),
  headquartersContact: z.string().default(''),
  headquartersAddress: z.string().default(''),
  constructionType: z.string().default(''),
  visitCount: z.string().default(''),
  totalVisitCount: z.string().default(''),
  previousImplementationStatus: previousImplementationStatusSchema.default(''),
  notificationMethod: notificationMethodSchema.default(''),
  notificationRecipientName: z.string().default(''),
  otherNotificationMethod: z.string().default(''),
  progressRate: z.string().default(''),
  processSummary: z.string().default(''),
  workerCount: z.string().default(''),
  siteAddress: z.string().default(''),
  siteContact: z.string().default(''),
  reportPriceKrw: z.number().int().nonnegative().default(3000),
});

export const reviewMetaSchema = z.object({
  reviewCompleted: z.boolean(),
  reviewCompletedAt: z.string().nullable(),
  responsibilityConfirmed: z.boolean(),
  requiredFieldPaths: z.array(z.string()).default([]),
  reviewQueue: z.array(reviewQueueItemSchema).default([]),
});

export const aiMetaSchema = z.object({
  pipelineVersion: z.string().default('v1-photo-first'),
  lastRunId: z.string().nullable(),
  lastRunStatus: z.enum(['queued', 'running', 'succeeded', 'failed']).default('queued'),
  generatedAt: z.string().nullable(),
  sourceMix: z.array(fieldSourceSchema).default([]),
});

export const photoStepBucketSchema = z.object({
  step: photoSourceStepSchema,
  title: z.string().min(1),
  description: z.string().default(''),
  minRequired: z.number().int().nonnegative().default(0),
  recommendedCount: z.number().int().nonnegative().default(0),
  bucketRole: photoBucketRoleSchema.optional(),
  uploadedPhotoIds: z.array(z.string()).default([]),
  representativePhotoId: z.string().nullable().default(null),
  status: photoStepBucketStatusSchema.default('pending'),
});

export const photoChecklistStatusSchema = z.object({
  step1OverviewComplete: z.boolean().default(false),
  step2HazardComplete: z.boolean().default(false),
  reviewReady: z.boolean().default(false),
  minimumSatisfied: z.boolean().default(false),
});

export const photoEvidenceSchema = z.object({
  photoAssetId: z.string().min(1),
  category: photoCategorySchema,
  sourceStep: photoSourceStepSchema.default('manual_override'),
  filename: z.string().default(''),
  imageUrl: z.string().default(''),
  aiCategorySuggestion: photoCategorySchema.nullable().default(null),
  aiCategoryConfidence: z.number().min(0).max(1).default(0),
  aiCategoryReason: z.string().default(''),
  sceneType: z.string().default(''),
  processType: z.string().default(''),
  locationHint: z.string().default(''),
  ppeSignals: z.array(z.string()).default([]),
  hazardSignals: z.array(z.string()).default([]),
  accidentTypeCandidates: z.array(z.string()).default([]),
  causativeAgentCandidates: z.array(z.string()).default([]),
  measurementContext: z.string().default(''),
  educationContext: z.string().default(''),
  activityContext: z.string().default(''),
  confidence: z.number().min(0).max(1),
  notes: z.string().default(''),
});

const majorProcessSchema = z.enum([
  '기초 및 토공사',
  '골조공사',
  '내부 마감공사',
  '외부 마감공사',
  '지붕공사',
  '기타',
  '확인 필요',
]);

const accidentTypeSchema = z.enum([
  '추락',
  '낙하',
  '충돌',
  '붕괴',
  '감전',
  '화재',
  '협착',
  '전도',
  '확인 필요',
]);

const observedProcessStructuredSchema = z
  .object({
    majorProcess: majorProcessSchema.default('확인 필요'),
    detailProcess: z.string().default(''),
    confidence: z.number().min(0).max(1),
  })
  .optional();

const observedRiskStructuredSchema = z
  .object({
    locationText: z.string().default(''),
    accidentType: accidentTypeSchema.default('확인 필요'),
    causativeAgent: z.string().default(''),
    hazardSummary: z.string().default(''),
    recommendedActionKey: z.string().default(''),
    riskLevel: z.enum(['상', '중', '하', '확인 필요']),
    confidence: z.number().min(0).max(1),
  })
  .optional();

const previousGuidanceCheckSchema = z
  .object({
    matchedPreviousFindingId: z.string().nullable().default(null),
    suggestedResult: z.enum(['이행 완료', '불이행', '부분 이행', '확인 필요']),
    reason: z.string().default(''),
    confidence: z.number().min(0).max(1),
  })
  .optional();

const supportObservationSchema = z
  .object({
    supportType: z.enum(['교육', '자료보급', '현장순회', '기타', '확인 필요']),
    attendeeCountText: z.string().default(''),
    topicCandidate: z.string().default(''),
    contentCandidate: z.string().default(''),
    confidence: z.number().min(0).max(1),
  })
  .optional();

export const photoObservationCardSchema = z.object({
  id: z.string().default(''),
  reportId: z.string().default(''),
  photoAssetId: z.string().min(1),
  photoRole: photoSourceStepSchema,
  observedProcess: z.string().default(''),
  observedRisk: z.string().default(''),
  observedProcessStructured: observedProcessStructuredSchema,
  observedRiskStructured: observedRiskStructuredSchema,
  previousGuidanceCheck: previousGuidanceCheckSchema,
  supportObservation: supportObservationSchema,
  rawAiNotes: z.string().default(''),
  confidence: z.number().min(0).max(1).default(0),
  needsHumanReview: z.boolean().default(true),
  createdAt: z.string().default(''),
});

export const generatedDraftSourceSchema = z.enum([
  'AI_PHOTO_AND_RISK_LIBRARY',
  'USER_INPUT',
  'DATA',
]);

export const findingCandidateSchema = z.object({
  linkedPhotoIds: z.array(z.string()).default([]),
  photoObservationIds: z.array(z.string()).optional(),
  standardRiskRuleId: z.string().optional(),
  source: generatedDraftSourceSchema.optional(),
  location: z.string().default(''),
  hazardDescription: z.string().default(''),
  accidentType: z.string().default(''),
  causativeAgentKey: z.string().default(''),
  riskLevel: z.enum(['상', '중', '하']),
  improvementPlan: z.string().default(''),
  emphasis: z.string().default(''),
  legalReferenceCandidates: z.array(z.string()).default([]),
  referenceMaterialCandidates: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  needsReview: z.boolean().default(true),
});

export const futureProcessRiskPlanSchema = z.object({
  processName: z.string(),
  hazard: z.string(),
  countermeasure: z.string(),
  note: z.string().optional(),
  evidencePhotoIds: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  standardRiskRuleId: z.string().optional(),
  photoObservationIds: z.array(z.string()).optional(),
  needsReview: z.boolean().optional(),
  source: generatedDraftSourceSchema.optional(),
});

export const doc5StructuredSummarySchema = z.object({
  progressOverview: z.string().default(''),
  accidentTrend: z.string().default(''),
  findingCase: z.string().default(''),
  workEnvironmentRisk: z.string().default(''),
  futureProcessFocus: z.string().default(''),
});

export const sectionDraftsSchema = z.object({
  doc5: doc5StructuredSummarySchema,
  doc7: z.array(findingCandidateSchema).default([]),
  doc8: z.array(futureProcessRiskPlanSchema).default([]),
  doc11: z
    .array(
      z.object({
        topic: z.string(),
        content: z.string(),
        attendeeCount: z.string().optional(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .default([]),
  doc12: z
    .array(
      z.object({
        activityType: z.string(),
        content: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .default([]),
  doc13: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .default([]),
  doc14: z.object({
    title: z.string().default(''),
    body: z.string().default(''),
    confidence: z.number().min(0).max(1),
  }),
});

export const validationResultSchema = z.object({
  valid: z.boolean(),
  blockingIssues: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  reviewedFieldPaths: z.array(z.string()).default([]),
});

export const fieldProvenanceSchema = z.object({
  fieldPath: z.string().min(1),
  source: draftFieldSourceSchema,
  sourceId: z.string().optional(),
  evidencePhotoIds: z.array(z.string()).default([]),
  photoObservationIds: z.array(z.string()).default([]),
  standardRiskRuleId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  generatedAt: z.string().optional(),
  model: z.string().optional(),
  needsReview: z.boolean().default(false),
  note: z.string().default(''),
});

export const documentsCompatSchema = z
  .object({
    document2Overview: z.record(z.string(), z.unknown()).default({}),
    document3Scenes: z.array(z.record(z.string(), z.unknown())).default([]),
    document4FollowUps: z.array(z.record(z.string(), z.unknown())).default([]),
    document5Summary: z.record(z.string(), z.unknown()).default({}),
    document6Measures: z.array(z.record(z.string(), z.unknown())).default([]),
    document7Findings: z.array(z.record(z.string(), z.unknown())).default([]),
    document8Plans: z.array(z.record(z.string(), z.unknown())).default([]),
    document9SafetyChecks: z.record(z.string(), z.unknown()).default({}),
    document10Measurements: z.array(z.record(z.string(), z.unknown())).default([]),
    document11EducationRecords: z.array(z.record(z.string(), z.unknown())).default([]),
    document12Activities: z.array(z.record(z.string(), z.unknown())).default([]),
    document13Cases: z.array(z.record(z.string(), z.unknown())).default([]),
    document14SafetyInfos: z.array(z.record(z.string(), z.unknown())).default([]),
  })
  .default({});

export const reportPayloadSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  status: reportStatusSchema,
  currentSection: z.string().min(1),
  reportMeta: reportMetaSchema,
  reviewMeta: reviewMetaSchema,
  aiMeta: aiMetaSchema,
  wizardStep: wizardStepSchema.default('meta'),
  photoStepBuckets: z.array(photoStepBucketSchema).default([]),
  photoChecklistStatus: photoChecklistStatusSchema.default({}),
  doc3PhotoCandidates: z.array(z.string()).default([]),
  doc7PhotoCandidates: z.array(z.string()).default([]),
  workspaceEntryMode: workspaceEntryModeSchema.default('guided_photo_flow'),
  doc11Doc12AutofillMode: doc11Doc12AutofillModeSchema.default('resource_autofill'),
  photoEvidence: z.array(photoEvidenceSchema).default([]),
  photoObservations: z.array(photoObservationCardSchema).default([]),
  findingCandidates: z.array(findingCandidateSchema).default([]),
  sectionDrafts: sectionDraftsSchema,
  validationResult: validationResultSchema,
  fieldProvenance: z.array(fieldProvenanceSchema).default([]),
  documentsCompat: documentsCompatSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const signupInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createWorkspaceInputSchema = z.object({
  name: z.string().min(1),
});

export const billingPackageSchema = z.enum(['starter-10', 'team-30', 'agency-100']);

export const createReportInputSchema = z.object({
  workspace_id: z.string().min(1),
  site_id: z.string().min(1),
  site_name: z.string().default(''),
  customer_name: z.string().default(''),
  visit_date: z.string().min(1),
  drafter_name: z.string().min(1),
  progress_rate: z.string().default(''),
  process_summary: z.string().default(''),
  worker_count: z.string().default(''),
});

export const generateDraftFromPhotosInputSchema = z.object({
  photo_asset_ids: z.array(z.string().min(1)).min(1),
});

export const guidedPhotoStepUploadInputSchema = z.object({
  photos: z
    .array(
      z.object({
        filename: z.string().min(1),
        category: photoCategorySchema.optional(),
        data_url: z.string().min(1),
        location_hint: z.string().default(''),
      }),
    )
    .min(1),
});

export const guidedPhotoReviewInputSchema = z.object({
  doc3_photo_ids: z.array(z.string().min(1)).default([]),
  doc7_photo_ids: z.array(z.string().min(1)).default([]),
  representative_doc3_photo_id: z.string().nullable().default(null),
  representative_doc7_photo_id: z.string().nullable().default(null),
});

export const generateDraftFromGuidedPhotosInputSchema = z.object({
  doc3_photo_ids: z.array(z.string().min(1)).min(1),
  doc7_photo_ids: z.array(z.string().min(1)).min(1),
});

export const exportReportInputSchema = z.object({
  confirm_reviewed: z.boolean().default(true),
  acknowledge_ai_disclaimer: z.boolean().default(false),
  typed_signature_name: z.string().default(''),
});

export const creditLedgerEntrySchema = z.object({
  id: z.string().min(1),
  workspace_id: z.string().min(1),
  type: z.enum(['grant_free_trial', 'purchase', 'consume_export', 'refund_export_failure']),
  amount: z.number().int(),
  description: z.string().min(1),
  report_id: z.string().nullable().optional(),
  created_at: z.string().min(1),
});

export type ReportPayload = z.infer<typeof reportPayloadSchema>;
export type PhotoEvidence = z.infer<typeof photoEvidenceSchema>;
export type PhotoObservationCard = z.infer<typeof photoObservationCardSchema>;
export type FindingCandidate = z.infer<typeof findingCandidateSchema>;
export type SectionDrafts = z.infer<typeof sectionDraftsSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
export type FieldProvenance = z.infer<typeof fieldProvenanceSchema>;
export type CreateReportInput = z.infer<typeof createReportInputSchema>;
export type GenerateDraftFromPhotosInput = z.infer<typeof generateDraftFromPhotosInputSchema>;
export type GuidedPhotoStepUploadInput = z.infer<typeof guidedPhotoStepUploadInputSchema>;
export type GuidedPhotoReviewInput = z.infer<typeof guidedPhotoReviewInputSchema>;
export type GenerateDraftFromGuidedPhotosInput = z.infer<typeof generateDraftFromGuidedPhotosInputSchema>;
export type ExportReportInput = z.infer<typeof exportReportInputSchema>;
export type CreditLedgerEntry = z.infer<typeof creditLedgerEntrySchema>;
