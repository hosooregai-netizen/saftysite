# 02. Global Design System — A&C 기술사 ERP

## 1. 디자인 원칙

### 1. 문서 중심

A&C ERP는 일반 SaaS보다 문서 정확성이 중요하다. 화면은 문서 생성, 표 검토, 사진대지 확인, 발주처 제출에 최적화한다.

### 2. ERP 밀도

현장명, 발주처, 공사금액, 공정율, 점검일, 담당자, 문서 상태 등 실무 정보가 많기 때문에 정보 밀도는 높게 유지하되, 상태 구분은 명확해야 한다.

### 3. 현장 입력 친화

모바일 점검, 사진 촬영, 지적사항 등록은 빠르게 입력할 수 있어야 한다. 버튼은 크고, 상태는 즉시 저장되며, 사진 업로드는 최소 단계로 처리한다.

### 4. 제출 신뢰감

발주처 제출용 문서 시스템이므로 공공문서 느낌의 단정한 디자인을 유지한다. 최종본과 초안의 시각적 구분을 분명히 한다.

### 5. AI 보조 구분

AI가 작성한 초안, 사용자가 확정한 본문, 최종 export 문서를 명확히 구분한다.

### 6. 연결성 가시화

프로젝트, 계약, 점검, 문서, 파일, 메일, 제출 이력이 서로 어떻게 연결되는지 화면에서 보여준다.

## 2. 컬러 토큰

### Primary

| Token | Hex | Use |
|---|---|---|
| primary-900 | `#102A5C` | 사이드바, 주요 헤더 |
| primary-800 | `#173B7A` | 강조 헤더 |
| primary-700 | `#1F4E9E` | Primary button |
| primary-600 | `#2F66C2` | 링크, 활성 탭 |
| primary-500 | `#3B7DDD` | 보조 강조 |

### Neutral

| Token | Hex | Use |
|---|---|---|
| neutral-950 | `#111827` | 본문 제목 |
| neutral-900 | `#1F2937` | 본문 강한 텍스트 |
| neutral-700 | `#374151` | 일반 텍스트 |
| neutral-500 | `#6B7280` | 보조 텍스트 |
| neutral-300 | `#D1D5DB` | border |
| neutral-200 | `#E5E7EB` | divider |
| neutral-100 | `#F3F4F6` | workspace background |
| neutral-50 | `#F9FAFB` | card background |
| white | `#FFFFFF` | paper/card |

### Semantic

| Token | Hex | Use |
|---|---|---|
| success | `#15803D` | 완료, 양호, 제출완료 |
| warning | `#D97706` | 주의, 기한임박, 누락 권장 |
| danger | `#DC2626` | 불량, 지연, 필수 누락 |
| info | `#2563EB` | 정보, 진행중 |
| review | `#7C3AED` | 검토중, AI 초안 |
| submitted | `#0F766E` | 제출 완료 |

## 3. 타이포그래피

| Role | Size | Line | Weight | Use |
|---|---:|---:|---:|---|
| Page Title | 24 | 32 | 700 | 페이지 제목 |
| Section Title | 18 | 28 | 700 | 카드/섹션 제목 |
| Body | 14 | 22 | 400 | 일반 본문 |
| Table Body | 13 | 20 | 400 | ERP 테이블 |
| Caption | 12 | 18 | 400 | 보조 설명, 사진 캡션 |
| Badge | 12 | 16 | 600 | 상태 배지 |

권장 폰트:

```text
Korean UI: Pretendard 또는 Noto Sans KR
Document Preview: Noto Serif KR 또는 Batang 계열
Numeric/Table: Tabular number 지원 폰트
```

## 4. Shell 규칙

### ERP Shell

```text
좌측 사이드바: 260px
상단바: 프로젝트 전환 / 검색 / 알림 / 사용자
중앙: 업무 화면
우측: AI 제안 / 누락정보 / 활동 로그 패널
```

적용 화면:

```text
대시보드, 프로젝트, 계약, 점검, 문서, 결재, 관리자
```

### Webhard Full-screen Shell

```text
좌측 자료함/프로젝트 필터
폴더 트리
파일 리스트/그리드
우측 파일 상세/미리보기 패널
상단 command bar: 업로드, 새 폴더, 공유 링크, 보기 전환
```

### Mailbox 3-pane Shell

```text
좌측 메일함/계정/프로젝트 필터
중앙 메일 목록
우측 메일 본문 또는 작성 패널
첨부파일 웹하드 저장 패널
프로젝트/문서/제출 연결 패널
```

## 5. 공통 컴포넌트

```text
AppShell
Sidebar
Topbar
ProjectSwitcher
GlobalSearch
PageHeader
Breadcrumb
DataTable
FilterBar
StatusBadge
ProgressBar
AmountCard
ContactCard
Timeline
MissingFieldPanel
ActivityLogPanel
DocumentPreview
A4Preview
FileAttachmentPanel
MailLinkPanel
ApprovalStepper
```

## 6. 상태 표시 규칙

### 문서 상태

| 상태 | Label | Color |
|---|---|---|
| draft | 초안 | neutral |
| ai_draft | AI 초안 | review |
| editing | 수정중 | info |
| review | 검토중 | review |
| confirmed | 확정 | primary |
| exported | 최종본 생성 | submitted |
| submitted | 제출완료 | success |
| archived | 보관 | neutral |

### 점검 결과

| 상태 | Label | Color |
|---|---|---|
| good | 양호 | success |
| caution | 주의 | warning |
| bad | 불량 | danger |
| not_applicable | 해당없음 | neutral |
| not_checked | 미점검 | neutral outline |

### 지적사항 상태

| 상태 | Label | Color |
|---|---|---|
| open | 미조치 | danger |
| action_requested | 조치요청 | warning |
| action_submitted | 조치등록 | info |
| verification_requested | 확인요청 | review |
| verified | 확인완료 | success |
| closed | 종결 | submitted |
| rejected | 반려 | danger |

## 7. A4 문서 미리보기 규칙

- 흰색 A4 paper를 회색 workspace 위에 표시한다.
- 초안은 watermark를 표시한다.
- 표가 페이지를 넘어가면 warning을 표시한다.
- 사진대지는 지적사진/조치사진 한 쌍을 명확히 보여준다.
- export 전 누락정보와 검토 경고를 우측 패널에 표시한다.
