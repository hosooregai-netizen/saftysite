# Design Implementation Map

## CSS locations

| Area | Likely CSS |
|---|---|
| global ERP tokens | `apps/web/app/globals.css` or global stylesheet |
| AppShell | `apps/web/components/AppShell*` |
| webhard | `apps/web/components/WebhardScreen.module.css`, `features/drive/*` |
| mailbox | `apps/web/features/mailbox/components/MailboxShell.module.css` |
| report workspace | `apps/web/components/ReportWorkspace.module.css` |
| guided upload | `apps/web/components/GuidedUploadFlow.module.css` |
| photo album | `apps/web/features/photos/components/PhotoAlbumPanel.module.css` |
| admin directory | `apps/web/features/admin/sections/*` |

## Implementation order

1. Audit current global tokens
2. Define token aliases
3. Normalize AppShell spacing/border/radius
4. Normalize list/table components
5. Webhard visual regression
6. Mailbox visual regression
7. Report workspace pattern
8. ERP list/form pattern
9. Accessibility pass
