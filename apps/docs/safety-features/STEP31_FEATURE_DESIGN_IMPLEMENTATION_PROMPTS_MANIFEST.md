# Step 31 Manifest: Feature Design Implementation Prompts

## 목적

기능별 명세와 구현 프롬프트는 충분히 쌓였지만, 실제 UI를 구현할 때 사용할 **기능별 디자인 구현 프롬프트**가 분리되어 있지 않았다. 이번 패키지는 각 기능의 `prompts/` 폴더에 디자인 구현 전용 프롬프트를 추가한다.

## 포함 기능

- webhard
- mailbox
- report-workspace
- report-list
- headquarters-sites
- photo-album
- account-settings
- billing-credits
- auth-workspace

## 사용 방식

```text
기능 specs/README.md
→ 기능 specs/ui_ux.md
→ _design-system/specs/*
→ 기능 prompts/*DESIGN_IMPLEMENTATION_PROMPT.md
→ 구현
→ visual QA
```
