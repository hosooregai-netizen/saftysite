# Step 16 Release Notes

## 변경

- actual route/API/source readiness 기준 registry patch를 추가했다.
- `/dashboard`, `/pricing` route를 문서화했다.
- frontend API proxy route를 별도 registry로 분리했다.
- 실제 FastAPI endpoint inventory를 추가했다.
- source readiness missing 상태를 registry와 quality docs에 반영했다.

## Release 영향

문서만 변경한다. 앱 코드 변경은 없다.

## 다음 release 전 필수

- missing source recovery
- clean build
- route smoke
- security regression
