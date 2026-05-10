# Code Inventory: Account Settings

## Frontend routes

```text
apps/web/app/account/page.tsx
apps/web/app/auth/google/callback/page.tsx
```

## Frontend components

```text
apps/web/components/AccountSettingsScreen.tsx
```

## Frontend libs

```text
apps/web/lib/reportApi.ts
apps/web/lib/sessionAuthFlow.ts
apps/web/lib/guestWorkspaceCache.ts
apps/web/lib/workspaceStorageApi.ts
apps/web/lib/clientPersistence.ts
apps/web/lib/safetyApi/authStorage.ts
```

## Backend

```text
apps/api/app/main.py
apps/api/app/config.py
apps/api/app/models.py
apps/api/app/store.py
```

## API endpoints

```text
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/anonymous
POST /api/v1/auth/google/start
POST /api/v1/auth/google/complete
POST /api/v1/auth/claim-anonymous
GET  /api/v1/auth/me
POST /api/v1/workspaces
GET  /api/v1/workspaces/me
POST /api/v1/workspaces/import-guest-cache
POST /api/v1/billing/checkout
GET  /api/v1/credits/balance
GET  /api/v1/credits/ledger
```

## Do not touch

```text
apps/web/.next
apps/api/.venv
__MACOSX
```
