import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildToggledReportDispatch,
  normalizeReportDispatchMeta,
} from './reportDispatch';

test('normalizeReportDispatchMeta maps snake_case dispatch metadata', () => {
  const normalized = normalizeReportDispatchMeta({
    actual_recipient: 'actual@example.com',
    dispatch_checked_at: '2026-04-01T01:00:00.000Z',
    dispatch_checked_by: 'user-1',
    dispatch_method: 'system_email',
    dispatch_status: 'sent',
    dispatched_at: '2026-04-01T00:30:00.000Z',
    mailbox_account_id: 'mailbox-1',
    mail_thread_id: 'thread-1',
    message_id: 'message-1',
    read_at: '2026-04-01T02:00:00.000Z',
    recipient: 'site@example.com',
    reply_at: '2026-04-01T03:00:00.000Z',
    reply_summary: 'ok',
    sent_history: [
      {
        id: 'history-1',
        memo: 'first send',
        sent_at: '2026-04-01T00:30:00.000Z',
        sent_by_user_id: 'user-1',
      },
    ],
  });

  assert.equal(normalized.dispatchStatus, 'sent');
  assert.equal(normalized.dispatchMethod, 'system_email');
  assert.equal(normalized.dispatchedAt, '2026-04-01T00:30:00.000Z');
  assert.equal(normalized.dispatchCheckedBy, 'user-1');
  assert.equal(normalized.mailboxAccountId, 'mailbox-1');
  assert.equal(normalized.mailThreadId, 'thread-1');
  assert.equal(normalized.messageId, 'message-1');
  assert.equal(normalized.actualRecipient, 'actual@example.com');
  assert.equal(normalized.readAt, '2026-04-01T02:00:00.000Z');
  assert.equal(normalized.replyAt, '2026-04-01T03:00:00.000Z');
  assert.equal(normalized.replySummary, 'ok');
  assert.deepEqual(normalized.sentHistory, [
    {
      id: 'history-1',
      memo: 'first send',
      sentAt: '2026-04-01T00:30:00.000Z',
      sentByUserId: 'user-1',
    },
  ]);
});

test('buildToggledReportDispatch appends history and preserves mail metadata', () => {
  const next = buildToggledReportDispatch(
    {
      dispatch_status: 'sent',
      mailbox_account_id: 'mailbox-1',
      mail_thread_id: 'thread-1',
      message_id: 'message-1',
      recipient: 'site@example.com',
      sent_history: [
        {
          id: 'history-1',
          memo: 'first send',
          sent_at: '2026-04-01T00:30:00.000Z',
          sent_by_user_id: 'user-1',
        },
      ],
    },
    {
      currentUserId: 'admin-1',
      historyMemo: 'manual toggle',
      nextCompleted: true,
      now: '2026-04-02T00:00:00.000Z',
    },
  );

  assert.equal(next.dispatchStatus, 'manual_checked');
  assert.equal(next.dispatchMethod, 'manual');
  assert.equal(next.dispatchCheckedBy, 'admin-1');
  assert.equal(next.dispatchCheckedAt, '2026-04-02T00:00:00.000Z');
  assert.equal(next.mailboxAccountId, 'mailbox-1');
  assert.equal(next.mailThreadId, 'thread-1');
  assert.equal(next.messageId, 'message-1');
  assert.equal(next.recipient, 'site@example.com');
  assert.deepEqual(
    next.sentHistory.map((entry) => entry.memo),
    ['first send', 'manual toggle'],
  );
});

test('buildToggledReportDispatch marks pending as explicit none', () => {
  const next = buildToggledReportDispatch(
    {
      dispatch_status: 'manual_checked',
      dispatch_checked_at: '2026-04-01T00:00:00.000Z',
      dispatch_checked_by: 'user-1',
      sent_history: [],
    },
    {
      currentUserId: 'admin-1',
      nextCompleted: false,
      now: '2026-04-02T00:00:00.000Z',
    },
  );

  assert.equal(next.dispatchStatus, 'none');
  assert.equal(next.dispatchCheckedBy, '');
  assert.equal(next.dispatchCheckedAt, '');
  assert.equal(next.sentHistory.length, 1);
});
