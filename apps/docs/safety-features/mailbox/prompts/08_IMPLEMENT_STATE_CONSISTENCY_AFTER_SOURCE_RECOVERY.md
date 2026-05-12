# 08_IMPLEMENT_STATE_CONSISTENCY_AFTER_SOURCE_RECOVERY

```text
너는 Gmail/Naver형 메일 클라이언트 UX를 안정화하는 시니어 프론트엔드 엔지니어다.

목표:
Step 17 source recovery 이후 메일함의 OAuth/account/onboarding/sync 상태 모순을 제거하라.

참조 문서:
- docs/safety-features/mailbox/specs/state_consistency_hardening.md
- docs/safety-features/mailbox/specs/account_onboarding_states.md
- docs/safety-features/mailbox/specs/sync_status_states.md

대상 코드:
- apps/web/features/mailbox/components/MailboxShellScreen.tsx
- apps/web/features/mailbox/components/MailboxOnboardingState.tsx
- apps/web/features/mailbox/components/MailboxSidebar.tsx
- apps/web/features/mailbox/components/MailboxTopbar.tsx
- apps/web/lib/mailboxApi.ts
- apps/web/lib/mail/apiClient.ts

요구사항:
1. OAuth success notice와 no account onboarding이 동시에 보이지 않게 하라.
2. accounts가 비어 있지만 OAuth success notice가 있으면 `oauth_success_pending_refresh` 상태로 표시하라.
3. 이 상태에서는 계정 목록 재조회 CTA를 제공하라.
4. Workspace login CTA와 Gmail connect CTA를 명확히 분리하라.
5. connected account가 있으면 계정 없음 onboarding을 숨겨라.
6. sync error/reconnect_required 상태를 account badge와 topbar에 표시하라.
7. 기존 웹하드/보고서/사진첩 기능은 수정하지 마라.

완료 기준:
- `구글 메일 계정을 연결했습니다`와 `연결된 메일 계정이 없습니다`가 동시에 보이지 않는다.
- 계정 있음/없음/동기화 오류 상태가 구분된다.
- clean build를 통과한다.
```
