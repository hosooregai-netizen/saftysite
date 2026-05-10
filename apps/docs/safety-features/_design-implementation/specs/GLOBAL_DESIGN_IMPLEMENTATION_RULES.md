# Global Design Implementation Rules

## 공통 원칙

- 화면별 layout pattern을 지킨다.
- 기능 구현과 디자인 구현을 섞지 말고, 디자인 작업 범위를 명확히 한다.
- 기존 업무 흐름을 깨지 않는다.
- 상태가 없는 화면, 오류 화면, 로딩 화면, 권한 없음 화면을 반드시 디자인한다.
- 접근성을 무시하지 않는다.

## Layout pattern

| Pattern | Feature |
|---|---|
| Drive-like fullscreen file manager | webhard |
| Three-pane mailbox | mailbox |
| Guided upload + review workspace | report-workspace |
| ERP list management | report-list |
| ERP directory management | headquarters-sites |
| ERP photo grid/list | photo-album |
| Settings hub | account-settings |
| Billing checkout/ledger | billing-credits |
| Auth/session callback | auth-workspace |

## Do not

- 웹하드를 ERP 카드형 웹하드로 되돌리지 않는다.
- 메일함을 단일 카드형 화면으로 단순화하지 않는다.
- 보고서 export gate를 숨기지 않는다.
- 사업장/현장 기준정보를 fullscreen workspace로 바꾸지 않는다.
- 사진첩을 웹하드처럼 보이게 만들지 않는다.
- Workspace Google login과 Gmail connect를 같은 UI로 묶지 않는다.
