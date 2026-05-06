import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canUseReportServerApis,
  canUseWorkspaceServerApis,
  isLocalReportId,
  type DemoSession,
} from './reportApi';

const AUTHENTICATED_SESSION: DemoSession = {
  token: 'token-auth',
  userId: 'user-auth',
  userName: 'Authenticated User',
  workspaceId: 'workspace-auth',
  workspaceName: 'Authenticated Workspace',
  mode: 'authenticated',
  isAnonymous: false,
  isLocalOnly: false,
};

const ANONYMOUS_SESSION: DemoSession = {
  token: 'token-anon',
  userId: 'user-anon',
  userName: 'Anonymous User',
  workspaceId: 'workspace-anon',
  workspaceName: 'Anonymous Workspace',
  mode: 'anonymous',
  isAnonymous: true,
  isLocalOnly: false,
};

const LOCAL_SESSION: DemoSession = {
  token: 'token-local',
  userId: 'user-local',
  userName: 'Local User',
  workspaceId: 'workspace-local',
  workspaceName: 'Local Workspace',
  mode: 'local',
  isAnonymous: false,
  isLocalOnly: true,
};

test('canUseReportServerApis accepts anonymous report sessions while workspace server APIs stay authenticated-only', () => {
  assert.equal(canUseReportServerApis(AUTHENTICATED_SESSION), true);
  assert.equal(canUseReportServerApis(ANONYMOUS_SESSION), true);
  assert.equal(canUseReportServerApis(LOCAL_SESSION), false);

  assert.equal(canUseWorkspaceServerApis(AUTHENTICATED_SESSION), true);
  assert.equal(canUseWorkspaceServerApis(ANONYMOUS_SESSION), false);
  assert.equal(canUseWorkspaceServerApis(LOCAL_SESSION), false);
});

test('isLocalReportId recognizes encoded local report ids', () => {
  assert.equal(isLocalReportId('local-report:demo-id'), true);
  assert.equal(isLocalReportId('local-report%3Ademo-id'), true);
  assert.equal(isLocalReportId('local-report%253Ademo-id'), true);
  assert.equal(isLocalReportId('report_demo-id'), false);
});
