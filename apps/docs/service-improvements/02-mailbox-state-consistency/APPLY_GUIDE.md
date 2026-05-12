# Apply Guide

## 1. 전제

먼저 Service Improvement 01 Source Recovery를 적용한다.

```bash
unzip service_improvement_01_source_recovery_clean_build_overlay.zip
```

## 2. 이번 패키지 적용

프로젝트 루트에서 실행한다.

```bash
unzip service_improvement_02_mailbox_state_consistency_overlay.zip
```

## 3. Clean build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## 4. Route smoke

```text
/mailbox
/mail/connect/google?error=access_denied
/mail/connect/google?code=dummy&state=dummy
```

## 5. 기대 상태

### 앱 로그인 필요

```text
메일함을 시작하려면 로그인하세요.
```

### 계정 없음

```text
메일 사용을 시작하려면 계정 연결이 필요합니다.
```

### OAuth 성공 직후 계정 refresh 중

```text
메일 계정 정보를 불러오는 중입니다.
```

### 연결 계정 있음 + 메일 없음

```text
표시할 메일이 없습니다.
검색 조건을 조정하거나 메일 계정 동기화를 다시 실행해 주세요.
```
