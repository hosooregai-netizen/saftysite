# Feature Spec: Mailbox

## 1. Purpose

메일함은 사용자가 Google Gmail 등 외부 메일 계정을 연결하고, 업무 시스템 안에서 받은메일 확인, 메일 작성/발송, 임시저장, 답장/전달, 첨부파일 다운로드, 보고서 발송을 수행할 수 있게 한다.

## 2. User Problems

- 사용자는 보고서 작성 후 별도의 메일 서비스로 이동해 발송해야 한다.
- 외부 메일 계정 연결 상태와 동기화 상태를 ERP 화면에서 명확히 알기 어렵다.
- 받은편지함/보낸메일함/임시보관함이 메일 서비스처럼 자연스럽게 탐색되지 않는다.
- OAuth 성공 notice와 계정 없음 상태가 동시에 보이면 사용자는 연결 성공 여부를 신뢰하기 어렵다.
- 메일 작성, 임시저장, 첨부파일, 답장/전달 흐름이 페이지 전환 없이 자연스럽게 이어져야 한다.

## 3. Primary Users

| User | Needs |
|---|---|
| 기술지도 실무자 | 보고서 작성 후 고객/현장 담당자에게 메일 발송 |
| 관리자 | 연결 계정 상태 확인, 메일 발송 이력 추적 |
| 현장/사업장 담당자 | 메일 내용과 첨부 확인, 관련 보고서 추적 |

## 4. Core Features

| Feature | Priority | Description |
|---|---:|---|
| Google Mail OAuth 연결 | P0 | Google 계정 연결, token 저장, 계정 목록 표시 |
| 계정 상태 표시 | P0 | connected, reconnect_required, sync_error, disabled |
| Gmail 받은편지함 동기화 | P0 | initial backfill + incremental sync |
| 보낸메일함/임시보관함 | P0 | sent, drafts 상태 확인 |
| 메일 상세 보기 | P0 | thread, messages, participants, attachments |
| 새 메일 작성 | P0 | floating compose panel |
| 답장/전달 | P1 | thread 기반 reply/forward |
| 첨부파일 | P1 | 업로드, 표시, 다운로드 |
| 검색/필터 | P1 | 제목, 본문, 주소, 현장/보고서 키워드 |
| 보고서 발송 연계 | P1 | reportKey/siteId/headquarterId와 메일 연결 |
| Naver/Naver Works 확장 | P2 | provider interface 확장 |

## 5. In Scope

- `/mailbox` full-screen mailbox shell
- `/mail/connect/google` OAuth callback
- 연결 계정 목록
- Google OAuth start/complete
- Gmail token exchange/refresh
- Gmail sync
- Gmail send
- compose/draft/reply/forward
- mail thread list/viewer
- source readiness and clean build stability

## 6. Out of Scope for Current Step

- Naver Mail production OAuth implementation
- Naver Works production OAuth implementation
- Gmail push notification watch endpoint
- organization-wide delegated mailbox
- advanced spam/phishing detection
- server-side full-text index beyond MVP

## 7. Success Criteria

- clean build에서 메일함 import error가 없어야 한다.
- 계정 연결 성공 후 계정 목록에 실제 계정 이메일이 표시되어야 한다.
- OAuth success notice와 계정 없음 state가 동시에 나타나면 안 된다.
- `/mailbox`는 Gmail/Naver Mail과 유사한 3-pane layout을 제공해야 한다.
- 받은편지함 thread 클릭 시 오른쪽 viewer에 상세가 표시되어야 한다.
- 새 메일/답장/전달은 floating compose panel에서 처리되어야 한다.
- Gmail sync 실패 시 reconnect 또는 sync error 상태가 명확히 보여야 한다.
