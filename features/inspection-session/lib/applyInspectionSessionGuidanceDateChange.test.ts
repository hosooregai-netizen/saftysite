import assert from 'node:assert/strict';
import test from 'node:test';

import { createInspectionSession } from '@/constants/inspectionSession';
import {
  applyInspectionSessionGuidanceDateChange,
  buildInspectionAutoReportTitle,
} from './applyInspectionSessionGuidanceDateChange';

test('guidance date change syncs report date, auto title, and default confirmation dates', () => {
  const session = createInspectionSession(
    {
      meta: {
        reportDate: '2026-04-01',
        reportTitle: buildInspectionAutoReportTitle('2026-04-01', 1),
      },
    },
    'site-1',
    1,
  );
  session.document2Overview.guidanceDate = '2026-04-01';
  session.document4FollowUps = [
    {
      id: 'follow-up-1',
      location: 'A',
      guidanceDate: '2026-03-01',
      confirmationDate: '2026-04-01',
      beforePhotoUrl: '',
      afterPhotoUrl: '',
      result: '',
    },
    {
      id: 'follow-up-2',
      location: 'B',
      guidanceDate: '2026-03-02',
      confirmationDate: '2026-04-10',
      beforePhotoUrl: '',
      afterPhotoUrl: '',
      result: '',
    },
  ];

  const next = applyInspectionSessionGuidanceDateChange(session, '2026-04-09');

  assert.equal(next.document2Overview.guidanceDate, '2026-04-09');
  assert.equal(next.meta.reportDate, '2026-04-09');
  assert.equal(next.meta.reportTitle, buildInspectionAutoReportTitle('2026-04-09', 1));
  assert.equal(next.document4FollowUps[0].confirmationDate, '2026-04-09');
  assert.equal(next.document4FollowUps[1].confirmationDate, '2026-04-10');
});

test('guidance date change refreshes a manual title with the current date and round', () => {
  const session = createInspectionSession(
    {
      meta: {
        reportDate: '2026-04-01',
        reportTitle: '수동 제목',
      },
    },
    'site-1',
    2,
  );
  session.document2Overview.guidanceDate = '2026-04-01';

  const next = applyInspectionSessionGuidanceDateChange(session, '2026-04-09');

  assert.equal(next.document2Overview.guidanceDate, '2026-04-09');
  assert.equal(next.meta.reportDate, '2026-04-09');
  assert.equal(next.meta.reportTitle, buildInspectionAutoReportTitle('2026-04-09', 2));
});

test('guidance date change refreshes stale auto titles with the current round', () => {
  const session = createInspectionSession(
    {
      meta: {
        reportDate: '2026-04-28',
        reportTitle: '2026-04-28 보고서 7',
      },
    },
    'site-1',
    6,
  );
  session.document2Overview.guidanceDate = '2026-04-28';

  const next = applyInspectionSessionGuidanceDateChange(session, '2026-04-30');

  assert.equal(next.meta.reportTitle, '2026-04-30 보고서 6');
});
