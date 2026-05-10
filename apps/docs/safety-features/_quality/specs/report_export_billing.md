# Report Export Billing Regression

## 정책

- 보고서별 최초 final export 성공 시 1 credit 차감
- PDF/HWPX 중 어떤 형식을 먼저 출력하든 최초 1회만 차감
- 같은 보고서의 후속 출력은 추가 차감하지 않음
- export record에는 `first_charge_applied` 기록

## 테스트

1. credit 0에서 export 실패
2. review incomplete report export 409
3. disclaimer missing 409
4. review completed + balance 1 → PDF export 성공, balance 0
5. 같은 report HWPX export → 추가 차감 없음
6. 다른 report export → credit 부족 실패
