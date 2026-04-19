import assert from 'node:assert/strict';
import test from 'node:test';

import JSZip from 'jszip';

import {
  createInspectionSession,
  createInspectionSite,
} from '@/constants/inspectionSession/sessionFactory';
import { buildInspectionHwpxDocument } from './hwpx';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildMeasurementFixture(accidentOccurred: 'no' | 'yes') {
  const site = createInspectionSite({
    assigneeName: '담당자',
    customerName: '고객사',
    siteName: '테스트 현장',
  });
  const session = createInspectionSession(
    {
      adminSiteSnapshot: site.adminSiteSnapshot,
      meta: {
        drafter: '작성자',
        reportDate: '2026-04-20',
        reportTitle: '계측점검 테스트',
      },
    },
    site.id,
    1,
  );

  session.document2Overview.accidentOccurred = accidentOccurred;
  session.document10Measurements = [
    {
      ...session.document10Measurements[0],
      instrumentType: '습구흑구온도지수(WBGT) 측정기',
      measurementLocation: '123',
      measuredValue: '29.1℃',
      actionTaken: '양호',
      safetyCriteria: '경작업: 30.0~32.2℃ 이하',
    },
    {
      ...session.document10Measurements[1],
      instrumentType: '조도계',
      measurementLocation: 'B1 통로',
      measuredValue: '750 Lux',
      actionTaken: '개선 필요',
      safetyCriteria: '정밀작업: 300 Lux 이상',
    },
    {
      ...session.document10Measurements[2],
      instrumentType: '가스측정기',
      measurementLocation: '지하층',
      measuredValue: '정상',
      actionTaken: '모니터링',
      safetyCriteria: '허용기준 이내',
    },
  ];

  return session;
}

async function readGeneratedSectionXml(accidentOccurred: 'no' | 'yes') {
  const session = buildMeasurementFixture(accidentOccurred);
  const document = await buildInspectionHwpxDocument(session, [session]);
  const zip = await JSZip.loadAsync(document.buffer);
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(sectionXml);
  return sectionXml;
}

test('buildInspectionHwpxDocument binds doc10 measurement values for both inspection template variants', async () => {
  const expectedValues = [
    '123',
    '29.1℃',
    '양호',
    '경작업: 30.0~32.2℃ 이하',
    'B1 통로',
    '750 Lux',
    '개선 필요',
    '정밀작업: 300 Lux 이상',
    '지하층',
    '정상',
    '모니터링',
    '허용기준 이내',
  ];
  const removedTokens = [
    '{sec10.measurements[0].measurement_location}',
    '{sec10.measurements[0].measured_value}',
    '{sec10.measurements[0].action_taken}',
    '{sec10.measurements[0].safety_criteria}',
    '{sec10.measurements[1].measurement_location}',
    '{sec10.measurements[1].measured_value}',
    '{sec10.measurements[1].action_taken}',
    '{sec10.measurements[1].safety_criteria}',
    '{sec10.measurements[2].measurement_location}',
    '{sec10.measurements[2].measured_value}',
    '{sec10.measurements[2].action_taken}',
    '{sec10.measurements[2].safety_criteria}',
  ];

  for (const accidentOccurred of ['no', 'yes'] as const) {
    const sectionXml = await readGeneratedSectionXml(accidentOccurred);

    for (const value of expectedValues) {
      assert.match(sectionXml, new RegExp(escapeRegExp(value)));
    }

    for (const token of removedTokens) {
      assert.doesNotMatch(sectionXml, new RegExp(escapeRegExp(token)));
    }
  }
});
