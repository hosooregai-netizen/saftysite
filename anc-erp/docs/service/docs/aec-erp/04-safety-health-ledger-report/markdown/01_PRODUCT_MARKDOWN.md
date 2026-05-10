# 01. Product Markdown — 공사안전보건대장 이행확인 보고서 자동화

## 1. 기능 정의

공사안전보건대장 이행확인 보고서 자동화는 A&C 기술사 ERP의 핵심 문서 생성 기능이다.

이 기능은 하나의 `InspectionRound`와 하나의 `ownerPartyId`를 기준으로 발주처별 보고서 초안을 만들고, 섹션별 검토·수정·확정·export·제출까지 연결한다.

```text
Project
→ ProjectParty(owner)
→ InspectionRound
→ ChecklistSession / ChecklistResult
→ Finding / CorrectiveAction / EvidencePhoto
→ SafetyCostUsage
→ SafetyReport DocumentInstance
→ FileAsset
→ Submission / MailThread
```

## 2. 이 기능이 필요한 이유

A&C 업무에서는 동일한 현장과 동일한 점검회차라도 발주처별로 보고서가 분리된다.

```text
제1회 점검 / 2026.01.23
├── 삼성문화재단 보고서
└── 삼성생명공익재단 보고서
```

두 보고서는 프로젝트명, 점검일, 시공사, 일부 점검표 결과처럼 공통 데이터를 공유하지만 다음 값은 발주처별로 달라질 수 있다.

- 발주자명
- 확인자
- 발주처별 공사내용 또는 관리 범위
- 발주처별 공사금액
- 발주처별 공정율
- 산업안전보건관리비 계상금액
- 산업안전보건관리비 사용금액
- 산업안전보건관리비 사용률
- 보완 필요 사항
- 사진대지에 들어갈 지적/조치 항목
- 제출 메일 수신자와 제출 이력

따라서 보고서 생성 기준은 단순히 `projectId`가 아니라 반드시 `inspectionRoundId + ownerPartyId` 조합이어야 한다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/건설안전기술사 | 보고서 최종 검토, 서명/날인, 제출 승인 |
| 점검 담당자 | 점검 결과, 강평, 지적사항, 조치현황, 사진 확인 |
| 문서 작성자 | 보고서 초안 생성, 섹션별 편집, 누락정보 보완, export |
| 계약/행정 담당자 | 발주처별 최종본 관리, 제출 메일 작성, 웹하드 보관 |
| 발주처 담당자 | 해당 발주처 보고서 수신 및 확인 |

## 4. 핵심 문서 구조

샘플 보고서 기준 섹션은 다음과 같다.

```text
1. 표지
2. 공사안전보건대장 이행 확인 점검표
3. 공사개요
4. 현장전경 및 점검사항/강평
5. 공통 점검표
6. 건축·토목 점검표
7. 건설기계 점검표
8. 공사안전보건대장 이행여부 확인서
9. 유해·위험방지계획에 따른 위험성 감소대책 이행확인
10. 추가 유해·위험요인 점검리스트
11. 산업안전보건관리비 사용 내용 확인
12. 발주자 참여 현장 안전보건활동
13. 발주자의 근로자 상담
14. 발주자가 고용한 안전보건 전문가 현황
15. 중대재해 관리
16. 지적사항/조치현황 사진대지
17. 공사일정 첨부
```

## 5. 핵심 기능

### 5.1 보고서 생성 마법사

```text
프로젝트 선택
→ 점검회차 선택
→ 발주처 선택
→ 템플릿 선택
→ 연결 데이터 확인
→ 누락정보 확인
→ 보고서 초안 생성
→ 섹션별 검토
→ 확정
→ PDF/HWPX export
→ 웹하드 저장
→ 메일 제출
```

### 5.2 발주처별 보고서 분기

`ProjectParty.requiresSeparateReport = true`인 발주처는 발주처별 보고서 생성 대상이다.

발주처별 분기 변수 예시:

```text
owner.name
owner.contact
owner.confirmName
owner.constructionScope
owner.shareAmount
owner.progressRate
owner.safetyCost.calculatedAmount
owner.safetyCost.usedAmount
owner.safetyCost.usedRate
owner.findings
owner.photoLedger
```

### 5.3 누락정보 패널

보고서 생성 전 다음 필드를 확인한다.

- 프로젝트명
- 현장주소
- 시공사
- 발주처
- 발주처별 확인자
- 점검일
- 공사기간
- 공정율
- 총 공사금액
- 발주처별 공사금액
- 점검표 결과
- 총평
- 산업안전보건관리비 사용내역
- 사진대지 지적사진/조치사진
- 서명/날인 정보

### 5.4 섹션별 편집

보고서는 섹션 단위로 편집하고 확정한다.

```text
not_started
→ ai_draft
→ edited
→ review
→ confirmed
→ locked
```

각 섹션은 원본 데이터와 연결되어야 하며, 원본이 변경되면 `stale_linked_data` 경고를 띄운다.

### 5.5 점검표 자동 반영

현장점검 체크리스트 결과를 보고서 점검표에 반영한다.

```text
good           → 양호
caution        → 주의
bad            → 불량
not_applicable → 해당없음
not_checked    → 미점검
```

주의/불량 항목은 `FindingCandidate` 또는 기존 `Finding`과 연결한다.

### 5.6 총평 자동 작성

총평은 다음 구조를 기본으로 한다.

```text
1. 현장관리
   1) 안전관리 체계
   2) 신규자 관리

2. 문서관리
   1) 이행 점검
   2) 법적 서류
   3) 예산 관리

3. 보완 필요
   1) 지적사항 요약
   2) 조치 필요사항
```

### 5.7 산업안전보건관리비 자동 반영

입력값:

- 계상금액
- 사용금액
- 기준월/기준일
- 사용률
- 관련근거
- 적정성 의견

자동 계산:

```text
usedRate = usedAmount / calculatedAmount * 100
```

계산값과 입력값이 다르면 경고한다.

### 5.8 사진대지 자동 반영

`Finding`과 `CorrectiveAction`에 연결된 사진을 보고서 사진대지로 배치한다.

사진대지 항목:

- 회차명
- 점검일
- 지적사항
- 조치현황
- 지적사진
- 조치사진
- 마크업 정보
- 캡션

### 5.9 Export 및 제출

지원 형식:

- PDF
- HWPX
- DOCX optional
- Markdown internal snapshot
- JSON document snapshot

Export 후 처리:

```text
DocumentInstance.status = exported
FileAsset 생성
웹하드 /프로젝트명/08_최종본 저장
InspectionOwnerReportTask.exportedFileId 연결
Submission 또는 MailThread 연결
```

## 6. 문서 상태

| 상태 | 의미 |
|---|---|
| draft | 초안 생성 |
| ai_draft | AI 초안 포함 |
| editing | 사용자 수정중 |
| review | 내부 검토중 |
| confirmed | 확정 |
| exported | 최종본 생성 |
| submitted | 발주처 제출 완료 |
| archived | 보관 |

## 7. 완료 기준

- 점검회차와 발주처를 선택하여 보고서 초안을 생성할 수 있다.
- 동일 회차에서 발주처별 보고서가 따로 생성된다.
- 공사개요, 점검표, 이행여부 확인서, 위험성 감소대책, 추가 유해·위험요인, 산업안전보건관리비, 사진대지를 포함한다.
- 누락정보가 있으면 export를 막거나 경고한다.
- AI 초안은 사용자가 검토·확정해야 한다.
- 최신 저장본 기준으로 export한다.
- export 파일은 웹하드 최종본 폴더에 저장된다.
- 제출 메일과 Submission 이력으로 연결된다.
