# Google OAuth Verification Guide

## Console Values

Use these values in Google Cloud Console for the current production deployment.

| Field | Value |
| --- | --- |
| App name | `한국종합안전 업무시스템` |
| User support email | 운영 문의를 실제로 받는 메일 주소 |
| Developer contact information | 운영자 메일 주소 1개 이상 |
| App home page | `https://saftysite-seven.vercel.app/service-intro` |
| App privacy policy | `https://saftysite-seven.vercel.app/privacy` |
| App terms of service | `https://saftysite-seven.vercel.app/terms` |
| Authorized domain | `saftysite-seven.vercel.app` |
| Redirect URI | `https://saftysite-seven.vercel.app/mail/connect/google` |

## Scopes

- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`

## Scope Justification

### App Purpose

> Korea Comprehensive Safety Work System is an internal operations platform for construction safety guidance work. It is used by controllers, administrators, and field agents to manage sites, generate reports, and handle report-related email communication.

### Why `gmail.readonly` is required

> The app reads incoming Gmail messages to display the connected inbox inside the service, review report-related replies, verify whether sent reports were received, and show ongoing email threads associated with specific sites and reports. The app does not modify or delete mailbox contents.

### Why `gmail.send` is required

> The app sends outbound emails directly from the user’s connected Gmail account for report delivery and operational communication within the mailbox workflow.

### Why broader scopes are not used

> The app does not request broader Gmail scopes such as `gmail.modify` or `mail.google.com` because it only needs read-only inbox access and outbound sending. It does not need permission to delete, archive, or otherwise modify mailbox state.

## Demo Video

Google requires a demo video that shows:

1. The end-to-end app flow.
2. The complete OAuth consent screen in English.
3. The exact scopes requested.
4. The in-app features that use those scopes.

Official reference:

- https://support.google.com/cloud/answer/13461325?hl=en
- https://support.google.com/cloud/answer/13804565?hl=en
- https://support.google.com/cloud/answer/15549135?hl=en-AU

### Acceptable narration

Google’s guidance explicitly says **voice or text narration** can help facilitate review, so either of these is acceptable:

- AI voiceover
- On-screen captions / subtitles only
- Human narration

Recommended approach:

- record the real UI
- add concise English captions
- optional Korean AI voiceover

### Suggested video order

1. Open `https://saftysite-seven.vercel.app/service-intro`
2. Show `Privacy Policy` and `Terms of Service`
3. Log in to the app
4. Open `/admin?section=mailbox&box=inbox`
5. Show the `지메일 로그인` button
6. Start Google OAuth
7. Show the full consent screen in English with the requested scopes
8. Return to the app after connection
9. Show inbox list and thread detail using `gmail.readonly`
10. Show compose/send flow using `gmail.send`

## Suggested English Captions

### Scene 1

`This is the public homepage of Korea Comprehensive Safety Work System.`

### Scene 2

`This page explains the service purpose, mailbox integration, and policy documents.`

### Scene 3

`After login, administrators use the mailbox section to manage report-related email workflows.`

### Scene 4

`The app asks the user to connect a Gmail account before inbox and sending features are used.`

### Scene 5

`The OAuth consent screen shows the exact scopes requested by the app.`

### Scene 6

`gmail.readonly is used to display inbox threads and review report-related replies.`

### Scene 7

`gmail.send is used to send outbound report emails from the connected Gmail account.`

### Scene 8

`The app does not request broader Gmail scopes such as gmail.modify or full mailbox access.`
