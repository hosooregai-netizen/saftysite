# Layout Patterns

## ERP AppShell

사용 대상:

- 보고서 목록
- 새 보고서 작성
- 사업장/현장
- 사진첩
- 계정/설정
- 결제/크레딧

구조:

```text
Topbar
Side rail
Content area
```

## Fullscreen Workspace Shell

사용 대상:

- 웹하드
- 메일함
- 공개 공유 페이지

구조:

```text
Feature topbar
Feature sidebar
Main workspace
Optional detail panel
```

## Drive-like File Manager

사용 대상:

- 웹하드

구조:

```text
Topbar
├─ 업무 메뉴
├─ 검색
├─ 업로드/새로 만들기
└─ 보기/상세 controls

Left sidebar
├─ + 새로 만들기
├─ 내 드라이브
├─ 공유 문서함
├─ 최근
├─ 중요
└─ 휴지통

Main canvas
├─ 현재 폴더명
├─ filter chips
├─ file table or grid
└─ empty/drop/upload states

Optional detail panel
```

## Three-pane Mailbox

사용 대상:

- 메일함

구조:

```text
Topbar
├─ 업무 메뉴
├─ 메일 검색
├─ 계정 전환
├─ 동기화
└─ 새 메일

Left sidebar
├─ + 메일 작성
├─ 받은편지함
├─ 보낸메일함
├─ 임시보관함
├─ 중요
└─ 휴지통

Center thread list

Right message viewer

Floating compose panel
```
