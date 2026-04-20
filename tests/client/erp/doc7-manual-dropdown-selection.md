# ERP Proof: Doc7 Manual Dropdown Selection

## Expected Behavior

- changing `재해유형`, `기인물`, `유해위험요인`, or `개선요청사항` does not automatically overwrite `관리대책` or `관련 법령`
- selecting a recommendation from the `유해위험작업 안전대책` dropdown is the only action that fills the related hazard, control measure, and legal reference fields
- AI refill updates the analyzed finding draft and keeps `DOC7 참고자료` matching, but it does not auto-apply hazard countermeasure catalog entries

## Verification

- `npx tsc --noEmit --pretty false`
- `node --import tsx --test lib/doc7ReferenceMaterials.test.ts`

## Manual Check

- open a technical guidance report Doc7 finding
- change `재해유형` and `기인물` and confirm `관리대책`/`관련 법령` stay as-is
- focus the recommendation dropdown fields and select an uploaded catalog item
- confirm the selected item fills the related fields only after the explicit selection
