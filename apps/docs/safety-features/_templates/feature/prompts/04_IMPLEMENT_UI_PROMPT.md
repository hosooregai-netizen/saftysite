# Prompt: Implement UI

```text
너는 Next.js/React 기반 SaaS UI를 구현하는 시니어 프론트엔드 엔지니어다.

목표:
<FEATURE_NAME> 기능의 UI를 specs/ui_ux.md와 디자인 시스템 기준에 맞게 구현 또는 개선하라.

먼저 읽을 문서:
- docs/safety-features/_design-system/specs/design_principles.md
- docs/safety-features/_design-system/specs/layout_patterns.md
- docs/safety-features/<FEATURE_SLUG>/specs/ui_ux.md
- docs/safety-features/<FEATURE_SLUG>/specs/data_flow.md
- docs/safety-features/<FEATURE_SLUG>/specs/validation.md
- docs/safety-features/<FEATURE_SLUG>/specs/reverse_map.md

대상 파일:
- <FRONTEND_FILES>

절대 수정하지 말 것:
- 관련 없는 기능
- .next
- global CSS 대규모 변경

구현 원칙:
- loading/empty/error/success state를 모두 구현한다.
- keyboard accessibility를 고려한다.
- desktop/tablet/mobile 대응을 한다.
- 기능별 layout pattern을 따른다.
- 기존 API 계약을 임의로 바꾸지 않는다.

완료 기준:
- UI가 specs/ui_ux.md와 일치한다.
- 주요 상호작용이 동작한다.
- visual QA checklist를 통과한다.
```
