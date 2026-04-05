# Inspection API Restructure

## 목표

- `inspection` 문서 생성 흐름을 `quarterly`와 같은 서버 생성 구조로 맞춘다.
- `HWPX -> PDF` 변환은 Next 서버에 직접 묶지 않고, 별도 Windows 서버로 분리 가능한 구조로 만든다.
- 브라우저에서 실행 중인 서버성 로직을 단계적으로 백엔드 API 뒤로 이동한다.

## 이번 변경

- `app/api/documents/inspection/hwpx`
  - 기술지도 HWPX 생성용 서버 API 추가
- `app/api/documents/inspection/pdf`
  - 기술지도 세션 JSON을 직접 받아 HWPX 생성 후 PDF 변환하도록 변경
  - 기존 `multipart/form-data` HWPX 업로드 방식도 계속 지원
- `server/documents/inspection/hwpx`
  - 기존 클라이언트 HWPX 생성기를 서버용으로 분리
- `server/documents/inspection/hwpxToPdf`
  - 로컬 Windows COM 변환 코드는 유지하지만 운영 기준은 원격 Windows FastAPI 변환 서버 사용
  - `HWPX_PDF_CONVERTER_URL` 또는 `WINDOWS_HWPX_PDF_CONVERTER_URL` 필수
  - `HWPX_PDF_API_KEY` 또는 `WINDOWS_HWPX_PDF_API_KEY` 필수
  - 요청 헤더 `X-Internal-Api-Key` 로 서버 간 인증
  - 응답 헤더 `X-Inspection-Pdf-Warnings` 가 오면 Next 서버 로그에 남김
- `features/inspection-session/hooks/useInspectionSessionScreen`
  - HWPX/PDF 다운로드를 서버 API 우선으로 호출
  - 이행 기간 동안 브라우저 생성은 폴백으로 유지

## 최종 권장 구조

- Web client
  - 세션 편집
  - 파일 선택/미리보기
  - `/api/documents/inspection/hwpx`
  - `/api/documents/inspection/pdf`
  - `/api/safety/*`
- App backend
  - 세션 검증
  - HWPX 생성
  - 안전 API 프록시/인증
  - Windows 변환 서버 호출
- Windows document worker
  - Hancom Office COM 자동화
  - HWPX -> PDF 전용 처리
  - 변환 큐/타임아웃/장애 복구

## 다음으로 백엔드로 더 옮길 후보

- `lib/documents/inspection/hwpxClient.ts`
  - 현재는 폴백 전용으로만 남아 있음
  - 안정화 후 제거 대상
- `lib/safetyApi/ai.ts`
  - 현재 브라우저에서 토큰을 읽고 직접 `/api/safety` 호출
  - 서버 액션 또는 서버 라우트로 옮기면 토큰/권한 관리가 단순해짐
- `lib/safetyApi/assets.ts`
  - 업로드도 서버 경유로 바꾸면 대용량 제어와 감사 로그에 유리
- `lib/safetyApi/authStorage.ts`
  - 장기적으로는 브라우저 저장 토큰보다 서버 세션/쿠키 구조가 안전

## 운영 메모

- 별도 Windows 변환 서버를 붙일 때는 Next 서버가 Windows일 필요가 없다.
- 권장 운영값은 `HWPX_PDF_CONVERTER_URL=http://<windows-host>/api/v1/documents/inspection/pdf` 와 동일한 `HWPX_PDF_API_KEY` 조합이다.
- `inspection` 세션에 data URL 이미지가 많으면 요청 본문이 커질 수 있으므로, 업로드 자산 URL 사용 비율을 높이는 편이 좋다.
