import assert from 'node:assert/strict';
import {
  createCurrentHazardFinding,
  createPreviousGuidanceFollowUpItem,
} from '@/constants/inspectionSession/itemFactory';
import {
  createInspectionSession,
  createInspectionSite,
} from '@/constants/inspectionSession/sessionFactory';
import {
  buildInitialBadWorkplaceReport,
  createEmptyManualBadWorkplaceViolation,
  syncBadWorkplaceReportSource,
} from '@/lib/erpReports/badWorkplace';

function createSiteFixture() {
  return createInspectionSite({
    customerName: '테스트건설',
    siteName: '가산 현장',
    assigneeName: '홍길동',
    siteManagerName: '김현장',
    siteManagerPhone: '010-1111-2222',
    siteAddress: '서울 금천구 가산동',
    constructionPeriod: '2026-01-01 ~ 2026-12-31',
    constructionAmount: '1,000,000,000원',
    businessStartNumber: '2026-01-001',
    companyName: '테스트건설 본사',
    businessRegistrationNumber: '123-45-67890',
    siteManagementNumber: 'SM-2026-001',
    headquartersAddress: '서울 영등포구 본사로 1',
    headquartersContact: '02-1234-5678',
    licenseNumber: 'LIC-001',
  });
}

function createReporterFixture() {
  return {
    id: 'user-1',
    name: '홍길동',
    phone: '010-9999-8888',
    organization_name: '한국종합안전주식회사',
  };
}

function buildCombinedSessions() {
  const site = createSiteFixture();

  const previousSession = createInspectionSession(
    {
      meta: {
        reportDate: '2026-02-10',
        drafter: '이전담당자',
      },
      adminSiteSnapshot: site.adminSiteSnapshot,
    },
    site.id,
    1,
  );
  const previousFinding = createCurrentHazardFinding({
    id: 'finding-prev-1',
    location: '외부 비계 작업발판',
    hazardDescription: '작업발판 파손',
    improvementPlan: '작업발판 전면 교체',
    legalReferenceTitle: '산업안전보건기준에 관한 규칙',
    accidentType: '추락',
  });
  previousSession.document7Findings = [previousFinding];

  const currentSession = createInspectionSession(
    {
      meta: {
        reportDate: '2026-03-15',
        drafter: '현재담당자',
      },
      adminSiteSnapshot: site.adminSiteSnapshot,
      document4FollowUps: [
        createPreviousGuidanceFollowUpItem({
          id: 'follow-up-1',
          sourceSessionId: previousSession.id,
          sourceFindingId: previousFinding.id,
          location: previousFinding.location,
          guidanceDate: '2026-03-15',
          confirmationDate: '2026-03-18',
          result: '미이행 - 후속조치 필요',
        }),
      ],
    },
    site.id,
    2,
  );
  const currentFinding = createCurrentHazardFinding({
    id: 'finding-current-1',
    location: '개구부 주변',
    hazardDescription: '개구부 추락 위험',
    improvementPlan: '덮개 설치 및 출입 통제',
    legalReferenceTitle: '산업안전보건기준에 관한 규칙',
    accidentType: '추락',
  });
  currentSession.document7Findings = [currentFinding];

  return { currentFinding, currentSession, previousFinding, previousSession, site };
}

function testBuildInitialBadWorkplaceReportCombinesPreviousAndCurrent() {
  const { currentFinding, currentSession, previousFinding, previousSession, site } =
    buildCombinedSessions();

  const report = buildInitialBadWorkplaceReport(
    site,
    [previousSession, currentSession],
    createReporterFixture(),
    '2026-03',
  );

  assert.equal(report.sourceSessionId, currentSession.id);
  assert.deepEqual(
    report.violations.map((item) => item.originKind),
    ['previous_unresolved', 'current_new_hazard'],
  );
  assert.deepEqual(report.sourceFindingIds, [previousFinding.id, currentFinding.id]);

  assert.equal(report.violations[0].legalReference, previousFinding.legalReferenceTitle);
  assert.equal(report.violations[0].hazardFactor, previousFinding.hazardDescription);
  assert.equal(report.violations[0].improvementMeasure, previousFinding.improvementPlan);
  assert.equal(report.violations[0].guidanceDate, '2026-03-15');
  assert.equal(report.violations[0].confirmationDate, '2026-03-18');
  assert.equal(report.violations[0].originFindingId, previousFinding.id);

  assert.equal(report.violations[1].legalReference, currentFinding.legalReferenceTitle);
  assert.equal(report.violations[1].hazardFactor, currentFinding.hazardDescription);
  assert.equal(report.violations[1].improvementMeasure, currentFinding.improvementPlan);
  assert.equal(report.violations[1].originFindingId, currentFinding.id);
}

function testBuildInitialBadWorkplaceReportFallsBackWhenSourceFindingIsMissing() {
  const site = createSiteFixture();
  const session = createInspectionSession(
    {
      meta: {
        reportDate: '2026-04-20',
        drafter: '현재담당자',
      },
      adminSiteSnapshot: site.adminSiteSnapshot,
      document4FollowUps: [
        createPreviousGuidanceFollowUpItem({
          id: 'follow-up-missing',
          sourceSessionId: 'missing-session',
          sourceFindingId: 'missing-finding',
          location: '도장 작업대',
          guidanceDate: '2026-04-20',
          confirmationDate: '2026-04-22',
          result: '미이행 - 후속조치 필요',
        }),
      ],
    },
    site.id,
    1,
  );
  session.document7Findings = [];

  const report = buildInitialBadWorkplaceReport(
    site,
    [session],
    createReporterFixture(),
    '2026-04',
  );

  assert.equal(report.violations.length, 1);
  assert.equal(report.violations[0].originKind, 'previous_unresolved');
  assert.equal(report.violations[0].sourceFindingId, 'missing-finding');
  assert.equal(report.violations[0].hazardFactor, '도장 작업대');
  assert.equal(report.violations[0].nonCompliance, '미이행 - 후속조치 필요');
  assert.equal(report.violations[0].guidanceDate, '2026-04-20');
  assert.equal(report.violations[0].confirmationDate, '2026-04-22');
}

function testSyncBadWorkplaceReportSourcePreservesManualRowsAndResetsAutoRows() {
  const { currentSession, previousSession, site } = buildCombinedSessions();
  const initialReport = buildInitialBadWorkplaceReport(
    site,
    [previousSession, currentSession],
    createReporterFixture(),
    '2026-03',
  );

  const manualViolation = createEmptyManualBadWorkplaceViolation(currentSession, initialReport);
  manualViolation.legalReference = '수동 입력 법령';
  manualViolation.hazardFactor = '수동 입력 위험';
  manualViolation.improvementMeasure = '수동 입력 개선조치';
  manualViolation.nonCompliance = '수동 입력 불이행';

  const draft = {
    ...initialReport,
    violations: [
      {
        ...initialReport.violations[0],
        legalReference: '임의 수정된 자동행',
      },
      manualViolation,
    ],
  };

  const synced = syncBadWorkplaceReportSource(draft, currentSession, [
    previousSession,
    currentSession,
  ]);

  assert.deepEqual(
    synced.violations.map((item) => item.originKind),
    ['previous_unresolved', 'current_new_hazard', 'manual'],
  );
  assert.equal(synced.violations[0].legalReference, initialReport.violations[0].legalReference);
  assert.equal(synced.violations[1].originFindingId, initialReport.violations[1].originFindingId);
  assert.equal(synced.violations[2].id, manualViolation.id);
  assert.equal(synced.violations[2].legalReference, '수동 입력 법령');
  assert.deepEqual(synced.sourceFindingIds, initialReport.sourceFindingIds);
}

function main() {
  testBuildInitialBadWorkplaceReportCombinesPreviousAndCurrent();
  testBuildInitialBadWorkplaceReportFallsBackWhenSourceFindingIsMissing();
  testSyncBadWorkplaceReportSourcePreservesManualRowsAndResetsAutoRows();
  console.log('badWorkplace.domain: ok');
}

main();
