# Docs QA Checklist

## 구조

- [ ] 각 기능에 `specs/`가 있다.
- [ ] 각 기능에 `prompts/`가 있다.
- [ ] `specs/README.md`가 있다.
- [ ] `prompts/01_READ_AND_PLAN.md`가 있다.
- [ ] QA regression prompt가 있다.

## specs 품질

- [ ] `feature.md`에 목적/범위/성공 기준이 있다.
- [ ] `user_flows.md`에 주요 흐름이 있다.
- [ ] `data_flow.md`에 route → component → API → backend가 있다.
- [ ] `schema.md`에 핵심 모델이 있다.
- [ ] `api_contract.md`에 endpoint/request/response/error가 있다.
- [ ] `ui_ux.md`에 화면 상태와 interaction이 있다.
- [ ] `validation.md`에 기능/보안/build 검증이 있다.
- [ ] `reverse_map.md`에 route/file/API/schema/prompt 연결이 있다.
- [ ] `test_scenarios.md`에 smoke/regression/negative case가 있다.

## prompts 품질

- [ ] 역할이 명확하다.
- [ ] 목표가 명확하다.
- [ ] 반드시 확인할 파일이 있다.
- [ ] 절대 수정하지 말아야 할 항목이 있다.
- [ ] 요구사항이 번호로 정리되어 있다.
- [ ] 완료 기준이 있다.
- [ ] build/QA 기준이 있다.
