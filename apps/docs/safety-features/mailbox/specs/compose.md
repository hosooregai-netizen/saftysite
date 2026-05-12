# Compose Spec: Mailbox

## 1. Goal

메일 작성 UX는 Gmail처럼 페이지 이동 없이 floating compose panel에서 처리한다. 새 메일, 답장, 전달, 임시저장, 첨부파일, 수신자 자동완성을 지원한다.

## 2. Compose Modes

| Mode | Trigger | Prefill |
|---|---|---|
| new | `+ 메일 작성` | empty |
| reply | viewer 답장 | subject `Re:`, to = original sender |
| forward | viewer 전달 | subject `Fwd:`, body includes forwarded content |
| draft | 임시보관함 row click | draft content |

## 3. Panel States

```text
closed
open
minimized
maximized
sending
saved
error
```

Rules:

- close with unsaved content asks confirmation or auto-saves draft.
- minimize keeps state.
- maximize expands but does not navigate away.
- Escape closes only if no modal confirmation is needed.

## 4. Fields

Required:

- account selector or selected account context
- to recipients
- cc
- subject
- rich body
- attachments
- send button
- draft status

Optional:

- bcc
- report/site tags
- signature
- template/snippet insertion

## 5. Recipient Field

The recipient field should support:

- email validation
- comma/semicolon Enter tokenization
- suggestions from `/api/v1/mail/recipient-suggestions`
- keyboard navigation
- duplicate removal
- invalid recipient warning

## 6. Attachments

Attachment draft shape:

```ts
interface MailboxAttachmentDraft {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  dataBase64?: string;
  downloadUrl?: string;
  source?: string | null;
  file?: File;
}
```

Rules:

- show filename and size
- allow remove before send
- limit size in validation
- convert to base64 only if backend contract requires it
- future: upload to object storage and send references

## 7. Draft Behavior

Draft should save when:

- user clicks save or closes panel with content
- user opens a draft
- periodic autosave is enabled in future

Draft content must include:

- accountId
- subject
- body
- recipients
- cc
- attachments
- headquarterId/siteId/reportKeys when applicable

## 8. Send Behavior

```text
onSend
→ validate selected account
→ validate recipients
→ validate subject/body or confirm blank subject
→ POST /api/v1/mail/send
→ success:
    close panel
    refresh sent/current threads
    show snackbar
→ failure:
    keep compose open
    show error
```

## 9. Reply/Forward Body Helpers

Required helper functions:

```ts
buildReplySubject
buildForwardSubject
buildThreadRecipients
buildForwardBody
formatMailBodyHtml
stripHtmlToText
dedupeRecipients
isLikelyEmail
```

These should live in:

```text
apps/web/features/mailbox/components/mailboxComposeHelpers.ts
```

## 10. Visual Requirements

- Floating panel bottom-right on desktop.
- Width 520-680px normal.
- Maximize to large centered or near-full viewport panel.
- Mobile uses bottom sheet or full-screen modal.
- Header has title and minimize/maximize/close controls.
- Primary send button is visually clear.
