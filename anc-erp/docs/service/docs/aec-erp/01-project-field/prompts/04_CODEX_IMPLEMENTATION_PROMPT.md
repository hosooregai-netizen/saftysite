# 04. Codex Implementation Prompt — 프로젝트/현장 원장 관리

## Prompt

```text
You are implementing the Project and Field Registry module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. The Project module is the root data layer for contracts, inspections, documents, webhard files, mailbox messages, approvals, and submissions.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Project and Field Registry module.

Existing global concepts:
- User
- AuditLog
- FileAsset
- MailThread
- DocumentInstance

Required backend models:
- Project
- Organization
- ProjectParty
- Contact
- ProjectRequirementStatus
- ProjectActivityLog
- ProjectExtractionResult

Required backend APIs:

Projects:
- GET /api/v1/projects
- POST /api/v1/projects
- GET /api/v1/projects/{projectId}
- PATCH /api/v1/projects/{projectId}
- DELETE /api/v1/projects/{projectId}
- GET /api/v1/projects/{projectId}/summary
- GET /api/v1/projects/{projectId}/requirements
- GET /api/v1/projects/{projectId}/related-counts
- GET /api/v1/projects/{projectId}/history

Organizations:
- GET /api/v1/organizations
- POST /api/v1/organizations
- GET /api/v1/organizations/{organizationId}
- PATCH /api/v1/organizations/{organizationId}
- DELETE /api/v1/organizations/{organizationId}

Project Parties:
- GET /api/v1/projects/{projectId}/parties
- POST /api/v1/projects/{projectId}/parties
- PATCH /api/v1/project-parties/{partyId}
- DELETE /api/v1/project-parties/{partyId}
- POST /api/v1/projects/{projectId}/parties/reorder
- POST /api/v1/projects/{projectId}/parties/calculate-share

Contacts:
- GET /api/v1/projects/{projectId}/contacts
- POST /api/v1/projects/{projectId}/contacts
- PATCH /api/v1/contacts/{contactId}
- DELETE /api/v1/contacts/{contactId}
- POST /api/v1/projects/{projectId}/contacts/set-primary

Extraction:
- POST /api/v1/projects/extract-from-document
- POST /api/v1/projects/{projectId}/validate-extracted-info
- POST /api/v1/projects/{projectId}/apply-extracted-info

Required frontend routes:
- /projects
- /projects/new
- /projects/[projectId]
- /projects/[projectId]/overview
- /projects/[projectId]/parties
- /projects/[projectId]/contacts
- /projects/[projectId]/requirements
- /projects/[projectId]/related
- /projects/[projectId]/history
- /projects/[projectId]/settings

Required frontend components:
- ProjectTable
- ProjectFilterBar
- ProjectStatusBadge
- ProjectSummaryCard
- ProjectForm
- ProjectRequiredFieldPanel
- ProjectPartyTable
- ProjectPartyForm
- OwnerPartyCard
- ContractorPartyCard
- EngineerPartyCard
- ContactTable
- ContactForm
- ContactCard
- ConstructionAmountCard
- InspectionSummaryCard
- RelatedWorkTabs
- ProjectActivityTimeline
- ProjectImpactWarningPanel

Validation:
1. projectName is required.
2. progressRate must be between 0 and 100.
3. Project must support multiple owner parties.
4. owner parties may require separate reports.
5. totalInspectionRounds must be a non-negative integer.
6. startDate must not be later than endDate.
7. Project deletion should be soft-archive or blocked if related documents exist.
8. shareRatio sum over 100 must produce warning.
9. shareAmount sum mismatch against totalAmount must produce warning.
10. receivesReport contact should have email warning when missing.

Business requirements:
1. Project is the root entity.
2. All later modules must be able to reference projectId.
3. Multiple owners must be represented through ProjectParty.
4. A project can have one or more contractors.
5. A project can have one or more engineer organizations.
6. Contacts are connected to both project and organization.
7. The project detail page must show counts for:
   - contracts
   - inspection rounds
   - documents
   - files
   - mail threads
   - open findings
8. When project data changes, create a ProjectActivityLog entry.
9. If totalInspectionRounds and inspectionCycleText exist, expose a field for schedule generation but do not implement schedule generation in this module.
10. When owner party requiresSeparateReport is true, expose this flag to the Document module.
11. Project extraction must return preview data and must not apply changes until user confirmation.
12. Creating a project should emit an event or service call for default webhard folder creation, but the webhard module may implement the actual folder creation later.

Seed data:
Create a demo project:
- projectName: 리움미술관 승강기 교체공사
- siteName: 리움미술관
- siteAddress: 서울시 용산구 한남동 이태원로 55길 60-16
- constructionType: 승강기 교체공사
- totalAmount: 9130000000
- startDate: 2025-10-01
- endDate: 2028-02-29
- actualStartDate: 2025-11-03
- progressRate: 3.9
- inspectionCycleText: 3개월 이내 1회
- totalInspectionRounds: 10
- owners: 삼성문화재단, 삼성생명공익재단
- contractor: 현대엘리베이터(주)
- engineer: A&C기술사사무소
- owner parties require separate reports: true

Tests:
- test_project_create_success
- test_project_requires_project_name
- test_project_update_success
- test_project_progress_rate_range
- test_project_date_range_validation
- test_project_total_inspection_rounds_non_negative
- test_project_soft_archive_when_related_documents_exist
- test_organization_duplicate_warning
- test_project_party_multiple_owners
- test_project_party_owner_requires_separate_report
- test_project_party_share_ratio_warning
- test_project_party_share_amount_warning
- test_contact_create_success
- test_contact_report_recipient_requires_email_warning
- test_project_requirements_for_safety_report
- test_project_related_counts
- test_project_activity_log_created_on_update
- test_project_extraction_preview_does_not_apply_without_confirmation
- test_project_apply_extracted_info_creates_parties_and_contacts

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Requirement validation service
- Project extraction preview service
- Frontend pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```
