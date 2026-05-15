# Admin Proof: Headquarter License Field Restore

## Covered Behavior

- The admin headquarter editor surfaces the stored `license_no` field as `건설업면허/등록번호`.
- The inline headquarter creation flow in the site editor also captures `license_no`.
- Workspace headquarter filtering includes `license_no`.

## Verification

- `npm run lint -w @saftysite/web`
