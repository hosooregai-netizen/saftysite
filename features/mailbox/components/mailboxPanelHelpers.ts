'use client';

import type {
  MailAccount,
  MailAccountSyncMetadata,
  MailProviderStatus,
  MailThread,
  MailThreadDetail,
} from '@/types/mail';
import {
  DEFAULT_SHARED_MAILBOX_EMAIL,
  DEFAULT_SHARED_MAILBOX_NAME,
  type MailboxSyncStatusSummary,
} from './mailboxPanelTypes';

function countHangulCharacters(value: string) {
  return Array.from(value).filter((char) => char >= '\uac00' && char <= '\ud7a3').length;
}

function repairMojibakeText(value: string | null | undefined) {
  const normalized = value?.trim() || '';
  if (!normalized) return '';
  const bytes = Array.from(normalized, (char) => char.charCodeAt(0));
  if (bytes.some((code) => code > 0xff)) return normalized;
  try {
    const repaired = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
    return countHangulCharacters(repaired) > countHangulCharacters(normalized)
      ? repaired.trim()
      : normalized;
  } catch {
    return normalized;
  }
}

function isDefaultSharedMailbox(input: {
  email: string;
  provider: MailAccount['provider'] | MailThread['provider'];
  scope: MailAccount['scope'] | MailThread['scope'];
}) {
  return (
    input.scope === 'shared' &&
    input.provider === 'naver_works' &&
    input.email.trim().toLowerCase() === DEFAULT_SHARED_MAILBOX_EMAIL
  );
}

function formatSyncDateTime(value: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function normalizeMailAccountUi(account: MailAccount): MailAccount {
  const displayName = repairMojibakeText(account.displayName) || account.email;
  const mailboxLabel = repairMojibakeText(account.mailboxLabel) || displayName || account.email;
  if (isDefaultSharedMailbox(account)) {
    return {
      ...account,
      displayName: DEFAULT_SHARED_MAILBOX_NAME,
      mailboxLabel: DEFAULT_SHARED_MAILBOX_NAME,
    };
  }
  return {
    ...account,
    displayName,
    mailboxLabel,
  };
}

export function normalizeMailThreadUi(thread: MailThread): MailThread {
  const accountDisplayName = repairMojibakeText(thread.accountDisplayName) || thread.accountEmail;
  if (
    isDefaultSharedMailbox({
      email: thread.accountEmail,
      provider: thread.provider,
      scope: thread.scope,
    })
  ) {
    return {
      ...thread,
      accountDisplayName: DEFAULT_SHARED_MAILBOX_NAME,
    };
  }
  return {
    ...thread,
    accountDisplayName,
  };
}

export function normalizeMailThreadDetailUi(detail: MailThreadDetail): MailThreadDetail {
  return {
    ...detail,
    thread: normalizeMailThreadUi(detail.thread),
  };
}

export function readMailAccountSyncMetadata(account: MailAccount | null): MailAccountSyncMetadata | null {
  if (!account || account.provider !== 'google' || account.scope !== 'personal') return null;
  const metadata = account.metadata ?? {};
  return {
    historyCursor: typeof metadata.historyCursor === 'string' ? metadata.historyCursor : null,
    initialBackfillCompleted: Boolean(metadata.initialBackfillCompleted),
    lastFullSyncAt: typeof metadata.lastFullSyncAt === 'string' ? metadata.lastFullSyncAt : null,
    lastIncrementalSyncAt:
      typeof metadata.lastIncrementalSyncAt === 'string' ? metadata.lastIncrementalSyncAt : null,
    queuedPageToken: typeof metadata.queuedPageToken === 'string' ? metadata.queuedPageToken : null,
    syncError: typeof metadata.syncError === 'string' ? metadata.syncError : null,
    syncStartedAt: typeof metadata.syncStartedAt === 'string' ? metadata.syncStartedAt : null,
    syncStatus: typeof metadata.syncStatus === 'string' ? metadata.syncStatus : 'idle',
  };
}

export function buildSyncStatusSummary(
  syncMeta: MailAccountSyncMetadata | null,
): MailboxSyncStatusSummary | null {
  if (!syncMeta) return null;
  if (syncMeta.syncStatus === 'backfilling') {
    return {
      tone: 'progress',
      title: '전체 메일함 초기 동기화 중',
      description: syncMeta.queuedPageToken
        ? '오래된 메일까지 순차적으로 저장하고 있습니다. 백그라운드 동기화가 계속 이어집니다.'
        : '전체 메일함을 처음부터 저장하고 있습니다. 오래된 메일은 순차적으로 추가됩니다.',
    };
  }
  if (syncMeta.syncStatus === 'incremental') {
    return {
      tone: 'progress',
      title: '메일 변경 사항 동기화 중',
      description: '새로 들어온 메일과 변경된 스레드를 반영하고 있습니다.',
    };
  }
  if (syncMeta.syncStatus === 'error') {
    return {
      tone: 'error',
      title: '메일 동기화 오류',
      description: syncMeta.syncError || '다음 백그라운드 동기화나 새로 고침에서 다시 시도합니다.',
    };
  }
  if (syncMeta.initialBackfillCompleted) {
    const basis = formatSyncDateTime(syncMeta.lastIncrementalSyncAt || syncMeta.lastFullSyncAt);
    return {
      tone: 'ready',
      title: '전체 메일함이 저장되어 있습니다',
      description: basis
        ? `최근 동기화 ${basis}. 받은편지함, 보낸편지함, 보관 메일까지 DB 기준으로 표시합니다.`
        : '받은편지함, 보낸편지함, 보관 메일까지 DB 기준으로 표시합니다.',
    };
  }
  return {
    tone: 'progress',
    title: '전체 메일함 초기 동기화 미완료',
    description:
      '오래된 메일 가져오기가 아직 끝나지 않았습니다. 현재 동기화가 실행 중이 아닐 수도 있으며, 새로 고침이나 백그라운드 동기화 때 이어집니다.',
  };
}

export function formatDateTime(value: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildProviderStatusLabel(provider: MailProviderStatus | undefined) {
  if (!provider) return '-';
  if (!provider.enabled) return '설정 필요';
  return provider.isRedirectAllowed ? '준비 완료' : '리디렉션 확인';
}

export function buildProviderStatusDetail(provider: MailProviderStatus | undefined) {
  if (!provider) return '';
  if (provider.missingFields.length > 0) return `필수값 ${provider.missingFields.join(', ')}`;
  if (!provider.enabled) return '필수값을 확인하세요.';
  if (!provider.isRedirectAllowed) return '리디렉션 주소를 확인하세요.';
  return '연결 가능';
}

export function buildThreadTimestamp(thread: MailThread) {
  return formatDateTime(thread.lastMessageAt);
}
