# Service Improvement 14: Account Settings / Guest Import / Billing Entry UX

## 목적

설정 화면에서 앱 로그인, Gmail 연결, 임시 자료 가져오기, 결제 진입을 명확히 분리한다.

현재 서비스 메뉴에서 설정은 “계정 및 기본정보”이며, 보고서·사진첩·웹하드·메일함의 기준 상태를 관리하는 허브 역할을 한다. 이 단계에서는 `/account` 화면을 단순 로그인/결제 카드에서 운영 가능한 계정 상태 화면으로 개선한다.

## 적용 파일

```text
apps/web/components/AccountSettingsScreen.tsx
apps/web/lib/sessionAuthFlow.ts
```

## 핵심 개선

1. Google Workspace 로그인과 Gmail 연결을 명확히 분리한다.
   - 앱 로그인: `/auth/google/callback`
   - Gmail 연결: `/mail/connect/google`
2. Workspace 로그인 완료 시 Gmail 연결 pending state를 자동으로 만들지 않는다.
3. 설정 화면에 session mode를 표시한다.
   - 로그인 완료
   - 임시 작업공간
   - 로컬 임시 보관
4. guest/local cache summary를 표시한다.
   - 사업장/현장
   - 사진첩
   - 웹하드 항목/공유
   - 메일 임시보관
5. authenticated workspace에서 임시 자료 가져오기 버튼을 제공한다.
6. 결제 패키지는 기존처럼 `/billing/checkout`으로 이동한다.
7. Gmail 연결 관리는 `/mailbox`로 안내한다.

## 적용 순서

```bash
unzip service_improvement_14_account_settings_guest_billing_overlay.zip
rm -rf apps/web/.next
cd apps/web
npm run build
```
