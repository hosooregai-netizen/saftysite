import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSafetyAssetUploadHelperText,
  uploadSafetyAssetFile,
  validateSafetyAssetFile,
} from './assets';
import { SAFETY_AUTH_TOKEN_KEY } from './config';

const UPLOAD_ENV_KEY = 'NEXT_PUBLIC_SAFETY_UPLOAD_UPSTREAM_BASE_URL';
const ASSET_ENV_KEY = 'NEXT_PUBLIC_SAFETY_ASSET_BASE_URL';
const ORIGINAL_UPLOAD_ENV = process.env[UPLOAD_ENV_KEY];
const ORIGINAL_ASSET_ENV = process.env[ASSET_ENV_KEY];
const FOUR_POINT_FIVE_MB = Math.floor(4.5 * 1024 * 1024);

type StorageMap = Map<string, string>;

function createStorage(store: StorageMap) {
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function installWindow(options: { protocol: string; token?: string | null }) {
  const store = new Map<string, string>();
  if (options.token) {
    store.set(SAFETY_AUTH_TOKEN_KEY, options.token);
  }

  const previousWindow = globalThis.window;
  const nextWindow = {
    localStorage: createStorage(store),
    location: { protocol: options.protocol },
  } as unknown as Window & typeof globalThis;
  globalThis.window = nextWindow;

  return () => {
    globalThis.window = previousWindow;
  };
}

function withUploadEnv(value: string | undefined, callback: () => Promise<void>) {
  if (value === undefined) {
    delete process.env[UPLOAD_ENV_KEY];
  } else {
    process.env[UPLOAD_ENV_KEY] = value;
  }

  return callback().finally(() => {
    if (ORIGINAL_UPLOAD_ENV === undefined) {
      delete process.env[UPLOAD_ENV_KEY];
    } else {
      process.env[UPLOAD_ENV_KEY] = ORIGINAL_UPLOAD_ENV;
    }
  });
}

function withAssetEnv(value: string | undefined, callback: () => Promise<void>) {
  if (value === undefined) {
    delete process.env[ASSET_ENV_KEY];
  } else {
    process.env[ASSET_ENV_KEY] = value;
  }

  return callback().finally(() => {
    if (ORIGINAL_ASSET_ENV === undefined) {
      delete process.env[ASSET_ENV_KEY];
    } else {
      process.env[ASSET_ENV_KEY] = ORIGINAL_ASSET_ENV;
    }
  });
}

test('validateSafetyAssetFile reports direct upload origin guidance for oversized proxy uploads', () => {
  const file = new File(['oversized'], 'guide.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: FOUR_POINT_FIVE_MB + 1 });

  const message = validateSafetyAssetFile(file, {
    proxyFileBytes: FOUR_POINT_FIVE_MB,
    usesProxy: true,
  });

  assert.match(message || '', /NEXT_PUBLIC_SAFETY_UPLOAD_UPSTREAM_BASE_URL/);
});

test('getSafetyAssetUploadHelperText only warns while proxy uploads are active', () => {
  assert.match(
    getSafetyAssetUploadHelperText({ usesProxy: true }) || '',
    /4\.5MB/,
  );
  assert.equal(getSafetyAssetUploadHelperText({ usesProxy: false }), undefined);
});

test('uploadSafetyAssetFile prefers direct upload when a secure upload origin is configured', async () => {
  const restoreWindow = installWindow({ protocol: 'https:', token: 'asset-token' });
  const originalFetch = globalThis.fetch;

  await withUploadEnv('https://uploads.example.com', async () => {
    globalThis.fetch = async (input, init) => {
      assert.equal(String(input), 'https://uploads.example.com/content-items/assets/upload');
      assert.equal(init?.method, 'POST');
      assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer asset-token');
      return new Response(
        JSON.stringify({
          path: '/uploads/content-items/mock-guide.pdf',
          file_name: 'mock-guide.pdf',
          content_type: 'application/pdf',
          size: 128,
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    };

    try {
      const uploaded = await uploadSafetyAssetFile(
        new File(['pdf'], 'mock-guide.pdf', { type: 'application/pdf' }),
      );

      assert.equal(uploaded.file_name, 'mock-guide.pdf');
      assert.ok(uploaded.url.includes('/uploads/content-items/mock-guide.pdf'));
    } finally {
      globalThis.fetch = originalFetch;
      restoreWindow();
    }
  });
});

test('uploadSafetyAssetFile uses the HTTPS asset origin when a dedicated upload origin is missing', async () => {
  const restoreWindow = installWindow({ protocol: 'https:', token: 'asset-token' });
  const originalFetch = globalThis.fetch;

  await withUploadEnv(undefined, () =>
    withAssetEnv('https://assets.example.com', async () => {
      globalThis.fetch = async (input, init) => {
        assert.equal(String(input), 'https://assets.example.com/content-items/assets/upload');
        assert.equal(init?.method, 'POST');
        assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer asset-token');
        return new Response(
          JSON.stringify({
            path: '/uploads/content-items/mock-guide.pdf',
            file_name: 'mock-guide.pdf',
            content_type: 'application/pdf',
            size: 128,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        );
      };

      try {
        const uploaded = await uploadSafetyAssetFile(
          new File(['pdf'], 'mock-guide.pdf', { type: 'application/pdf' }),
        );

        assert.equal(uploaded.file_name, 'mock-guide.pdf');
        assert.ok(uploaded.url.includes('/uploads/content-items/mock-guide.pdf'));
      } finally {
        globalThis.fetch = originalFetch;
        restoreWindow();
      }
    }),
  );
});

test('uploadSafetyAssetFile falls back to the proxy route after a small direct-upload 404', async () => {
  const restoreWindow = installWindow({ protocol: 'https:', token: 'asset-token' });
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  await withUploadEnv('https://uploads.example.com', async () => {
    globalThis.fetch = async (input, init) => {
      callCount += 1;
      if (callCount === 1) {
        assert.equal(String(input), 'https://uploads.example.com/content-items/assets/upload');
        return new Response(JSON.stringify({ detail: 'missing' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }

      assert.equal(String(input), '/api/safety/content-items/assets/upload');
      assert.equal(init?.method, 'POST');
      return new Response(
        JSON.stringify({
          path: '/uploads/content-items/fallback-guide.pdf',
          file_name: 'fallback-guide.pdf',
          content_type: 'application/pdf',
          size: 256,
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    };

    try {
      const uploaded = await uploadSafetyAssetFile(
        new File(['pdf'], 'fallback-guide.pdf', { type: 'application/pdf' }),
      );

      assert.equal(callCount, 2);
      assert.equal(uploaded.file_name, 'fallback-guide.pdf');
    } finally {
      globalThis.fetch = originalFetch;
      restoreWindow();
    }
  });
});
