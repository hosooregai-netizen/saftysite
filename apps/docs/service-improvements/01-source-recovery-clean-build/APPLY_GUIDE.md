# Apply Guide

## 1. 백업 또는 브랜치 생성

```bash
git checkout -b improve/source-recovery-clean-build
```

## 2. overlay 적용

프로젝트 루트에서 압축을 푼다.

```bash
unzip service_improvement_01_source_recovery_clean_build_overlay.zip
```

## 3. 기존 파일 충돌 확인

기존 파일이 이미 있는 경우, 덮어쓴 내용을 바로 커밋하지 말고 diff를 확인한다.

```bash
git status
git diff -- apps/web/types/mail.ts
git diff -- apps/web/lib/mail/apiClient.ts
```

## 4. clean build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## 5. smoke route

build 후 최소 아래 route를 확인한다.

```text
/mailbox
/mail/connect/google?error=access_denied
/photo-album
/headquarters
/sites
/reports/new
```

## 6. 결과별 다음 행동

### build 통과

```text
다음: Service Improvement 02 Mailbox State Consistency
```

### build 실패

```text
build log를 저장하고 Remaining Build Error Patch 생성
```
