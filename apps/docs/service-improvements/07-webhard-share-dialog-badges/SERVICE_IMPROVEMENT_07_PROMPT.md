# Service Improvement 07 Prompt: Webhard Share Dialog & Badges UX

```text
너는 Drive-like 파일 관리 UI를 구현하는 시니어 프론트엔드 엔지니어다.

목표:
웹하드 공유 다이얼로그와 공유 상태 badge를 사용자가 이해하기 쉽게 개선하라.

대상 파일:
- apps/web/features/drive/DriveShareDialog.tsx
- apps/web/features/drive/DriveGrid.tsx
- apps/web/features/drive/useDriveItems.ts

요구사항:
1. 공유 dialog의 People with access / General access 구조는 유지하되 한국어 업무 UI에 맞게 문구를 정리하라.
2. Restricted / Anyone with link / Viewer / Editor 문구를 제한됨 / 링크가 있는 사용자 / 보기 전용 / 편집 가능으로 표시하라.
3. 일반 접근 섹션에 현재 링크 상태, 권한, 만료 정보를 helper로 표시하라.
4. Grid card에서도 Table row처럼 공유 badge detail을 표시하라.
5. 공유 badge는 링크 공유, 제한 링크, 사용자 N명, 공유 중지됨, 비공개를 구분해야 한다.
6. 만료 D-3 이하 링크는 warning tone을 유지하라.
7. 공유 badge에 접근성 aria-label을 추가하라.
8. 웹하드 Drive-like layout은 유지하고 ERP 카드형으로 회귀하지 마라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- 공유 dialog가 한국어 업무 UI로 정리된다.
- grid/table 모두 공유 상태와 detail이 명확하다.
- 웹하드 layout 회귀가 없다.
```
