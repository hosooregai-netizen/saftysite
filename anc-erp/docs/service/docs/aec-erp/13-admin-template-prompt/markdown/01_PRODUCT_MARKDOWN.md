# 01. Product Markdown — 관리자/템플릿/프롬프트

## 1. 기능 정의

관리자/템플릿/프롬프트는 A&C 기술사 ERP의 운영 설정과 자동화 품질을 관리하는 기능이다.

이 기능은 단순한 관리자 페이지가 아니라 다음 항목을 버전 단위로 통제한다.

- 사용자/권한
- 회사정보
- 프로젝트 기본 정책
- 문서 템플릿
- 체크리스트 템플릿
- 표준 문구
- 법령/고시 문구
- 서비스 AI 프롬프트
- Codex 구현 프롬프트 저장소
- 디자인 프롬프트
- Reverse Prompt
- 메일 템플릿
- 웹하드 폴더 정책
- 결재선 템플릿
- 서명/직인 자산
- 감사로그

## 2. 이 기능이 필요한 이유

A&C ERP의 핵심은 문서 자동화다. 그런데 문서 자동화 품질은 화면보다 템플릿과 프롬프트에 크게 의존한다.

예를 들어 다음 문서는 모두 템플릿 버전을 가져야 한다.

```text
기술용역계약서
공사안전보건대장 이행확인 보고서
공사안전보건대장 이행 확인 점검표
공사안전보건대장 이행여부 확인서
유해·위험방지계획에 따른 위험성 감소대책 이행확인
추가 유해·위험요인 점검리스트
산업안전보건관리비 사용내용 확인
사진대지
안전관리계획서
안전보건대장
보고서 제출 메일
조치요청 메일
```

템플릿과 프롬프트가 관리되지 않으면 다음 문제가 발생한다.

- 발주처별 문서 양식이 섞인다.
- 법령 문구가 임의 변경된다.
- AI가 생성한 문구의 근거 버전을 추적할 수 없다.
- 기존 문서가 새 템플릿 변경으로 깨진다.
- Codex 구현 프롬프트와 실제 Reverse Map이 어긋난다.
- 체크리스트 항목 버전이 보고서 섹션과 불일치한다.

따라서 관리자/템플릿/프롬프트 기능은 ERP의 장기 운영을 위한 필수 모듈이다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 시스템 관리자 | 사용자/권한, 전역 설정, 감사로그 관리 |
| 템플릿 관리자 | 문서 템플릿, 변수, 섹션, 반복 표 관리 |
| 기술사/대표 | 법령 문구, 표준 문구, 최종 발행 승인 |
| 문서 작성 책임자 | 보고서 문구, 메일 템플릿, 체크리스트 문항 보정 |
| 개발/운영 담당자 | Codex 구현 프롬프트, Reverse Map, 테스트케이스 관리 |
| 일반 사용자 | 발행된 템플릿과 프롬프트만 사용 |

## 4. 핵심 기능

### 4.1 사용자/권한 관리

사용자 계정, 역할, 프로젝트 접근권한, 관리자 권한을 관리한다.

역할 예시:

```text
super_admin
admin
template_manager
prompt_manager
legal_text_manager
engineer
writer
contract_manager
field_inspector
viewer
```

권한은 다음 단위로 나뉜다.

```text
project.read
project.write
document.generate
document.export
document.submit
template.read
template.write
template.publish
prompt.read
prompt.write
prompt.publish
legal_clause.write
admin.audit.read
```

### 4.2 회사정보 관리

A&C기술사사무소의 기본 정보를 관리한다.

필드:

- 회사명
- 대표자
- 사업자등록번호
- 주소
- 전화번호
- 이메일
- 로고
- 직인 이미지
- 기술사 정보
- 기본 서명 문구
- 기본 메일 footer

### 4.3 문서 템플릿 관리

문서 자동화에 사용할 템플릿을 관리한다.

템플릿 유형:

```text
technical_service_contract
estimate
safety_health_ledger_inspection_report
safety_management_plan
safety_health_ledger
photo_ledger
safety_cost_usage
mail_submission
mail_action_request
approval_checklist
```

템플릿은 다음 구조를 가진다.

```text
DocumentTemplate
→ TemplateVersion
→ TemplateSection
→ TemplateVariable
→ TemplateLoop
→ TemplateCondition
→ TemplatePreviewSample
```

### 4.4 템플릿 변수 관리

템플릿 변수는 dot notation을 사용한다.

예시:

```text
{{project.projectName}}
{{project.siteAddress}}
{{owner.organizationName}}
{{inspection.roundNo}}
{{inspection.actualInspectionDate}}
{{safetyCost.calculatedAmount}}
{{safetyCost.usedAmount}}
{{safetyCost.usedRate}}
{{finding.title}}
{{correctiveAction.actionDetail}}
{{photo.findingPhoto}}
{{photo.actionPhoto}}
```

반복 구문 예시:

```text
{{#each checklistResults}}
  {{itemTitle}} / {{result}} / {{comment}}
{{/each}}
```

조건 구문 예시:

```text
{{#if owner.requiresSeparateReport}}
  발주처별 보고서 문구
{{/if}}
```

### 4.5 체크리스트 템플릿 관리

현장점검 체크리스트 항목과 보고서 매핑을 관리한다.

관리 대상:

- 공통 점검표
- 건축·토목 점검표
- 건설기계 점검표
- 위험성 감소대책 항목
- 추가 유해·위험요인 항목
- 보고서 섹션 매핑
- 항목별 지적사항 후보 생성 규칙

### 4.6 표준 문구 / 법령 문구 라이브러리

문서 자동화에서 사용할 표준 문구와 법령/고시 문구를 관리한다.

구분:

```text
standard_phrase
legal_clause
guideline_text
contract_clause
mail_phrase
review_warning_text
```

법령/고시 문구는 다음 원칙을 따른다.

- 권한 있는 사용자만 수정 가능
- 수정 시 변경 사유 필수
- 발행 전 검토 필요
- 기존 문서에는 자동 소급 적용하지 않음
- 사용된 문서/프롬프트 버전 추적

### 4.7 서비스 AI 프롬프트 관리

ERP 내부에서 실행되는 AI 프롬프트를 관리한다.

프롬프트 예시:

```text
project-info-extraction
contract-draft-generation
inspection-schedule-generation
safety-report-generation
checklist-summary-and-finding-candidate
finding-action-photo-ledger
safety-cost-usage-comment
safety-management-plan-generation
safety-health-ledger-generation
webhard-file-classification
mail-draft-and-classification
approval-submission-readiness
template-variable-mapping-and-prompt-governance
```

프롬프트는 다음 정보를 가진다.

- promptKey
- 이름
- 목적
- 입력 스키마
- 출력 스키마
- 시스템 메시지
- 사용자 메시지 템플릿
- 금지사항
- 테스트케이스
- 버전
- 상태

### 4.8 Codex/구현 프롬프트 저장소

개발 에이전트에게 넣을 구현 프롬프트를 기능별로 저장한다.

구분:

```text
codex_implementation_prompt
design_prompt
reverse_prompt
service_ai_prompt
qa_prompt
all_in_one_context
```

관리 목적:

- 기능별 구현 지시문 일관성 유지
- Reverse Map과 API/모델 불일치 방지
- 기능 추가 시 누적 문맥 유지
- Codex 작업 전 acceptance criteria 명확화

### 4.9 프롬프트 테스트/평가

프롬프트 발행 전 샘플 입력과 예상 출력으로 검증한다.

테스트 항목:

- JSON schema 준수
- 누락정보 분리
- 입력에 없는 정보 생성 금지
- 발주처별 분기 정확성
- 금액/날짜 임의 생성 금지
- 법령 문구 임의 생성 금지
- 사진 누락 warning 생성
- save-before-export 불변 조건 포함

### 4.10 발행/롤백

템플릿과 프롬프트는 발행 전 검토를 거친다.

상태:

```text
draft
review
published
deprecated
archived
```

발행 후에는 새 문서 생성에만 적용하고, 기존 문서는 생성 당시 버전을 유지한다.

## 5. 사용자 흐름

### 문서 템플릿 발행 흐름

```text
템플릿 생성
→ 섹션 작성
→ 변수 등록
→ 반복/조건 설정
→ 샘플 데이터 preview
→ 누락 변수 확인
→ 테스트 통과
→ 검토 요청
→ 승인
→ publish
```

### 프롬프트 발행 흐름

```text
프롬프트 생성
→ 입력/출력 스키마 작성
→ 금지사항 작성
→ 테스트케이스 등록
→ 샘플 실행
→ 결과 평가
→ 검토 요청
→ 승인
→ publish
```

### 법령 문구 변경 흐름

```text
법령 문구 수정 요청
→ 변경 사유 입력
→ 영향 템플릿 확인
→ 기술사 검토
→ 발행
→ 감사로그 기록
```

## 6. 완료 기준

- 사용자를 생성하고 역할/권한을 부여할 수 있다.
- 회사정보, 로고, 직인, 서명 문구를 관리할 수 있다.
- 문서 템플릿을 버전 단위로 관리할 수 있다.
- 템플릿 변수, 반복 섹션, 조건부 섹션을 관리할 수 있다.
- 체크리스트 템플릿과 보고서 섹션 매핑을 관리할 수 있다.
- 표준 문구와 법령 문구를 권한 기반으로 관리할 수 있다.
- 서비스 AI 프롬프트를 버전 단위로 관리할 수 있다.
- Codex/디자인/Reverse Prompt를 기능별로 보관할 수 있다.
- 프롬프트 테스트케이스를 실행하고 결과를 평가할 수 있다.
- 발행/롤백/감사로그가 남는다.
