import type {
  AdminSiteSnapshot,
  InspectionSession,
  InspectionSite,
  MeasurementCheckItem,
  SafetyEducationRecord,
  SiteScenePhoto,
  ActivityRecord,
  CurrentHazardFinding,
} from '@/types/inspectionSession';

export type TechnicalGuidanceExtractorKind =
  | 'rule'
  | 'ocr'
  | 'llm'
  | 'layout'
  | 'manual'
  | 'unknown';

export interface EvidenceSnippetRef {
  id: string;
  page: number;
  text: string;
}

export interface SectionEvidenceBundle {
  sectionKey: string;
  title: string;
  pageRefs: number[];
  markdown: string;
  rawText: string;
  normalizedText: string;
  snippetRefs: EvidenceSnippetRef[];
  confidence: number;
}

export interface TechnicalGuidanceCanonicalField<T = unknown> {
  value: T;
  confidence: number;
  evidenceRefs: string[];
  extractor: TechnicalGuidanceExtractorKind;
}

export interface TechnicalGuidanceCanonicalSection {
  sectionKey: string;
  title: string;
  structuredData: Record<string, unknown>;
  evidence: SectionEvidenceBundle;
}

export interface TechnicalGuidanceExtractionMeta {
  sourcePdfPath: string;
  pageCount: number;
  textPdf: boolean;
  formatFamily: string;
  parserVersion: string;
  modelVersion: string | null;
  unresolvedFields: string[];
  confidenceSummary: Record<string, number>;
  qualityFlags: string[];
}

export interface TechnicalGuidanceCanonicalReport {
  legacyReportId: string;
  variantProfileId: string;
  reportMeta: Record<string, TechnicalGuidanceCanonicalField | unknown>;
  siteSnapshot: Record<string, TechnicalGuidanceCanonicalField | unknown>;
  sections: TechnicalGuidanceCanonicalSection[];
  extractionMeta: TechnicalGuidanceExtractionMeta;
}

export interface TechnicalGuidanceVariantProfile {
  profileId: string;
  familyName: string;
  sectionOrder: string[];
  sectionPresenceRules: Record<string, number>;
  fieldAliases: Record<string, string[]>;
  repeatBlockRules: Record<string, string>;
  layoutHints: Record<string, string | number | boolean | null>;
}

export interface TechnicalGuidanceFormatContract {
  id: string;
  rendererPath: string;
  templatePath: string;
  pdfRoute: string;
  requiredSectionOrder: string[];
  requiredMetaFields: string[];
  requiredSiteSnapshotFields: string[];
  notes: string[];
}

export type TechnicalGuidancePhotoIntent =
  | 'doc3_scene'
  | 'doc7_finding'
  | 'doc10_measurement'
  | 'doc11_education'
  | 'doc12_activity'
  | 'unknown';

export interface TechnicalGuidancePhotoObservation {
  photoId: string;
  intent: TechnicalGuidancePhotoIntent;
  imagePath?: string;
  imageUrl?: string;
  caption: string;
  observedHazards: string[];
  observedText?: string;
  locationHint?: string;
  confidence: number;
}

export interface TechnicalGuidancePreviousReportSummary {
  legacyReportId: string;
  reportDate: string;
  siteName: string;
  variantProfileId: string;
  doc5Summary: string;
  findingKeywords: string[];
}

export interface GenerateTechnicalGuidancePhotoDraftInput {
  site: Partial<InspectionSite> & TechnicalGuidanceDraftSiteInput;
  reportMeta: Record<string, unknown>;
  variantProfileId: string;
  formatContractId: string;
  photoObservations: TechnicalGuidancePhotoObservation[];
  previousReports: TechnicalGuidancePreviousReportSummary[];
}

export interface GenerateTechnicalGuidancePhotoDraftOutput {
  doc3Scenes: Array<Partial<SiteScenePhoto>>;
  doc5SummaryHint: string;
  doc7Findings: Array<Partial<CurrentHazardFinding>>;
  doc10Measurements: Array<Partial<MeasurementCheckItem>>;
  doc11EducationRecords: Array<Partial<SafetyEducationRecord>>;
  doc12Activities: Array<Partial<ActivityRecord>>;
  reviewChecklist: string[];
  lowConfidenceFields: string[];
  warnings: string[];
}

export interface TechnicalGuidanceDraftSiteInput {
  id?: string;
  siteName?: string;
  customerName?: string;
  assigneeName?: string;
  adminSiteSnapshot?: Partial<AdminSiteSnapshot>;
}

export interface GenerateTechnicalGuidanceDraftInput {
  site: Partial<InspectionSite> & TechnicalGuidanceDraftSiteInput;
  reportMeta: Record<string, unknown>;
  photos: Record<string, string[]>;
  previousReports: TechnicalGuidanceCanonicalReport[];
  canonicalEvidence: TechnicalGuidanceCanonicalReport;
  variantProfileId: string;
}

export interface GenerateTechnicalGuidanceDraftOutput {
  session: InspectionSession;
  formatContract: TechnicalGuidanceFormatContract;
  reviewChecklist: string[];
  lowConfidenceFields: string[];
  warnings: string[];
}
