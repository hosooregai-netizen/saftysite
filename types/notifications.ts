export type NotificationSeverity = 'info' | 'warning' | 'danger';
export type NotificationCategory =
  | 'report_dispatch'
  | 'report_deadline'
  | 'quality_review'
  | 'contract'
  | 'assignment'
  | 'schedule'
  | 'mail_received'
  | 'mail_replied';

export interface NotificationItem {
  id: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  title: string;
  description: string;
  href: string;
  isRead: boolean;
  isImportant: boolean;
  sourceType: string;
  sourceId: string;
  createdAt: string;
  siteId: string;
  reportKey: string;
  threadId: string;
  messageId: string;
}

export interface NotificationFeedResponse {
  unreadCount: number;
  unreadImportantCount: number;
  rows: NotificationItem[];
}
