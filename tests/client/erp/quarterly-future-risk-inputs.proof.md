# Quarterly Future Risk Inputs Proof

- Scope: `features/site-reports/quarterly-report/QuarterlyFuturePlansSection.tsx`
- Behavior: quarterly report section 4 keeps the content CRUD hazard-countermeasure catalog matching path, with `expectedRisk` feeding the risk textarea and `countermeasure` feeding the safety measure textarea.
- UI proof: section 4 textareas now expose combobox/listbox attributes and placeholders for expected-risk and management-measure search, while the input height is controlled by `futurePlanControl`.
- Static proof: `npx eslint features/site-reports/quarterly-report/QuarterlyFuturePlansSection.tsx --quiet`
- Runtime reachability: local Next app responded with HTTP 200 at `http://127.0.0.1:3100`.
