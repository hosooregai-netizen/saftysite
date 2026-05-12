# Design Principles

## 1. 업무 화면은 조용하고 명확해야 한다

보고서, 사업장/현장, 사진첩, 설정, 결제 화면은 ERP 업무 화면이다. 화려한 장식보다 정보 구조, 입력 안정성, 상태 명확성을 우선한다.

## 2. Workspace 기능은 넓은 작업 공간을 우선한다

웹하드와 메일함은 단순 ERP 카드 화면으로 만들면 사용성이 떨어진다.

- 웹하드: Drive-like fullscreen workspace
- 메일함: Three-pane mailbox workspace

기존 ERP 사이드바를 그대로 노출하지 말고, 필요한 경우 topbar의 업무 메뉴 drawer로 제공한다.

## 3. 카드 중첩을 피한다

나쁜 예:

```text
큰 카드
└─ 탐색 카드
   └─ 목록 카드
      └─ 상세 카드
```

좋은 예:

```text
Topbar
Left navigation
Main canvas
Optional detail panel
```

## 4. 상태를 숨기지 않는다

다음 상태는 항상 명확히 보여야 한다.

- 저장 중/저장 완료/저장 실패
- 업로드 중/완료/실패
- 연결됨/연결 필요/재연결 필요
- 권한 없음
- 검토 필요
- 출력 가능/출력 차단
- credit 부족

## 5. 기능별 layout pattern을 존중한다

| Feature | Pattern |
|---|---|
| webhard | Drive-like File Manager |
| mailbox | Three-pane Mailbox |
| report-workspace | Report Workspace |
| report-list | List Management |
| headquarters-sites | Directory Management |
| photo-album | Photo Grid |
| account-settings | Settings |
| billing-credits | Checkout/Ledger |
