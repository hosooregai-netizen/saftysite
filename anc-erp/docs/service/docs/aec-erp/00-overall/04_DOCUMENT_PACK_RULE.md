# 04. Document Pack Rule

## 1. 기본 원칙

이 프로젝트의 산출물은 기능별 문서팩으로 관리한다. 각 기능팩은 명세, 프롬프트, 디자인, 리버스맵을 함께 가진다.

## 2. 파일 번호 규칙

| 번호 | 파일 | 목적 |
|---:|---|---|
| 01 | PRODUCT_MARKDOWN | 제품/업무 명세 |
| 02 | TECH_MARKDOWN | 기술/API/모델 명세 |
| 03 | SERVICE_AI_PROMPT | 서비스 내부 AI 프롬프트 |
| 04 | CODEX_IMPLEMENTATION_PROMPT | 구현 에이전트 프롬프트 |
| 05 | DESIGN_MARKDOWN | 화면/UX/컴포넌트 명세 |
| 06 | DESIGN_PROMPT | 디자인 생성 프롬프트 |
| 07 | REVERSE_MAP | 기능 역추적 지도 |
| 08 | REVERSE_PROMPT | Reverse Map 생성/검증 프롬프트 |

## 3. ZIP 분리 규칙

### Markdown ZIP

포함:

```text
README.md
SOURCE_CHAT_SUMMARY.md
FILE_TREE.txt
MANIFEST.json
00-overall/*.md
XX-feature/README.md
XX-feature/markdown/*.md
```

### Prompt ZIP

포함:

```text
README.md
SOURCE_CHAT_SUMMARY.md
FILE_TREE.txt
MANIFEST.json
00-overall/03_GLOBAL_REVERSE_PROMPT.md
00-overall/02_GLOBAL_DESIGN_SYSTEM.md
XX-feature/README.md
XX-feature/prompts/*.md
```

### Full ZIP

포함:

```text
전체 파일
```

## 4. 내용 밀도 기준

각 기능의 `01_PRODUCT_MARKDOWN.md`에는 최소 다음 항목이 있어야 한다.

- 기능 정의
- 이 기능이 필요한 이유
- 주요 사용자
- 핵심 화면
- 사용자 흐름
- 핵심 데이터
- 상태
- 권한
- 완료 기준
- 다음 모듈 연결

각 기능의 `02_TECH_MARKDOWN.md`에는 최소 다음 항목이 있어야 한다.

- Frontend routes
- Components
- Backend APIs
- Data models
- Repository interfaces
- Validation rules
- Service rules
- API response example
- Tests

각 기능의 디자인 산출물에는 반드시 전체 디자인 시스템과 별개로 **기능별 디자인 마크다운 + 기능별 디자인 프롬프트**가 있어야 한다.
