# Schema: Auth Workspace

## User

```ts
type User = {
  id: string;
  email: string;
  name: string;
  auth_provider: 'legacy' | 'google';
  oauth_subject?: string | null;
  avatar_url?: string | null;
  is_anonymous: boolean;
  role: 'super_admin' | 'admin' | 'controller' | 'field_agent' | 'client_viewer';
  position?: string | null;
  organization_name?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};
```

## Workspace

```ts
type Workspace = {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
};
```

## Membership

```ts
type Membership = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'member';
  created_at: string;
};
```

## DemoSession

```ts
type DemoSession = {
  token: string;
  userId: string;
  userName: string;
  workspaceId: string;
  workspaceName: string;
  mode: 'authenticated' | 'anonymous' | 'local';
  isAnonymous: boolean;
  isLocalOnly: boolean;
};
```

## AuthResponse

```ts
type AuthResponse = {
  token: string;
  user: User;
  workspace: Workspace;
  membership: Membership;
  creditBalance: number;
};
```

## GoogleWorkspaceAuthContext

```ts
type GoogleWorkspaceAuthContext = {
  anonymousToken: string | null;
  nextPath: string;
  requestedAt: number;
};
```

## GuestWorkspaceCache

```ts
type GuestWorkspaceCache = {
  directory: {
    headquarters: SafetyHeadquarter[];
    sites: SafetySite[];
    updatedAt: string | null;
  };
  mailboxDrafts: GuestMailboxDraft[];
  photoAlbum: GuestPhotoAlbumItem[];
  drive: {
    items: GuestDriveItem[];
    shares: GuestDriveShare[];
    updatedAt: string | null;
  };
  sync: {
    lastImportedAt: string | null;
    lastImportedWorkspaceId: string | null;
  };
};
```

## ImportGuestWorkspaceCacheResponse

```ts
type GuestWorkspaceImportResponse = {
  importedCounts: {
    headquarters: number;
    sites: number;
    mailboxDrafts: number;
    photoAlbum: number;
    driveItems: number;
    driveShares: number;
  };
  idMaps: {
    headquarters: Record<string, string>;
    sites: Record<string, string>;
    driveItems: Record<string, string>;
    driveShares: Record<string, string>;
  };
};
```
