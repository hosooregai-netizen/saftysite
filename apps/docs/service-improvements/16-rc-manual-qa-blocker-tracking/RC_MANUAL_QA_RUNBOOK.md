# RC Manual QA Runbook

## 1. Build 결과 확인

먼저 15단계 스크립트 결과를 확인한다.

```text
docs/service-improvements/15-final-build-route-smoke-qa/FINAL_QA_REPORT.md
docs/service-improvements/15-final-build-route-smoke-qa/frontend-build.log
docs/service-improvements/15-final-build-route-smoke-qa/backend-compile.log
```

## 2. Manual route smoke

아래 route를 실제 브라우저에서 확인한다.

| Route | 핵심 확인 |
|---|---|
| `/` | app entry/home 표시 |
| `/dashboard` | dashboard/entry 표시 |
| `/pricing` | pricing/billing 안내 표시 |
| `/reports/new` | 새 보고서 작성, checklist 표시 |
| `/reports` | 검색/필터/출력 이력 표시 |
| `/reports/{knownReportId}` | review/export gate 표시 |
| `/headquarters` | 사업장 기준정보 |
| `/sites` | 현장 기준정보 |
| `/photo-album` | grid/list/filter 표시 |
| `/webhard` | Drive-like layout 유지 |
| `/share/{validToken}` | public share viewer |
| `/share/{invalidToken}` | invalid/expired/revoked state |
| `/mailbox` | state contradiction 없음 |
| `/mail/connect/google?error=access_denied` | Gmail connect error state |
| `/account` | account/session/guest import/billing entry |
| `/auth/google/callback?error=access_denied` | workspace auth error state |
| `/billing/checkout` | checkout 또는 auth-required state |
| `/billing/success` | confirm/success state |
| `/billing/fail` | failure state |
| `/credits` | credit state 또는 login required |

## 3. 기능별 gate

### Mailbox

- [ ] Workspace Google login과 Gmail connect 문구가 분리되어 있다.
- [ ] “구글 메일 계정을 연결했습니다”와 “연결된 메일 계정이 없습니다”가 동시에 보이지 않는다.
- [ ] OAuth success pending / no accounts / sync needed / reconnect required가 구분된다.
- [ ] 새 메일 작성창에서 수신자 없으면 발송이 비활성화된다.
- [ ] Gmail send 실패가 local sent success처럼 저장되지 않는다.

### Webhard

- [ ] Drive-like layout 유지.
- [ ] ERP 카드형 웹하드로 회귀하지 않음.
- [ ] 공유 dialog가 한국어 업무 UI로 표시된다.
- [ ] public share는 shared root 밖으로 나가지 않는다.
- [ ] public payload에서 내부 headquarter/site id를 노출하지 않는다.

### Report / Billing / Auth

- [ ] 필수 사진 없으면 AI 초안 생성 차단.
- [ ] 검토 항목이 남으면 export 차단.
- [ ] 책임 확인 전 export 차단.
- [ ] 최초 final export만 credit 차감.
- [ ] 같은 report의 후속 PDF/HWPX는 추가 차감 없음.
- [ ] Toss confirm/webhook 중복 지급 없음.
- [ ] guest import 중복 없음.

### Photo / Directory / Account

- [ ] 사진첩 grid/list/filter 동작.
- [ ] 사업장/현장 CRUD modal 표시.
- [ ] 현장 quick action에서 보고서/사진첩/메일함 이동.
- [ ] 설정 화면에서 Workspace login과 Gmail connect가 분리되어 설명된다.

## 4. Release decision

결정은 아래 셋 중 하나다.

```text
Release
Hold
Conditional Release
```

Hold 조건:

```text
clean build 실패
backend compile 실패
workspace/public share security 실패
billing idempotency 실패
report export gate 실패
mailbox state contradiction
webhard Drive-like visual regression
```
