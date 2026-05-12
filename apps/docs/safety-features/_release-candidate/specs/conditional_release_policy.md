# Conditional Release Policy

## 허용 가능한 조건부 release

- S3 visual minor issue
- S4 docs-only issue
- workaround이 명확한 S2 issue
- 운영 기능이 아닌 placeholder 기능

## 허용 불가

- security
- billing
- auth/session
- data loss
- core report export
- public share boundary
- clean build failure

## 조건부 release 문서화

조건부 release는 반드시 아래를 남긴다.

```text
issue id
impact
workaround
owner
target fix date
rollback trigger
```
