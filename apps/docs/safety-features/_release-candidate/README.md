# Release Candidate Branching

`_release-candidate/`는 Step 17 source recovery overlay를 실제 프로젝트에 적용한 뒤, build 결과에 따라 다음 작업을 분기하기 위한 문서와 프롬프트다.

## 핵심 분기

```text
Step 17 source recovery 적용
→ clean build 실행
→ build 실패: Remaining Build Error Patch
→ build 성공: Feature Hardening Sprint
```

## 목적

- build 결과가 없는 상태에서도 다음 조치가 흔들리지 않도록 한다.
- source recovery가 MVP fallback에 머무르지 않고 실제 기능 품질로 이어지게 한다.
- 메일함, 사진첩, 사업장/현장, 웹하드, 보고서, 결제/인증의 release candidate 기준을 분리한다.
