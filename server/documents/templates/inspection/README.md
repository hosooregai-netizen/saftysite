`default-inspection.docx` 템플릿 파일을 이 폴더에 두면 됩니다.

권장 파일명:
- `default-inspection.docx`

권장 운영 방식:
- 양식 수정은 이 템플릿 파일 교체로 처리
- 웹은 입력만 담당
- 다운로드 시 `/api/documents/inspection/word` 로 현재 세션 JSON 전송
- 서버에서 템플릿 치환 후 `.docx` 또는 `.pdf` 생성

현재 상태:
- 프로젝트 구조와 API는 준비됨
- 실제 docx 치환 엔진은 아직 미연결

