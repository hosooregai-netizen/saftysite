# Schema: Billing & Credits

## BillingPackage

```ts
type BillingPackageId = 'starter-10' | 'team-30' | 'agency-100';

type BillingPackage = {
  id: BillingPackageId;
  amount_krw: number;
  credits: number;
  label?: string;
};
```

## BillingCheckoutRequest

```ts
type BillingCheckoutRequest = {
  workspace_id: string;
  package_id: BillingPackageId;
};
```

## BillingCheckoutResponse

```ts
type BillingCheckoutResponse = {
  checkoutUrl?: string | null;
  orderId: string;
  workspaceId: string;
  package: {
    amount_krw: number;
    credits: number;
  };
};
```

## BillingConfirmRequest

```ts
type BillingConfirmRequest = {
  payment_key: string;
  order_id: string;
  amount: number;
};
```

## BillingOrder

```ts
type BillingOrder = {
  id: string;
  workspace_id: string;
  user_id: string;
  package_id: BillingPackageId;
  amount_krw: number;
  credits: number;
  order_name: string;
  status: 'pending' | 'payment_created' | 'paid' | string;
  checkout_url?: string | null;
  payment_key?: string | null;
  approved_at?: string | null;
  credit_granted: boolean;
  credited_at?: string | null;
  approval_payload: Record<string, unknown>;
  webhook_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
```

## CreditLedgerEntry

```ts
type CreditLedgerEntry = {
  id: string;
  workspace_id: string;
  type:
    | 'grant_free_trial'
    | 'purchase'
    | 'consume_export'
    | string;
  amount: number;
  description: string;
  report_id?: string | null;
  source_order_id?: string | null;
  source_payment_key?: string | null;
  created_at: string;
};
```

## ReportExportBilling

```ts
type ReportExportBilling = {
  report_id: string;
  format: 'pdf' | 'hwpx';
  final_export_consumed: boolean;
  first_charge_applied: boolean;
  balance_after_export: number;
};
```

## Idempotency keys

```text
checkout payment create
→ order.id

confirm
→ confirm:{order_id}

ledger purchase uniqueness
→ order.credit_granted === true
```

## Schema 원칙

- balance는 ledger entry amount 합계로 계산한다.
- `credit_granted`는 purchase credit 중복 지급 방지 플래그다.
- `final_export_consumed`는 보고서별 최초 최종 출력 차감 방지 플래그다.
- ledger entry는 삭제하지 않는 append-only 구조가 이상적이다.
