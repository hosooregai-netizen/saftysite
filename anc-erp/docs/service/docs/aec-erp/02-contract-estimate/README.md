# 기능 02 — 계약/견적 관리

이 폴더는 A&C 기술사 ERP의 두 번째 기능인 **계약/견적 관리** 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

계약/견적 관리는 기술용역계약서, 견적서, 계약금액, VAT 포함 여부, 발주처별 분담비율, 지급조건, 최종본, 날인본, 계약 변경 이력을 관리한다.

샘플 기준 핵심 구조:

```text
프로젝트: 리움미술관 승강기 교체공사
용역: 공사안전보건대장 이행점검 기술용역
계약금액: 11,000,000원, VAT 포함
발주처 1: 삼성문화재단, 60%, 6,600,000원
발주처 2: 삼성생명공익재단, 40%, 4,400,000원
점검횟수: 총 10회
지급조건: 1차기성, 준공금
```

## 핵심 연결

```text
ProjectParty.owner
→ ContractParty.client
→ PaymentSplitItem
→ PaymentTerm
→ ContractVersion
→ FileAsset
→ Webhard 00_계약_견적
→ MailThread / Submission
```
