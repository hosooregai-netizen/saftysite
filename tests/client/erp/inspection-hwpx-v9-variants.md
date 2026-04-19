# ERP Proof: Inspection HWPX v9 Variants

## Scope

- `features/inspection-session/**`
- `lib/documents/inspection/**`
- `server/documents/inspection/**`

## Expected Behavior

- technical guidance HWPX export chooses `v9-1` only when `document2Overview.accidentOccurred === 'yes'`
- the cover binds `cover.client_representative_name` from the site snapshot
- accident tracking in section 10 is image-only: UI shows two upload slots and generated output does not rely on text placeholders for occurrence/status
- section 7 labels align with the revised v9 template wording

## Checks

- `npm run build`
- manual code-path verification for client/server HWPX generators and the template patch script
- note: the local `annotated.v9-1.hwpx` file was locked during patching, so runtime placeholder stripping remains in place to keep generated documents clean until the file can be rewritten
