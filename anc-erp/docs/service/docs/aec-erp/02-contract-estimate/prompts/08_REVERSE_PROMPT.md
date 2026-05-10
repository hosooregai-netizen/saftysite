# 08. Reverse Prompt — 계약/견적 관리

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
계약/견적 관리

기능 설명:
계약/견적 관리는 기술용역계약서, 견적서, 계약금액, VAT 포함 여부, 발주처별 분담비율, 지급조건, 계약기간, 납품항목, 최종본, 날인본, 계약 변경 이력을 관리하는 기능이다.

업무 맥락:
- 계약은 Project에 속한다.
- ProjectParty owner는 ContractParty client로 전환될 수 있다.
- 발주처가 여러 개인 경우 분담비율과 분담금액을 관리해야 한다.
- 지급조건은 1차기성, 준공금 등으로 구성될 수 있다.
- 계약서 초안은 AI가 작성할 수 있지만 사용자가 검토해야 한다.
- 계약서 최종본과 날인본은 웹하드에 저장되어야 한다.
- 계약기간과 점검횟수는 점검회차 생성에 사용된다.
- 계약서 발송은 메일함 및 제출 이력과 연결될 수 있다.

입력:
{
  "featureName": "계약/견적 관리",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "mailRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `contract.estimate.management`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 점검회차/일정
    - 보고서 자동화
    - 웹하드
    - 메일함
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "contract.estimate.management",
  "featureName": "계약/견적 관리",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /projects/[projectId]/contracts
- /projects/[projectId]/contracts/new
- /contracts/[contractId]
- /contracts/[contractId]/edit
- /contracts/[contractId]/preview
- /contracts/[contractId]/payments
- /contracts/[contractId]/files
- /contracts/[contractId]/changes
- /projects/[projectId]/estimates
- /projects/[projectId]/estimates/new
- /estimates/[estimateId]

반드시 포함할 models:
- Contract
- ContractParty
- PaymentTerm
- PaymentSplitItem
- Estimate
- EstimateItem
- ContractVersion
- ContractChange
- FileAsset
- AuditLog

반드시 포함할 prompts:
- contract-draft-generation
- contract-estimate-management implementation prompt
- contract-estimate design prompt

반드시 포함할 tests:
- test_contract_create_success
- test_contract_multiple_clients_supported
- test_contract_share_ratio_calculation
- test_payment_term_split_by_ratio
- test_contract_generate_creates_version
- test_contract_export_uses_latest_version
- test_contract_mark_signed_requires_signed_file
- test_estimate_create_and_convert_to_contract
- test_contract_file_saved_to_webhard_contract_folder

주의:
- Contract는 Project 없이 생성될 수 없다.
- ProjectParty와 ContractParty를 혼동하지 않는다.
- 계약금액 총액과 발주처별 분담금액을 혼동하지 않는다.
- 지급조건 합계와 계약금액 합계가 맞는지 검증해야 한다.
- signed 상태는 날인본 파일이 있어야 한다.
- AI가 생성한 계약서 문구는 draft 상태로만 저장한다.
- 법률/일반조건 문구는 등록된 템플릿 문구만 사용한다.
- 계약서 export는 최신 ContractVersion을 기준으로 한다.
```
