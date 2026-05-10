# Service Improvement 09 Prompt: Photo Album Grid / Filters / Guest-Auth Adapter

```text
너는 Next.js 사진첩 기능을 현장 사진 관리 화면으로 고도화하는 시니어 프론트엔드 엔지니어다.

목표:
PhotoAlbumPanel을 grid/list, 사업장/현장/회차/검색 필터, guest/auth adapter, 업로드/다운로드/삭제 UX를 갖춘 사진첩 화면으로 개선하라.

대상 파일:
- apps/web/types/photos.ts
- apps/web/features/photos/components/PhotoAlbumPanel.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.module.css

요구사항:
1. Grid/List 보기 전환을 구현하라.
2. 사업장, 현장, 회차, 출처, 검색 필터를 제공하라.
3. URL에서 받은 initialHeadquarterId/initialSiteId를 초기 필터에 반영하라.
4. 현장 선택 시 사업장 id를 자동 보정하라.
5. guestAdapter의 list/upload/downloadSelection/deleteSelection/updateRounds와 호환되게 하라.
6. authenticated mode에서는 /api/report-saas/v1/photo-album 기본 adapter를 사용하라.
7. 사진 상세 drawer에 preview와 metadata를 표시하라.
8. 보고서 evidence linking CTA를 제공하되 실제 연결은 다음 단계로 남겨도 된다.
9. 사진첩은 ERP AppShell 화면으로 유지하고 웹하드/메일함 layout으로 바꾸지 마라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- /photo-album route build가 깨지지 않는다.
- guest mode에서 사진 upload/list/download/delete가 가능하다.
- auth mode에서 server adapter fallback이 동작한다.
- 필터와 empty state가 자연스럽다.
```
