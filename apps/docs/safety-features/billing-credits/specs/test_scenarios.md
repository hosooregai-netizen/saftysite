# Test Scenarios: Billing & Credits

## Smoke

- [ ] `/account#billing`
- [ ] `/credits` → `/account#billing`
- [ ] `/billing/checkout?package=starter-10`
- [ ] invalid package → account error
- [ ] unauthenticated checkout → account auth required

## Checkout

- [ ] valid package creates order
- [ ] checkoutUrl returned
- [ ] Toss secret missing → 503
- [ ] workspace mismatch → blocked
- [ ] Toss payment create failure → 502

## Confirm

- [ ] valid success callback confirms payment
- [ ] amount mismatch → 409
- [ ] order not found → 404
- [ ] duplicate confirm → no duplicate ledger
- [ ] confirm after webhook DONE → no duplicate ledger

## Webhook

- [ ] DONE webhook grants credits once
- [ ] duplicate DONE webhook no duplicate ledger
- [ ] missing orderId ignored
- [ ] unknown order ignored
- [ ] non-DONE status updates order but does not grant credits

## Credit ledger

- [ ] free trial granted once
- [ ] purchase entry positive amount
- [ ] consume_export negative amount
- [ ] balance equals sum(amount)
- [ ] ledger sorted desc

## Report export billing

- [ ] credit 0 export fails 402
- [ ] first PDF export consumes 1
- [ ] second HWPX export same report consumes 0
- [ ] first_charge_applied only first export
- [ ] export history contains both formats
