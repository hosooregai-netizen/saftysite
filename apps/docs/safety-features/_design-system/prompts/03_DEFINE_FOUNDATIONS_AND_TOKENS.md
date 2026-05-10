# 03_DEFINE_FOUNDATIONS_AND_TOKENS

```text
너는 CSS token과 UI foundation을 정리하는 프론트엔드 아키텍트다.

목표:
현재 global CSS와 feature CSS module을 점검하고 공통 token alias를 정리하라.

참조 문서:
- docs/safety-features/_design-system/specs/foundations.md
- docs/safety-features/_design-system/specs/tokens.md

대상 코드:
- apps/web/app/globals.css
- apps/web/components/*.module.css
- apps/web/features/**/**/*.module.css

요구사항:
1. 기존 CSS variable 목록을 추출하라.
2. 색상/spacing/radius/shadow 중복을 찾으라.
3. 새 token alias가 필요한 항목을 제안하라.
4. 기능 CSS를 한 번에 갈아엎지 말고 점진 적용 계획을 세워라.
5. 웹하드/메일함의 workspace token 사용 기준을 정리하라.
6. ERP 화면 token 사용 기준을 정리하라.

완료 기준:
- token map
- migration plan
- do-not-break list
```
