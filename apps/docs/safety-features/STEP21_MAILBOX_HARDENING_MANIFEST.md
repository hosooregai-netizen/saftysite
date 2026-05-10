# Step 21 Manifest: Mailbox State Consistency & Hardening

## 목적

Step 17 source recovery와 Step 18~20 release candidate branching 이후, 메일함을 우선 hardening 대상으로 삼는다.

## 이유

메일함은 다음 문제가 실제 화면/문서에서 반복적으로 확인되었다.

- 연결 성공 메시지와 계정 없음 상태가 동시에 보일 수 있다.
- 연결 계정이 있어도 받은편지함 0건/상세 empty state가 자연스럽지 않다.
- source recovery 이후 three-pane layout, onboarding, sync state, compose panel을 정리해야 한다.

## 생성 범위

```text
docs/safety-features/mailbox/specs/*
docs/safety-features/mailbox/prompts/*
docs/safety-features/_release-candidate/specs/*
docs/safety-features/_quality/specs/*
```

## 이번 단계의 성격

이 단계는 앱 source patch가 아니라, source recovery 적용 후 메일함 기능을 실제 제품 수준으로 hardening하기 위한 명세/프롬프트 패키지다.
