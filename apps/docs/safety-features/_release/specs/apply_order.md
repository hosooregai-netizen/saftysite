# Apply Order

## 통합 overlay 적용

```bash
unzip safety_features_step14_combined_docs_overlay.zip
```

프로젝트 루트에서 실행한다.

## 개별 step을 적용하는 경우

통합 overlay 대신 개별 overlay를 적용해야 한다면 아래 순서를 지킨다.

```text
01 foundation
02 webhard
03 mailbox
04 report-workspace
05 report-list
06 headquarters-sites
07 photo-album
08 account-settings
09 billing-credits
10 auth-workspace
11 registry-index
12 design-system
13 quality-regression
14 release docs
```

## 적용 후 확인

```bash
find docs/safety-features -maxdepth 3 -type f | sort | head
```

그리고 다음 문서가 존재하는지 확인한다.

```text
docs/safety-features/INDEX.md
docs/safety-features/_registry/feature_registry.md
docs/safety-features/_design-system/specs/README.md
docs/safety-features/_quality/specs/release_gate.md
docs/safety-features/_release/specs/final_qa_order.md
```
