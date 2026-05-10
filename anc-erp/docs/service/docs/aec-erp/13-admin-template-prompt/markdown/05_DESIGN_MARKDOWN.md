# 05. Design Markdown — 관리자/템플릿/프롬프트

## 1. 화면 목표

관리자/템플릿/프롬프트 화면은 A&C ERP의 운영 품질을 관리하는 전문가용 설정 화면이다.

일반 사용자에게는 복잡해 보일 수 있으므로, 관리자 화면은 다음 목표를 가진다.

- 설정 항목을 기능별로 명확히 분리한다.
- 문서 템플릿과 프롬프트 버전 상태를 한눈에 보여준다.
- 발행 전 검증/테스트/미리보기를 강하게 유도한다.
- 법령/고시 문구와 일반 문구를 시각적으로 구분한다.
- 위험한 작업은 확인 모달과 감사로그 사유 입력을 요구한다.

## 2. 화면 목록

### 2.1 관리자 대시보드

Route:

```text
/admin
```

표시 카드:

- 사용자 수
- 활성 템플릿 수
- 검토중 템플릿 수
- 발행된 프롬프트 수
- 실패한 프롬프트 테스트
- 최근 법령 문구 변경
- 최근 감사로그

### 2.2 사용자/권한

Routes:

```text
/admin/users
/admin/roles
/admin/permissions
```

화면 구성:

- 사용자 테이블
- 역할 badge
- 프로젝트 접근 정책
- 상태 필터
- 권한 matrix
- 역할별 권한 편집 drawer

### 2.3 회사정보

Route:

```text
/admin/company
```

화면 구성:

- 회사 기본정보 form
- 로고 업로드
- 직인 이미지 업로드
- 기술사 정보
- 기본 문서 footer
- 기본 메일 footer
- 변경 이력

### 2.4 문서 템플릿 목록

Route:

```text
/admin/document-templates
```

컬럼:

| 컬럼 | 설명 |
|---|---|
| 템플릿명 | 문서 템플릿 이름 |
| 문서유형 | 보고서/계약서/사진대지 등 |
| 현재 버전 | published version |
| 상태 | draft/review/published/deprecated |
| 변수 수 | TemplateVariable count |
| 섹션 수 | TemplateSection count |
| 최근 수정 | updatedAt |
| 발행자 | publishedBy |

### 2.5 문서 템플릿 편집기

Route:

```text
/admin/document-templates/[templateId]
```

Layout:

```text
┌─────────────────────────────────────────────────────────┐
│ Template Header: 이름 / 유형 / 버전 / 상태 / 발행 버튼    │
├──────────────┬────────────────────────┬─────────────────┤
│ Section Tree │ Template Editor        │ Preview/Vars    │
│ 260px        │ fluid                  │ 420px           │
└──────────────┴────────────────────────┴─────────────────┘
```

편집 기능:

- 섹션 추가/삭제/정렬
- 변수 삽입
- 반복 섹션 삽입
- 조건부 섹션 삽입
- 표준 문구 삽입
- 법령 문구 삽입
- 샘플 데이터 preview
- 변수 추출
- validation
- version diff

### 2.6 변수 관리자

Route:

```text
/admin/document-templates/[templateId]/variables
```

컬럼:

- variableKey
- label
- dataPath
- sourceModel
- dataType
- required
- ownerSpecific
- exampleValue
- 사용 섹션

### 2.7 체크리스트 템플릿

Route:

```text
/admin/checklist-templates
```

구성:

- 템플릿 목록
- 카테고리 탭
- 항목 편집 table
- 보고서 섹션 매핑
- 주의/불량 시 지적사항 후보 생성 규칙
- 발행/복제/보관 버튼

### 2.8 표준 문구 / 법령 문구

Routes:

```text
/admin/phrase-library
/admin/legal-clauses
```

표준 문구 화면:

- 문구 유형 필터
- 태그
- 본문 미리보기
- 사용 템플릿 목록

법령 문구 화면:

- 더 강한 warning 스타일
- 변경 사유 필수
- 검토/승인 stepper
- 사용 문서/템플릿 영향도
- 변경 이력

### 2.9 프롬프트 저장소

Route:

```text
/admin/prompts
```

컬럼:

- promptKey
- 이름
- 유형
- featureId
- 현재 버전
- 상태
- 테스트 통과율
- 최근 실행
- 발행자

### 2.10 프롬프트 편집기

Route:

```text
/admin/prompts/[promptId]
```

구성:

- system message editor
- user message template editor
- input schema editor
- output schema editor
- guardrails editor
- forbidden behaviors editor
- linked templates
- test cases
- run console
- publish checklist

### 2.11 Prompt Run Console

Route:

```text
/admin/prompts/[promptId]/run
```

구성:

- 입력 fixture JSON editor
- 실행 버튼
- 출력 결과 panel
- schema validation 결과
- forbidden behavior 결과
- 테스트 통과/실패 badge
- PromptRunLog 저장

### 2.12 감사로그

Route:

```text
/admin/audit-logs
```

컬럼:

- 시간
- 사용자
- action
- targetType
- targetName
- 변경 사유
- before/after diff
- IP

## 3. UX 규칙

- published 버전은 편집 불가로 표시한다.
- 새 버전 만들기 버튼을 명확히 제공한다.
- publish 버튼은 검증 통과 전 비활성화한다.
- 법령 문구는 빨간색/주황색 caution area를 사용한다.
- 위험 작업은 항상 confirm modal과 reason field를 요구한다.
- version diff는 좌우 비교 형태로 제공한다.
- 프롬프트 테스트 실패는 publish checklist에서 막는다.
- 템플릿 impact panel은 변경이 영향을 줄 문서유형과 기능을 표시한다.
- 비개발자도 변수/반복/조건을 이해할 수 있도록 설명 tooltip을 제공한다.

## 4. 핵심 컴포넌트

### TemplateSectionTree

- 섹션 목록
- drag reorder
- required badge
- source model badge
- warning count

### TemplateVariableTable

- variableKey
- dataPath
- required
- ownerSpecific
- sourceModel
- example value

### TemplatePreviewPane

- 샘플 프로젝트 선택
- 발주처 선택
- 점검회차 선택
- A4 preview
- missing variables panel

### PromptMessageEditor

- system/user prompt tabs
- markdown editor
- variable insertion helper
- guardrail snippets

### PromptRunResultPanel

- raw output
- parsed JSON
- schema validation
- expected checks
- warnings
- run log

### VersionDiffViewer

- 이전 버전
- 새 버전
- 변경 섹션 highlight
- 변수 변경 highlight

## 5. Empty State

### 템플릿 없음

```text
등록된 문서 템플릿이 없습니다.
공사안전보건대장 이행확인 보고서 템플릿부터 생성하세요.
```

### 프롬프트 없음

```text
등록된 프롬프트가 없습니다.
서비스 AI 프롬프트 또는 Codex 구현 프롬프트를 추가하세요.
```

## 6. Warning State

### Publish 불가

```text
필수 변수 3개가 매핑되지 않았습니다.
템플릿 발행 전 변수 매핑을 완료하세요.
```

### 법령 문구 변경

```text
법령/고시 문구 변경은 기존 문서에 직접 반영되지 않습니다.
변경 사유와 검토자를 입력하세요.
```

### 프롬프트 테스트 실패

```text
프롬프트 테스트케이스 2개가 실패했습니다.
발행 전 실패 원인을 수정하세요.
```

## 7. Responsive

관리자/템플릿/프롬프트 화면은 데스크톱 우선이다.

- Desktop: table + editor + preview 3-column
- Tablet: editor/preview toggle
- Mobile: 조회와 간단 승인만 지원, 복잡한 템플릿 편집은 제한
