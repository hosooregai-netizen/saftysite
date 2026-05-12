# Step 18 Manifest: Source Recovery Build QA

## 목적

Step 17 Source Recovery overlay를 적용한 뒤, 실제 clean build와 route smoke를 통해 남은 오류를 수집하고 분류하기 위한 QA 문서/프롬프트 패키지다.

## 전제

먼저 Step 17 overlay를 프로젝트 루트에 적용한다.

```bash
unzip safety_features_step17_source_recovery_overlay.zip
```

그 다음 Step 18의 QA 절차를 실행한다.

## 핵심 QA 축

- clean build
- missing import 재검사
- TypeScript type error triage
- route smoke
- source fallback component hardening
- docs/registry update
- release decision
