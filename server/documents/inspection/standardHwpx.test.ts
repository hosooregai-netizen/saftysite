import assert from 'node:assert/strict';
import test from 'node:test';

import JSZip from 'jszip';

import {
  createInspectionSession,
  createInspectionSite,
} from '@/constants/inspectionSession/sessionFactory';
import {
  createCurrentHazardFinding,
  createFutureProcessRiskPlan,
  createPreviousGuidanceFollowUpItem,
  createSafetyEducationRecord,
  createActivityRecord,
} from '@/constants/inspectionSession/itemFactory';
import { buildStandardInspectionHwpxDocument } from './standardHwpx';

const PREVIOUS_STATUS_EXPECTED = {
  implemented: '\u2611\uC774\uD589 / \u2610\uBD88\uC774\uD589 / \u2610\uD574\uB2F9\uC5C6\uC74C',
  partial: '\u2611\uC774\uD589 / \u2611\uBD88\uC774\uD589 / \u2610\uD574\uB2F9\uC5C6\uC74C',
  not_implemented: '\u2610\uC774\uD589 / \u2611\uBD88\uC774\uD589 / \u2610\uD574\uB2F9\uC5C6\uC74C',
  not_applicable: '\u2610\uC774\uD589 / \u2610\uBD88\uC774\uD589 / \u2611\uD574\uB2F9\uC5C6\uC74C',
  unchecked: '\u2610\uC774\uD589 / \u2610\uBD88\uC774\uD589 / \u2610\uD574\uB2F9\uC5C6\uC74C',
} as const;

function flattenXmlText(xml: string) {
  return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

test('buildStandardInspectionHwpxDocument renders standard report content and clears template samples', async () => {
  const site = createInspectionSite({
    customerName: '성수건설',
    siteName: '세종 복합센터 현장',
    assigneeName: '홍길동',
    siteManagementNumber: 'MG-2026-001',
    businessStartNumber: 'BS-2026-002',
    constructionPeriod: '2026.04.01 ~ 2026.12.31',
    constructionAmount: '1,200,000,000원',
    siteManagerName: '김현장',
    siteContactEmail: '010-1111-2222',
    siteAddress: '세종시 한누리대로 100',
    companyName: '성수건설',
    corporationRegistrationNumber: '110111-1111111',
    businessRegistrationNumber: '123-45-67890',
    licenseNumber: '제2026-01호',
    headquartersContact: '02-1111-2222',
    headquartersAddress: '서울시 중구 예시로 10',
  });
  const session = createInspectionSession(
    {
      meta: {
        siteName: site.siteName,
        reportDate: '2026-04-30',
        reportTitle: '표준보고서 테스트',
        drafter: '홍길동',
      },
      adminSiteSnapshot: site.adminSiteSnapshot,
    },
    site.id,
    2,
  );

  session.document2Overview.guidanceAgencyName = '새 기관명';
  session.document2Overview.guidanceDate = '2026-04-30';
  session.document2Overview.constructionType = '건설공사';
  session.document2Overview.progressRate = '68';
  session.document2Overview.visitCount = '2';
  session.document2Overview.totalVisitCount = '5';
  session.document2Overview.previousImplementationStatus = 'implemented';
  session.document2Overview.contact = '010-1111-2222';
  session.document2Overview.notificationMethod = 'direct';
  session.document2Overview.notificationRecipientName = '박담당';
  session.document2Overview.processAndNotes = '터파기 및 가설공사 진행 중.\n특이사항 없음.';

  session.document4FollowUps = [
    createPreviousGuidanceFollowUpItem({
      location: '지하층 슬라브 단부',
      hazardDescription: '안전난간 미설치',
      actionRequired: '난간대 및 중간난간 설치',
      result: '확인 필요',
      guidanceDate: '2026-04-20',
      confirmationDate: '2026-04-30',
    }),
  ];

  session.document7Findings = [
    createCurrentHazardFinding({
      location: '타설 구간 통로',
      hazardDescription: '낙하 위험',
      improvementPlan: '출입 통제선과 방호선반 설치',
      emphasis: '추가 점검 필요',
      riskLevel: '상',
    }),
  ];

  session.document8Plans = [
    createFutureProcessRiskPlan({
      processName: '기초 및 토공사',
      hazard: '굴착기 작업반경 충돌',
      countermeasure: '신호수 배치 및 출입통제',
      note: '우천 시 재점검',
    }),
  ];
  session.document5Summary.summaryText =
    '향후 기초 및 토공사 공정에서 유해·위험요인 및 예방대책 재점검 필요';

  session.document11EducationRecords = [
    createSafetyEducationRecord({
      attendeeCount: '12명',
      topic: 'TBM 교육',
      content: '낙하 및 충돌 예방 교육',
      materialName: '안전보건교육자료',
    }),
  ];
  session.document12Activities = [
    createActivityRecord({
      activityType: '안전보건교육자료 배포',
      content: '작업 전 교육자료 전달 및 확인',
    }),
  ];
  session.document14SafetyInfos = [
    {
      id: 'memo-1',
      title: '기타 메모',
      body: '다음 방문 전 추락방지 조치 재확인.',
      imageUrl: '',
    },
  ];

  const document = await buildStandardInspectionHwpxDocument(session, [session]);
  const zip = await JSZip.loadAsync(document.buffer);
  const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

  assert.ok(sectionXml);
  const flattened = flattenXmlText(sectionXml);
  assert.match(flattened, /세종 복합센터 현장/);
  assert.match(flattened, /MG-2026-001/);
  assert.match(flattened, /새 기관명/);
  assert.match(flattened, /지하층 슬라브 단부/);
  assert.match(flattened, /안전난간 미설치/);
  assert.match(flattened, /타설 구간 통로/);
  assert.match(flattened, /굴착기 작업반경 충돌/);
  assert.match(flattened, /향후 기초 및 토공사 공정에서 유해·위험요인 및 예방대책 재점검 필요/);
  assert.match(flattened, /12명/);
  assert.match(flattened, /다음 방문 전 추락방지 조치 재확인/);
  assert.match(flattened, new RegExp(PREVIOUS_STATUS_EXPECTED.implemented));
  assert.doesNotMatch(flattened, /1동 3층 발코니 자리 슬라브/);
  assert.doesNotMatch(flattened, /1층 현장 출입구 낙하물 방지조치 미실시/);
});

test('buildStandardInspectionHwpxDocument renders previous implementation status as three checkboxes', async () => {
  const cases = [
    { expected: PREVIOUS_STATUS_EXPECTED.implemented, value: 'implemented' },
    { expected: PREVIOUS_STATUS_EXPECTED.partial, value: 'partial' },
    { expected: PREVIOUS_STATUS_EXPECTED.not_implemented, value: 'not_implemented' },
    { expected: PREVIOUS_STATUS_EXPECTED.not_applicable, value: 'not_applicable' },
    { expected: PREVIOUS_STATUS_EXPECTED.unchecked, value: '' },
    { expected: PREVIOUS_STATUS_EXPECTED.unchecked, value: 'unexpected-status' },
  ];

  for (const { expected, value } of cases) {
    const session = createInspectionSession({}, `standard-previous-status-${value || 'blank'}`, 1);
    (session.document2Overview as { previousImplementationStatus: string }).previousImplementationStatus =
      value;

    const document = await buildStandardInspectionHwpxDocument(session, [session]);
    const zip = await JSZip.loadAsync(document.buffer);
    const sectionXml = await zip.file('Contents/section0.xml')?.async('string');

    assert.ok(sectionXml);
    assert.match(flattenXmlText(sectionXml), new RegExp(expected));
  }
});
