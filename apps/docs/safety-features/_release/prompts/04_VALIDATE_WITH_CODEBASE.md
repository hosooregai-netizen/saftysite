# 04_VALIDATE_WITH_CODEBASE

```text
너는 문서와 실제 코드의 일치 여부를 검증하는 소프트웨어 아키텍트다.

목표:
route_registry, api_registry, code_map이 실제 최신 코드와 맞는지 검증하라.

확인 대상:
- apps/web/app/*
- apps/web/components/*
- apps/web/features/*
- apps/web/lib/*
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/apps_stack.py
- apps/api/app/drive_service.py
- apps/api/app/mail_google_service.py

완료 기준:
- 문서 route와 실제 route가 일치한다.
- 문서 API와 실제 API가 일치한다.
- 불일치 항목은 registry update 대상으로 기록한다.
```
