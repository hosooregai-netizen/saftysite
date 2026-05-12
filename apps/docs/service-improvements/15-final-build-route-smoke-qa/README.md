# Service Improvement 15: Final Clean Build / Route Smoke QA

## 목적

1~14단계 service improvement overlay를 적용한 뒤, 실제 release candidate에 들어가기 전에 clean build, backend compile, 핵심 route smoke, 기능별 regression gate를 한 번에 확인한다.

이번 단계는 앱 기능을 새로 수정하는 source patch가 아니라, 누적 개선 패키지를 검증하기 위한 QA package다.

## 적용 순서

```bash
unzip service_improvements_01_to_14_apply_overlay.zip
unzip service_improvement_15_final_build_route_smoke_qa_overlay.zip
```

## 실행

프로젝트 루트에서:

```bash
bash scripts/service-improvements/run-final-qa.sh
```

수동으로 실행하려면:

```bash
rm -rf apps/web/.next
cd apps/web
npm run build

cd ../api
python -m compileall app
```

## 핵심 route smoke

```text
/
/dashboard
/pricing
/reports/new
/reports
/reports/{knownReportId}
/headquarters
/sites
/photo-album
/webhard
/share/{validToken}
/share/{invalidToken}
/mailbox
/mail/connect/google?error=access_denied
/account
/auth/google/callback?error=access_denied
/billing/checkout
/billing/success
/billing/fail
/credits
```

## Release hold 조건

아래 중 하나라도 실패하면 다음 단계는 blocker patch다.

```text
frontend clean build 실패
backend compile 실패
/mailbox state contradiction
/webhard Drive-like layout 회귀
public share root boundary 실패
report export gate 실패
billing idempotency 실패
workspace auth와 Gmail connect 혼동
guest import 중복
```
