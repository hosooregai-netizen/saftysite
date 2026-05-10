# 00_MASTER_FEATURE_DESIGN_IMPLEMENTATION

```text
너는 SaaS 업무 시스템의 디자인 구현을 담당하는 시니어 프론트엔드 엔지니어다.

목표:
기능별 UI를 명세된 layout pattern에 맞게 구현하고, visual regression을 방지하라.

반드시 확인:
- docs/safety-features/_design-system/specs/*
- docs/safety-features/_design-implementation/specs/GLOBAL_DESIGN_IMPLEMENTATION_RULES.md
- docs/safety-features/_design-implementation/specs/FEATURE_DESIGN_PROMPT_INDEX.md
- 담당 기능 specs/ui_ux.md
- 담당 기능 prompts/*DESIGN_IMPLEMENTATION_PROMPT.md

요구사항:
1. 기능별 layout pattern을 지켜라.
2. empty/loading/error/auth-required/permission-denied 상태를 구현하라.
3. responsive/mobile 상태를 확인하라.
4. 접근성 기본 요구사항을 지켜라.
5. 다른 기능의 layout으로 오인되지 않게 하라.
6. 변경 후 visual QA matrix를 업데이트하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- 담당 route visual QA 통과
- layout non-regression 통과
- 기능별 QA prompt 통과
```
