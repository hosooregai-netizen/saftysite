# 00_MASTER_CREATE_CODE_DOCS_VERIFICATION

```text
너는 Next.js + FastAPI 프로젝트의 코드-문서 일치성을 검증하는 시니어 소프트웨어 아키텍트다.

목표:
최신 코드베이스와 `docs/safety-features` 문서를 대조하는 `_verification/` 문서 구조를 생성하라.

생성 구조:
docs/safety-features/_verification/
├─ README.md
├─ STEP15_MANIFEST.md
├─ specs/
└─ prompts/

요구사항:
1. 실제 frontend route inventory를 생성하라.
2. 실제 FastAPI endpoint inventory를 생성하라.
3. source readiness missing file을 확인하라.
4. 기능별 code inventory와 실제 파일 존재 여부를 대조하라.
5. docs registry와 code inventory의 gap report를 작성하라.
6. registry update plan을 작성하라.
7. reverse map consistency 검증 기준을 작성하라.
8. 앱 코드는 수정하지 마라.

완료 기준:
- 실제 route/API/source file 기준으로 문서 보강 항목이 명확하다.
- missing source readiness가 기능별로 분류되어 있다.
- 다음 단계에서 registry/reverse_map을 업데이트할 수 있다.
```
