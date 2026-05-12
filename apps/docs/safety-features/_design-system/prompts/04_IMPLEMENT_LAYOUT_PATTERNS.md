# 04_IMPLEMENT_LAYOUT_PATTERNS

```text
너는 layout pattern을 구현하는 시니어 프론트엔드 엔지니어다.

목표:
ERP AppShell, Fullscreen Workspace Shell, Drive-like File Manager, Three-pane Mailbox layout이 디자인 시스템 기준과 일치하도록 개선하라.

참조 문서:
- docs/safety-features/_design-system/specs/erp_app_shell.md
- docs/safety-features/_design-system/specs/fullscreen_workspace_shell.md
- docs/safety-features/_design-system/specs/drive_like_file_manager.md
- docs/safety-features/_design-system/specs/three_pane_mailbox.md

요구사항:
1. 웹하드와 메일함에서 기존 ERP sidebar 상시 노출을 피하라.
2. 업무 메뉴 접근은 topbar drawer로 제공하라.
3. 웹하드는 Drive-like sidebar + file canvas + optional detail panel 유지.
4. 메일함은 folder sidebar + thread list + message viewer 유지.
5. 일반 ERP 화면은 page header + toolbar + panel/list 기준 유지.
6. 기능 로직을 깨지 마라.

완료 기준:
- layout visual QA 통과
- build 통과
- 기존 주요 기능 route smoke 통과
```
