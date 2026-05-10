# 00_MASTER_IMPORT_RESOLUTION_VERIFICATION

```text
너는 Next.js + TypeScript 프로젝트의 source recovery 검증을 담당하는 시니어 프론트엔드 엔지니어다.

목표:
Step 17 source recovery overlay 적용 후 정적 import resolution을 검증하고, 실제 clean build 전 남은 리스크를 문서화하라.

요구사항:
1. apps/web source files의 alias/relative import를 스캔하라.
2. Step 17 overlay 파일을 포함해서 missing source가 남는지 확인하라.
3. `.next/types/routes.d.ts`처럼 Next.js generated file은 일반 source missing과 분리하라.
4. 실제 clean build에 필요한 환경 조건을 정리하라.
5. route smoke manual plan을 작성하라.
6. 앱 코드는 수정하지 마라.

완료 기준:
- missing source import class가 해결되었는지 판단할 수 있다.
- 실제 build 환경에서 다음에 무엇을 확인해야 하는지 명확하다.
```
