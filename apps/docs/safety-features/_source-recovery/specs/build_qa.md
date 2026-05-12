# Source Recovery Build QA

## 목적

Step 17 source overlay 적용 후 clean build를 실행하고, 남은 오류를 다음 작업자가 바로 처리할 수 있게 분류한다.

## 실행 순서

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

백엔드 import check도 가능하면 실행한다.

```bash
cd apps/api
python -m compileall app
```

## 결과 분류

| 오류 유형 | 설명 | 다음 조치 |
|---|---|---|
| Missing import | 파일이 여전히 없음 | source file 추가 |
| Type mismatch | 타입 정의가 실제 사용처와 다름 | `types/*.ts` 보강 |
| Component props mismatch | fallback component props 부족 | component interface 확장 |
| API contract mismatch | frontend client와 proxy/backend 경로 불일치 | api client 수정 |
| CSS class missing | CSS module class 누락 | CSS module 보강 |
| Server route helper missing | `/api/documents/*` helper 누락 | server helper 추가 |
| External package missing | package dependency 문제 | package.json/workspace 확인 |

## 산출물

- build 로그 요약
- 오류별 기능 분류
- release blocking 여부
- Step 19에서 수정할 patch list
