# Service Improvement 06 Prompt: Webhard Permission & Public Share Security

```text
너는 Drive-like 파일 관리 SaaS의 권한/공개 공유 보안을 구현하는 시니어 풀스택 엔지니어다.

목표:
웹하드 public share의 root boundary와 응답 데이터 노출 범위를 강화하라.

대상 파일:
- apps/api/app/drive_service.py
- apps/api/app/main.py
- apps/web/lib/workspaceStorageApi.ts
- apps/web/features/drive/PublicDriveShareScreen.tsx

요구사항:
1. public share metadata에서 내부 workspace 기준정보를 노출하지 마라.
2. /share/[token] 응답에 access metadata(role, visibility, expires_at)를 포함하라.
3. children endpoint는 shared root descendants만 반환해야 한다.
4. item endpoint는 shared root 밖 item_id를 차단해야 한다.
5. folder item은 metadata만 반환하고, file item은 권한 확인 후 content를 반환하라.
6. expired/revoked/deleted/trashed share는 데이터를 반환하지 마라.
7. public share page에서 “공유 루트와 하위 항목만 접근 가능”을 명확히 표시하라.
8. Drive-like UI를 유지하고 ERP 카드형 웹하드로 회귀하지 마라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

cd apps/api
python -m compileall app

완료 기준:
- /webhard route smoke 통과
- /share/{token} route smoke 통과
- shared root 밖 접근 차단
- public response의 내부 workspace metadata 노출 감소
```
