# ERP AppShell Pattern

## 사용 기능

- report-list
- headquarters-sites
- photo-album
- account-settings
- billing-credits 일부 화면

## 구조

```text
Left ERP Navigation
Main Page
├─ Page Header Card
├─ Filters / Actions
└─ Panel / Table / Grid
```

## 원칙

- 기존 업무 메뉴 접근성을 유지한다.
- page header에는 기능명, 설명, 주요 CTA를 둔다.
- 목록 화면은 검색/필터/정렬을 header 아래에 둔다.
- 카드 중첩은 최소화한다.
- 기준정보 화면은 표와 form modal 중심으로 구성한다.

## 사용하지 말아야 할 경우

- 웹하드
- 메일함
- 공개 공유 페이지
