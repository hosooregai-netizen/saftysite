# Admin Content Measurement Template Units Proof

- Content CRUD proof: `npx tsx --test features/admin/sections/content/lib/contentItems.test.ts lib/safetyApi/endpoints.test.ts`
- Master data proof: `npx tsx --test lib/safetyApiMappers/masterData.test.ts`
- Backend route proof: `cd ../server && .\.venv\Scripts\python.exe -m pytest tests/test_content_item_cache.py tests/test_api_hardening.py -q`
- Type proof: `npx tsc --noEmit --pretty false`
