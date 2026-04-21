# AIDLC Hooks Overview

## 목적

이 문서는 `saftysite-real` 저장소에서 `pre-commit`, `pre-push`, CI가 어떤 순서로 guardrail을 실행하는지 설명하는 운영용 요약본이다.

이번 개편의 목표는 세 가지다.

- `pre-commit`이 working tree noise가 아니라 staged snapshot 기준으로 판정하게 만들기
- `pre-push`가 실제 push ref 범위를 읽어 smoke 대상을 더 정확히 계산하게 만들기
- guarded source뿐 아니라 metadata와 smoke harness/runner 같은 guardrail 자체 변경도 놓치지 않기

## 한 줄 요약

- `pre-commit`은 이제 unstaged/untracked 변경을 잠깐 stash해 두고, staged snapshot만 남긴 상태에서 `verify:aidlc`를 실행한다.
- `pre-push`는 Git hook stdin으로 넘어오는 ref update를 읽어, 실제로 push되는 변경 파일을 기준으로 smoke 범위를 계산한다.
- contract metadata와 smoke harness/runner 같은 guardrail config가 바뀌면 targeted 경로 대신 full validation 또는 full smoke로 승격한다.

## pre-commit

진입점은 [.githooks/pre-commit](/Users/mac_mini/Documents/GitHub/saftysite-real/.githooks/pre-commit:1) 이다.

동작 순서는 이렇다.

1. unstaged 변경이나 untracked 파일이 있으면 `git stash --keep-index --include-untracked`로 임시 분리한다.
2. staged index만 남긴 상태에서 `npm run verify:aidlc`를 실행한다.
3. 종료 후 stash를 다시 apply/drop 해서 원래 작업 트리를 복원한다.

이렇게 바꾼 이유는 다음과 같다.

- 부분 staging 중인 파일 때문에 `tsc`나 audit가 흔들리지 않게 하기 위해서다.
- "지금 커밋하려는 snapshot" 기준으로 검증해야 commit gating 의미가 맞기 때문이다.
- guarded source 삭제도 놓치지 않도록 staged diff filter에 delete를 포함했다.

실제 검증 스크립트는 [scripts/verifyAidlc.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/verifyAidlc.mjs:1) 이다.

이 스크립트는 다음을 수행한다.

- guarded source 변경 시 admin/ERP companion proof 검사
- `validateRecoverySlices.mjs`
- `validateErpReversePlatform.ts`
- `tsc --noEmit`
- scope별 AIDLC audit

추가로 아래 파일이 바뀌면 guarded source가 없더라도 full validation으로 본다.

- `tests/client/contracts/featureContractMetadata.json`
- `tests/client/contracts/*.ts`
- `tests/client/featureContracts.ts`
- `tests/client/fixtures/*SmokeHarness.ts`
- `scripts/verifyAidlc.mjs`
- `scripts/verifyAidlcPush.mjs`
- `.githooks/pre-commit`
- `.githooks/pre-push`

## pre-push

진입점은 [.githooks/pre-push](/Users/mac_mini/Documents/GitHub/saftysite-real/.githooks/pre-push:1) 이다.

기존에는 `@{upstream}...HEAD` 같은 추정 diff에 기대는 부분이 있었는데, 이제는 Git이 hook stdin으로 넘겨주는 ref update 목록을 임시 파일로 받아 [scripts/verifyAidlcPush.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/verifyAidlcPush.mjs:1) 에 전달한다.

stdin 형식은 다음과 같다.

```text
<local ref> <local oid> <remote ref> <remote oid>
```

스크립트는 이 정보를 이용해서:

1. 일반 push면 `remoteOid..localOid` diff를 계산한다.
2. 새 ref push면 remote에 아직 없는 commit 집합을 모아 변경 파일을 합산한다.
3. 그 파일이 guarded source면 contract metadata로 smoke id를 역추적한다.
4. ERP smoke가 하나라도 있으면 `auth`도 자동 포함한다.
5. 로컬 앱이 살아 있는지 확인한 뒤 필요한 smoke만 실행한다.

## guardrail config 변경 승격 규칙

guarded source가 없더라도 아래와 같은 파일이 바뀌면 `pre-push`는 full smoke set으로 승격한다.

- `tests/client/contracts/featureContractMetadata.json`
- `tests/client/contracts/*.ts`
- `tests/client/featureContracts.ts`
- `tests/client/fixtures/*SmokeHarness.ts`
- `tests/client/runSmoke.ts`
- `scripts/smokeClient.ts`
- `scripts/smokeRealAdmin.ts`
- `tooling/internal/smokeClient_impl.ts`

이 규칙이 필요한 이유는 smoke 대상 계산이나 harness/runner 자체를 바꾸는 변경은, source ownership 변경이 없어도 검증 의미가 크게 달라지기 때문이다.

## CI 정렬

[.github/workflows/aidlc.yml](/Users/mac_mini/Documents/GitHub/saftysite-real/.github/workflows/aidlc.yml:1) 은 changed files를 계산해서:

- `verifyAidlc.mjs`
- `verifyAidlcPush.mjs`

를 다시 실행한다.

즉, 로컬 hook이 꺼져 있어도 `main` 보호선은 CI에서 다시 한 번 유지된다.

## 핵심 파일

| 파일 | 역할 |
| --- | --- |
| [.githooks/pre-commit](/Users/mac_mini/Documents/GitHub/saftysite-real/.githooks/pre-commit:1) | staged snapshot 보호 후 `verify:aidlc` 실행 |
| [.githooks/pre-push](/Users/mac_mini/Documents/GitHub/saftysite-real/.githooks/pre-push:1) | 실제 push ref stdin을 전달 |
| [scripts/aidlcHookUtils.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/aidlcHookUtils.mjs:1) | guardrail config 분류, pre-push stdin parser |
| [scripts/verifyAidlc.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/verifyAidlc.mjs:1) | pre-commit 성격의 validate/audit 실행 |
| [scripts/verifyAidlcPush.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/verifyAidlcPush.mjs:1) | push 범위 해석 + smoke 실행 |
| [scripts/aidlcContractMetadata.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/aidlcContractMetadata.mjs:1) | contract/smoke metadata 로더 |
| [tests/scripts/aidlcHookUtils.test.mjs](/Users/mac_mini/Documents/GitHub/saftysite-real/tests/scripts/aidlcHookUtils.test.mjs:1) | hook 규칙 순수 테스트 |

## PPT

발표용 요약본은 아래 파일로 생성된다.

- [aidlc-hooks-overview.pptx](</Users/mac_mini/Documents/GitHub/saftysite-real/docs/guardrails/aidlc-hooks-overview.pptx>)

생성 스크립트:

- [scripts/generateAidlcHooksOverviewDeck.ts](/Users/mac_mini/Documents/GitHub/saftysite-real/scripts/generateAidlcHooksOverviewDeck.ts:1)
