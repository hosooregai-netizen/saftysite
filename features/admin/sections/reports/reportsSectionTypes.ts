'use client';

import type { SafetySite, SafetyUser } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';
import type { ControllerQualityStatus } from '@/types/admin';
import type { SafetyHeadquarter } from '@/types/controller';

export interface ReportsSectionProps {
  currentUser: SafetyUser;
  ensureSessionLoaded: (reportKey: string) => Promise<void>;
  getSessionById: (sessionId: string) => InspectionSession | null;
  headquarters: SafetyHeadquarter[];
  isLoading: boolean;
  onReloadData: (options?: {
    force?: boolean;
    includeContent?: boolean;
    includeReports?: boolean;
  }) => Promise<void>;
  sessions: InspectionSession[];
  sites: SafetySite[];
  users: SafetyUser[];
}

export interface ReportReviewForm {
  note: string;
  ownerUserId: string;
  qualityStatus: ControllerQualityStatus;
}
