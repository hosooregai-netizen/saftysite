# apps/api

FastAPI 기반의 기술지도 표준보고서 SaaS API 스캐폴드입니다.

현재 구현 범위:

- 인증, 워크스페이스, 크레딧, 리포트, AI draft, export 흐름의 초기 엔드포인트
- 메모리 기반 저장소
- 무료 2건 지급, 첫 export 성공 시 1건 차감 규칙
- 사진 기반 AI 파이프라인 결과 스텁 생성

실운영 전 전환 필요 항목:

- PostgreSQL + Redis + S3 호환 스토리지 연결
- Toss Payments 실결제 검증 로직
- OpenAI/Vision 호출과 비동기 작업 큐 연동
- HWPX/PDF export를 실제 report engine과 Windows 변환 워커에 연결
