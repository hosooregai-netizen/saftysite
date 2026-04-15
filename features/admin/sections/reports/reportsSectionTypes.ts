'use client';

import type { SafetyUser } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';
import type { ControllerQualityStatus } from '@/types/admin';

export interface ReportsSectionProps {
  currentUser: SafetyUser;
  ensureSessionLoaded: (reportKey: string) => Promise<void>;
  getSessionById: (sessionId: string) => InspectionSession | null;
  isLoading: boolean;
  onReloadData: (options?: {
    force?: boolean;
    includeContent?: boolean;
    includeReports?: boolean;
  }) => Promise<void>;
  sessions: InspectionSession[];
}

export interface ReportReviewForm {
  note: string;
  ownerUserId: string;
  qualityStatus: ControllerQualityStatus;
}

export interface ReportsUserOption {
  id: string;
  name: string;
}
