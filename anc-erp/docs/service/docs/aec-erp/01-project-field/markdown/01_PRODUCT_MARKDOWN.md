# 01. Product Markdown — 프로젝트/현장 원장 관리

## 1. 기능 정의

프로젝트/현장 원장 관리는 A&C 기술사 ERP의 기준 데이터 기능이다.

이 기능은 계약서, 총괄현황, 점검표, 이행여부 확인서, 산업안전보건관리비 확인, 사진대지, 제출 메일에 반복 사용되는 공사개요 정보를 한 곳에서 관리한다.

단순히 프로젝트명을 등록하는 기능이 아니라, 다음 정보를 구조화한다.

```text
Project: 현장/공사 자체
Organization: 발주처, 시공사, 엔지니어링사, 협력사 등 조직
ProjectParty: 특정 프로젝트 안에서 조직이 맡는 역할
Contact: 조직과 프로젝트에 연결된 담당자
```

## 2. 이 기능이 필요한 이유

A&C 업무 문서에서는 같은 정보가 여러 문서에 반복된다.

```text
- 사업명
- 현장명
- 현장주소
- 발주자
- 시공사
- 엔지니어링사
- 공사금액
- 발주처별 금액
- 공사기간
- 실착공일
- 공정율
- 규모
- 담당자 연락처
- 점검주기
- 점검회차
- 발주처별 보고서 제출 여부
```

이 정보를 프로젝트 원장으로 관리하지 않으면 다음 문제가 생긴다.

| 문제 | 영향 |
|---|---|
| 공사개요 중복 입력 | 계약서/보고서마다 내용 불일치 |
| 발주처 문자열 저장 | 발주처별 보고서 분기 불가 |
| 시공사/발주처 담당자 분리 누락 | 메일, 제출, 조치 요청 연결 불가 |
| 공사금액 총액과 발주처별 금액 혼동 | 계약/안전관리비/보고서 오류 |
| 점검주기와 총 회차 누락 | 점검회차 자동 생성 불가 |
| 공정율 누락 | 보고서 공사개요 필드 누락 |

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/기술사 | 프로젝트 전체 현황, 주요 발주처, 문서 제출 상태 검토 |
| 상무/점검 담당자 | 점검일, 공정율, 현장 연락처, 시공사 담당자 확인 |
| 문서 작성자 | 보고서 공사개요, 발주처별 문서 변수 자동 입력 |
| 계약/행정 담당자 | 계약서, 견적서, 발주처별 금액과 지급조건 관리 |
| 관리자 | 프로젝트 상태, 권한, 보관 정책, 템플릿 연결 관리 |

## 4. 핵심 화면

### 4.1 프로젝트 목록

프로젝트 전체를 조회하고 진행/문서/점검 상태를 빠르게 파악한다.

표시 항목:

```text
- 프로젝트명
- 현장주소
- 발주처
- 시공사
- 공사기간
- 공정율
- 상태
- 최근 점검일
- 다음 점검일
- 미제출 문서 수
- 미조치 지적사항 수
- 최근 메일/파일 활동
```

필터:

```text
- 프로젝트 상태
- 발주처
- 시공사
- 점검 담당자
- 문서 미제출 여부
- 미조치 지적사항 여부
- 공사기간
```

### 4.2 프로젝트 생성/수정

입력 섹션:

```text
1. 기본정보
2. 공사정보
3. 발주처
4. 시공사
5. 엔지니어링사 / A&C 담당자
6. 담당자 연락처
7. 점검 조건
8. 보고서 제출 조건
9. 웹하드/메일 연결 설정
```

### 4.3 프로젝트 상세

탭 구조:

```text
개요
관계자
계약/견적
점검회차
문서
사진/증빙
웹하드
메일
이력
```

상단 요약 카드:

```text
- 총 공사금액
- 발주처 수
- 발주처별 보고서 대상 수
- 총 점검회차
- 다음 점검일
- 미제출 보고서
- 미조치 지적사항
- 최근 파일/메일 활동
```

## 5. 사용자 흐름

### 5.1 직접 등록

```text
프로젝트 생성 클릭
→ 공사개요 입력
→ 발주처 추가
→ 시공사 추가
→ A&C 담당자 지정
→ 담당자 연락처 입력
→ 공사기간/실착공일 입력
→ 공사금액/발주처별 금액 입력
→ 점검주기/총 회차 입력
→ 발주처별 보고서 제출 여부 설정
→ 저장
→ 프로젝트 상세 진입
```

### 5.2 문서에서 정보 추출

```text
계약서 또는 총괄현황 업로드
→ AI 프로젝트 정보 추출
→ 추출 결과 확인
→ 누락정보 보완
→ 발주처/시공사/담당자 매핑
→ 사용자 승인
→ 프로젝트 원장 반영
```

### 5.3 다음 모듈로 이어지는 흐름

```text
Project 생성
→ ProjectParty 등록
→ Contract 생성
→ InspectionSchedule 생성
→ InspectionRound 생성
→ SafetyReport 생성
→ Webhard 폴더 생성
→ MailThread 연결
→ Submission 이력 생성
```

## 6. 핵심 데이터 필드

### Project

```text
projectName
siteName
siteAddress
constructionType
constructionDescription
totalAmount
startDate
endDate
actualStartDate
progressRate
inspectionCycleText
totalInspectionRounds
status
memo
```

### Organization

```text
name
type: owner | contractor | engineer | subcontractor | authority | other
businessNumber
representativeName
address
phone
email
```

### ProjectParty

```text
projectId
organizationId
role: owner | contractor | engineer | subcontractor | authority | other
shareRatio
shareAmount
requiresSeparateReport
reportRecipient
invoiceRecipient
displayOrder
note
```

### Contact

```text
projectId
organizationId
name
position
phone
email
roleDescription
isPrimary
receivesReport
receivesActionRequest
```

## 7. 상태

| 상태 | 의미 |
|---|---|
| planning | 등록/준비 |
| active | 진행중 |
| paused | 일시중지 |
| completed | 준공/완료 |
| archived | 보관 |

## 8. 권한

| 권한 | 가능 작업 |
|---|---|
| admin | 전체 생성/수정/삭제, 권한 관리 |
| principal_engineer | 프로젝트 조회, 최종 검토, 상태 변경 |
| engineer | 프로젝트 조회, 점검정보 수정, 연락처 관리 |
| writer | 프로젝트 조회, 문서 생성에 필요한 필드 수정 |
| contract_manager | 계약/발주처/금액 수정 |
| viewer | 조회만 가능 |

## 9. 필수 누락정보 기준

보고서 생성 전 필수:

```text
- 프로젝트명
- 현장주소
- 발주처
- 시공사
- 공사기간
- 점검회차
- 점검일
- 공정율
- 발주처별 보고서 필요 여부
```

계약서 생성 전 필수:

```text
- 발주처 조직 정보
- A&C 조직 정보
- 계약명
- 계약금액
- VAT 포함 여부
- 지급조건
```

메일 제출 전 권장:

```text
- 발주처 담당자 이메일
- 제출 문서명
- 최종본 파일
- 첨부파일 확인
```

## 10. 샘플 데이터 방향

리움미술관 승강기 교체공사는 다음처럼 저장한다.

```text
Project: 리움미술관 승강기 교체공사
Organization(owner): 삼성문화재단
Organization(owner): 삼성생명공익재단
Organization(contractor): 현대엘리베이터(주)
Organization(engineer): A&C기술사사무소
ProjectParty(owner): 삼성문화재단, requiresSeparateReport=true
ProjectParty(owner): 삼성생명공익재단, requiresSeparateReport=true
ProjectParty(contractor): 현대엘리베이터(주)
ProjectParty(engineer): A&C기술사사무소
```

## 11. 완료 기준

- 프로젝트를 생성/조회/수정할 수 있다.
- 발주처를 여러 개 등록할 수 있다.
- 발주처별 분담금액과 보고서 제출 여부를 설정할 수 있다.
- 시공사와 엔지니어링사를 등록할 수 있다.
- 담당자 연락처를 여러 명 등록할 수 있다.
- 공사기간, 실착공일, 공정율, 점검주기를 관리할 수 있다.
- 프로젝트 상세에서 관련 계약, 점검, 문서, 파일, 메일로 이동할 수 있다.
- 프로젝트 정보 변경 시 ActivityLog가 남는다.
- 문서 생성 전 누락정보를 확인할 수 있다.
- ProjectParty 기반으로 발주처별 보고서 분기를 지원한다.

## 12. 다음 모듈 연결

| 다음 모듈 | 연결 방식 |
|---|---|
| 계약/견적 | `projectId`, `ProjectParty`, `Contact` |
| 점검회차/일정 | `projectId`, `inspectionCycleText`, `totalInspectionRounds` |
| 보고서 자동화 | `projectId`, `ownerPartyId`, `ProjectParty.requiresSeparateReport` |
| 체크리스트 | `projectId`, `inspectionRoundId` |
| 지적/조치/사진대지 | `projectId`, `inspectionRoundId`, `ownerPartyId` |
| 산업안전보건관리비 | `projectId`, `ownerPartyId` |
| 웹하드 | `projectId`, 프로젝트 폴더 |
| 메일함 | `projectId`, 담당자 이메일 |
| 결재/제출 | `projectId`, `ownerPartyId`, `Submission` |
