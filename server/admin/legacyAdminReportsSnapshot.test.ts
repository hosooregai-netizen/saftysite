import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLegacyAdminReportRows } from './legacyAdminReportsSnapshot';
import type { SafetySite, SafetyUser } from '@/types/backend';

function buildSite(overrides: Partial<SafetySite> = {}): SafetySite {
  return {
    id: 'site-1',
    headquarter_id: 'hq-1',
    headquarter: { id: 'hq-1', name: '테스트 본부' },
    headquarter_detail: {
      id: 'hq-1',
      name: '테스트 본부',
      management_number: null,
      opening_number: null,
      business_registration_no: null,
      corporate_registration_no: null,
      license_no: null,
      contact_name: null,
      contact_phone: null,
      address: null,
      memo: null,
      is_active: true,
      lifecycle_status: 'active',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    assigned_user: { id: 'user-1', name: '홍길동', email: 'hong@example.com', role: 'field_agent' },
    assigned_users: null,
    site_name: '테스트 현장',
    site_code: null,
    management_number: null,
    labor_office: null,
    guidance_officer_name: null,
    project_start_date: null,
    project_end_date: null,
    project_amount: null,
    project_scale: null,
    project_kind: null,
    client_management_number: null,
    client_business_name: null,
    client_representative_name: null,
    client_corporate_registration_no: null,
    client_business_registration_no: null,
    order_type_division: null,
    technical_guidance_kind: null,
    manager_name: null,
    inspector_name: null,
    contract_contact_name: null,
    manager_phone: null,
    site_contact_email: null,
    is_high_risk_site: null,
    site_address: null,
    status: 'active',
    pause_start_date: null,
    lifecycle_status: 'active',
    is_active: true,
    memo: 'legacy_insafed_site_id:7001',
    contract_date: null,
    contract_start_date: null,
    contract_end_date: null,
    contract_signed_date: null,
    contract_type: null,
    contract_status: null,
    total_rounds: null,
    guidance_max_visit_round: null,
    per_visit_amount: null,
    total_contract_amount: null,
    last_visit_date: null,
    required_completion_fields: null,
    dispatch_policy: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildUser(overrides: Partial<SafetyUser> = {}): SafetyUser {
  return {
    id: 'user-1',
    email: 'hong@example.com',
    name: '홍길동',
    phone: null,
    role: 'field_agent',
    position: null,
    organization_name: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    last_login_at: null,
    ...overrides,
  };
}

test('buildLegacyAdminReportRows maps legacy rows to matched sites and pdf manifest', () => {
  const rows = buildLegacyAdminReportRows({
    legacyRows: [
      {
        assigneeName: '홍길동',
        headquarterName: '테스트 본부',
        legacyReportId: '9001',
        legacySiteId: '7001',
        pdfFileName: '9001.pdf',
        roundNo: 3,
        siteName: '테스트 현장',
        status: '완료',
        visitDate: '2026-04-20',
      },
      {
        assigneeName: '홍길동',
        headquarterName: '이름 매칭 본부',
        legacyReportId: '9002',
        legacySiteId: '',
        pdfFileName: '커스텀 보고서.pdf',
        roundNo: 1,
        siteName: '이름 매칭 현장',
        status: '진행',
        visitDate: '2026-04-21',
      },
    ],
    pdfManifest: new Map([
      [
        'legacy:technical_guidance:9001',
        {
          archivePath: '/uploads/content-items/sample.pdf',
          fileName: 'sample.pdf',
          legacyReportId: '9001',
          visitDate: '2026-04-20',
        },
      ],
    ]),
    sites: [
      buildSite(),
      buildSite({
        id: 'site-2',
        headquarter_id: 'hq-2',
        headquarter: { id: 'hq-2', name: '이름 매칭 본부' },
        headquarter_detail: {
          id: 'hq-2',
          name: '이름 매칭 본부',
          management_number: null,
          opening_number: null,
          business_registration_no: null,
          corporate_registration_no: null,
          license_no: null,
          contact_name: null,
          contact_phone: null,
          address: null,
          memo: null,
          is_active: true,
          lifecycle_status: 'active',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        site_name: '이름 매칭 현장',
        memo: '',
      }),
    ],
    users: [buildUser()],
  });

  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.siteId, 'site-1');
  assert.equal(rows[0]?.assigneeUserId, 'user-1');
  assert.equal(rows[0]?.originalPdfAvailable, true);
  assert.equal(
    rows[0]?.originalPdfDownloadPath,
    '/uploads/content-items/sample.pdf',
  );
  assert.equal(rows[0]?.status, 'submitted');
  assert.equal(rows[1]?.siteId, 'site-2');
  assert.equal(rows[1]?.reportTitle, '커스텀 보고서');
  assert.equal(rows[1]?.originalPdfAvailable, false);
  assert.equal(rows[1]?.status, 'draft');
});

test('buildLegacyAdminReportRows tolerates company suffix differences and unique site-name matches', () => {
  const rows = buildLegacyAdminReportRows({
    legacyRows: [
      {
        assigneeName: '홍길동',
        headquarterName: '(주)은화종합건설',
        legacyReportId: '9101',
        legacySiteId: '',
        pdfFileName: '',
        roundNo: 1,
        siteName: '하왕십리동 890-93 다세대 신축공사',
        status: '완료',
        visitDate: '2026-01-05',
      },
      {
        assigneeName: '홍길동',
        headquarterName: '다른 본부 표기',
        legacyReportId: '9102',
        legacySiteId: '',
        pdfFileName: '',
        roundNo: 2,
        siteName: '유일 현장명',
        status: '완료',
        visitDate: '2026-01-06',
      },
    ],
    pdfManifest: new Map(),
    sites: [
      buildSite({
        id: 'site-eunhwa',
        site_name: '하왕십리동 890-93 다세대 신축공사',
        headquarter: { id: 'hq-eunhwa', name: '주식회사은화종합건설' },
        headquarter_detail: {
          ...buildSite().headquarter_detail!,
          id: 'hq-eunhwa',
          name: '주식회사은화종합건설',
        },
        memo: '',
      }),
      buildSite({
        id: 'site-unique',
        site_name: '유일 현장명',
        headquarter: { id: 'hq-unique', name: '현재 본부' },
        headquarter_detail: {
          ...buildSite().headquarter_detail!,
          id: 'hq-unique',
          name: '현재 본부',
        },
        memo: '',
      }),
    ],
    users: [buildUser()],
  });

  assert.equal(rows[0]?.siteId, 'site-eunhwa');
  assert.equal(rows[0]?.headquarterName, '주식회사은화종합건설');
  assert.equal(rows[1]?.siteId, 'site-unique');
});

test('buildLegacyAdminReportRows tolerates punctuation differences in site names', () => {
  const rows = buildLegacyAdminReportRows({
    legacyRows: [
      {
        assigneeName: '홍길동',
        headquarterName: '테스트 본부',
        legacyReportId: '9201',
        legacySiteId: '',
        pdfFileName: '',
        roundNo: 1,
        siteName: '노량진동 218-75,76번지 다세대 신축공사',
        status: '완료',
        visitDate: '2026-01-07',
      },
    ],
    pdfManifest: new Map(),
    sites: [
      buildSite({
        id: 'site-punctuation',
        site_name: '노량진동 218-75 76번지 다세대 신축공사',
        memo: '',
      }),
    ],
    users: [buildUser()],
  });

  assert.equal(rows[0]?.siteId, 'site-punctuation');
});
