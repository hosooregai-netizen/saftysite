import assert from 'node:assert/strict';
import test from 'node:test';

import { uploadPhotoAlbumAsset } from './apiClient';
import { SAFETY_AUTH_TOKEN_KEY } from '@/lib/safetyApi/config';

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

function buildPhotoAssetResponse() {
  return {
    captured_at: '2026-04-23T00:00:00Z',
    content_type: 'image/jpeg',
    created_at: '2026-04-23T00:00:00Z',
    exif_json: {},
    file_name: 'photo.jpg',
    gps_latitude: null,
    gps_longitude: null,
    headquarter_id: 'hq-1',
    headquarter_name: 'HQ',
    id: 'photo-1',
    original_path: '/photo-assets/files/originals/photo.jpg',
    round_no: 1,
    size_bytes: 1234,
    site_id: 'site-1',
    site_name: 'Site 1',
    source_document_key: '',
    source_kind: 'album_upload',
    source_report_key: '',
    source_report_title: '',
    source_slot_key: '',
    thumbnail_path: '/photo-assets/files/thumbnails/photo.jpg',
    updated_at: '2026-04-23T00:00:00Z',
    uploaded_by_name: 'Uploader',
    uploaded_by_user_id: 'user-1',
  };
}

test('uploadPhotoAlbumAsset prefers direct upload when a secure upload origin is configured', async () => {
  const restoreWindow = installWindow({ protocol: 'https:', token: 'photo-token' });
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  await withUploadEnv('https://uploads.example.com', async () => {
    globalThis.fetch = async (input) => {
      callCount += 1;
      if (callCount === 1) {
        assert.equal(String(input), 'https://uploads.example.com/photo-assets/upload');
        return new Response(JSON.stringify(buildPhotoAssetResponse()), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      assert.equal(String(input), '/api/photos/cache');
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    try {
      const uploaded = await uploadPhotoAlbumAsset({
        file: new File(['img'], 'photo.jpg', { type: 'image/jpeg' }),
        roundNo: 1,
        siteId: 'site-1',
      });

      assert.equal(uploaded.id, 'photo-1');
      assert.equal(callCount, 2);
    } finally {
      globalThis.fetch = originalFetch;
      restoreWindow();
    }
  });
});

test('uploadPhotoAlbumAsset uses the HTTPS asset origin when a dedicated upload origin is missing', async () => {
  const restoreWindow = installWindow({ protocol: 'https:', token: 'photo-token' });
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  await withUploadEnv(undefined, () =>
    withAssetEnv('https://assets.example.com', async () => {
      globalThis.fetch = async (input) => {
        callCount += 1;
        if (callCount === 1) {
          assert.equal(String(input), 'https://assets.example.com/photo-assets/upload');
          return new Response(JSON.stringify(buildPhotoAssetResponse()), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }

        assert.equal(String(input), '/api/photos/cache');
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      };

      try {
        const uploaded = await uploadPhotoAlbumAsset({
          file: new File(['img'], 'photo.jpg', { type: 'image/jpeg' }),
          roundNo: 1,
          siteId: 'site-1',
        });

        assert.equal(uploaded.id, 'photo-1');
        assert.equal(callCount, 2);
      } finally {
        globalThis.fetch = originalFetch;
        restoreWindow();
      }
    }),
  );
});

test('uploadPhotoAlbumAsset falls back to the proxy route after a small direct-upload 404', async () => {
  const restoreWindow = installWindow({ protocol: 'https:', token: 'photo-token' });
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  await withUploadEnv('https://uploads.example.com', async () => {
    globalThis.fetch = async (input) => {
      callCount += 1;
      if (callCount === 1) {
        assert.equal(String(input), 'https://uploads.example.com/photo-assets/upload');
        return new Response(JSON.stringify({ error: 'missing' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }

      assert.equal(String(input), '/api/photos/upload');
      return new Response(JSON.stringify({ item: { id: 'proxy-photo' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    try {
      const uploaded = await uploadPhotoAlbumAsset({
        file: new File(['img'], 'photo.jpg', { type: 'image/jpeg' }),
        roundNo: 1,
        siteId: 'site-1',
      });

      assert.equal(uploaded.id, 'proxy-photo');
      assert.equal(callCount, 2);
    } finally {
      globalThis.fetch = originalFetch;
      restoreWindow();
    }
  });
});

test('uploadPhotoAlbumAsset blocks oversized proxy uploads using the original plus thumbnail byte total', async () => {
  const restoreWindow = installWindow({ protocol: 'https:', token: 'photo-token' });

  await withUploadEnv(undefined, () =>
    withAssetEnv(undefined, async () => {
      try {
        const original = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
        const thumbnail = new File(['thumb'], 'thumb.jpg', { type: 'image/jpeg' });
        Object.defineProperty(original, 'size', { value: FOUR_POINT_FIVE_MB - 128 });
        Object.defineProperty(thumbnail, 'size', { value: 256 });

        await assert.rejects(
          () =>
            uploadPhotoAlbumAsset({
              file: original,
              roundNo: 1,
              siteId: 'site-1',
              thumbnail,
            }),
          (error: unknown) => {
            assert.ok(error instanceof Error);
            assert.match(error.message, /NEXT_PUBLIC_SAFETY_UPLOAD_UPSTREAM_BASE_URL/);
            return true;
          },
        );
      } finally {
        restoreWindow();
      }
    }),
  );
});
