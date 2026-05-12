# Component Fallback Hardening

## 목적

Step 17의 source recovery component는 MVP fallback이다. Build 통과 후 실제 UX 수준에 맞게 보강한다.

## 보강 순서

1. Props를 실제 호출부 기준으로 정리한다.
2. `any` props를 줄이고 interface를 도입한다.
3. CSS module class를 실제 디자인 시스템과 맞춘다.
4. 빈 상태/오류 상태를 기능별 `ui_ux.md`와 맞춘다.
5. route smoke와 visual QA를 실행한다.

## 우선 보강 대상

| Component | Feature | Reason |
|---|---|---|
| `PhotoAlbumPanel` | photo-album | 실제 grid/filter/upload UX 필요 |
| `HeadquartersTable` | headquarters-sites | 기준정보 관리 핵심 |
| `SitesTable` | headquarters-sites | 현장 목록 핵심 |
| `MailboxRecipientField` | mailbox | compose UX 핵심 |
| `MailboxComposeToolbar` | mailbox | send/draft/attachment 핵심 |
| document bridge helpers | report-workspace | PDF/HWPX 출력 안정화 |
