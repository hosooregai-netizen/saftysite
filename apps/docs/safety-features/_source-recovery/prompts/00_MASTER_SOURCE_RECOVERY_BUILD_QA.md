# 00_MASTER_SOURCE_RECOVERY_BUILD_QA

```text
너는 Step 17 Source Recovery overlay 적용 후 clean build와 route smoke를 검증하는 시니어 QA 엔지니어다.

목표:
Source recovery 적용 후 남은 build/type/import/API 오류를 수집하고 기능별로 분류하라.

전제:
Step 17 overlay가 적용되어 있어야 한다.

검증 명령:
rm -rf apps/web/.next
cd apps/web
npm run build

검증 route:
- /mailbox
- /mail/connect/google?error=access_denied
- /photo-album
- /headquarters
- /sites
- /reports/new
- /reports
- /webhard
- /account

요구사항:
1. build 결과를 pass/fail로 기록하라.
2. 오류를 missing import, type mismatch, component props mismatch, API contract mismatch, CSS module mismatch로 분류하라.
3. 기능별 owner를 지정하라.
4. release blocking 여부를 표시하라.
5. 다음 patch list를 작성하라.
6. 앱 코드는 임의 수정하지 말고 보고서를 먼저 작성하라.

완료 기준:
- build result report가 작성된다.
- 다음 Step 19가 hardening인지 remaining error patch인지 결정된다.
```
