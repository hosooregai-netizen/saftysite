'use client';

import { useMemo, useState } from 'react';
import OperationalKpiPanel from '@/components/controller/OperationalKpiPanel';
import {
  buildAdminOverviewModel,
  type AdminOverviewAsyncKpiState,
} from '@/features/admin/lib/buildAdminOverviewModel';
import type { ControllerDashboardData } from '@/types/controller';
import type { InspectionSession } from '@/types/inspectionSession';

interface AdminOverviewSectionProps {
  data: ControllerDashboardData;
  sessions: InspectionSession[];
}

const EMPTY_ASYNC_KPI_STATE: AdminOverviewAsyncKpiState = {
  pendingAgentRows: [],
  urgentSiteRows: [],
};

export function AdminOverviewSection({
  data,
  sessions,
}: AdminOverviewSectionProps) {
  const [asyncKpiState, setAsyncKpiState] = useState<AdminOverviewAsyncKpiState>(
    EMPTY_ASYNC_KPI_STATE,
  );
  const overview = useMemo(
    () => buildAdminOverviewModel(data, sessions, asyncKpiState),
    [asyncKpiState, data, sessions],
  );

  return (
    <OperationalKpiPanel
      coverageEntries={overview.coverageEntries}
      onDataChange={setAsyncKpiState}
      reportProgressEntries={overview.reportProgressEntries}
      sites={data.sites}
      users={data.users}
    />
  );
}
