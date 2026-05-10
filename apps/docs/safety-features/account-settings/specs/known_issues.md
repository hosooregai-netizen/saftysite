# Known Issues: Account Settings

## 1. Google Workspace auth와 Gmail auth 혼동 위험

Workspace 로그인은 `/auth/google/callback`이고, Gmail 메일 연결은 `/mail/connect/google`이다. 두 흐름은 state key, scope, callback URL, token 저장 위치가 달라야 한다.

## 2. nextPath open redirect 위험

`next` query나 OAuth context의 nextPath가 외부 URL이면 보안 문제가 된다. 내부 경로만 허용해야 한다.

## 3. guest cache 중복 import

로그인 callback이 여러 번 실행되거나 state 재사용이 가능하면 guest cache가 중복 import될 수 있다. state 1회성 소비와 import marker가 필요하다.

## 4. cached session 만료

프론트 localStorage/session cache가 실제 backend token과 맞지 않을 수 있다. `/auth/me` 또는 protected API 실패 시 재로그인을 안내해야 한다.

## 5. billing intent와 auth redirect 충돌

`intent=billing`, `auth=required`, `next`가 동시에 있는 경우 우선순위를 명확히 해야 한다. 현재는 billing intent가 있으면 checkout 이동을 우선한다.

## 6. 계정 화면 UI 정보 부족 가능성

단순 CTA와 패키지 카드만 있으면 현재 세션/워크스페이스/게스트 import 상태가 불명확할 수 있다. account panel, workspace panel, guest import panel을 분리하는 것이 좋다.
