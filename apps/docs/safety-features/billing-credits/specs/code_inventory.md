# Code Inventory: Billing & Credits

## Frontend routes

```text
apps/web/app/billing/checkout/page.tsx
apps/web/app/billing/success/page.tsx
apps/web/app/billing/fail/page.tsx
apps/web/app/credits/page.tsx
```

## Frontend components

```text
apps/web/components/BillingCheckoutScreen.tsx
apps/web/components/BillingSuccessScreen.tsx
apps/web/components/BillingFailScreen.tsx
apps/web/components/AccountSettingsScreen.tsx
apps/web/components/ReportWorkspace.tsx
```

## Frontend API client

```text
apps/web/lib/reportApi.ts
  startBillingCheckout
  confirmBillingPayment
  fetchCreditBalance
  fetchCreditLedger
  registerReportExport
```

## Backend

```text
apps/api/app/main.py
  billing_checkout
  billing_confirm
  billing_webhook
  credits_balance
  credits_ledger
  export_pdf
  export_hwpx

apps/api/app/services/credits.py
  ledger_balance
  list_ledger_entries
  add_ledger_entry
  grant_workspace_trial

apps/api/app/config.py
  BILLING_PACKAGES
  TOSS_PAYMENTS_API_BASE_URL
  TOSS_PAYMENTS_SECRET_KEY
  FREE_TRIAL_CREDITS

apps/api/app/models.py
  BillingCheckoutRequest
  BillingConfirmRequest
  TossWebhookRequest
  CreditLedgerEntry
  ReportExport
```

## Do not touch

```text
apps/web/.next
apps/api/.venv
__MACOSX
```
