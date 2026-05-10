# 05. Design Markdown — 메일함

## 1. 화면 목표

메일함 화면은 A&C ERP 안에서 프로젝트 메일을 빠르게 확인하고, 문서 제출·조치요청·자료요청·일정협의 메일을 작성하며, 첨부파일을 웹하드에 저장하고, 메일을 ERP 업무 데이터와 연결하는 3-pane 업무 화면이다.

핵심 목표:

- 받은편지함과 보낸메일함을 프로젝트 중심으로 탐색
- 메일이 어떤 프로젝트/문서/지적사항과 연결되어 있는지 즉시 표시
- 첨부파일을 웹하드로 저장하는 흐름을 단순화
- 보고서 제출 메일과 Submission 이력을 자동 연결
- 조치요청 메일과 Finding 상태를 연결
- OAuth 미연결 상태에서도 초안 작성 가능

## 2. 화면 목록

### 2.1 통합 메일함

Route:

```text
/mail
/mail/inbox
/mail/sent
/mail/drafts
```

Layout:

```text
┌────────────────────────────────────────────────────────────┐
│ Toolbar: Sync / Compose / Project Filter / Search           │
├──────────────┬─────────────────────┬───────────────────────┤
│ Left Pane    │ Thread List         │ Message Detail         │
│ accounts     │ message summary     │ body / attachments     │
│ folders      │ project badge       │ project linker         │
│ project      │ status badge        │ attachment save panel  │
└──────────────┴─────────────────────┴───────────────────────┘
```

### 2.2 프로젝트별 메일

Route:

```text
/projects/[projectId]/mail
```

표시:

- 프로젝트 관련 메일만 필터링
- 발주처/시공사/내부 메일 구분
- 회차별 필터
- 문서별 필터
- 제출 메일 강조
- 미저장 첨부파일 경고

### 2.3 메일 작성

Route:

```text
/mail/compose
/projects/[projectId]/mail/compose
```

구성:

- 수신자/참조자 입력
- 메일 목적 선택
- 템플릿 선택
- AI 초안 생성
- 제목/본문 편집
- 첨부파일 선택
- 발송 전 체크리스트

### 2.4 보고서 제출 메일

Route:

```text
/documents/[documentId]/submission-mail
```

구성:

- 문서 정보 카드
- 발주처 카드
- 최종본 첨부파일 카드
- 수신자 확인
- 제출 메일 본문
- 제출 후 Submission 생성 안내

### 2.5 조치요청 메일

Route:

```text
/findings/[findingId]/action-request-mail
```

또는 복수 Finding 선택 시:

```text
/findings/action-request-mail
```

구성:

- 지적사항 표
- 지적사진 첨부
- 요청기한 입력
- 시공사 담당자 선택
- 조치요청 메일 본문

### 2.6 첨부파일 웹하드 저장 패널

메시지 상세 우측 또는 하단에 표시한다.

표시:

- 첨부파일명
- 크기
- 저장 여부
- 추천 프로젝트
- 추천 폴더
- 추천 태그
- 저장 버튼
- 이미 저장된 FileAsset 링크

### 2.7 메일 계정 설정

Route:

```text
/settings/mail-accounts
```

표시:

- Guest draft mode
- OAuth 연결 카드
- 연결 계정 목록
- 동기화 상태
- 서명 설정
- 템플릿 설정

## 3. UX 규칙

1. 메일은 3-pane 구조를 기본으로 한다.
2. 프로젝트 연결이 없는 메일은 `미분류` badge를 표시한다.
3. 시스템 추천 연결은 `추천` 상태로 표시하고, 사용자가 확인해야 `확정`이 된다.
4. 보고서 제출 메일은 첨부파일 누락 시 발송 버튼을 비활성화한다.
5. OAuth 미연결 상태에서는 `발송` 대신 `초안 복사` 또는 `외부 메일로 복사` 버튼을 표시한다.
6. 첨부파일이 웹하드에 저장되지 않았으면 `저장 필요` badge를 표시한다.
7. 보낸메일 중 제출 메일은 Submission 상태를 함께 표시한다.
8. 조치요청 메일 발송 후 관련 Finding 상태 변화를 명확히 보여준다.
9. AI가 작성한 본문은 `AI 초안` badge를 표시한다.
10. 발송 전 수신자, 첨부파일, 연결 문서, 제출 상태를 체크리스트로 보여준다.

## 4. 주요 컴포넌트

### MailboxShell

- Left Pane
- Thread List
- Message Detail
- Compose Overlay
- Attachment Save Panel

### MailLeftPane

항목:

```text
계정
받은편지함
보낸메일함
임시보관함
중요
미분류
프로젝트별
발주처별
```

### MailThreadList

컬럼/정보:

- 읽음 상태
- 보낸 사람
- 제목
- 프로젝트 badge
- 연결 엔티티 badge
- 첨부파일 아이콘
- 마지막 수신/발신 시간

### MailDetailPane

표시:

- 제목
- 보낸 사람/받는 사람/참조
- 프로젝트 연결 상태
- 본문
- 첨부파일
- 관련 업무
- 회신/전달/프로젝트 연결 버튼

### MailAttachmentSavePanel

기능:

- 파일별 저장 상태
- 추천 폴더
- 저장 위치 변경
- 태그 선택
- 중복 파일 처리
- 웹하드 열기

### ComposePanel

구성:

- 목적 선택
- 템플릿 선택
- AI 초안 생성
- 수신자/참조자
- 제목
- 본문 editor
- 첨부파일
- 발송 전 체크리스트

### SubmissionMailComposer

보고서 제출 전용:

- 문서번호
- 발주처
- 점검회차
- 최종본 파일
- Submission 생성 여부

### ActionRequestMailComposer

조치요청 전용:

- 지적사항 표
- 조치기한
- 지적사진 첨부
- 시공사 담당자

## 5. Warning State

### 프로젝트 미연결

```text
이 메일은 아직 프로젝트와 연결되지 않았습니다.
제목, 수신자, 첨부파일 기준으로 추천 프로젝트를 확인하세요.
```

### 첨부파일 미저장

```text
첨부파일이 웹하드에 저장되지 않았습니다.
제출 증빙으로 보관하려면 프로젝트 폴더에 저장하세요.
```

### 제출파일 누락

```text
보고서 제출 메일에는 최종본 파일이 필요합니다.
먼저 보고서를 export하고 웹하드 최종본 파일을 첨부하세요.
```

### OAuth 미연결

```text
메일 계정이 연결되어 있지 않습니다.
현재는 초안 작성 및 복사만 가능합니다.
```

## 6. Responsive

### Desktop

- 3-pane shell 기본
- 첨부파일 저장 패널 우측 고정
- 작성 패널은 우측 drawer 또는 전체 overlay

### Tablet

- Left Pane collapse
- Thread List + Detail 2-pane
- Compose full-screen drawer

### Mobile

- 메일 목록과 상세 분리
- 작성은 full-screen
- 첨부파일 저장은 step 방식
