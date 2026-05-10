# Final QA Runbook

## 1. Build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

```bash
cd apps/api
python -m compileall app
```

## 2. Route smoke

`_qa/ROUTE_SMOKE_CHECKLIST.md`를 사용한다.

## 3. 기능별 gate

### Mailbox

- 연결 성공 메시지와 계정 없음 메시지가 동시에 보이면 실패.
- OAuth pending, no accounts, connected empty, sync needed, reconnect required 상태가 구분되어야 한다.
- 새 메일 작성 시 받는 사람 없으면 발송 disabled.

### Webhard

- Drive-like layout 유지.
- ERP 카드형 웹하드로 회귀하면 실패.
- public share는 shared root와 descendants만 접근.
- 내부 headquarter/site id를 public payload에 노출하지 않음.

### Report / Billing / Auth

- 검토 완료 전 export disabled.
- 책임 확인 전 export disabled.
- 최초 final export만 credit 차감.
- Toss confirm/webhook 중복 지급 없음.
- `/auth/google/callback`과 `/mail/connect/google` 분리.

### Photo / Directory / Account

- 사진첩 grid/filter 표시.
- 사업장/현장 CRUD modal 표시.
- 현장 quick action으로 보고서/사진첩/메일함 이동.
- 설정 화면에서 guest import와 billing entry 표시.

## 4. QA report 작성

`15-final-build-route-smoke-qa/FINAL_QA_REPORT_TEMPLATE.md`를 사용한다.
