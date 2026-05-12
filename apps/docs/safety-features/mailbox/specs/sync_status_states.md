# Mail Sync Status States

## 목적

Gmail sync 상태를 connected badge 하나로 뭉개지 않고 명확히 표현한다.

## Sync states

| State | 조건 | Badge |
|---|---|---|
| idle | 연결 완료, sync 대기 | 연결 완료 |
| syncing | sync API 진행 중 | 동기화 중 |
| initial_backfill | 최초 backfill 진행 | 초기 동기화 중 |
| synced | lastSyncedAt 있음 | 동기화 완료 |
| sync_error | metadata.syncError 있음 | 동기화 오류 |
| reconnect_required | token refresh 실패 | 재연결 필요 |

## UI 기준

- topbar에 현재 계정 sync 상태 표시
- sidebar account row에 lastSyncedAt 표시
- sync_error는 toast + account badge 둘 다 표시
- reconnect_required는 sync 버튼 대신 재연결 CTA 표시

## API follow-up

Backend MailAccount metadata에 아래 필드를 권장한다.

```ts
metadata: {
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error' | 'reconnect_required';
  syncError?: string | null;
  initialBackfillCompleted?: boolean;
}
```
