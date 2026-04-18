import assert from 'node:assert/strict';
import test from 'node:test';

import {
  invalidateAdminDirectoryMutationClientCaches,
  invalidateAdminReportMutationClientCaches,
} from './adminClientCacheInvalidation';
import {
  readAdminSessionCache,
  writeAdminSessionCache,
} from './adminSessionCache';

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

const scope = 'admin-user-1';
const originalWindow = globalThis.window;

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
  if (originalWindow === undefined) {
    Reflect.deleteProperty(globalThis, 'window');
    return;
  }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
}

test('report mutation invalidation clears bootstrap report caches and section prefixes', () => {
  const sessionStorage = installWindow();

  writeAdminSessionCache(scope, 'overview', { count: 1 });
  writeAdminSessionCache(scope, 'bootstrap:report-list', ['new-report']);
  writeAdminSessionCache(scope, 'report-list', ['legacy-report']);
  writeAdminSessionCache(scope, 'sites-data', ['legacy-sites']);
  writeAdminSessionCache(scope, 'mailbox-directory', ['legacy-mailbox']);
  writeAdminSessionCache(scope, 'reports:list:alpha', ['report-row']);
  writeAdminSessionCache(scope, 'analytics:monthly:2026-04', { total: 3 });
  writeAdminSessionCache(scope, 'schedule-lookups', { untouched: true });

  invalidateAdminReportMutationClientCaches(scope);

  assert.equal(readAdminSessionCache(scope, 'overview').value, null);
  assert.equal(readAdminSessionCache(scope, 'bootstrap:report-list').value, null);
  assert.equal(readAdminSessionCache(scope, 'report-list').value, null);
  assert.equal(readAdminSessionCache(scope, 'sites-data').value, null);
  assert.equal(readAdminSessionCache(scope, 'mailbox-directory').value, null);
  assert.equal(readAdminSessionCache(scope, 'reports:list:alpha').value, null);
  assert.equal(readAdminSessionCache(scope, 'analytics:monthly:2026-04').value, null);
  assert.deepEqual(readAdminSessionCache(scope, 'schedule-lookups').value, { untouched: true });

  sessionStorage.clear();
  uninstallWindow();
});

test('directory mutation invalidation clears bootstrap directory caches and schedule prefixes', () => {
  const sessionStorage = installWindow();

  writeAdminSessionCache(scope, 'bootstrap:sites-data', ['new-sites']);
  writeAdminSessionCache(scope, 'bootstrap:mailbox-directory', { sites: [], headquarters: [] });
  writeAdminSessionCache(scope, 'schedule-lookups', { filters: [] });
  writeAdminSessionCache(scope, 'schedule-calendar:2026-04', ['calendar-row']);
  writeAdminSessionCache(scope, 'schedule-queue:2026-04', ['queue-row']);
  writeAdminSessionCache(scope, 'users:list:alpha', ['user-row']);
  writeAdminSessionCache(scope, 'headquarters:list:alpha', ['hq-row']);

  invalidateAdminDirectoryMutationClientCaches(scope);

  assert.equal(readAdminSessionCache(scope, 'bootstrap:sites-data').value, null);
  assert.equal(readAdminSessionCache(scope, 'bootstrap:mailbox-directory').value, null);
  assert.equal(readAdminSessionCache(scope, 'schedule-lookups').value, null);
  assert.equal(readAdminSessionCache(scope, 'schedule-calendar:2026-04').value, null);
  assert.equal(readAdminSessionCache(scope, 'schedule-queue:2026-04').value, null);
  assert.equal(readAdminSessionCache(scope, 'users:list:alpha').value, null);
  assert.equal(readAdminSessionCache(scope, 'headquarters:list:alpha').value, null);

  sessionStorage.clear();
  uninstallWindow();
});
