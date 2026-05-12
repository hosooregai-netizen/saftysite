# 00_MASTER_SOURCE_RECOVERY

```text
너는 Next.js + TypeScript 프로젝트의 missing source recovery를 수행하는 시니어 프론트엔드 엔지니어다.

목표:
clean build를 막는 누락 source file을 복구하라.

대상:
- mailbox
- photo-album
- headquarters-sites
- shared types/API utilities
- document API bridge helpers

절대 수정하지 말 것:
- .next
- .venv
- __MACOSX

요구사항:
1. missing import 대상 source file을 생성한다.
2. 타입은 우선 build-safe하게 정의한다.
3. UI component는 MVP fallback으로 구현한다.
4. API client는 기존 Next.js proxy route를 사용한다.
5. 적용 후 `.next`를 삭제하고 build를 실행한다.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- missing import error가 사라진다.
- `/mailbox`, `/photo-album`, `/headquarters`, `/sites`, `/reports/new` route가 build 대상에서 실패하지 않는다.
```
