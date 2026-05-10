# Assignment Spec

## 목적

사용자별로 접근 가능한 사업장/현장을 제한한다.

## 배정 유형

| 유형 | 설명 |
|---|---|
| Site Assignment | 특정 현장 단위 배정 |
| Headquarter Assignment | 특정 사업장 및 그 하위 현장 접근 배정 |

## 접근 판정

```text
관리자
→ workspace 내 모든 사업장/현장 접근

일반 사용자
→ 직접 site assignment가 있으면 해당 site 접근
→ headquarter assignment가 있으면 해당 headquarter와 하위 site 접근
→ 둘 다 없으면 assigned scope에서 빈 목록
```

## 배정 생성 검증

- user_id는 같은 workspace 사용자여야 한다.
- site_id/headquarter_id는 같은 workspace 데이터여야 한다.
- 중복 active assignment는 생성하지 않는다.
- 비활성 user에게 배정하지 않는다.

## 배정 삭제/비활성화

- hard delete보다 `is_active=false`를 우선한다.
- 이력 추적이 필요하면 updated_at과 actor를 남긴다.

## UI 기준

- 사업장/현장 상세 영역에서 배정 사용자 목록을 표시한다.
- 배정 추가 modal에서 사용자 검색을 제공한다.
- 배정 해제는 confirm dialog를 사용한다.
- 현재 로그인 사용자가 자기 접근권을 해제하는 경우 주의 문구를 표시한다.
