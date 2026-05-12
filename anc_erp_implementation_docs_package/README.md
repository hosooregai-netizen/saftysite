# A&C 기술사 ERP — 구현 문서/프롬프트 패키지

    이 패키지는 A&C 기술사 ERP를 실제 프로젝트에서 구현하기 위한 제품 명세, 기술 명세, 기능별 명세, 디자인 시스템, 구현 프롬프트, QA/릴리즈/운영 문서를 포함한다.

    ## 생성 정보

    - generatedAt: `2026-05-08T12:23:03`
    - featureCount: `26`
    - outputRoot: `anc_erp_implementation_docs_package`

    ## 기준 데모 데이터

    ```json
    {
  "projectId": "project_leeum_elevator_2026",
  "projectName": "리움미술관 승강기 교체공사",
  "owners": [
    "삼성문화재단",
    "삼성생명공익재단"
  ],
  "contractor": "현대엘리베이터(주)",
  "engineer": "A&C기술사사무소",
  "constructionAmount": 9130000000,
  "contractAmount": 11000000,
  "contractSplit": {
    "삼성문화재단": 60,
    "삼성생명공익재단": 40
  },
  "inspectionRounds": 10,
  "round1": {
    "documentNo": "제2026-01호",
    "inspectionDate": "2026-01-23"
  },
  "safetyCost": {
    "삼성문화재단": 38.2,
    "삼성생명공익재단": 40.5
  }
}
    ```

    ## 기능 목록

    - `00_GLOBAL` | 통합 제품/기술/디자인/Reverse Map | P0 | `/docs/safety-features/00_GLOBAL`
- `01_project_field_registry` | 프로젝트/현장 원장 관리 | P0 | `/projects/[projectId]`
- `02_contract_estimate_management` | 계약/견적 관리 | P0 | `/projects/[projectId]/contracts`
- `03_inspection_schedule` | 점검회차/일정 관리 | P0 | `/projects/[projectId]/inspections`
- `04_00_document_automation_hub` | 표준서식 자동화 허브 | P0 | `/document-bundles/[bundleId]`
- `04_01_safety_health_ledger_report_bundle` | 공사안전보건대장 이행확인 보고서 묶음 | P0 | `/safety-health-ledger-reports/[bundleId]`
- `04_02_safety_health_ledger_inspection_checklist` | 공사안전보건대장 이행 확인 점검표 | P0 | `/inspection-checklist-forms/[formId]/edit`
- `04_03_safety_health_ledger_implementation_confirmation` | 공사안전보건대장 이행여부 확인서 | P0 | `/implementation-confirmation-forms/[formId]/edit`
- `04_04_risk_reduction_implementation_check` | 위험성 감소대책 이행확인 | P0 | `/risk-reduction-forms/[formId]/edit`
- `04_05_additional_hazard_checklist` | 추가 유해·위험요인 점검리스트 | P0 | `/additional-hazard-forms/[formId]/edit`
- `04_06_safety_cost_usage_confirmation` | 산업안전보건관리비 사용 내용 확인 | P0 | `/safety-cost-usage-confirmation-forms/[formId]/edit`
- `04_07_owner_safety_activity` | 발주자 참여 현장 안전보건활동 | P1 | `/owner-safety-activity-forms/[formId]/edit`
- `04_08_owner_worker_consultation` | 발주자의 근로자 상담 | P1 | `/worker-consultation-forms/[formId]/edit`
- `04_09_hired_safety_expert_status` | 발주자가 고용한 안전보건 전문가 현황 | P1 | `/hired-safety-expert-forms/[formId]/edit`
- `04_10_serious_accident_management` | 중대재해 관리 | P1 | `/serious-accident-management-forms/[formId]/edit`
- `04_11_finding_action_photo_ledger` | 지적사항/조치현황 사진대지 | P0 | `/photo-ledger-forms/[formId]/edit`
- `04_12_work_schedule_attachment` | 공사일정 첨부/공정표 첨부 | P1 | `/work-schedule-attachment-forms/[formId]/edit`
- `04_13_technical_service_contract` | 기술용역계약서 표준서식 | P0 | `/technical-service-contract-forms/[formId]`
- `04_14_project_summary_contact_book` | 공사개요 및 연락망/총괄현황 | P0 | `/project-summary-contact-books/[formId]`
- `08_safety_management_plan` | 안전관리계획서 자동화 | P1 | `/safety-management-plans/[planId]`
- `09_safety_health_ledger` | 안전보건대장 자동화 | P1 | `/safety-health-ledgers/[ledgerId]`
- `10_webhard` | 웹하드 | P0 | `/webhard/projects/[projectId]`
- `11_mailbox` | 메일함 | P0 | `/mail`
- `12_approval_submission` | 결재/서명/제출 | P1 | `/submissions/[submissionId]`
- `13_admin_template_prompt` | 관리자/템플릿/프롬프트 | P1 | `/admin/prompts`
- `14_dashboard_statistics` | 대시보드/통계 | P1 | `/dashboard`
