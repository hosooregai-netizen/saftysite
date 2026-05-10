# Schema: Headquarters & Sites

## SafetyHeadquarter

```ts
type SafetyHeadquarter = {
  id: string;
  workspace_id: string;
  name: string;
  management_number?: string;
  opening_number?: string;
  business_registration_no?: string;
  corporate_registration_no?: string;
  license_no?: string;
  address?: string;
  contact_name?: string;
  contact_phone?: string;
  memo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
```

## SafetySite

```ts
type SafetySite = {
  id: string;
  workspace_id: string;
  headquarter_id: string;
  client_business_name?: string;
  site_name: string;
  site_address?: string;
  manager_name?: string;
  manager_phone?: string;
  status?: 'active' | 'paused' | 'completed' | 'inactive' | string;
  start_date?: string;
  end_date?: string;
  last_visit_date?: string;
  report_count?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};
```

## SafetyUser

```ts
type SafetyUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
  workspace_id?: string;
  is_active?: boolean;
};
```

## SafetyAssignment

```ts
type SafetyAssignment = {
  id: string;
  workspace_id: string;
  site_id: string;
  user_id: string;
  role?: 'owner' | 'manager' | 'viewer' | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
```

## SafetyHeadquarterAssignment

```ts
type SafetyHeadquarterAssignment = {
  id: string;
  workspace_id: string;
  headquarter_id: string;
  user_id: string;
  role?: 'owner' | 'manager' | 'viewer' | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
```

## 입력 타입

```ts
type SafetyHeadquarterInput = Omit<
  SafetyHeadquarter,
  'id' | 'workspace_id' | 'created_at' | 'updated_at'
>;

type SafetySiteInput = Omit<
  SafetySite,
  'id' | 'workspace_id' | 'created_at' | 'updated_at'
>;
```

## Schema 원칙

- backend 저장 필드는 snake_case를 기본으로 한다.
- frontend form state는 기존 component convention에 맞추되 API payload에서 정규화한다.
- `headquarter_id`는 site 생성 시 필수다.
- 비활성화는 hard delete보다 `is_active=false` 또는 deactivate endpoint를 우선한다.
- 보고서/사진/메일 연계가 있는 site/headquarter는 삭제보다 비활성화한다.
