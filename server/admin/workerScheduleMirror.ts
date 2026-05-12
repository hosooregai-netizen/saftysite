import { upsertSiteScheduleByRound } from '@/server/admin/automation';
import {
  fetchAdminSiteServer,
  updateAdminSite,
} from '@/server/admin/safetyApiServer';
import type { SafetyInspectionSchedule } from '@/types/admin';
import type { SafetySite } from '@/types/backend';

const WORKER_SCHEDULE_MIRROR_KEY = '__SAFETY_WORKER_SCHEDULE_MIRROR__';

interface WorkerScheduleMirrorStore {
  byId: Map<string, SafetyInspectionSchedule>;
  idBySiteRound: Map<string, string>;
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function getWorkerScheduleMirrorStore() {
  const globalRecord = globalThis as typeof globalThis & {
    [WORKER_SCHEDULE_MIRROR_KEY]?: WorkerScheduleMirrorStore;
  };
  if (!globalRecord[WORKER_SCHEDULE_MIRROR_KEY]) {
    globalRecord[WORKER_SCHEDULE_MIRROR_KEY] = {
      byId: new Map(),
      idBySiteRound: new Map(),
    };
  }
  return globalRecord[WORKER_SCHEDULE_MIRROR_KEY]!;
}

function getSiteRoundKey(schedule: Pick<SafetyInspectionSchedule, 'roundNo' | 'siteId'>) {
  return schedule.siteId && schedule.roundNo > 0
    ? `${schedule.siteId}:${schedule.roundNo}`
    : '';
}

function normalizeMirrorRow(schedule: SafetyInspectionSchedule): SafetyInspectionSchedule {
  return {
    ...schedule,
    selectionConfirmedAt:
      normalizeText(schedule.selectionConfirmedAt) ||
      (schedule.plannedDate || schedule.actualVisitDate || schedule.linkedReportKey
        ? new Date().toISOString()
        : ''),
  };
}

export function rememberWorkerScheduleMirrorRows(schedules: SafetyInspectionSchedule[]) {
  const store = getWorkerScheduleMirrorStore();

  schedules.forEach((schedule) => {
    if (!schedule.id || !schedule.siteId || schedule.roundNo <= 0) return;

    const nextSchedule = normalizeMirrorRow(schedule);
    const siteRoundKey = getSiteRoundKey(nextSchedule);
    const previousId = store.idBySiteRound.get(siteRoundKey);
    if (previousId && previousId !== nextSchedule.id) {
      store.byId.delete(previousId);
    }

    store.byId.set(nextSchedule.id, nextSchedule);
    if (siteRoundKey) {
      store.idBySiteRound.set(siteRoundKey, nextSchedule.id);
    }
  });
}

export function getWorkerScheduleMirrorRows() {
  return Array.from(getWorkerScheduleMirrorStore().byId.values());
}

export function clearWorkerScheduleMirrorRowsForTests() {
  const store = getWorkerScheduleMirrorStore();
  store.byId.clear();
  store.idBySiteRound.clear();
}

export function buildWorkerScheduleMirrorMemo(
  site: SafetySite,
  schedule: SafetyInspectionSchedule,
) {
  if (!schedule.siteId || schedule.roundNo <= 0) {
    return null;
  }

  return upsertSiteScheduleByRound(
    site,
    [],
    schedule.roundNo,
    {
      actualVisitDate: schedule.actualVisitDate,
      assigneeName: schedule.assigneeName,
      assigneeUserId: schedule.assigneeUserId,
      linkedReportKey: schedule.linkedReportKey,
      plannedDate: schedule.plannedDate,
      selectionReasonLabel: schedule.selectionReasonLabel,
      selectionReasonMemo: schedule.selectionReasonMemo,
      status: schedule.status,
    },
    {
      actorUserId:
        normalizeText(schedule.selectionConfirmedByUserId) ||
        normalizeText(schedule.assigneeUserId),
      actorUserName:
        normalizeText(schedule.selectionConfirmedByName) ||
        normalizeText(schedule.assigneeName),
    },
  ).memo;
}

export function buildWorkerSchedulesMirrorMemo(
  site: SafetySite,
  schedules: SafetyInspectionSchedule[],
) {
  const siteSchedules = schedules
    .filter((schedule) => schedule.siteId === site.id && schedule.roundNo > 0)
    .sort((left, right) => left.roundNo - right.roundNo);
  if (siteSchedules.length === 0) {
    return null;
  }

  let nextMemo = site.memo ?? null;
  siteSchedules.forEach((schedule) => {
    const mirroredMemo = buildWorkerScheduleMirrorMemo(
      {
        ...site,
        memo: nextMemo,
      },
      schedule,
    );
    if (mirroredMemo !== null) {
      nextMemo = mirroredMemo;
    }
  });

  return nextMemo === (site.memo ?? null) ? null : nextMemo;
}

export async function mirrorWorkerScheduleToSiteMemo(
  token: string,
  schedule: SafetyInspectionSchedule,
  request: Request | null = null,
) {
  rememberWorkerScheduleMirrorRows([schedule]);

  if (!schedule.siteId || schedule.roundNo <= 0) {
    return;
  }

  try {
    const site = await fetchAdminSiteServer(token, schedule.siteId, request);
    const memo = buildWorkerSchedulesMirrorMemo(site, [schedule]);
    if (memo == null) return;
    await updateAdminSite(token, schedule.siteId, { memo }, request);
  } catch {
    // The worker schedule write is the source of truth; memo mirroring is best-effort for admin snapshots.
  }
}

export async function mirrorWorkerSchedulesToSiteMemo(
  token: string,
  schedules: SafetyInspectionSchedule[],
  request: Request | null = null,
) {
  rememberWorkerScheduleMirrorRows(schedules);

  const siteIds = Array.from(
    new Set(
      schedules
        .filter((schedule) => schedule.plannedDate || schedule.actualVisitDate || schedule.linkedReportKey)
        .map((schedule) => schedule.siteId)
        .filter(Boolean),
    ),
  );

  await Promise.all(
    siteIds.map(async (siteId) => {
      try {
        const site = await fetchAdminSiteServer(token, siteId, request);
        const memo = buildWorkerSchedulesMirrorMemo(
          site,
          schedules.filter((schedule) => schedule.siteId === siteId),
        );
        if (memo == null) return;
        await updateAdminSite(token, siteId, { memo }, request);
      } catch {
        // Keep schedule reads resilient even when memo mirroring is unavailable.
      }
    }),
  );
}
