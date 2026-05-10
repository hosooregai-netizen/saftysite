# Session Modes

## authenticated

실제 사용자 계정과 workspace membership이 있는 상태다.

사용 가능:

- 보고서 서버 저장
- 웹하드 서버 저장
- 사진첩 서버 저장
- 메일 계정 연결
- 결제/크레딧 사용
- workspace import

## anonymous

서버에 anonymous user와 임시 workspace가 있는 상태다.

사용 가능:

- 임시 보고서 작성
- 일부 workspace API 사용
- 로그인 후 claim 가능

주의:

- 결제 불가
- 장기 보관 보장 낮음
- Gmail 연결 불가 또는 로그인 유도 필요

## local

브라우저 local storage 중심의 임시 상태다.

사용 가능:

- generated snapshot 표시
- guest cache 저장

주의:

- 서버 동기화 없음
- 다른 기기에서 접근 불가
- 로그인 후 import 필요

## 판단 helper

```ts
isAuthenticatedSession(session)
isAnonymousSession(session)
canUseWorkspaceServerApis(session)
canUseReportServerApis(session)
```

## UI 표시 기준

| Mode | 표시 |
|---|---|
| authenticated | 사용자 이름, workspace, credit balance |
| anonymous | 임시 작성자, 로그인 안내 |
| local | 로컬 임시 보관함, 동기화 안내 |
