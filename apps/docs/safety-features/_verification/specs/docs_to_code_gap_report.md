# Docs ↔ Code Gap Report

## 확인된 gap

### 1. Registry route 보강 필요

실제 route에 아래가 존재한다.

```text
/dashboard
/pricing
```

기존 registry에서 누락되어 있다면 추가해야 한다.

### 2. Source readiness missing

다음 기능은 source recovery가 필요하다.

| Feature | 주요 missing |
|---|---|
| mailbox | `types/mail.ts`, `lib/mail/apiClient.ts`, callback/compose helper |
| photo-album | `types/photos.ts`, `PhotoAlbumPanel.tsx` |
| headquarters-sites | admin endpoints, backend/controller/admin types |

### 3. API registry 보강 필요

실제 FastAPI endpoint는 109개다. 기존 registry는 group 중심이므로, API contract 문서와 registry를 실제 endpoint inventory 기준으로 보강해야 한다.

### 4. Proxy route 분류 필요

Next.js frontend에는 아래 API proxy routes가 있다.

```text
/api/admin/[...path]
/api/mail/[...path]
/api/report-saas/[...path]
/api/safety/[...path]
/api/documents/inspection/pdf
/api/documents/inspection/hwpx
```

이 route들은 feature route가 아니라 proxy/API bridge로 분류해야 한다.

## 우선순위

1. source readiness missing 해결
2. route registry 업데이트
3. api registry endpoint 보강
4. feature reverse_map과 code_inventory 업데이트
5. clean build 실행
