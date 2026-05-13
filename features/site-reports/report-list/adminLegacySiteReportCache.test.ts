import assert from 'node:assert/strict';
import test from 'node:test';

import type { InspectionReportListItem } from '@/types/inspectionSession';
import {
  beginAdminLegacySiteReportRequest,
  isCurrentAdminLegacySiteReportRequest,
  readAdminLegacySiteReportCache,
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

test('legacy report request generation rejects stale site responses', () => {
  const requestRef = { current: null };
  const first = beginAdminLegacySiteReportRequest(requestRef, 'site-1');
  const second = beginAdminLegacySiteReportRequest(requestRef, 'site-2');

  assert.equal(isCurrentAdminLegacySiteReportRequest(requestRef, first), false);
  assert.equal(isCurrentAdminLegacySiteReportRequest(requestRef, second), true);
});
