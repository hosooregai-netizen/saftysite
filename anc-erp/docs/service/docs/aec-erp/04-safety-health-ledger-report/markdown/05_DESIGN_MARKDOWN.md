# 05. Design Markdown — 공사안전보건대장 이행확인 보고서 자동화

## 1. 화면 목표

공사안전보건대장 이행확인 보고서 자동화 화면은 사용자가 발주처별 보고서 초안을 생성하고, 섹션별로 검토하고, A4 미리보기에서 최종 문서 형태를 확인한 뒤 export/제출까지 수행하는 문서 작업 화면이다.

핵심은 다음 세 가지다.

1. 발주처별 분기 명확화
2. 누락정보와 검토 경고 명확화
3. A4 제출 문서 미리보기 중심 작업

## 2. 화면 목록

### 2.1 보고서 목록

Route:

```text
/projects/[projectId]/documents/safety-reports
```

표시 항목:

| 컬럼 | 설명 |
|---|---|
| 문서번호 | 제2026-01호 |
| 회차 | 제1회 |
| 점검일 | 2026.01.23 |
| 발주처 | 삼성문화재단 등 |
| 문서상태 | draft/review/exported/submitted |
| 누락정보 | required missing count |
| 최종본 | 파일 링크 |
| 제출일 | submittedAt |
| 작성자 | 담당자 |

### 2.2 보고서 생성 마법사

Route:

```text
/projects/[projectId]/documents/safety-reports/new
```

Step:

```text
1. 점검회차 선택
2. 발주처 선택
3. 템플릿 선택
4. 연결 데이터 확인
5. 누락정보 확인
6. 초안 생성
```

### 2.3 보고서 편집

Route:

```text
/documents/safety-reports/[documentId]/edit
```

Layout:

```text
┌─────────────────────────────────────────────────────────┐
│ Top: 문서번호 / 회차 / 발주처 / 상태 / 저장 / export      │
├──────────────┬────────────────────────┬─────────────────┤
│ Section Nav  │ Section Editor         │ A4 Preview      │
│ 240px        │ fluid                  │ 520~720px       │
├──────────────┴────────────────────────┴─────────────────┤
│ Bottom Save Bar / Version / Validation                   │
└─────────────────────────────────────────────────────────┘
```

### 2.4 A4 미리보기

Route:

```text
/documents/safety-reports/[documentId]/preview
```

기능:

- 페이지별 미리보기
- 섹션 이동
- 확대/축소
- 출력 여백 확인
- 표/사진 페이지 깨짐 경고
- 최종본/초안 watermark 표시

### 2.5 변수/누락정보 화면

Route:

```text
/documents/safety-reports/[documentId]/variables
```

표시:

- 변수명
- 값
- 데이터 출처
- 발주처별 값 여부
- 필수 여부
- 수정 가능 여부

### 2.6 Export 화면

Route:

```text
/documents/safety-reports/[documentId]/export
```

구성:

- export 전 체크리스트
- 누락정보
- 검토 경고
- 저장 상태
- output format 선택
- 웹하드 저장 위치
- 최종 파일명 preview
- export 버튼

## 3. UX 규칙

1. 상단에는 항상 `문서번호 / 회차 / 발주처 / 상태`를 표시한다.
2. 발주처별 보고서임을 badge로 명확히 표시한다.
3. AI 초안 섹션은 `AI Draft` badge를 표시한다.
4. 사용자가 수정한 섹션은 `Edited` badge를 표시한다.
5. 확정 섹션은 잠금 아이콘을 표시한다.
6. required missing field가 있으면 final export 버튼을 비활성화한다.
7. linked data가 변경되면 `원본 데이터 변경됨` 경고를 표시한다.
8. A4 미리보기는 실제 제출 문서와 최대한 유사해야 한다.
9. 사진대지는 지적사진/조치사진 한 쌍을 명확히 보여준다.
10. 발주처별 금액과 총 공사금액은 시각적으로 구분한다.

## 4. 핵심 컴포넌트

### SafetyReportWizard

- 점검회차 선택
- 발주처 선택
- 템플릿 선택
- 연결 데이터 확인
- 누락정보 확인
- 초안 생성

### OwnerReportBranchNotice

표시 예:

```text
이 문서는 제1회 점검의 삼성문화재단 제출용 보고서입니다.
같은 회차에 삼성생명공익재단 보고서도 생성할 수 있습니다.
```

### DocumentSectionNavigator

섹션 목록:

```text
표지
공사개요
점검표
이행여부 확인서
위험성 감소대책
추가 유해·위험요인
산업안전보건관리비
사진대지
공사일정 첨부
```

각 섹션 옆에 상태 badge를 표시한다.

### MissingFieldPanel

필드 그룹:

```text
프로젝트 정보
발주처 정보
점검회차 정보
점검표
사진대지
산업안전보건관리비
서명/날인
```

### A4ReportPreview

- 흰색 A4 paper
- 회색 workspace background
- 페이지 그림자
- 페이지 번호
- 초안 watermark
- 확대/축소

### PhotoLedgerSectionEditor

- 지적사항 카드
- 지적 사진
- 조치 사진
- 캡션
- 누락사진 warning
- 사진 순서 변경

## 5. Warning State

### 발주처별 값 누락

```text
이 발주처의 공사금액 또는 산업안전보건관리비 정보가 누락되었습니다.
발주처별 보고서에는 발주처 전용 금액이 필요합니다.
```

### 사진대지 누락

```text
지적사항에 연결된 조치사진이 없습니다.
최종본 export 전에 사진대지 구성을 확인하세요.
```

### 원본 데이터 변경

```text
보고서 생성 이후 점검표 또는 지적사항 데이터가 변경되었습니다.
보고서에 최신 데이터를 반영할지 선택하세요.
```

## 6. Responsive

### Desktop

- Section Nav + Editor + A4 Preview 3-column
- 우측 preview 고정
- 하단 save/export bar 고정

### Tablet

- Section Nav는 drawer
- Editor와 Preview toggle

### Mobile

- 섹션별 카드 편집
- 미리보기는 별도 화면
- export는 제한하거나 검토 전용으로 사용
