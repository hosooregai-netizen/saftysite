# UI/UX Spec: Billing & Credits

## 위치

결제 UI는 독립 메뉴라기보다 `/account#billing` 섹션에서 제공한다. `/credits`는 `/account#billing`로 redirect한다.

## Account billing section

권장 구성:

```text
현재 크레딧 잔액
→ N건

패키지 카드
→ 10건 / 30건 / 100건
→ 가격
→ 결제하기 CTA

최근 이력
→ 무료 체험 지급
→ 결제 지급
→ 보고서 출력 차감

오류/안내
→ billingNotice
→ billingError
```

## Checkout route

`/billing/checkout`는 오래 머무는 화면이 아니다. 결제 준비/이동 상태만 표시하고 Toss로 이동한다.

## Success route

`/billing/success`는 승인 확인 중 화면을 보여준 뒤 `/account#billing`로 이동한다.

## Fail route

`/billing/fail`은 실패 정보를 account billing section으로 전달한다.

## Report export UI

보고서 출력 영역에서 다음을 명확히 보여준다.

- 현재 잔액
- 최초 최종 출력 시 차감 여부
- credit 부족 시 충전 버튼
- 재출력 추가 차감 여부

## Accessibility

- 패키지 카드는 버튼 역할이 명확해야 한다.
- 금액과 크레딧 수는 스크린리더에서도 읽혀야 한다.
- 오류 메시지는 aria-live 영역에 표시한다.
