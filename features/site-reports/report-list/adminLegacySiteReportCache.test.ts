import assert from 'node:assert/strict';
import test from 'node:test';

import type { ControllerReportRow } from '@/types/admin';
import type { InspectionReportListItem } from '@/types/inspectionSession';
import {
  beginAdminLegacySiteReportRequest,
  isCurrentAdminLegacySiteReportRequest,
  mapAdminLegacyRowToReportItem,
  readAdminLegacySiteReportCache,
  upsertAdminLegacySiteReportCacheItem,
  writeAdminLegacySiteReportCache,
} from './adminLegacySiteReportCache';

class MemorySessionStorage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

const originalWindow = globalThis.window;
const originalDateNow = Date.now;

function installWindow() {
  const sessionStorage = new MemorySessionStorage();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      sessionStorage,
    },
  });
  return sessionStorage;
}

function uninstallWindow() {
  Date.now = originalDateNow;

  if (originalWindow === undefined) {
    Reflect.deleteProperty(globalThis, 'window');
    return;
  }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
}

function buildItem(reportKey: string): InspectionReportListItem {
  return {
    id: reportKey,
    reportKey,
    reportTitle: 'Legacy report',
    reportOpenHref: `/admin/report-open?reportKey=${encodeURIComponent(reportKey)}`,
    reportOpenMode: 'original_pdf',
    readOnly: true,
    originalPdfAvailable: true,
    siteId: 'site-1',
    headquarterId: 'hq-1',
    assignedUserId: 'admin-1',
    visitDate: '2026-04-01',
    visitRound: 1,
    totalRound: null,
    progressRate: 100,
    status: 'submitted',
    dispatchCompleted: false,
    dispatchStatus: null,
    reportIndexSource: 'legacy',
    payloadVersion: 1,
    latestRevisionNo: 0,
    submittedAt: '2026-04-01T00:00:00.000Z',
    publishedAt: null,
    lastAutosavedAt: '2026-04-01T00:00:00.000Z',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    meta: {},
  };
}

function buildLegacyRow(
  overrides: Partial<ControllerReportRow> = {},
): ControllerReportRow {
  return {
    assigneeName: 'Inspector',
    assigneeUserId: 'user-1',
    checkerUserId: '',
    controllerReview: null,
    deadlineDate: '2026-04-08',
    dispatch: null,
    dispatchSignal: '',
    dispatchStatus: '',
    headquarterId: 'hq-1',
    headquarterName: 'HQ',
    lifecycleStatus: 'active',
    originalPdfAvailable: true,
    originalPdfDownloadPath: '/api/admin/reports/legacy/original-pdf',
    periodLabel: '',
    progressRate: 100,
    qualityStatus: 'unchecked',
    reportKey: 'legacy:technical_guidance:1001',
    reportMonth: '',
    reportTitle: 'Legacy report',
    reportType: 'technical_guidance',
    routeParam: 'legacy:technical_guidance:1001',
    siteId: 'site-1',
    siteName: 'Site 1',
    sortLabel: 'Site 1 Legacy report',
    status: 'submitted',
    updatedAt: '2026-04-01T00:00:00.000Z',
    visitDate: '2026-04-01',
    visitRound: 1,
    totalRound: null,
    workflowStatus: 'submitted',
    ...overrides,
  } as ControllerReportRow;
}

test('mapAdminLegacyRowToReportItem keeps original PDF href when available', () => {
  const item = mapAdminLegacyRowToReportItem(buildLegacyRow());

  assert.equal(item.reportOpenHref, '/admin/report-open?reportKey=legacy%3Atechnical_guidance%3A1001');
  assert.equal(item.reportOpenMode, 'original_pdf');
  assert.equal(item.originalPdfAvailable, true);
});

test('mapAdminLegacyRowToReportItem marks PDF-less legacy rows for document creation', () => {
  const item = mapAdminLegacyRowToReportItem(
    buildLegacyRow({
      originalPdfAvailable: false,
      originalPdfDownloadPath: '',
      reportKey: 'legacy:technical_guidance:1002',
      routeParam: 'legacy:technical_guidance:1002',
    }),
  );

  assert.equal(item.reportOpenHref, null);
  assert.equal(item.reportOpenMode, 'legacy_create');
  assert.equal(item.originalPdfAvailable, false);
});

test('empty legacy report arrays are valid cache hits', () => {
  const sessionStorage = installWindow();

  try {
    writeAdminLegacySiteReportCache('admin-1', 'site-empty', []);
    const cached = readAdminLegacySiteReportCache('admin-1', 'site-empty');

    assert.equal(cached.hasCache, true);
    assert.deepEqual(cached.items, []);
  } finally {
    sessionStorage.clear();
    uninstallWindow();
  }
});

test('stale legacy report cache remains available as fallback data', () => {
  const sessionStorage = installWindow();

  try {
    Date.now = () => 0;
    const item = buildItem('legacy:technical_guidance:1001');
    writeAdminLegacySiteReportCache('admin-1', 'site-1', [item]);

    Date.now = () => 1000 * 60 * 10;
    const cached = readAdminLegacySiteReportCache('admin-1', 'site-1');

    assert.equal(cached.hasCache, true);
    assert.equal(cached.isFresh, false);
    assert.deepEqual(cached.items, [item]);
  } finally {
    sessionStorage.clear();
    uninstallWindow();
  }
});

test('upsertAdminLegacySiteReportCacheItem replaces matching legacy rows with dispatch metadata', () => {
  const sessionStorage = installWindow();

  try {
    const pendingItem = buildItem('legacy:technical_guidance:1001');
    const siblingItem = buildItem('legacy:technical_guidance:1002');
    writeAdminLegacySiteReportCache('admin-1', 'site-1', [pendingItem, siblingItem]);

    const dispatch = {
      dispatchStatus: 'manual_checked',
      dispatchMethod: 'manual',
      dispatchCheckedBy: 'admin-1',
      dispatchCheckedAt: '2026-04-01T01:00:00.000Z',
      sentHistory: [
        {
          id: 'manual-dispatch-1',
          memo: '현장 기술지도보고서 목록에서 발송으로 변경',
          sentAt: '2026-04-01T01:00:00.000Z',
          sentByUserId: 'admin-1',
        },
      ],
    };
    const updatedItem: InspectionReportListItem = {
      ...pendingItem,
      dispatchCompleted: true,
      dispatchStatus: 'manual_checked',
      meta: {
        ...pendingItem.meta,
        dispatch,
      },
    };

    upsertAdminLegacySiteReportCacheItem('admin-1', 'site-1', updatedItem);
    const cached = readAdminLegacySiteReportCache('admin-1', 'site-1');

    assert.equal(cached.items.length, 2);
    assert.equal(cached.items[0]?.reportKey, 'legacy:technical_guidance:1001');
    assert.equal(cached.items[0]?.dispatchCompleted, true);
    assert.equal(cached.items[0]?.dispatchStatus, 'manual_checked');
    assert.deepEqual(cached.items[0]?.meta.dispatch, dispatch);
    assert.equal(cached.items[1]?.reportKey, 'legacy:technical_guidance:1002');
    assert.equal(cached.items[1]?.dispatchCompleted, false);
  } finally {
    sessionStorage.clear();
    uninstallWindow();
  }
});

test('upsertAdminLegacySiteReportCacheItem creates a legacy cache when none exists', () => {
  const sessionStorage = installWindow();

  try {
    const item = buildItem('legacy:technical_guidance:1001');
    upsertAdminLegacySiteReportCacheItem('admin-1', 'site-1', item);
    const cached = readAdminLegacySiteReportCache('admin-1', 'site-1');

    assert.equal(cached.hasCache, true);
    assert.deepEqual(cached.items, [item]);
  } finally {
    sessionStorage.clear();
    uninstallWindow();
  }
});

test('legacy report request generation rejects stale site responses', () => {
  const requestRef = { current: null };
  const first = beginAdminLegacySiteReportRequest(requestRef, 'site-1');
  const second = beginAdminLegacySiteReportRequest(requestRef, 'site-2');

  assert.equal(isCurrentAdminLegacySiteReportRequest(requestRef, first), false);
  assert.equal(isCurrentAdminLegacySiteReportRequest(requestRef, second), true);
});
