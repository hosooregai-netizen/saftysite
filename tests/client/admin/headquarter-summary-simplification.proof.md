# Headquarter Summary Simplification Proof

- Static proof: `npx eslint features/admin/sections/headquarters/HeadquarterSummaryPanel.tsx`
- Type proof: `npx tsc --noEmit`

The headquarter summary panel no longer displays the completion badge, data-completion card, or registration-status card. It keeps number fields as plain registration values and presents contractor contact details in a dedicated `담당자 연락 정보` card.
