# Code ↔ Docs Verification

`_verification/`은 최신 코드베이스와 `docs/safety-features` 문서가 실제로 일치하는지 검증하기 위한 문서다.

## 이번 스캔 기준

- 입력 파일: `apps(3).zip`
- 스캔 시각: 2026-05-07 12:45 UTC
- Frontend app route 수: 27
- FastAPI endpoint 수: 109
- source readiness watchlist missing 수: 13

## 목적

- route registry와 실제 `apps/web/app` route를 대조한다.
- api registry와 실제 `apps/api/app/main.py` FastAPI endpoint를 대조한다.
- 기능별 code inventory와 실제 source file 존재 여부를 대조한다.
- missing source readiness 파일을 확인한다.
- reverse map과 prompt registry를 다음 단계에서 업데이트할 기준을 만든다.
