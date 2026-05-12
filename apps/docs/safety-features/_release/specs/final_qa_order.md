# Final QA Order

## 1. 문서 구조 확인

```bash
ls docs/safety-features
ls docs/safety-features/_registry
ls docs/safety-features/_quality
```

## 2. 문서 coverage 확인

참조:

```text
docs/safety-features/_quality/specs/docs_coverage.md
```

## 3. Registry 검증

```text
_registry/feature_registry.md
_registry/route_registry.md
_registry/api_registry.md
_registry/schema_registry.md
_registry/prompt_registry.md
_registry/reverse_registry.md
```

## 4. Clean build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## 5. Route smoke

참조:

```text
_quality/specs/route_smoke.md
```

## 6. Security regression

참조:

```text
_quality/specs/security_regression.md
_quality/specs/public_share_security.md
_quality/specs/oauth_regression.md
_quality/specs/report_export_billing.md
```

## 7. Visual QA

참조:

```text
_design-system/specs/visual_qa_checklist.md
_quality/specs/visual_regression.md
```

## 8. Release gate report

실행 프롬프트:

```text
_quality/prompts/08_RELEASE_GATE_REPORT.md
```
