# Remaining Error Triage

## 오류 분류 템플릿

```text
[Error ID]
- Feature:
- File:
- Error:
- Cause:
- Blocking: yes/no
- Proposed fix:
- Related docs:
```

## 기능별 우선순위

### 1. Mailbox

우선 확인:

```text
apps/web/types/mail.ts
apps/web/lib/mail/apiClient.ts
apps/web/features/mailbox/components/*
```

중점:

- `MailThread`, `MailMessage`, `MailboxDraft` 타입이 실제 component 사용과 맞는지
- compose toolbar/recipient field props가 실제 호출과 맞는지
- `/api/mail/*` proxy path가 backend `/api/v1/mail/*`와 맞는지

### 2. Photo Album

우선 확인:

```text
apps/web/types/photos.ts
apps/web/features/photos/components/PhotoAlbumPanel.tsx
```

중점:

- `PhotoAlbumPanel` props
- `PhotoAlbumDataAdapter`
- `PhotoAlbumItem`
- guest adapter 반환 구조

### 3. Headquarters/Sites

우선 확인:

```text
apps/web/types/backend.ts
apps/web/types/controller.ts
apps/web/lib/safetyApi/adminEndpoints.ts
apps/web/features/admin/sections/*
```

중점:

- `HeadquartersHubScreen` props-heavy component 호출
- admin table/modal fallback component props
- `SafetyHeadquarter`, `SafetySite`, `SafetyAssignment` 타입

### 4. Report document bridge

우선 확인:

```text
apps/web/server/documents/*
lib/api.ts
constants/inspectionSession/*
types/inspectionSession/*
```

중점:

- relative import path
- server route response type
- HWPX/PDF placeholder response
