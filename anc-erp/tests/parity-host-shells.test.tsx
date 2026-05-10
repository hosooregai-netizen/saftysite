import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import React from "react";

import MailAccountsPage from "../client/app/mail/accounts/page";
import MailComposePage from "../client/app/mail/compose/page";
import MailPage from "../client/app/mail/page";
import MailSettingsPage from "../client/app/mail/settings/page";
import ProjectMailPage from "../client/app/projects/[projectId]/mail/page";
import WebhardHomePage from "../client/app/webhard/page";
import WebhardProjectPage from "../client/app/webhard/projects/[projectId]/page";

async function renderPage(element: Promise<React.ReactNode> | React.ReactNode) {
  const resolved = await element;
  return renderToStaticMarkup(resolved);
}

async function run() {
  const webhardHomeMarkup = await renderPage(WebhardHomePage());
  assert.match(webhardHomeMarkup, /webhard-host-shell/);
  assert.match(webhardHomeMarkup, /A&amp;C ERP Webhard/);
  assert.match(webhardHomeMarkup, /full-screen host/);
  assert.match(webhardHomeMarkup, /최근 파일/);

  const webhardProjectMarkup = await renderPage(
    WebhardProjectPage({ params: Promise.resolve({ projectId: "project-sample-001" }) }),
  );
  assert.match(webhardProjectMarkup, /projectId project-sample-001/);
  assert.match(webhardProjectMarkup, /프로젝트 공간/);
  assert.match(webhardProjectMarkup, /tree → list → detail/);

  const mailMarkup = await renderPage(MailPage());
  assert.match(mailMarkup, /mailbox-host-shell/);
  assert.match(mailMarkup, /A&amp;C ERP Mailbox/);
  assert.match(mailMarkup, /3-pane host/);
  assert.match(mailMarkup, /받은 메일/);

  const composeMarkup = await renderPage(MailComposePage());
  assert.match(composeMarkup, /mailbox-host-shell/);
  assert.match(composeMarkup, /메일 작성/);
  assert.match(composeMarkup, /작성/);

  const accountsMarkup = await renderPage(MailAccountsPage());
  assert.match(accountsMarkup, /mailbox-host-shell/);
  assert.match(accountsMarkup, /메일 계정/);
  assert.match(accountsMarkup, /계정/);

  const settingsMarkup = await renderPage(MailSettingsPage());
  assert.match(settingsMarkup, /mailbox-host-shell/);
  assert.match(settingsMarkup, /메일 설정/);
  assert.match(settingsMarkup, /설정/);

  const projectMailMarkup = await renderPage(
    ProjectMailPage({ params: Promise.resolve({ projectId: "project-sample-001" }) }),
  );
  assert.match(projectMailMarkup, /projectId project-sample-001/);
  assert.match(projectMailMarkup, /프로젝트 메일/);
  assert.match(projectMailMarkup, /folders → threads → detail/);

  console.log("parity host shell smoke checks passed");
}

void run();
