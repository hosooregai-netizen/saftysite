# 01. Product Markdown — 메일함

## 1. 기능 정의

메일함은 A&C 기술사 ERP에서 프로젝트 관련 메일을 송수신·분류·연결·보관하는 기능이다.

기존 apps의 메일함 3-pane shell을 ERP 안에 통합하되, 단순 이메일 클라이언트가 아니라 다음 업무를 처리하는 프로젝트 커뮤니케이션 모듈로 설계한다.

```text
프로젝트별 메일 관리
보고서 제출 메일 작성
자료요청 메일 작성
조치요청 메일 작성
일정협의 메일 작성
계약/견적 발송 메일 작성
첨부파일 웹하드 저장
메일-문서-파일-제출 이력 연결
```

## 2. 이 기능이 필요한 이유

A&C 업무에서 메일은 단순 연락 수단이 아니라 제출 증빙이다.

예를 들어 공사안전보건대장 이행확인 보고서를 발주처별로 제출할 때, 다음 정보가 함께 남아야 한다.

- 어떤 프로젝트의 메일인지
- 어느 점검회차의 제출인지
- 어느 발주처에 보낸 것인지
- 어떤 최종본 파일을 첨부했는지
- PDF/HWPX 등 제출 파일이 웹하드 어디에 저장되어 있는지
- 발송일과 수신자가 누구인지
- 회신이 왔는지
- 발주처 확인 상태가 무엇인지

시공사에 지적사항 조치를 요청할 때도 다음 정보가 연결되어야 한다.

- 지적사항 목록
- 조치요청 내용
- 지적사진
- 요청기한
- 시공사 담당자
- 회신 메일
- 조치사진
- 조치 완료 여부

따라서 메일함은 보고서 제출, 조치요청, 자료요청, 일정협의, 계약/견적 발송 이력을 ERP 데이터와 연결해야 한다.

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/기술사 | 제출 메일 확인, 중요 회신 검토, 최종본 발송 승인 |
| 점검 담당자 | 일정협의, 현장자료 요청, 조치요청 메일 작성 |
| 문서 작성자 | 보고서 제출 메일 작성, 첨부파일 확인, 회신 반영 |
| 계약/행정 담당자 | 계약/견적 발송, 자료요청, 발주처 연락 관리 |
| 관리자 | 메일 계정, OAuth, 서명, 템플릿, 권한 관리 |

## 4. 핵심 메일 유형

| 메일 유형 | 설명 | 연결 대상 |
|---|---|---|
| report_submission | 보고서 제출 | DocumentInstance, FileAsset, Submission, OwnerReportTask |
| action_request | 지적사항 조치 요청 | Finding, CorrectiveAction, EvidencePhoto |
| material_request | 자료 요청 | Project, InspectionRound, FileAsset |
| schedule_coordination | 점검 일정 협의 | InspectionRound, InspectionTask |
| contract_estimate | 계약서/견적서 발송 | Contract, Estimate, FileAsset |
| general_reply | 일반 회신 | Project, MailThread |
| safety_cost_request | 산업안전보건관리비 자료 요청 | SafetyCostUsage, FileAsset |
| approval_request | 내부 검토/승인 요청 | Approval, DocumentInstance |

## 5. 핵심 기능

### 5.1 메일 계정 연결

지원 모드:

```text
guest_draft_mode
connected_oauth_mode
```

Guest draft mode:

- OAuth 연결 없이 메일 초안 작성
- 제목/본문/첨부 체크리스트 생성
- 사용자가 외부 메일 클라이언트에 복사
- 제출 이력은 수동 등록 가능

Connected OAuth mode:

- 메일 계정 연결
- 받은편지함/보낸메일함/임시보관함 sync
- 메일 발송
- 첨부파일 저장
- 프로젝트 자동/수동 연결
- 발송 후 Submission 자동 생성

### 5.2 3-pane 메일함

기본 구조:

```text
좌측: 메일함 / 계정 / 프로젝트 필터
중앙: 메일 목록 / 스레드 목록
우측: 메일 상세 또는 작성 패널
하단/우측: 첨부파일 웹하드 저장, 프로젝트 연결, AI 초안 패널
```

### 5.3 프로젝트별 메일 연결

메일은 다음 방식으로 프로젝트와 연결된다.

- 수동 연결
- 제목/본문의 프로젝트명 기반 추천
- 발주처/시공사 담당자 이메일 기반 추천
- 첨부파일명 기반 추천
- 문서번호/회차 기반 추천

연결 가능한 대상:

```text
Project
InspectionRound
DocumentInstance
Finding
CorrectiveAction
SafetyCostUsage
Contract
Estimate
Submission
FileAsset
```

### 5.4 보고서 제출 메일

보고서 제출 메일 작성 시 포함 항목:

- 프로젝트명
- 발주처명
- 점검회차
- 점검일
- 문서번호
- 제출 문서명
- 첨부파일명
- 검토 요청 문구
- 회신 요청 문구
- 담당자 서명

발송 후 처리:

```text
MailMessage 저장
Submission 생성 또는 갱신
DocumentInstance.status = submitted
OwnerReportTask.status = submitted
submittedAt 저장
첨부파일 FileAsset 연결
```

### 5.5 조치요청 메일

지적사항 선택 후 조치요청 메일을 작성한다.

포함 항목:

- 프로젝트명
- 점검회차
- 지적사항 표
- 요청 조치내용
- 조치기한
- 지적사진
- 회신 요청 문구

지적사항 표 기본 컬럼:

```text
번호
지적사항
위험유형
요청 조치내용
조치기한
첨부사진
```

### 5.6 자료요청 메일

예시 요청자료:

- 공사일정표
- 공정표
- 산업안전보건관리비 사용내역서
- 세금계산서/영수증
- 안전교육 자료
- 안전관리조직도
- 비상연락망
- 조치사진
- 발주처 확인자료

### 5.7 첨부파일 웹하드 저장

메일 첨부파일을 웹하드에 저장할 수 있다.

저장 시 선택 항목:

- 프로젝트
- 폴더
- 태그
- 연결 대상
- 파일 설명
- 중복 파일 처리 방식

저장 후 처리:

```text
MailAttachment.savedFileId = FileAsset.id
FileAsset.source = mail_attachment
FileAsset.linkedEntityType = mail_message
FileAsset.linkedEntityId = MailMessage.id
FileActivityLog 생성
```

### 5.8 메일 초안 AI 작성

AI가 작성하는 초안 유형:

- 보고서 제출 메일
- 조치요청 메일
- 자료요청 메일
- 일정협의 메일
- 계약/견적 발송 메일
- 회신 메일

AI 작성 원칙:

- 공손하고 실무적인 한국어
- 첨부파일명 명확히 표시
- 발주처/시공사/프로젝트명 오기 방지
- 입력에 없는 첨부파일이나 날짜를 만들지 않음
- 발송 전 사용자 확인 필수

### 5.9 메일 템플릿

템플릿 변수:

```text
{{project.name}}
{{project.siteAddress}}
{{owner.name}}
{{inspection.roundNo}}
{{inspection.date}}
{{document.title}}
{{document.documentNo}}
{{file.names}}
{{finding.table}}
{{dueDate}}
{{sender.name}}
{{sender.signature}}
```

## 6. 상태

### MailAccount 상태

| 상태 | 의미 |
|---|---|
| guest | OAuth 미연결 초안 모드 |
| connected | OAuth 연결됨 |
| sync_error | 동기화 오류 |
| disconnected | 연결 해제 |

### MailMessage 상태

| 상태 | 의미 |
|---|---|
| received | 수신 |
| draft | 초안 |
| queued | 발송 대기 |
| sent | 발송됨 |
| failed | 발송 실패 |
| archived | 보관 |

### MailLink 상태

| 상태 | 의미 |
|---|---|
| suggested | 시스템 추천 |
| confirmed | 사용자 확인 |
| rejected | 사용자 제외 |

## 7. 완료 기준

- 메일함 3-pane shell을 제공한다.
- Guest draft mode에서 메일 초안을 작성할 수 있다.
- OAuth 연결 모드에서 계정 연결, sync, send를 지원할 수 있다.
- 메일을 프로젝트, 점검회차, 문서, 지적사항, 제출 이력과 연결할 수 있다.
- 첨부파일을 웹하드에 저장할 수 있다.
- 보고서 제출 메일 발송 후 Submission 이력이 생성된다.
- 지적사항 조치요청 메일을 작성할 수 있다.
- 자료요청/일정협의/계약발송 메일 템플릿을 지원한다.
- AI 초안은 발송 전 사용자 검토가 필요하다.
