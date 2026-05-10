# Prompt 05: Implement Public Share

```text
너는 보안이 중요한 public file sharing page를 구현하는 시니어 풀스택 엔지니어다.

목표:
`/share/[token]` public share viewer를 `docs/safety-features/webhard/specs/public_share.md` 기준으로 구현/보강하라. 공유된 root 밖으로 절대 나갈 수 없어야 한다.

반드시 확인할 문서:
- docs/safety-features/webhard/specs/public_share.md
- docs/safety-features/webhard/specs/permissions.md
- docs/safety-features/webhard/specs/api_contract.md
- docs/safety-features/webhard/specs/test_scenarios.md

대상 코드:
- apps/web/app/share/[token]/page.tsx
- apps/web/components/PublicDriveShareScreen.tsx
- apps/web/features/drive/PublicDriveShareScreen.tsx
- apps/web/features/drive/driveApi.ts
- apps/web/features/drive/types.ts
- apps/web/lib/workspaceStorageApi.ts
- apps/api/app/main.py
- apps/api/app/drive_service.py

백엔드 요구사항:
1. GET /api/v1/drive/shares/{token}
   - token 검증
   - revoked/expired/root deleted 차단
   - root item 반환
   - folder root면 immediate children metadata 반환

2. GET /api/v1/drive/shares/{token}/items?parent_id=
   - parent_id 없으면 root folder
   - parent_id 있으면 root descendant folder인지 확인
   - sibling/parent/workspace root 접근 차단

3. GET /api/v1/drive/shares/{token}/items/{item_id}
   - item_id가 root 또는 descendant인지 확인
   - content payload는 이 검사 후에만 반환

4. Public serializer
   - private owner/workspace/group permission data 노출 금지
   - deleted/trashed item 제외

프론트 요구사항:
1. invalid/expired link state를 명확히 보여라.
2. shared file page와 shared folder browser를 모두 지원하라.
3. breadcrumb는 shared root 기준 relative breadcrumb만 보여라.
4. viewer role에서는 수정/삭제/이동 UI를 보여주지 마라.
5. editor role은 MVP에서 read-only로 처리해도 되지만 role label은 표시하라.
6. preview 가능한 파일은 preview, 아니면 download/open action을 제공하라.

테스트:
- valid file share
- valid folder share
- child folder navigation
- parent_id outside root
- item_id outside root
- revoked link
- expired link
- deleted root
- trashed child hidden

완료 기준:
- 공개 token으로 공유 root 밖 항목을 절대 볼 수 없다.
- 공개 viewer는 공유된 콘텐츠를 이해하기 쉬운 UI로 볼 수 있다.
- private metadata leakage가 없다.
```
