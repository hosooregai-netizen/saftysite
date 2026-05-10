# Data Flow: <Feature Name>

## 1. Page load

```text
Route
→ Screen component
→ Hook/API client
→ Backend route
→ Service/store
→ Response normalization
→ UI state
```

## 2. 주요 데이터 흐름

| 흐름 | Frontend | API | Backend | Data |
|---|---|---|---|---|
| 목록 조회 |  |  |  |  |
| 상세 조회 |  |  |  |  |
| 생성 |  |  |  |  |
| 수정 |  |  |  |  |
| 삭제 |  |  |  |  |

## 3. 상태 전이

```text
idle → loading → success
idle → loading → error
success → refetching → success
```
