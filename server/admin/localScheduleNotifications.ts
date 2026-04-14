import {
  buildSiteMemoWithScheduleNotifications,
  parseSiteScheduleNotifications,
  type SiteScheduleNotificationRecord,
} from '@/lib/admin/siteContractProfile';
import { buildWorkerCalendarHref } from '@/features/home/lib/site-entry/paths';
import type { SafetyInspectionSchedule } from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { NotificationFeedResponse, NotificationItem } from '@/types/notifications';

const LOCAL_SCHEDULE_NOTIFICATION_PREFIX = 'local-schedule:';

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeIdSegment(value: string) {
  return encodeURIComponent(normalizeText(value));
}

function buildNotificationId(
  siteId: string,
  scheduleId: string,
  userId: string,
  createdAt: string,
  kind: string,
) {
  return [
    LOCAL_SCHEDULE_NOTIFICATION_PREFIX,
    escapeIdSegment(siteId),
    ':',
    escapeIdSegment(scheduleId),
    ':',
    escapeIdSegment(userId),
    ':',
    escapeIdSegment(kind),
    ':',
    escapeIdSegment(createdAt),
  ].join('');
}

function buildNotificationTitle(schedule: SafetyInspectionSchedule, kind: string) {
  switch (kind) {
    case 'unassigned':
      return `${schedule.siteName} ${schedule.roundNo}회차 일정에서 해제되었습니다.`;
    case 'assigned':
      return `${schedule.siteName} ${schedule.roundNo}회차 일정이 배정되었습니다.`;
    default:
      return `${schedule.siteName} ${schedule.roundNo}회차 일정이 변경되었습니다.`;
  }
}

function buildNotificationDescription(input: {
  actorName: string;
  kind: string;
  nextSchedule: SafetyInspectionSchedule;
  previousSchedule: SafetyInspectionSchedule;
}) {
  const actorLabel = input.actorName || '관리자';
  const previousDate = normalizeText(input.previousSchedule.plannedDate) || '-';
  const nextDate = normalizeText(input.nextSchedule.plannedDate) || '-';

  if (input.kind === 'unassigned') {
    return `${actorLabel}님이 ${input.nextSchedule.siteName} ${input.nextSchedule.roundNo}회차 일정을 ${previousDate}에서 해제했습니다.`;
  }

  if (input.kind === 'assigned') {
    return `${actorLabel}님이 ${input.nextSchedule.siteName} ${input.nextSchedule.roundNo}회차 일정을 ${nextDate}로 배정했습니다.`;
  }

  return `${actorLabel}님이 ${input.nextSchedule.siteName} ${input.nextSchedule.roundNo}회차 일정을 ${previousDate}에서 ${nextDate}로 변경했습니다.`;
}

function toNotificationItem(record: SiteScheduleNotificationRecord): NotificationItem {
  return {
    category: 'schedule',
    createdAt: record.createdAt,
    description: record.description,
    href: record.href,
    id: record.id,
    isImportant: false,
    isRead: record.isRead,
    messageId: '',
    reportKey: '',
    severity: 'info',
    siteId: record.siteId,
    sourceId: record.scheduleId,
    sourceType: 'local_schedule',
    threadId: '',
    title: record.title,
  };
}

export function isLocalScheduleNotificationId(notificationId: string) {
  return normalizeText(notificationId).startsWith(LOCAL_SCHEDULE_NOTIFICATION_PREFIX);
}

export function buildScheduleChangeNotifications(input: {
  actorUser: Pick<SafetyUser, 'id' | 'name'> | null;
  nextSchedule: SafetyInspectionSchedule;
  previousSchedule: SafetyInspectionSchedule;
  site: SafetySite;
}): SiteScheduleNotificationRecord[] {
  const actorUserId = normalizeText(input.actorUser?.id);
  const actorName = normalizeText(input.actorUser?.name) || '관리자';
  const createdAt = new Date().toISOString();
  const records: SiteScheduleNotificationRecord[] = [];

  const pushRecord = (userId: string, kind: 'assigned' | 'rescheduled' | 'unassigned') => {
    const normalizedUserId = normalizeText(userId);
    if (!normalizedUserId || normalizedUserId === actorUserId) return;
    records.push({
      createdAt,
      description: buildNotificationDescription({
        actorName,
        kind,
        nextSchedule: input.nextSchedule,
        previousSchedule: input.previousSchedule,
      }),
      href: buildWorkerCalendarHref(input.site.id),
      id: buildNotificationId(
        input.site.id,
        input.nextSchedule.id,
        normalizedUserId,
        createdAt,
        kind,
      ),
      isRead: false,
      readAt: '',
      scheduleId: input.nextSchedule.id,
      siteId: input.site.id,
      title: buildNotificationTitle(input.nextSchedule, kind),
      userId: normalizedUserId,
    });
  };

  const previousAssigneeUserId = normalizeText(input.previousSchedule.assigneeUserId);
  const nextAssigneeUserId = normalizeText(input.nextSchedule.assigneeUserId);
  const previousDate = normalizeText(input.previousSchedule.plannedDate);
  const nextDate = normalizeText(input.nextSchedule.plannedDate);

  if (
    previousAssigneeUserId === nextAssigneeUserId &&
    previousDate === nextDate
  ) {
    return [];
  }

  if (
    previousAssigneeUserId &&
    nextAssigneeUserId &&
    previousAssigneeUserId !== nextAssigneeUserId
  ) {
    pushRecord(previousAssigneeUserId, 'unassigned');
    pushRecord(nextAssigneeUserId, 'assigned');
    return records;
  }

  if (!previousAssigneeUserId && nextAssigneeUserId) {
    pushRecord(nextAssigneeUserId, 'assigned');
    return records;
  }

  if (previousAssigneeUserId && !nextAssigneeUserId) {
    pushRecord(previousAssigneeUserId, 'unassigned');
    return records;
  }

  if (nextAssigneeUserId) {
    pushRecord(nextAssigneeUserId, 'rescheduled');
  }

  return records;
}

export function appendSiteScheduleNotifications(
  site: SafetySite,
  nextNotifications: SiteScheduleNotificationRecord[],
) {
  if (nextNotifications.length === 0) {
    return site.memo;
  }

  const merged = [
    ...parseSiteScheduleNotifications(site),
    ...nextNotifications,
  ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return buildSiteMemoWithScheduleNotifications(site, merged);
}

export function getLocalScheduleNotificationsForUser(
  sites: SafetySite[],
  userId: string,
): NotificationItem[] {
  const normalizedUserId = normalizeText(userId);
  return sites
    .flatMap((site) => parseSiteScheduleNotifications(site))
    .filter((record) => record.userId === normalizedUserId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((record) => toNotificationItem(record));
}

export function mergeNotificationFeeds(
  upstreamFeed: NotificationFeedResponse,
  localRows: NotificationItem[],
): NotificationFeedResponse {
  const rows = [...upstreamFeed.rows, ...localRows].sort(
    (left, right) => right.createdAt.localeCompare(left.createdAt),
  );

  const unreadLocalCount = localRows.filter((item) => !item.isRead).length;
  const unreadLocalImportantCount = localRows.filter(
    (item) => !item.isRead && item.isImportant,
  ).length;

  return {
    rows,
    unreadCount: upstreamFeed.unreadCount + unreadLocalCount,
    unreadImportantCount:
      upstreamFeed.unreadImportantCount + unreadLocalImportantCount,
  };
}

export function acknowledgeLocalScheduleNotification(
  site: SafetySite,
  notificationId: string,
  userId: string,
) {
  const notifications = parseSiteScheduleNotifications(site);
  let acknowledged = false;

  const nextNotifications = notifications.map((record) => {
    if (
      record.id !== notificationId ||
      record.userId !== normalizeText(userId) ||
      record.isRead
    ) {
      return record;
    }

    acknowledged = true;
    return {
      ...record,
      isRead: true,
      readAt: new Date().toISOString(),
    };
  });

  return {
    acknowledged,
    acknowledgedIds: acknowledged ? [notificationId] : [],
    memo: acknowledged ? buildSiteMemoWithScheduleNotifications(site, nextNotifications) : site.memo,
  };
}

export function acknowledgeAllLocalScheduleNotifications(
  site: SafetySite,
  userId: string,
) {
  const notifications = parseSiteScheduleNotifications(site);
  const acknowledgedIds: string[] = [];

  const nextNotifications = notifications.map((record) => {
    if (record.userId !== normalizeText(userId) || record.isRead) {
      return record;
    }

    acknowledgedIds.push(record.id);
    return {
      ...record,
      isRead: true,
      readAt: new Date().toISOString(),
    };
  });

  return {
    acknowledgedIds,
    memo:
      acknowledgedIds.length > 0
        ? buildSiteMemoWithScheduleNotifications(site, nextNotifications)
        : site.memo,
  };
}
