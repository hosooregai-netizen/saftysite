# 01 READ AND PLAN — 웹하드

Implement `웹하드`.

## Trace

- Route: `/webhard/projects/[projectId]`
- Component: `WebhardFullScreenShell`
- API: `GET /api/v1/projects/{projectId}/files`
- Models: `Folder, FileAsset, FileVersion, FileLink, ShareLink`
- Prompt: `file-classification`
- Tests: `webhard_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
