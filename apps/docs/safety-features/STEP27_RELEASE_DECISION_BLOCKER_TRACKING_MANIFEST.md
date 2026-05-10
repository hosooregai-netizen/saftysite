# Step 27 Manifest: Release Decision & Blocker Tracking

## 목적

Step 26 Final RC QA 실행 결과를 수집하고, release / hold 결정을 내리기 위한 보고서와 blocker 추적 체계를 만든다.

## 전제

Step 26은 QA 실행 순서와 gate를 정의했다. Step 27은 그 결과를 기록하고 의사결정으로 연결한다.

```text
Step 26 Final RC QA
→ clean build 결과
→ route smoke 결과
→ security gate 결과
→ business workflow 결과
→ visual/accessibility 결과
→ docs coverage 결과
→ Step 27 release decision
```

## 이번 단계의 범위

- RC 결과 수집 양식
- release blocker severity matrix
- 기능별 blocker owner mapping
- remaining patch sprint plan
- release / hold decision report
- rollback / hotfix 기준
- docs update after decision
- final sign-off checklist

## 제외 범위

- 실제 앱 코드 수정
- 실제 build 실행
- Toss 운영 결제 테스트
- 실제 Gmail API 운영 검증
