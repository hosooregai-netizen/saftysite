import type { SafetyReportSection } from "../../packages/contracts/src";
import { DocumentSectionEditor } from "./document-section-editor";

type SectionEditorProps = {
  section: SafetyReportSection;
};

export function CoverSectionEditor({ section }: SectionEditorProps) {
  return <DocumentSectionEditor section={section} />;
}

export function ProjectSummarySectionEditor({ section }: SectionEditorProps) {
  return <DocumentSectionEditor section={section} />;
}

export function SitePhotoSummarySectionEditor({ section }: SectionEditorProps) {
  return <DocumentSectionEditor section={section} />;
}

export function ChecklistSectionEditor({ section }: SectionEditorProps) {
  return <DocumentSectionEditor section={section} />;
}

export function ConfirmationSectionEditor({ section }: SectionEditorProps) {
  return <DocumentSectionEditor section={section} />;
}

export function RiskReductionChecklistEditor({ section }: SectionEditorProps) {
  return <DocumentSectionEditor section={section} />;
}

export function AdditionalHazardChecklistEditor({ section }: SectionEditorProps) {
  return <DocumentSectionEditor section={section} />;
}

export function SafetyCostSectionEditor({ section }: SectionEditorProps) {
  return <DocumentSectionEditor section={section} />;
}

export function PhotoLedgerSectionEditor({ section }: SectionEditorProps) {
  return <DocumentSectionEditor section={section} />;
}

export function ScheduleAttachmentSectionEditor({ section }: SectionEditorProps) {
  return <DocumentSectionEditor section={section} />;
}

