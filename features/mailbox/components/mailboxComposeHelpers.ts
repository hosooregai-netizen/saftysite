import type { MailAttachmentPayload, MailMessage, MailThread } from '@/types/mail';
import { uploadSafetyAssetFile } from '@/lib/safetyApi/assets';
import type { ComposeState } from './mailboxPanelTypes';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function stripHtmlToText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function formatMailBodyHtml(value: string) {
  const trimmed = value.trim();
  const documentHead = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; background: #ffffff; overflow: hidden; }
      body { color: #111827; overflow-wrap: anywhere; }
      img { max-width: 100%; height: auto; }
    </style>
  `;

  const wrapDocument = (bodyHtml: string) =>
    `<!DOCTYPE html><html><head>${documentHead}</head><body>${bodyHtml}</body></html>`;

  const sanitizeMarkup = (markup: string) =>
    markup
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<base[\s\S]*?>/gi, '')
      .replace(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*>/gi, '')
      .replace(/\s(on\w+)=(".*?"|'.*?'|[^\s>]+)/gi, '')
      .replace(/\s(srcdoc)=(".*?"|'.*?'|[^\s>]+)/gi, '')
      .replace(/javascript:/gi, '');

  const appendDocumentHead = (markup: string) => {
    if (/<head[\s>]/i.test(markup)) {
      return markup.replace(/<head([^>]*)>/i, `<head$1>${documentHead}`);
    }
    if (/<html[\s>]/i.test(markup)) {
      return markup.replace(/<html([^>]*)>/i, `<html$1><head>${documentHead}</head>`);
    }
    return wrapDocument(markup);
  };

  if (!trimmed) return wrapDocument('');
  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return wrapDocument(
      `<pre style="margin:0; white-space:pre-wrap; font: 14px/1.65 sans-serif; color:#111827;">${escapeHtml(trimmed)}</pre>`,
    );
  }
  const sanitized = sanitizeMarkup(trimmed);
  return /<(?:!doctype|html|head|body)\b/i.test(sanitized)
    ? appendDocumentHead(sanitized)
    : wrapDocument(sanitized);
}

export function isLikelyEmail(value: string) {
  const normalized = value.trim();
  return normalized ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) : false;
}

export function dedupeRecipients(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function extractRecipientTokens(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildComposeState(input?: Partial<ComposeState>): ComposeState {
  return {
    body: input?.body || '',
    subject: input?.subject || '',
    toInput: input?.toInput || '',
    toRecipients: input?.toRecipients || [],
  };
}

export function buildThreadRecipients(thread: MailThread, accountEmail: string) {
  return thread.participants
    .filter((item) => item.email !== accountEmail)
    .map((item) => item.email)
    .join(', ');
}

export function buildReplySubject(subject: string) {
  const normalized = subject.trim();
  if (!normalized) return '';
  return /^re:/i.test(normalized) ? normalized : `Re: ${normalized}`;
}

function formatRecipientLabel(recipient: MailMessage['to'][number]) {
  const normalizedName = recipient.name?.trim();
  return normalizedName ? `${normalizedName} <${recipient.email}>` : recipient.email;
}

export function buildForwardSubject(subject: string) {
  const normalized = subject.trim();
  if (!normalized) return '';
  return /^(fw|fwd):/i.test(normalized) ? normalized : `Fwd: ${normalized}`;
}

export function buildForwardBody(message: MailMessage) {
  const sender = message.fromName?.trim()
    ? `${message.fromName} <${message.fromEmail}>`
    : message.fromEmail;
  const recipients = message.to.map(formatRecipientLabel).join(', ') || '-';
  const sentAt = message.sentAt || message.createdAt || '-';
  const bodyText = stripHtmlToText(message.body);
  const quotedBody = bodyText
    ? bodyText
        .split('\n')
        .map((line) => (line ? escapeHtml(line) : '&nbsp;'))
        .join('<br />')
    : '&nbsp;';

  return [
    '<p><br /></p>',
    '<div>---------- 전달된 메일 ----------</div>',
    `<div><strong>보낸사람:</strong> ${escapeHtml(sender)}</div>`,
    `<div><strong>받는사람:</strong> ${escapeHtml(recipients)}</div>`,
    `<div><strong>보낸시간:</strong> ${escapeHtml(sentAt)}</div>`,
    `<div><strong>제목:</strong> ${escapeHtml(message.subject || '(제목 없음)')}</div>`,
    '<br />',
    `<div>${quotedBody}</div>`,
  ].join('');
}

export async function buildFileAttachmentPayload(file: File): Promise<MailAttachmentPayload> {
  const uploaded = await uploadSafetyAssetFile(file);
  return {
    contentType: file.type || 'application/octet-stream',
    downloadUrl: uploaded.url,
    filename: file.name,
    sizeBytes: uploaded.size || file.size,
  };
}
