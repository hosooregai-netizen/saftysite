# Step 24 Webhard Permission/Public Share Report

## 목표

웹하드의 Drive-like UI를 유지하면서 권한/공유/공개 링크 보안 경계를 강화한다.

## Release candidate gate

- `/webhard` route smoke 통과
- `/share/[token]` route smoke 통과
- shared root boundary 통과
- expired/revoked share 차단
- viewer role no edit/delete/share UI
- Drive-like layout non-regression
