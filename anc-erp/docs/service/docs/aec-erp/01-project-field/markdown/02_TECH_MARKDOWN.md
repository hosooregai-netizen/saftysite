# 02. Tech Markdown — 프로젝트/현장 원장 관리

## 1. Frontend Routes

```text
/projects
/projects/new
/projects/[projectId]
/projects/[projectId]/overview
/projects/[projectId]/parties
/projects/[projectId]/contacts
/projects/[projectId]/requirements
/projects/[projectId]/related
/projects/[projectId]/history
/projects/[projectId]/settings
```

## 2. Frontend Components

```text
ProjectListPage
ProjectCreatePage
ProjectDetailPage
ProjectOverviewTab
ProjectPartyTab
ProjectContactTab
ProjectRequirementTab
ProjectRelatedTab
ProjectHistoryTab

ProjectTable
ProjectFilterBar
ProjectStatusBadge
ProjectSummaryCard
ProjectForm
ProjectRequiredFieldPanel
ProjectPartyTable
ProjectPartyForm
OwnerPartyCard
ContractorPartyCard
EngineerPartyCard
ContactTable
ContactForm
ContactCard
ConstructionAmountCard
InspectionSummaryCard
RelatedWorkTabs
ProjectActivityTimeline
ProjectImpactWarningPanel
```

## 3. Backend APIs

### Projects

```text
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{projectId}
PATCH  /api/v1/projects/{projectId}
DELETE /api/v1/projects/{projectId}
GET    /api/v1/projects/{projectId}/summary
GET    /api/v1/projects/{projectId}/requirements
GET    /api/v1/projects/{projectId}/related-counts
GET    /api/v1/projects/{projectId}/history
```

### Organizations

```text
GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/{organizationId}
PATCH  /api/v1/organizations/{organizationId}
DELETE /api/v1/organizations/{organizationId}
```

### Project Parties

```text
GET    /api/v1/projects/{projectId}/parties
POST   /api/v1/projects/{projectId}/parties
PATCH  /api/v1/project-parties/{partyId}
DELETE /api/v1/project-parties/{partyId}
POST   /api/v1/projects/{projectId}/parties/reorder
POST   /api/v1/projects/{projectId}/parties/calculate-share
```

### Contacts

```text
GET    /api/v1/projects/{projectId}/contacts
POST   /api/v1/projects/{projectId}/contacts
PATCH  /api/v1/contacts/{contactId}
DELETE /api/v1/contacts/{contactId}
POST   /api/v1/projects/{projectId}/contacts/set-primary
```

### Extraction

```text
POST /api/v1/projects/extract-from-document
POST /api/v1/projects/{projectId}/apply-extracted-info
POST /api/v1/projects/{projectId}/validate-extracted-info
```

## 4. Data Models

### Project

```ts
type ProjectStatus =
  | 'planning'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived'

type Project = {
  id: string
  projectCode?: string
  projectName: string
  siteName: string
  siteAddress: string
  constructionType: string
  constructionDescription?: string
  totalAmount?: number
  startDate?: string
  endDate?: string
  actualStartDate?: string
  progressRate?: number
  inspectionCycleText?: string
  totalInspectionRounds?: number
  status: ProjectStatus
  memo?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}
```

### Organization

```ts
type OrganizationType =
  | 'owner'
  | 'contractor'
  | 'engineer'
  | 'subcontractor'
  | 'authority'
  | 'other'

type Organization = {
  id: string
  name: string
  type: OrganizationType
  businessNumber?: string
  representativeName?: string
  address?: string
  phone?: string
  email?: string
  createdAt: string
  updatedAt: string
}
```

### ProjectParty

```ts
type ProjectPartyRole =
  | 'owner'
  | 'contractor'
  | 'engineer'
  | 'subcontractor'
  | 'authority'
  | 'other'

type ProjectParty = {
  id: string
  projectId: string
  organizationId: string
  role: ProjectPartyRole
  shareRatio?: number
  shareAmount?: number
  requiresSeparateReport: boolean
  reportRecipient: boolean
  invoiceRecipient: boolean
  displayOrder: number
  note?: string
  createdAt: string
  updatedAt: string
}
```

### Contact

```ts
type Contact = {
  id: string
  projectId: string
  organizationId: string
  name: string
  position?: string
  phone?: string
  email?: string
  roleDescription?: string
  isPrimary?: boolean
  receivesReport?: boolean
  receivesActionRequest?: boolean
  createdAt: string
  updatedAt: string
}
```

### ProjectRequirementStatus

```ts
type ProjectRequirementStatus = {
  projectId: string
  forSafetyReport: MissingField[]
  forContract: MissingField[]
  forInspectionSchedule: MissingField[]
  forSubmissionMail: MissingField[]
  warnings: RequirementWarning[]
}

type MissingField = {
  field: string
  label: string
  severity: 'required' | 'recommended' | 'optional'
  reason: string
  sourceEntity: 'Project' | 'ProjectParty' | 'Organization' | 'Contact'
}
```

### ProjectActivityLog

```ts
type ProjectActivityLog = {
  id: string
  projectId: string
  eventType:
    | 'created'
    | 'updated'
    | 'party_added'
    | 'party_updated'
    | 'contact_added'
    | 'requirement_changed'
    | 'document_created'
    | 'file_uploaded'
    | 'mail_linked'
    | 'archived'
  message: string
  actorId?: string
  diff?: Record<string, unknown>
  createdAt: string
}
```

## 5. Repository Interfaces

```ts
interface ProjectRepository {
  list(filter: ProjectListFilter): Promise<Project[]>
  getById(projectId: string): Promise<Project | null>
  create(input: ProjectCreateInput): Promise<Project>
  update(projectId: string, input: ProjectUpdateInput): Promise<Project>
  archive(projectId: string): Promise<Project>
}

interface OrganizationRepository {
  list(filter: OrganizationListFilter): Promise<Organization[]>
  getById(organizationId: string): Promise<Organization | null>
  findByName(name: string): Promise<Organization | null>
  create(input: OrganizationCreateInput): Promise<Organization>
  update(organizationId: string, input: OrganizationUpdateInput): Promise<Organization>
}

interface ProjectPartyRepository {
  listByProject(projectId: string): Promise<ProjectParty[]>
  getById(partyId: string): Promise<ProjectParty | null>
  create(input: ProjectPartyCreateInput): Promise<ProjectParty>
  update(partyId: string, input: ProjectPartyUpdateInput): Promise<ProjectParty>
  delete(partyId: string): Promise<void>
}

interface ContactRepository {
  listByProject(projectId: string): Promise<Contact[]>
  listByOrganization(organizationId: string): Promise<Contact[]>
  create(input: ContactCreateInput): Promise<Contact>
  update(contactId: string, input: ContactUpdateInput): Promise<Contact>
  delete(contactId: string): Promise<void>
}
```

## 6. Validation Rules

### Project

- `projectName`은 필수다.
- `siteAddress`는 보고서 생성 전 필수다.
- `startDate`가 `endDate`보다 늦을 수 없다.
- `progressRate`는 0 이상 100 이하만 허용한다.
- `totalAmount`는 0 이상이어야 한다.
- `totalInspectionRounds`는 0 이상 정수다.
- 관련 문서가 있으면 삭제가 아니라 archive를 사용한다.

### Organization

- `name`은 필수다.
- 같은 `name + type` 조합은 중복 등록 경고를 띄운다.
- 사업자등록번호는 optional이지만 계약서 생성 전 권장한다.

### ProjectParty

- 보고서 생성 전 owner 역할이 하나 이상 있어야 한다.
- 점검표/보고서 생성 전 contractor 역할이 하나 이상 권장된다.
- A&C 담당 문서에는 engineer 역할이 하나 이상 권장된다.
- `requiresSeparateReport = true`인 owner는 보고서 생성 시 분기 대상이다.
- `shareRatio` 합계가 100을 초과하면 warning을 표시한다.
- `shareAmount` 합계가 `Project.totalAmount`와 크게 다르면 warning을 표시한다.

### Contact

- `name`은 필수다.
- `phone` 또는 `email` 중 하나 이상을 권장한다.
- `receivesReport = true`이면 email을 권장한다.
- `receivesActionRequest = true`이면 email 또는 phone을 권장한다.

## 7. Service Rules

### 프로젝트 생성 후 자동 작업

```text
1. Project 생성
2. ProjectActivityLog 생성
3. 기본 웹하드 폴더 생성 이벤트 발행
4. 프로젝트 필수정보 상태 계산
5. 점검회차 생성 가능 여부 계산
6. 발주처별 보고서 생성 가능 여부 계산
```

### ProjectParty 추가 후 자동 작업

```text
1. Organization 존재 여부 확인
2. ProjectParty 생성
3. owner인 경우 reportRecipient 기본값 true
4. requiresSeparateReport가 true이면 보고서 분기 대상으로 표시
5. 관련 문서 생성 가능 여부 재계산
6. ProjectActivityLog 생성
```

### 프로젝트 수정 후 영향도 계산

다음 필드가 변경되면 하위 모듈에 영향을 준다.

| 변경 필드 | 영향 모듈 |
|---|---|
| projectName | 웹하드 표시명, 보고서 제목, 메일 제목 |
| siteAddress | 보고서 공사개요, 계약서 |
| totalAmount | 계약/견적, 안전관리비, 보고서 |
| startDate/endDate | 점검회차, 계약서, 보고서 |
| progressRate | 보고서 공사개요 |
| owner party | 발주처별 보고서, 제출 메일 |
| contact email | 메일 제출, 조치요청 |

## 8. API Response Example

```json
{
  "project": {
    "id": "project_leeum_elevator_2026",
    "projectName": "리움미술관 승강기 교체공사",
    "siteName": "리움미술관",
    "siteAddress": "서울시 용산구 한남동 이태원로 55길 60-16",
    "constructionType": "승강기 교체공사",
    "totalAmount": 9130000000,
    "startDate": "2025-10-01",
    "endDate": "2028-02-29",
    "actualStartDate": "2025-11-03",
    "progressRate": 3.9,
    "inspectionCycleText": "3개월 이내 1회",
    "totalInspectionRounds": 10,
    "status": "active"
  },
  "parties": [
    {
      "id": "party_samsung_culture",
      "role": "owner",
      "organizationName": "삼성문화재단",
      "requiresSeparateReport": true,
      "displayOrder": 1
    },
    {
      "id": "party_samsung_public",
      "role": "owner",
      "organizationName": "삼성생명공익재단",
      "requiresSeparateReport": true,
      "displayOrder": 2
    }
  ],
  "relatedCounts": {
    "contracts": 1,
    "inspectionRounds": 10,
    "documents": 2,
    "files": 0,
    "mailThreads": 0,
    "openFindings": 0
  }
}
```

## 9. Seed Data

```json
{
  "project": {
    "id": "project_leeum_elevator_2026",
    "projectName": "리움미술관 승강기 교체공사",
    "siteName": "리움미술관",
    "siteAddress": "서울시 용산구 한남동 이태원로 55길 60-16",
    "constructionType": "승강기 교체공사",
    "totalAmount": 9130000000,
    "startDate": "2025-10-01",
    "endDate": "2028-02-29",
    "actualStartDate": "2025-11-03",
    "progressRate": 3.9,
    "inspectionCycleText": "3개월 이내 1회",
    "totalInspectionRounds": 10,
    "status": "active"
  },
  "organizations": [
    { "name": "삼성문화재단", "type": "owner" },
    { "name": "삼성생명공익재단", "type": "owner" },
    { "name": "현대엘리베이터(주)", "type": "contractor" },
    { "name": "A&C기술사사무소", "type": "engineer" }
  ],
  "projectParties": [
    { "organizationName": "삼성문화재단", "role": "owner", "requiresSeparateReport": true, "displayOrder": 1 },
    { "organizationName": "삼성생명공익재단", "role": "owner", "requiresSeparateReport": true, "displayOrder": 2 },
    { "organizationName": "현대엘리베이터(주)", "role": "contractor", "requiresSeparateReport": false, "displayOrder": 3 },
    { "organizationName": "A&C기술사사무소", "role": "engineer", "requiresSeparateReport": false, "displayOrder": 4 }
  ]
}
```

## 10. Tests

```text
test_project_create_success
test_project_requires_project_name
test_project_update_success
test_project_progress_rate_range
test_project_date_range_validation
test_project_total_inspection_rounds_non_negative
test_project_soft_archive_when_related_documents_exist
test_organization_duplicate_warning
test_project_party_multiple_owners
test_project_party_owner_requires_separate_report
test_project_party_share_ratio_warning
test_project_party_share_amount_warning
test_contact_create_success
test_contact_report_recipient_requires_email_warning
test_project_requirements_for_safety_report
test_project_related_counts
test_project_activity_log_created_on_update
test_project_extraction_preview_does_not_apply_without_confirmation
test_project_apply_extracted_info_creates_parties_and_contacts
```
