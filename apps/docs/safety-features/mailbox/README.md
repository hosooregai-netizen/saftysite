# Mailbox

메일함은 외부 메일 계정, 우선 Google Gmail을 업무 시스템에 연결하고 받은편지함, 보낸메일함, 임시보관함, 메일 작성, 답장/전달, 첨부파일, 보고서 발송 흐름을 한 화면에서 관리하는 기능이다.

## Documentation Layout

```text
docs/safety-features/mailbox/
├─ specs/
└─ prompts/
```

- `specs/`: 기능 명세, 데이터 흐름, schema, API, OAuth, Gmail sync, compose, UI/UX, validation, reverse map
- `prompts/`: Codex/AI coding agent에 순서대로 입력할 구현 프롬프트

## Current Product Baseline

현재 메일함은 `/mailbox` route와 `/mail/connect/*` callback route를 가진다. 최신 코드 기준으로 `apps/web/features/mailbox/components/*` 아래에 3-pane shell 계열 컴포넌트가 존재하지만, 일부 import 대상 source file은 누락될 수 있다.

현재 화면 기준으로는 다음 상태가 관찰된다.

- 연결 계정 카드와 받은편지함/보낸메일함/임시보관함 영역이 존재한다.
- `구글 메일 계정을 연결했습니다.` notice가 표시될 수 있다.
- 동시에 `연결된 메일 계정이 없습니다.` 또는 받은편지함 0건 empty state가 표시될 수 있다.
- 아직 Gmail/Naver Mail처럼 자연스러운 3-pane mail client라기보다 ERP 카드형 화면의 흔적이 남아 있다.

## Desired Product Direction

메일함은 일반 ERP 카드 화면이 아니라 Gmail/Naver Mail형 full-screen 3-pane workspace로 관리한다.

```text
Topbar
├─ 업무 메뉴
├─ 메일 검색
├─ 계정 상태
├─ 동기화
└─ 새 메일

Body
├─ Left Mailbox Sidebar
├─ Center Thread List
└─ Right Message Viewer

Overlay
└─ Floating Compose Panel
```

## Primary Documents

| Document | Purpose |
|---|---|
| `specs/feature.md` | 기능 목적과 범위 |
| `specs/oauth.md` | Google Mail OAuth 연결 정책 |
| `specs/gmail_sync.md` | Gmail initial/incremental sync |
| `specs/compose.md` | floating compose / draft / reply / forward |
| `specs/ui_ux.md` | Gmail/Naver형 3-pane UX |
| `specs/reverse_map.md` | route, code, API, schema, prompt 역추적 |
| `prompts/01_READ_AND_PLAN.md` | 구현 전 분석 프롬프트 |
| `prompts/02_BUILD_READINESS.md` | source 누락/clean build 안정화 |
| `prompts/03_IMPLEMENT_GMAIL_OAUTH_SYNC.md` | OAuth + Gmail sync 구현 |
| `prompts/04_IMPLEMENT_THREE_PANE_UI.md` | UI 재구성 |
| `prompts/05_IMPLEMENT_COMPOSE_PANEL.md` | 작성창 고도화 |
| `prompts/06_QA_REGRESSION.md` | 회귀/보안/시각 QA |
