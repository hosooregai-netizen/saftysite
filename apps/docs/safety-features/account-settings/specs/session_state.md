# Session State Spec

## 목적

계정/설정에서 session state를 일관되게 표시하고, 다른 기능의 서버 API 사용 가능 여부를 판단한다.

## 세션 저장

```text
saftysite-web-report-session-v2
```

## 주요 helper

```text
peekCachedSession()
canUseWorkspaceServerApis()
isAnonymousSession()
isAuthenticatedSession()
bootstrapReportSession()
bootstrapDemoSession()
writeCachedSession()
```

## 상태별 동작

| 상태 | API 사용 | UI |
|---|---|---|
| local | server API 제한 | 로컬 임시 보관 안내 |
| anonymous | 일부 server API 가능 | 로그인 전환 CTA |
| authenticated | 전체 workspace API 가능 | 계정/워크스페이스 표시 |

## 이벤트

```text
saftysite:report-session-changed
```

세션 변경 시 다른 화면이 상태를 갱신할 수 있어야 한다.

## 위험

- cached session이 만료되었지만 UI는 로그인처럼 보일 수 있다.
- local/anonymous/authenticated 모드가 혼재하면 import/sync 중복 가능성이 있다.
- auth callback 중 nextPath가 외부 URL이면 open redirect 위험이 있다.
