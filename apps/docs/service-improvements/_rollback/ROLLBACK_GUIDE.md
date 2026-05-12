# Rollback Guide

## 개별 overlay rollback

각 overlay 적용 전 git branch 또는 commit을 만든다.

```bash
git checkout -b service-improvements-apply
git status
```

문제가 생기면 변경 파일을 확인한다.

```bash
git diff --name-only
```

## 통합 overlay rollback

통합 overlay 적용 후 build 실패가 큰 경우:

```bash
git restore .
git clean -fd
```

주의: 이 명령은 추적되지 않는 파일도 삭제할 수 있으므로, 적용 전 별도 branch를 반드시 만든다.

## Release hold rollback trigger

- public share data exposure
- billing double credit
- report export failure
- auth callback failure
- mailbox OAuth state corruption
