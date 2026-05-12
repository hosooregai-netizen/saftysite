# Inheritance & Effective Permission

## 목표

폴더 공유 시 하위 파일/폴더에 권한이 상속되도록 하고, 실제 UI/API에서는 effective permission을 기준으로 동작하게 한다.

## 상속 규칙

```text
Folder A permission
→ Folder A 하위 Folder B
→ Folder B 하위 File C
```

Folder A에 viewer 권한이 있으면 B와 C에도 viewer 권한이 적용된다.

## 직접 권한과 상속 권한

| 상황 | 결과 |
|---|---|
| 상위 폴더 viewer, 하위 파일 직접 editor | editor |
| 상위 폴더 editor, 하위 파일 직접 viewer | 정책 필요: 명시적 제한을 허용할지 결정 |
| 상위 폴더 공유 취소 | 상속 권한 제거 |
| 하위 파일 direct permission 존재 | direct permission 유지 |

## MVP 정책

- 높은 권한을 우선한다.
- `owner > editor > commenter/viewer`.
- 상위 폴더 권한을 제거해도 direct permission은 유지한다.
- restricted item feature는 후속 단계로 분리한다.

## API response 권장 필드

```ts
type DriveItemResponse = DriveItem & {
  effectiveRole?: 'owner' | 'editor' | 'viewer';
  inheritedPermissionFrom?: string | null;
  isShared?: boolean;
  shareSummary?: {
    visibility: 'restricted' | 'anyone_with_link';
    role: 'viewer' | 'editor';
    expiresAt?: string | null;
  } | null;
};
```

## UI 기준

- 상속된 공유는 “상위 폴더에서 공유됨”으로 표시한다.
- 직접 공유는 “직접 공유됨”으로 표시한다.
- share dialog에서 inherited permission을 삭제하려면 상위 폴더로 이동하도록 안내한다.
