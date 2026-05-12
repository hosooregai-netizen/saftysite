# 02_VERIFY_DOC_COVERAGE

```text
너는 문서 품질을 검수하는 QA 엔지니어다.

목표:
docs/safety-features 아래 모든 기능 문서가 템플릿 기준을 충족하는지 검사하라.

검사 대상:
- webhard
- mailbox
- report-workspace
- report-list
- headquarters-sites
- photo-album
- account-settings
- billing-credits
- auth-workspace

검사 기준:
- docs/safety-features/_project/specs/docs_qa_checklist.md
- docs/safety-features/DOCUMENTATION_RULES.md

요구사항:
1. 각 기능에 specs/README.md가 있는지 확인하라.
2. feature/user_flows/data_flow/schema/api_contract/ui_ux/validation/reverse_map/test_scenarios가 있는지 확인하라.
3. prompts/01_READ_AND_PLAN.md가 있는지 확인하라.
4. QA regression prompt가 있는지 확인하라.
5. 누락된 파일은 목록화하고 생성 프롬프트를 제안하라.
6. 내용이 빈약한 문서는 보강 방향을 제안하라.

완료 기준:
- 기능별 coverage table 생성
- 누락 파일 목록 생성
- 다음 보강 우선순위 제안
```
