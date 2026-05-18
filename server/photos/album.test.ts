import assert from 'node:assert/strict';
import Module from 'node:module';
import test from 'node:test';

import type { SafetyReport, SafetySite } from '@/types/backend';

const moduleLoader = Module as unknown as {
  _load: (request: string, parent?: unknown, isMain?: boolean) => unknown;
};
const originalModuleLoad = moduleLoader._load;
moduleLoader._load = function patchedLoad(
  request: string,
  parent?: unknown,
  isMain?: boolean,
) {
  if (request === 'server-only') {
    return {};
  }
  return originalModuleLoad.call(this, request, parent, isMain);
};

function buildSite(): SafetySite {
  return {
    id: 'site-1',
    headquarter_id: 'hq-1',
    headquarter: { id: 'hq-1', name: '본사' },
    headquarter_detail: null,
    assigned_user: null,
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
    site_address: null,
    status: 'active',
    memo: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

function buildReport(payload: Record<string, unknown>): SafetyReport {
  return {
    id: 'report-1',
    report_key: 'report-key-1',
    report_title: '1차 기술지도 보고서',
    site_id: 'site-1',
    headquarter_id: 'hq-1',
    assigned_user_id: 'user-1',
    visit_date: '2026-01-02',
    visit_round: 1,
    total_round: 3,
    progress_rate: 0,
    status: 'draft',
    workflow_status: 'draft',
    payload_version: 1,
    latest_revision_no: 1,
    submitted_at: null,
    published_at: null,
    last_autosaved_at: null,
    report_type: 'technical_guidance',
    meta: { drafter: '작성자', reportTitle: '1차 기술지도 보고서' },
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
    payload,
  };
}

test('buildLegacyPhotoAlbumItemsForReport includes document 2 accident photos', async () => {
  const { buildLegacyPhotoAlbumItemsForReport } = await import('./album');
  const items = buildLegacyPhotoAlbumItemsForReport(
    buildReport({
      adminSiteSnapshot: {},
      meta: { drafter: '작성자', reportTitle: '1차 기술지도 보고서' },
      document2Overview: {
        accidentPhotoUrl: 'https://assets.example.com/accident-1.jpg',
        accidentPhotoUrl2: '/uploads/content-items/accident-2.png',
      },
    }),
    buildSite(),
  );

  assert.deepEqual(
    items.map((item) => [item.sourceDocumentKey, item.sourceSlotKey, item.originalUrl]),
    [
      ['doc2', 'accident-photo-1', 'https://assets.example.com/accident-1.jpg'],
      [
        'doc2',
        'accident-photo-2',
        'http://52.64.85.49:8011/uploads/content-items/accident-2.png',
      ],
    ],
  );
});

test('buildLegacyPhotoAlbumItemsForReport skips non-image document 2 accident material', async () => {
  const { buildLegacyPhotoAlbumItemsForReport } = await import('./album');
  const items = buildLegacyPhotoAlbumItemsForReport(
    buildReport({
      adminSiteSnapshot: {},
      meta: { drafter: '작성자', reportTitle: '1차 기술지도 보고서' },
      document2Overview: {
        accidentPhotoUrl: '/uploads/content-items/accident-report.pdf',
        accidentPhotoUrl2: '',
      },
    }),
    buildSite(),
  );

  assert.equal(items.length, 0);
});
