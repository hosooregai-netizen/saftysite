import type { InspectionSession } from '@/types/inspectionSession';

export type InspectionWordTemplateId = 'default-inspection';

export interface GenerateInspectionWordRequest {
  session: InspectionSession;
  siteSessions?: InspectionSession[];
  templateId?: InspectionWordTemplateId;
}
