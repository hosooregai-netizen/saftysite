# Complete Markdown Structure: Existing Docs + Service Improvements

이 패키지는 기존에 만든 **`docs/safety-features/` 기능 명세/프롬프트 구조**와, 실제 서비스 개선 단계인 **`docs/service-improvements/` 구조**를 함께 포함한 마크다운 전용 패키지입니다.

## 포함 구조

```text
docs/
├─ safety-features/
│  ├─ _project/
│  ├─ _design-system/
│  ├─ _registry/
│  ├─ _quality/
│  ├─ _verification/
│  ├─ _release/
│  ├─ _release-candidate/
│  ├─ _operations/
│  ├─ _handoff/
│  ├─ webhard/
│  ├─ mailbox/
│  ├─ report-workspace/
│  ├─ report-list/
│  ├─ headquarters-sites/
│  ├─ photo-album/
│  ├─ account-settings/
│  ├─ billing-credits/
│  └─ auth-workspace/
│
└─ service-improvements/
   ├─ 00-overview/
   ├─ 01-source-recovery-clean-build/
   ├─ 02-mailbox-state-consistency/
   ├─ ...
   ├─ 16-rc-manual-qa-blocker-tracking/
   ├─ _meta/
   ├─ _qa/
   ├─ _handoff/
   ├─ _rollback/
   └─ _blocker-patches/
```

## 두 구조의 차이

| 구조 | 목적 |
|---|---|
| `docs/safety-features/` | 기능별 명세, schema, API, UI/UX, 구현 프롬프트, QA, release/operations 문서 |
| `docs/service-improvements/` | 실제 적용 순서가 있는 01~16 서비스 개선 패키지 문서와 QA runbook |

## 먼저 읽을 순서

```text
1. docs/safety-features/_handoff/README.md
2. docs/safety-features/_handoff/specs/role_based_reading_order.md
3. docs/safety-features/INDEX.md
4. docs/service-improvements/README.md
5. docs/service-improvements/00-overview/STRUCTURE_OVERVIEW.md
6. docs/service-improvements/_meta/APPLY_ORDER.md
7. docs/service-improvements/16-rc-manual-qa-blocker-tracking/README.md
```

## 실제 코드 적용 ZIP은 별도

이 패키지는 마크다운 문서 전용입니다. 실제 source overlay 적용은 다음 ZIP을 사용합니다.

```text
service_improvements_01_to_16_apply_overlay.zip
```

## 생성 정보

- 생성 시각: 2026-05-08 13:33 UTC
- 포함 형식: `.md` only
- 제외: source code, `.txt`, `.next`, `.venv`, `__MACOSX`
