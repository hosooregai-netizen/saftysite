# Mailbox Canonical Admin Report Selection Proof

## Scope

- admin mailbox report selection should hydrate from canonical `/api/admin/reports` rows instead of stale dashboard preload rows
- duplicate current/generated and legacy/original report titles should prefer the attachable legacy/original row
- oversized legacy original PDFs should stay on the original-PDF path long enough for `/api/mail/send-report` to switch them to download-link delivery

## Validation

- `pnpm exec tsx --test server/admin/originalPdfDocument.test.ts server/mail/reportAttachment.test.ts app/api/mail/send-report/route.test.ts`
- `pnpm exec eslint server/admin/originalPdfDocument.ts server/admin/originalPdfDocument.test.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `npm run build`

## Runtime Probe

- direct `buildMailReportAttachment(...)` probes now resolve `legacy:technical_guidance:427520` and `legacy:technical_guidance:440160` as `download_url` attachments with `size_bytes` `71241257` and `24504008`
- those probes confirm the mailbox/send pipeline no longer produces the generated `144KB` PDF for those legacy reports before the oversized-link fallback runs
