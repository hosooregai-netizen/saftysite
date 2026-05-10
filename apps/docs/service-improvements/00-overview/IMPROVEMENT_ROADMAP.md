# 개선 로드맵

## Phase 1. Build 안정화

```text
01 Source Recovery / Clean Build
15 Final Clean Build / Route Smoke QA
```

## Phase 2. Mailbox 안정화

```text
02 Mailbox State Consistency
03 Mailbox 3-Pane & Compose
04 Gmail Send & Sync Backend
05 Mailbox Sync / Reconnect UX
```

## Phase 3. Webhard 보안/UX

```text
06 Webhard Permission / Public Share Security
07 Webhard Share Dialog / Badges UX
```

## Phase 4. Report/Billing/Auth gate

```text
08 Report / Billing / Auth Gate
11 Report Guided Upload / Review
12 Report Review / Export UX
13 Report List Status / Filters
```

## Phase 5. 기준정보/사진첩/설정

```text
09 Photo Album Grid / Filters
10 Headquarters/Sites Directory UI
14 Account Settings / Guest Import / Billing Entry UX
```

## Phase 6. Release candidate

```text
15 Final Clean Build / Route Smoke QA
```

## 권장 실제 실행 순서

```bash
unzip service_improvements_01_to_15_apply_overlay.zip
bash scripts/service-improvements/run-final-qa.sh
```

빌드 실패 시 다음은 blocker patch다. 빌드 성공 시 manual route smoke와 release decision으로 이동한다.
