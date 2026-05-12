# Admin Overview Donut Center Label Removal Proof

- Static proof: `npm run lint`
- The change is limited to `features/admin/sections/overview/OverviewVisualCards.tsx`.
- Donut totals remain exposed through the SVG title and `aria-label`; visible values remain in the legend.

