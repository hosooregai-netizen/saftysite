# Schema: Account Settings

## DemoSession

```ts
type SessionMode = 'authenticated' | 'anonymous' | 'local';

type DemoSession = {
  token: string;
  userId: string;
  userName: string;
  workspaceId: string;
  workspaceName: string;
  mode: SessionMode;
  isAnonymous: boolean;
  isLocalOnly: boolean;
};
```

## AuthResponse

```ts
type AuthResponse = {
  token: string;
  user: {
    id: string;
    email?: string;
    name?: string;
    auth_provider?: string;
    avatar_url?: string | null;
  };
  workspace: {
    id: string;
    name: string;
  };
  membership: {
    id: string;
    role: string;
  };
  creditBalance?: number;
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

## GoogleWorkspaceAuthStartResponse

```ts
type GoogleWorkspaceAuthStartResponse = {
  authUrl: string;
  state: string;
};
```

## GoogleWorkspaceAuthCompleteInput

```ts
type GoogleWorkspaceAuthCompleteInput = {
  authCode: string;
  redirectUri: string;
  state: string;
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

## GuestWorkspaceImportResponse

```ts
type GuestWorkspaceImportResponse = {
  imported: {
    headquarters: number;
    sites: number;
    mailboxDrafts: number;
    photoAlbum: number;
    driveItems: number;
    driveShares: number;
  };
  skipped?: Record<string, number>;
  workspaceId: string;
};
```

## Billing package

```ts
type BillingPackageCard = {
  id: 'free' | 'starter-10' | 'team-30' | 'agency-100' | string;
  name: string;
  amount: string;
  credits: string;
  note: string;
};
```
