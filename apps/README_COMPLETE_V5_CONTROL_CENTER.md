# Complete Markdown Structure + Interactive Control Center v5

이 ZIP은 다음을 포함한다.

```text
docs/safety-features/
→ 기존 기능별 명세, 프롬프트, 디자인 구현 프롬프트, registry, QA, release, operations, handoff

docs/service-improvements/
→ 실제 서비스 개선 01~16 단계 문서

docs/control-center/
→ Markdown/JSON 기반 interactive HTML control center

assets/service_improvements_01_to_16_apply_overlay.zip
→ 실제 source overlay 통합 적용 ZIP
```

## 사용 순서

```bash
unzip complete_markdown_structure_with_control_center_v5.zip

# 문서/컨트롤 센터 확인
open docs/control-center/index.html

# 실제 코드 overlay 적용이 필요하면
unzip assets/service_improvements_01_to_16_apply_overlay.zip

# QA
bash scripts/service-improvements/run-final-qa.sh
bash scripts/service-improvements/create-rc-qa-report.sh
```

## 원칙

```text
Markdown = source of truth
JSON = structured index
HTML = interactive control center
```
