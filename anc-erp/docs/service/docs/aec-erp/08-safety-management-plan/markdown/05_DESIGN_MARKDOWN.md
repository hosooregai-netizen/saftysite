# 05. Design Markdown — 안전관리계획서 자동화

## 1. 화면 목표

안전관리계획서 자동화 화면은 프로젝트의 안전관리계획서를 섹션별로 작성하고, 위험요인/감소대책을 표로 관리하며, A4 제출 문서 형태로 미리보고 export하는 문서 작업 화면이다.

핵심 UX 목표:

1. 프로젝트 원장 데이터 자동 반영
2. 공종별 위험요인/감소대책 표 작성
3. 안전조직·비상연락망·교육·점검계획을 누락 없이 작성
4. A4 문서 미리보기 중심의 검토
5. AI 초안과 확정본의 명확한 구분

## 2. 화면 목록

### 2.1 계획서 목록

Route:

```text
/projects/[projectId]/safety-management-plans
```

표시 컬럼:

| 컬럼 | 설명 |
|---|---|
| 계획서명 | 문서 상세 이동 |
| 프로젝트 | 프로젝트명 |
| 템플릿 | 안전관리계획서 템플릿 버전 |
| 상태 | draft/review/exported 등 |
| 위험요인 | 등록된 risk item 수 |
| 누락정보 | required missing count |
| 최종본 | FileAsset 링크 |
| 수정일 | updatedAt |

### 2.2 계획서 생성 마법사

Route:

```text
/projects/[projectId]/safety-management-plans/new
```

Step:

```text
1. 템플릿 선택
2. 프로젝트/계약 정보 확인
3. 첨부자료 연결
4. 주요 공종 선택
5. 위험요인 후보 생성
6. 누락정보 확인
7. 초안 생성
```

### 2.3 계획서 편집

Route:

```text
/safety-management-plans/[planId]/edit
```

Layout:

```text
┌─────────────────────────────────────────────────────────┐
│ Top: 계획서명 / 프로젝트 / 상태 / 저장 / 검토요청 / export │
├──────────────┬────────────────────────┬─────────────────┤
│ Section Nav  │ Section Editor         │ A4 Preview      │
│ 240px        │ fluid                  │ 520~720px       │
└──────────────┴────────────────────────┴─────────────────┘
```

### 2.4 위험요인/감소대책 화면

Route:

```text
/safety-management-plans/[planId]/risks
```

구성:

- 공종 필터
- 위험유형 필터
- 위험도 필터
- RiskRegister table
- 위험요인 추가/수정 drawer
- AI 위험요인 후보 생성 버튼
- 체크리스트/지적사항에서 불러오기 버튼

RiskRegister 컬럼:

| 컬럼 | 설명 |
|---|---|
| 공종 | 승강기 설치 등 |
| 작업내용 | 상세 작업 |
| 유해·위험요인 | 위험 설명 |
| 위험유형 | 추락/감전/화재 등 |
| 위험도 | low/medium/high/critical |
| 감소대책 | 조치 계획 |
| 책임조직 | 시공사/A&C/발주처 등 |
| 점검방법 | 점검·기록 방식 |
| 출처 | manual/template/checklist |

### 2.5 조직/비상/교육 화면

Route:

```text
/safety-management-plans/[planId]/organization
/safety-management-plans/[planId]/education
/safety-management-plans/[planId]/emergency
```

각 화면은 표 입력과 파일 연결을 함께 제공한다.

### 2.6 A4 미리보기/Export

Route:

```text
/safety-management-plans/[planId]/preview
/safety-management-plans/[planId]/export
```

Export 전 체크리스트:

- 필수 프로젝트 정보
- 안전조직
- 위험요인/감소대책
- 교육계획
- 점검계획
- 비상연락망
- 필수 첨부자료
- 최신 저장 여부
- 웹하드 저장 위치

## 3. UX 규칙

- 상단에는 항상 `계획서명 / 프로젝트명 / 상태 / 저장상태`를 표시한다.
- AI 초안 섹션은 `AI Draft` badge를 표시한다.
- 사용자가 수정한 섹션은 `Edited` badge를 표시한다.
- 확정 섹션은 lock icon을 표시한다.
- 위험도 high/critical은 시각적으로 강조한다.
- 필수 첨부자료가 없으면 export 전 warning을 표시한다.
- 법령/표준 문구는 편집권한과 변경이력을 표시한다.
- A4 미리보기는 실제 출력 여백과 페이지 구성을 최대한 보여준다.

## 4. 주요 컴포넌트

### SafetyManagementPlanWizard

- 템플릿 선택
- 프로젝트 데이터 확인
- 공정표/첨부자료 연결
- 공종 선택
- 위험요인 후보 생성
- 누락정보 확인
- 초안 생성

### PlanSectionNavigator

섹션 목록과 상태 badge를 표시한다.

### RiskRegisterTable

공종별 위험요인과 감소대책을 관리하는 핵심 표다.

### SafetyOrganizationEditor

안전관리조직도, 역할/책임, 담당자 연락처를 관리한다.

### EmergencyContactTable

비상연락망, 사고유형별 대응절차, 병원/소방/관계기관 연락처를 관리한다.

### AttachmentLinkPanel

웹하드 FileAsset을 계획서 첨부로 연결한다.

## 5. Warning State

### 위험요인 없음

```text
등록된 공종별 위험요인이 없습니다.
안전관리계획서 export 전에 주요 공종과 위험요인을 입력하세요.
```

### 필수 첨부 누락

```text
공정표 또는 안전관리조직도 첨부가 누락되었습니다.
웹하드에서 파일을 연결하거나 새로 업로드하세요.
```

### 원본 데이터 변경

```text
프로젝트 원장 또는 계약 정보가 계획서 생성 이후 변경되었습니다.
최신 데이터 반영 여부를 확인하세요.
```

## 6. Responsive

### Desktop

- Section Nav + Editor + A4 Preview 3-column
- RiskRegister는 table 중심
- 우측 MissingField/Warning panel

### Tablet

- Section Nav drawer
- Editor/Preview toggle
- Risk table horizontal scroll

### Mobile

- 검토 중심
- 위험요인/첨부 상태 확인
- 본격 편집은 데스크톱 권장
