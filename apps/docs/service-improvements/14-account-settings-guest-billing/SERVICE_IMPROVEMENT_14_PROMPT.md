# Service Improvement 14 Prompt: Account Settings / Guest Import / Billing Entry UX

```text
너는 인증/워크스페이스/설정 화면을 개선하는 시니어 프론트엔드 엔지니어다.

목표:
설정 화면에서 Google Workspace 로그인, Gmail 연결, guest cache import, billing entry를 명확히 분리하라.

대상 파일:
- apps/web/components/AccountSettingsScreen.tsx
- apps/web/lib/sessionAuthFlow.ts

요구사항:
1. AccountSettingsScreen에서 session mode를 명확히 표시하라.
2. Google Workspace 로그인과 Gmail 연결 문구를 분리하라.
3. Workspace 로그인 완료 시 Gmail connect pending flag를 자동 설정하지 마라.
4. guest cache summary를 표시하라.
5. authenticated session에서 guest cache import 버튼을 제공하라.
6. 이미 현재 workspace로 import된 cache는 중복 import하지 마라.
7. 결제 패키지는 기존 checkout flow를 유지하라.
8. Gmail 연결은 /mailbox로 안내하라.
9. 메일함, 보고서, 웹하드 기능 코드는 직접 수정하지 마라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- /account route smoke 통과
- Workspace login과 Gmail connect가 UI와 state에서 분리됨
- guest import 중복 방지
- billing entry 유지
```
