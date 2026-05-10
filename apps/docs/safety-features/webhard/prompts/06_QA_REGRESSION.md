# Prompt 06: Webhard QA Regression

```text
너는 웹하드 기능의 회귀 테스트와 보안 검증을 담당하는 QA 엔지니어다.

목표:
웹하드 변경 후 기능, UI, 권한, 공개 공유, build 상태를 검증하라.

반드시 확인할 문서:
- docs/safety-features/webhard/specs/validation.md
- docs/safety-features/webhard/specs/test_scenarios.md
- docs/safety-features/webhard/specs/permissions.md
- docs/safety-features/webhard/specs/public_share.md

검증 대상 코드:
- apps/web/features/drive/*
- apps/web/components/WebhardScreen.tsx
- apps/web/components/PublicDriveShareScreen.tsx
- apps/web/lib/workspaceStorageApi.ts
- apps/api/app/main.py
- apps/api/app/drive_service.py
- apps/api/app/models.py

Build 검증:
```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

수동 smoke 검증:
1. /webhard 진입
2. 새 폴더 생성
3. 파일 업로드
4. 메모 생성
5. 링크 생성
6. 폴더 진입/나가기
7. 검색/정렬/필터
8. 리스트/그리드 전환
9. 상세 패널 열기/닫기
10. 이름 변경
11. 이동
12. 중요 표시
13. 휴지통 이동
14. 복원
15. 공유 dialog 열기
16. 링크 공유 생성
17. public share 열기
18. 링크 폐기 후 접근 실패

보안 검증:
1. 공유 root 밖 parent_id 요청 실패
2. 공유 root 밖 item_id 요청 실패
3. expired share 실패
4. revoked share 실패
5. deleted/trashed root 실패
6. trashed child public list에서 숨김
7. 권한 없는 사용자의 internal API 접근 실패
8. public response에 private owner/group/permission data 없음

UI 검증:
1. Drive-like fullscreen workspace 유지
2. nested ERP card layout으로 회귀하지 않음
3. 좌측 flat navigation 유지
4. file canvas 넓게 표시
5. selection toolbar 표시
6. context menu 동작
7. empty state/ snackbar 표시
8. share dialog 정보구조 적절

산출물:
- 통과/실패 checklist
- 발견한 버그 목록
- 재현 단계
- 수정 권장 우선순위
- 업데이트해야 할 docs 목록

완료 기준:
웹하드의 CRUD, share, public share, permission boundary, UI non-regression이 모두 검증된다.
```
