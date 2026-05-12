# Service Improvement 17: Feature Design Implementation Prompts

## 목적

기존 `docs/safety-features` 기능별 문서에 디자인 구현 전용 프롬프트를 추가한다.

## 적용 내용

```text
docs/safety-features/_design-implementation/
docs/safety-features/{feature}/specs/design_implementation.md
docs/safety-features/{feature}/prompts/*_DESIGN_IMPLEMENTATION_PROMPT.md
```

## 사용 순서

1. 담당 기능의 `specs/design_implementation.md`를 읽는다.
2. 담당 기능의 `prompts/*_DESIGN_IMPLEMENTATION_PROMPT.md`를 실행한다.
3. build와 visual QA를 실행한다.
