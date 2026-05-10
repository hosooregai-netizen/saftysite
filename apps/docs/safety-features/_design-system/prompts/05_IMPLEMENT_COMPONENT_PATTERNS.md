# 05_IMPLEMENT_COMPONENT_PATTERNS

```text
너는 공통 component pattern을 정리하는 프론트엔드 엔지니어다.

목표:
Button, SearchBar, Badge, EmptyState, Toast, Modal, Table/List row, ContextMenu 같은 반복 UI를 디자인 시스템 기준으로 정리하라.

참조 문서:
- docs/safety-features/_design-system/specs/component_inventory.md
- docs/safety-features/_design-system/specs/state_patterns.md
- docs/safety-features/_design-system/specs/data_table_pattern.md
- docs/safety-features/_design-system/specs/form_modal_pattern.md

요구사항:
1. 기능별로 중복 구현된 UI를 찾으라.
2. 공통화할 것과 feature-specific으로 남길 것을 구분하라.
3. status badge 색상/문구를 일관화하라.
4. empty/error/loading state를 표준화하라.
5. table/list row hover/selected/focus state를 표준화하라.
6. 접근성 aria-label/focus/keyboard를 확인하라.

완료 기준:
- 공통화 후보 목록
- 수정 적용 계획
- 회귀 테스트 기준
```
