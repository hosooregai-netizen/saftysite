# Docs Index

이 폴더에는 두 개의 주요 문서 트리가 있습니다.

## 1. `docs/safety-features/`

기능별 명세와 구현 프롬프트의 원본 구조입니다.

```text
기능명/
├─ specs/
└─ prompts/
```

대표 기능:

- webhard
- mailbox
- report-workspace
- report-list
- headquarters-sites
- photo-album
- account-settings
- billing-credits
- auth-workspace

## 2. `docs/service-improvements/`

실제 서비스 개선 적용 순서를 가진 실행 패키지 문서입니다.

```text
01-source-recovery-clean-build
02-mailbox-state-consistency
...
16-rc-manual-qa-blocker-tracking
```

## 사용법

- 기능을 이해하려면 `safety-features`를 본다.
- 실제 개선 적용 순서를 보려면 `service-improvements`를 본다.
- 신규 인수인계는 `safety-features/_handoff`를 본다.
- 실제 QA는 `service-improvements/15`와 `service-improvements/16`을 본다.
