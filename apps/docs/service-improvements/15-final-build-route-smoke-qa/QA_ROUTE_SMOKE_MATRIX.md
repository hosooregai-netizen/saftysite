# Final QA Route Smoke Matrix

## Build

| Check | Command | Result | Notes |
|---|---|---|---|
| frontend clean build | `rm -rf apps/web/.next && cd apps/web && npm run build` |  |  |
| backend compile | `cd apps/api && python -m compileall app` |  |  |

## Route smoke

| Route | Expected | Result | Notes |
|---|---|---|---|
| `/` | app entry/home 표시 |  |  |
| `/dashboard` | dashboard 또는 entry route 표시 |  |  |
| `/pricing` | pricing/billing 안내 표시 |  |  |
| `/reports/new` | 새 보고서 작성 화면 표시 |  |  |
| `/reports` | 보고서 목록, 검색/필터 표시 |  |  |
| `/reports/{knownReportId}` | 보고서 workspace 표시 |  |  |
| `/headquarters` | 사업장 기준정보 화면 표시 |  |  |
| `/sites` | 현장 기준정보 화면 표시 |  |  |
| `/photo-album` | 사진첩 grid/filter 표시 |  |  |
| `/webhard` | Drive-like file manager 표시 |  |  |
| `/share/{validToken}` | public share viewer 표시 |  |  |
| `/share/{invalidToken}` | invalid/expired/revoked state 표시 |  |  |
| `/mailbox` | 메일함 state 일관성 유지 |  |  |
| `/mail/connect/google?error=access_denied` | Gmail connect 오류 state 표시 |  |  |
| `/account` | 계정/guest import/billing entry 표시 |  |  |
| `/auth/google/callback?error=access_denied` | Workspace auth 오류 state 표시 |  |  |
| `/billing/checkout` | checkout 준비 또는 로그인 필요 state 표시 |  |  |
| `/billing/success` | confirm/success state 표시 |  |  |
| `/billing/fail` | 결제 실패 안내 표시 |  |  |
| `/credits` | credit 상태 또는 로그인 필요 state 표시 |  |  |

## Functional regression

### Mailbox

- [ ] Workspace Google login과 Gmail connect 문구가 분리되어 있다.
- [ ] “구글 메일 계정을 연결했습니다”와 “연결된 메일 계정이 없습니다”가 동시에 보이지 않는다.
- [ ] 계정 없음 / OAuth pending / sync needed / reconnect required state가 구분된다.
- [ ] 새 메일 작성창이 열린다.
- [ ] 받는 사람 없으면 발송 disabled.
- [ ] Gmail send 실패 시 local outbox 성공으로 저장하지 않는다.

### Webhard

- [ ] `/webhard`가 Drive-like layout을 유지한다.
- [ ] ERP 카드형 웹하드로 회귀하지 않는다.
- [ ] 공유 dialog가 한국어 업무 UI로 표시된다.
- [ ] public share는 shared root와 descendants만 접근 가능하다.
- [ ] public payload가 내부 headquarter/site id를 노출하지 않는다.

### Report

- [ ] `/reports/new`에서 기본정보/전경/위험요인 checklist가 보인다.
- [ ] 필수 사진 없으면 AI 초안 생성 disabled.
- [ ] 보고서 workspace에서 검토 항목이 남으면 export disabled.
- [ ] 책임 확인 전 export disabled.
- [ ] local/generated snapshot은 server sync 전 export disabled.

### Billing/Auth

- [ ] 최초 final export만 credit 차감.
- [ ] 같은 report 후속 PDF/HWPX는 추가 차감 없음.
- [ ] Toss confirm/webhook 중복 지급 없음.
- [ ] `/auth/google/callback`과 `/mail/connect/google` 역할 분리.
- [ ] guest import 중복 방지.

### Photo Album / Directory

- [ ] 사진첩 grid/list 전환.
- [ ] 사업장/현장/회차/검색 필터 동작.
- [ ] 사업장/현장 CRUD modal이 표시된다.
- [ ] 현장 quick action에서 보고서/사진첩/메일함 이동.
