# Admin Overview Priority Quarterly Detection Proof

- `npx tsx --test features/admin/lib/control-center-model/overviewModel.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run lint`

The admin overview fallback now keeps a 20억 이상 current-quarter site in the quarterly management table even when the matching quarterly report only carries the quarter in its title or dates.

