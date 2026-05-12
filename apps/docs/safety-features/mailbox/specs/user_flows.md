# User Flows: Mailbox

## 1. 계정 없는 사용자가 메일함 진입

```text
사용자 /mailbox 진입
→ session 확인
→ mail accounts 조회
→ accounts = []
→ provider status 조회
→ center pane에 onboarding empty state 표시
→ "구글 메일 연결" CTA 클릭
→ OAuth start
```

Expected UI:

- topbar는 유지한다.
- left sidebar는 기본 폴더를 비활성 또는 안내 상태로 보여준다.
- center thread list 영역에는 계정 연결 안내를 표시한다.
- right viewer는 "메일을 선택하면 상세 내용을 확인할 수 있습니다" 대신 계정 연결 후 사용 가능한 기능을 안내한다.

## 2. Google Mail 계정 연결

```text
구글 메일 연결 클릭
→ POST /api/v1/mail/accounts/connect/google/start
→ Google OAuth URL 수신
→ Google consent screen 이동
→ /mail/connect/google?code=&state= callback
→ POST /api/v1/mail/accounts/connect/google/complete
→ token exchange
→ Gmail profile 조회
→ MailAccount 저장
→ /mailbox?oauthNotice=connected 이동
→ accounts 재조회
→ 연결 계정 chip 표시
```

Failure states:

- `error=access_denied`
- state mismatch
- expired state
- redirect_uri mismatch
- token exchange failure
- missing refresh_token
- Gmail API permission error

## 3. 받은편지함 보기

```text
/mailbox 진입
→ accounts 조회
→ selectedAccountId 결정
→ GET /api/v1/mail/threads?box=inbox&accountId=
→ thread rows 표시
→ thread 클릭
→ GET /api/v1/mail/threads/{threadId}
→ viewer 갱신
```

Thread row should show:

- 읽음/안읽음
- 별표/중요
- 발신자
- 제목
- snippet
- 첨부 여부
- 시간
- siteId/reportKey badge

## 4. 검색

```text
topbar 검색창 입력
→ query state 업데이트
→ URL query 반영
→ GET /api/v1/mail/threads?query=
→ center pane title = 검색 결과
→ searchBox filter 적용 가능
```

Search scopes:

- all
- inbox
- sent
- drafts
- starred
- trash

## 5. 새 메일 작성

```text
+ 메일 작성 클릭
→ floating compose panel open
→ 받는 사람 입력
→ recipient suggestions 조회
→ 제목/본문/첨부 작성
→ 임시저장 자동/수동
→ 보내기 클릭
→ POST /api/v1/mail/send
→ Gmail messages.send
→ sent thread upsert
→ compose close
```

## 6. 답장

```text
thread 선택
→ viewer에서 답장 클릭
→ compose panel open
→ subject = Re: 원제목
→ toRecipients = 원 발신자 또는 thread recipients
→ body에 원문 quote 포함
→ 발송
```

## 7. 전달

```text
thread 선택
→ viewer에서 전달 클릭
→ compose panel open
→ subject = Fwd: 원제목
→ body에 원문/첨부 정보 포함
→ 수신자 입력
→ 발송
```

## 8. 메일 삭제/복원/보관

```text
thread row 또는 viewer action 클릭
→ PATCH /api/v1/mail/threads/{threadId}
→ Gmail label modify 또는 trash/untrash
→ local thread state 갱신
→ active box 목록 refresh
```

## 9. 동기화

```text
동기화 버튼 클릭
→ POST /api/v1/mail/sync
→ account별 token refresh
→ initial backfill 또는 history sync 수행
→ sync summary 표시
→ threads refresh
```
