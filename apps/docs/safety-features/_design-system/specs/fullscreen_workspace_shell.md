# Fullscreen Workspace Shell

## 사용 기능

- webhard
- mailbox
- public share viewer 일부

## 구조

```text
Topbar 64px
├─ hamburger / 업무 메뉴
├─ feature title
├─ primary search
└─ account/status/actions

Body
├─ Feature Sidebar
├─ Main Workspace
└─ Optional Detail Panel
```

## 원칙

- 기존 ERP sidebar는 상시 노출하지 않는다.
- 업무 메뉴 접근은 hamburger drawer로 제공한다.
- 검색은 topbar 중앙 또는 workspace header에 둔다.
- 메인 canvas는 카드로 감싸지 않는다.
- detail panel은 기본 닫힘 또는 선택 전 empty state를 사용한다.

## 금지

- 탐색/목록/상세를 모두 카드로 감싸는 ERP형 레이아웃
- 검색창을 작은 내부 카드 안에 숨기는 것
- primary action이 화면 오른쪽 작은 버튼으로만 있는 것
