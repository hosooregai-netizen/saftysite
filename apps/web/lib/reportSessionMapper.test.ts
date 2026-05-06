import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDemoReport } from './demoReport';
import { mapReportPayloadToInspectionSession } from './reportSessionMapper';

test('mapReportPayloadToInspectionSession maps standard draft fields into export session', () => {
  const report = buildDemoReport('demo-review');
  report.photoEvidence = report.photoEvidence.map((item) => ({
    ...item,
    imageUrl: `/photos/${item.photoAssetId}.jpg`,
  }));
  const session = mapReportPayloadToInspectionSession(report.id, report);

  assert.ok(session.document7Findings.length > 0);
  assert.ok(session.document8Plans.length > 0);

  const firstFinding = session.document7Findings[0];
  const firstPlan = session.document8Plans[0];
  const sourceFinding = report.findingCandidates[0];
  const sourcePlan = report.sectionDrafts.doc8[0];

  assert.equal(firstFinding.location, sourceFinding.location);
  assert.equal(firstFinding.hazardDescription, sourceFinding.hazardDescription);
  assert.equal(firstFinding.improvementPlan, sourceFinding.improvementPlan);
  assert.equal(firstFinding.emphasis, sourceFinding.emphasis);
  assert.equal(firstFinding.photoUrl !== '' || firstFinding.photoUrl2 !== '', true);

  assert.equal(firstPlan.processName, sourcePlan.processName);
  assert.equal(firstPlan.hazard, sourcePlan.hazard);
  assert.equal(firstPlan.countermeasure, sourcePlan.countermeasure);
  assert.equal(firstPlan.note, sourcePlan.note ?? '');
  assert.equal(firstPlan.source, 'api');

  assert.equal(
    session.document5Summary.summaryText,
    report.sectionDrafts.doc5.futureProcessFocus,
  );
});
