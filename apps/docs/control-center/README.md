# Interactive Control Center

생성일: 2026-05-09 05:52 UTC

이 폴더는 기존 Markdown 문서 구조를 대체하지 않고, 그 위에 얹는 정적 HTML control layer다.

## 핵심 구조

```text
docs/control-center/
├─ index.html
├─ README.md
├─ CONTROL_CENTER_PROMPT.md
├─ data/
│  ├─ features.json
│  ├─ service_improvements.json
│  ├─ prompts.json
│  ├─ routes.json
│  ├─ qa_gates.json
│  └─ blockers.json
└─ exports/
   └─ .gitkeep
```

## 사용법

브라우저에서 `docs/control-center/index.html`을 연다.

기능:

- 기능별 route/source/spec/prompt 확인
- Service Improvement 01~16 적용 상태 체크
- route smoke 결과 localStorage 저장
- blocker severity 확인
- Codex용 prompt 복사

## 원칙

```text
Markdown = source of truth
Registry/JSON = structured index
HTML = interactive control surface
```

HTML은 문서 원본이 아니다. 명세와 프롬프트는 계속 `docs/safety-features/`와 `docs/service-improvements/`의 Markdown을 기준으로 관리한다.
