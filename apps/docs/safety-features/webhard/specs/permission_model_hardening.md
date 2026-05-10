# Permission Model Hardening

## 목표

웹하드의 권한 모델을 단순 링크 공유가 아니라 업무용 파일/폴더 권한 체계로 강화한다.

## 핵심 모델

```ts
type DrivePermission = {
  id: string;
  workspaceId: string;
  itemId: string;
  principalType: 'user' | 'group' | 'domain' | 'anyone';
  principalId?: string | null;
  email?: string | null;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  inheritedFromItemId?: string | null;
  expiresAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
```

## 역할

| Role | 읽기 | 수정 | 공유 | 삭제 | 설명 |
|---|---:|---:|---:|---:|---|
| owner | O | O | O | O | 소유자 |
| editor | O | O | 제한 | 제한 | 편집 가능 |
| viewer | O | X | X | X | 보기 가능 |
| commenter | O | X | X | X | MVP에서는 viewer와 동일 처리 가능 |

## Principal

| Type | 설명 |
|---|---|
| user | 특정 사용자 |
| group | workspace group |
| domain | 특정 이메일 도메인 |
| anyone | 링크 접근자 |

## 권한 해석 순서

```text
1. workspace membership 확인
2. item owner 확인
3. item direct permission 확인
4. ancestor folder permission 확인
5. group/domain permission 확인
6. share link permission 확인
7. effective role 계산
```

## 필수 함수

```text
can_read_item(user, item)
can_edit_item(user, item)
can_share_item(user, item)
resolve_effective_permission(user, item)
list_effective_permissions(item)
is_descendant_of(item_id, ancestor_id)
```

## 보안 기준

- workspace 밖 item에 permission을 부여할 수 없다.
- owner transfer는 별도 API와 확인 절차가 필요하다.
- viewer는 data download/read만 가능하고 edit/delete/share UI가 없어야 한다.
- deleted/trashed item은 permission이 있어도 일반 목록과 public share에서 제외한다.
