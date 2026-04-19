import assert from 'node:assert/strict';
import test from 'node:test';

import { createInspectionSession } from '@/constants/inspectionSession/sessionFactory';
import {
  selectQuarterlyAppendixSessions,
  type QuarterlySelectableSessionRecord,
} from './requestResolver';

function buildSessionRecord(
  reportKey: string,
  options: {
    isTechnicalGuidance?: boolean;
    sessionMissing?: boolean;
  } = {},
): QuarterlySelectableSessionRecord {
  return {
    isTechnicalGuidance: options.isTechnicalGuidance ?? true,
    reportKey,
    session: options.sessionMissing ? null : createInspectionSession({}, 'site-1'),
  };
}

test('selectQuarterlyAppendixSessions preserves generatedFromSessionIds order', () => {
  const first = buildSessionRecord('report-1');
  const second = buildSessionRecord('report-2');

  const result = selectQuarterlyAppendixSessions(
    ['report-2', 'report-1'],
    [first, second],
  );

  assert.equal(result.length, 2);
  assert.equal(result[0], second.session);
  assert.equal(result[1], first.session);
});

test('selectQuarterlyAppendixSessions rejects missing report keys', () => {
  assert.throws(
    () => selectQuarterlyAppendixSessions(['missing-report'], [buildSessionRecord('report-1')]),
    /missing-report/,
  );
});

test('selectQuarterlyAppendixSessions rejects non-technical guidance reports', () => {
  assert.throws(
    () =>
      selectQuarterlyAppendixSessions(
        ['quarterly-report'],
        [buildSessionRecord('quarterly-report', { isTechnicalGuidance: false })],
      ),
    /quarterly-report/,
  );
});

test('selectQuarterlyAppendixSessions returns an empty list when nothing is selected', () => {
  assert.deepEqual(selectQuarterlyAppendixSessions([], [buildSessionRecord('report-1')]), []);
  assert.deepEqual(
    selectQuarterlyAppendixSessions(['', '   '], [buildSessionRecord('report-1')]),
    [],
  );
});
