# AIDLC Guardrails Overview

## 목적

이 문서는 `saftysite-real` 저장소의 가드레일 구조를 한 번에 이해할 수 있도록 정리한 설명서다.

중점은 세 가지다.

- 어떤 파일이 어떤 책임을 가지는지
- 코드 변경이 들어왔을 때 어떤 검증이 자동으로 도는지
- 지금 구조가 어디까지는 지속가능하고, 어디부터는 아직 추가 작업이 필요한지

## 한 줄 요약

현재 구조는 다음 3층으로 돌아간다.

1. top-level feature contract
2. recovery slice
3. batch record

각 층의 역할은 다르다.

- top-level feature contract:
  - smoke와 push gating 단위
- recovery slice:
  - reverse spec과 세부 회귀 보호 단위
- batch record:
  - 작업 로그와 검증 결과 기록 단위

## 전체 구조도

```text
source code
  -> top-level feature contract
     -> smoke id / guarded ownership
  -> recovery slice
     -> reverse spec / invariants / targeted checks
  -> batch record
     -> what changed / what passed / what is blocked

local hooks
  pre-commit
    -> verify:aidlc
       -> staged snapshot isolation
       -> companion checks
       -> recovery-slice validation
       -> tsc
       -> aidlc audit

  pre-push
    -> verify:aidlc:push
       -> derive files from pushed refs
       -> derive smoke ids from metadata
       -> full smoke fallback for metadata/harness/runner changes
       -> run targeted client smoke

remote CI
  -> .github/workflows/aidlc.yml
     -> rerun verify:aidlc equivalent
     -> rerun verify:aidlc:push equivalent
```

## 주요 파일과 역할

### 1. 진입점과 실행 스크립트

| 파일 | 역할 |
| --- | --- |
| [package.json](/Users/mac_mini/Documents/GitHub/saftysite-real/package.json:1) | `verify:aidlc`, `verify:aidlc:push`, `validate:recovery-slices`, `aidlc:audit` 같은 실행 명령의 엔트리 |
| [.githooks/pre-commit](/Users/mac_mini/Documents/GitHub/saftysite-real/.githooks/pre-commit:1) | 커밋 전에 `npm run verify:aidlc` 실행 |
| [.githooks/pre-push](/Users/mac_mini/Documents/GitHub/saftysite-real/.githooks/pre-push:1) | 푸시 전에 `npm run verify:aidlc:push` 실행 |
| [scripts/installGitHooks.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/installGitHooks.mjs:1) | `core.hooksPath=.githooks` 설정 |
| [.github/workflows/aidlc.yml](/Users/mac_mini/Documents/GitHub/saftysite-real/.github/workflows/aidlc.yml:1) | 로컬 훅과 비슷한 검증을 CI에서 재실행 |

### 2. 계약과 메타데이터

| 파일 | 역할 |
| --- | --- |
| [tests/client/contracts/adminContracts.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/contracts/adminContracts.ts:1) | admin top-level feature contract 정의 |
| [tests/client/contracts/erpContracts.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/contracts/erpContracts.ts:1) | ERP top-level feature contract 정의 |
| [tests/client/contracts/shared.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/contracts/shared.ts:1) | `FeatureContract`, `FeatureContractMetadata`, `RecoverySliceManifest` 타입 정의 |
| [tests/client/featureContracts.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/featureContracts.ts:1) | contract registry. smoke runner가 읽는 얇은 합본 레이어 |
| [tests/client/contracts/featureContractMetadata.json](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/contracts/featureContractMetadata.json:1) | guarded globs, smoke scope, recovery slice, reverse spec path의 단일 메타데이터 소스 |
| [tests/client/contracts/metadata.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/contracts/metadata.ts:1) | JSON metadata 타입 래퍼 |

### 3. 검증 스크립트

| 파일 | 역할 |
| --- | --- |
| [scripts/aidlcContractMetadata.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/aidlcContractMetadata.mjs:1) | metadata JSON 로드, glob 매칭, contract/slice 해석 |
| [scripts/aidlcHookUtils.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/aidlcHookUtils.mjs:1) | guardrail config 파일 분류, pre-push stdin parser |
| [scripts/validateRecoverySlices.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/validateRecoverySlices.mjs:1) | metadata 정합성, reverse spec header, inventory 링크, staged slice companion 검사 |
| [scripts/verifyAidlc.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/verifyAidlc.mjs:1) | pre-commit 성격. proof/doc 동반 여부, recovery-slice validation, `tsc`, audit 실행 |
| [scripts/verifyAidlcPush.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/verifyAidlcPush.mjs:1) | pre-push 성격. 실제 pushed ref에서 변경 파일을 계산하고 필요한 smoke를 실행 |
| [scripts/aidlcAudit.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/aidlcAudit.mjs:1) | 파일 크기/분해 후보를 advisory audit으로 표시 |
| [scripts/listFeatureContractIds.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/listFeatureContractIds.ts:1) | metadata와 실제 contract registry id drift 검사 보조 |

### 4. smoke와 증거 레이어

| 파일 | 역할 |
| --- | --- |
| [tests/client/runSmoke.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/runSmoke.ts:1) | top-level contract id를 받아 smoke runner 실행 |
| [tests/client/admin/admin-control-center.spec.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/admin/admin-control-center.spec.ts:1) | admin 대표 smoke 예시 |
| [tests/client/erp/quarterly-report.spec.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/erp/quarterly-report.spec.ts:1) | ERP 대표 smoke 예시 |
| [tests/client/fixtures/adminSmokeHarness.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/fixtures/adminSmokeHarness.ts:1) | admin mocked smoke harness |
| [tests/client/fixtures/erpSmokeHarness.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/fixtures/erpSmokeHarness.ts:1) | ERP mocked smoke harness |

### 5. reverse spec와 작업 기록

| 파일 | 역할 |
| --- | --- |
| [docs/reverse-specs/README.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/README.md:1) | reverse spec 철학과 granularity rule |
| [docs/reverse-specs/reverse-spec-template.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/reverse-spec-template.md:1) | reverse spec template |
| [docs/reverse-specs/feature-inventory.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/feature-inventory.md:1) | managed recovery slice inventory |
| [docs/admin-aidlc/batch-47-feature-contract-recovery-slices.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/admin-aidlc/batch-47-feature-contract-recovery-slices.md:1) | 이번 2계층 구조 변경 작업 기록 |
| [ARCHITECTURE.md](/Users/mac_mini/Documents/GitHub/saftysite-real/ARCHITECTURE.md:1) | 전체 AIDLC 운영 원칙과 작업 흐름 |

### 6. skill 레이어

| 파일 | 역할 |
| --- | --- |
| [skills/aidlc-contract-pack/SKILL.md](/Users/mac_mini/Documents/GitHub/saftysite-real/skills/aidlc-contract-pack/SKILL.md:1) | broad bootstrap guardrail |
| [skills/admin-contract-pack/SKILL.md](/Users/mac_mini/Documents/GitHub/saftysite-real/skills/admin-contract-pack/SKILL.md:1) | admin 작업용 contract/smoke/reverse/batch 동시 업데이트 규칙 |
| [skills/erp-platform-guardrails/SKILL.md](/Users/mac_mini/Documents/GitHub/saftysite-real/skills/erp-platform-guardrails/SKILL.md:1) | ERP 쪽 플랫폼/industry-pack 경계와 계약 동반 규칙 |

## 코드 변경이 들어왔을 때 실제 흐름

### 로컬 커밋 전

1. `.githooks/pre-commit`이 unstaged/untracked 변경을 잠깐 stash해서 staged snapshot만 남긴다.
2. `npm run verify:aidlc`가 staged 파일 중 guarded 파일과 guardrail config 파일을 찾는다.
3. admin/erp proof 파일이 같이 staged 되었는지 본다.
4. `validateRecoverySlices`를 돌린다.
5. managed recovery slice에 속한 파일이 바뀌었으면 해당 reverse spec도 같이 바뀌었는지 본다.
6. `tsc --noEmit`을 돌린다.
7. 해당 scope의 `aidlc:audit`를 돌리거나, guardrail config 변경이면 admin/ERP audit를 둘 다 돌린다.
8. 종료 후 stash를 자동 복원한다.

### 로컬 푸시 전

1. `.githooks/pre-push`가 Git hook stdin의 ref update를 임시 파일로 받아 `npm run verify:aidlc:push`에 넘긴다.
2. `verifyAidlcPush`는 실제 pushed ref 범위에서 변경 파일을 계산한다.
3. guarded source면 contract metadata에 매핑해서 smoke id를 모은다.
4. metadata/harness/runner 변경이면 전체 smoke set으로 승격한다.
5. 필요한 smoke를 실행한다.

### CI

1. `.github/workflows/aidlc.yml`이 changed files를 계산한다.
2. `verifyAidlc` equivalent를 다시 돌린다.
3. 앱을 띄운 뒤 `verifyAidlcPush` equivalent를 다시 돌린다.
4. 즉, 로컬 훅이 비활성화되어도 CI에서 다시 잡는다.

## 이번 구조에서 자동으로 유지되는 것

현재는 아래 항목이 자동으로 유지된다.

- guarded 파일이 어느 top-level contract에 속하는지
- 그 contract가 어떤 smoke id를 요구하는지
- managed recovery slice가 어떤 reverse spec을 가져야 하는지
- reverse spec header가 metadata와 맞는지
- reverse inventory에 managed slice가 반영되었는지
- 실제 contract registry와 metadata contract id 집합이 같은지

즉, 첫 번째 migration wave에 대해서는 “틀이 깨진 상태로 슬쩍 지나가기”가 꽤 어려워졌다.

## 아직 자동이 아닌 것

아직은 아래 항목이 완전히 자동화된 상태는 아니다.

- 모든 기존 contract가 managed recovery slice 체계로 옮겨진 것은 아님
- 모든 legacy reverse spec이 slice 단위로 분해된 것은 아님
- batch record까지 무조건 강제하는 메타데이터 validator는 아직 없음
- 일부 공용 코드 변경이 너무 넓은 ownership으로 묶일 수 있어서, 더 세밀한 slice 분해가 필요할 수 있음
- smoke는 여전히 top-level contract 단위라, 세부 slice별 smoke 분리는 아직 하지 않음

## 분리된 ERP Reverse Platform

현재 가드레일과 별도로, 산업 재사용용 reverse는 [docs/erp-reverse-platform/README.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/README.md:1) 아래에서 따로 운영한다.

핵심 차이는 이렇다.

- `docs/reverse-specs/`
  - 현재 제품을 복구하는 recovery slice 문서
- `docs/erp-reverse-platform/`
  - 다른 산업 ERP로 조립하기 위한 module/adapter/industry-pack/composition 문서와 manifest

이 레이어는 다음 파일이 운영 기준점이다.

| 파일 | 역할 |
| --- | --- |
| [docs/erp-reverse-platform/module-catalog.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/module-catalog.md:1) | starter module catalog inventory |
| [docs/erp-reverse-platform/provenance/recovery-slice-map.json](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/provenance/recovery-slice-map.json:1) | recovery slice와 reverse module의 명시적 매핑 |
| [scripts/erpReversePlatform.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/erpReversePlatform.ts:1) | reverse platform manifest/type loader |
| [scripts/validateErpReversePlatform.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/validateErpReversePlatform.ts:1) | reverse module pair, override surface, tenant binding, freshness validator |
| [scripts/generateErpReversePlatformDeck.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/generateErpReversePlatformDeck.ts:1) | 발표용 PPT generator |

운영 규칙도 다르다.

- recovery slice가 바뀌면 recovery spec은 현재 제품 복구를 위해 업데이트한다.
- 같은 변경이 재사용 가능한 capability에도 영향을 주면, ERP reverse module도 같이 갱신한다.
- source slice가 바뀌었는데 module/provenance가 안 바뀌면 `validate:erp-reverse-platform`이 실패시킨다.

## 지속가능성 판단

결론은 이렇다.

- 지금 구조는 “초기 우산 계약 + 하위 slice”라는 틀 자체는 지속가능하다.
- 하지만 “전 저장소 전체에 완전히 자동 유지” 단계는 아직 아니다.
- 현재는 priority target 집합에 대해 지속가능한 구조를 만든 상태다.

다시 말해:

- 틀은 맞게 세워졌다.
- 첫 파도는 자동 보호된다.
- 전체 저장소에 대해 같은 수준으로 유지하려면 추가 migration이 더 필요하다.

## 추천하는 다음 작업

1. 남은 top-level contract도 `featureContractMetadata.json`로 전부 정리한다.
2. legacy umbrella reverse spec을 slice 단위로 점진 분해한다.
3. batch doc도 metadata에 연결해서 “어떤 작업이 어떤 batch 기록을 남겨야 하는지”를 더 직접 검증한다.
4. 공용 계층 중 ownership이 너무 넓은 곳은 slice를 더 세밀하게 나눈다.
5. 필요한 경우 slice-level targeted smoke를 일부 추가한다.

## 이 문서를 업데이트할 때 같이 봐야 하는 파일

- [tests/client/contracts/featureContractMetadata.json](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/client/contracts/featureContractMetadata.json:1)
- [scripts/validateRecoverySlices.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/validateRecoverySlices.mjs:1)
- [scripts/verifyAidlc.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/verifyAidlc.mjs:1)
- [scripts/verifyAidlcPush.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/verifyAidlcPush.mjs:1)
- [docs/reverse-specs/feature-inventory.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/feature-inventory.md:1)
- [ARCHITECTURE.md](/Users/mac_mini/Documents/GitHub/saftysite-real/ARCHITECTURE.md:1)

## PPT

이 문서의 발표용 요약본은 아래 파일로 생성된다.

- [aidlc-guardrails-overview.pptx](</Users/mac_mini/Documents/GitHub/saftysite-real/docs/guardrails/aidlc-guardrails-overview.pptx>)

생성 스크립트:

- [scripts/generateGuardrailsOverviewDeck.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/generateGuardrailsOverviewDeck.ts:1)

hook runtime 발표본은 별도 파일로 생성된다.

- [aidlc-hooks-overview.pptx](</Users/mac_mini/Documents/GitHub/saftysite-real/docs/guardrails/aidlc-hooks-overview.pptx>)
- [scripts/generateAidlcHooksOverviewDeck.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/generateAidlcHooksOverviewDeck.ts:1)

ERP reverse platform 발표본은 별도 파일로 생성된다.

- [erp-reverse-platform-overview.pptx](</Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/erp-reverse-platform-overview.pptx>)
- [scripts/generateErpReversePlatformDeck.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/generateErpReversePlatformDeck.ts:1)
