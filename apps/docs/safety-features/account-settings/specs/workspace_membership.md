# Workspace Membership Spec

## 목적

사용자와 워크스페이스의 관계를 정의하고, 기능별 접근 가능 여부를 결정한다.

## 모델

```ts
type Workspace = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type Membership = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | string;
};
```

## 권한 기준

| Role | 설명 |
|---|---|
| owner | workspace 생성자, 모든 기능 접근 |
| admin | 기준정보/사용자 관리 가능 |
| member | 배정된 업무 데이터 중심 접근 |

## 기능별 사용

| 기능 | workspace 사용 |
|---|---|
| report-workspace | report workspace_id |
| report-list | workspace report list |
| headquarters-sites | directory and assignment |
| photo-album | workspace photo records |
| webhard | drive items and permissions |
| mailbox | mail accounts per user/workspace |
| billing-credits | workspace credit ledger |

## UI 기준

- workspace name을 설정 화면에 표시한다.
- workspace role을 표시한다.
- workspace 전환 기능이 없다면 “현재 작업공간”으로 명확히 표시한다.
- workspace 없음 상태는 409 복구 플로우를 제공한다.
