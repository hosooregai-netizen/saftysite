# Import Scan After Step 17

## Summary

| 항목 | 결과 |
|---|---:|
| scan time | 2026-05-07 14:03 UTC |
| source files scanned | 157 |
| alias/relative import references checked | 343 |
| unresolved unique imports | 1 |
| status | PASS |

## Remaining unresolved imports

| Importing source | Import target | Resolved base |
|---|---|---|
| `apps/web/next-env.d.ts` | `./.next/types/routes.d.ts` | `apps/web/.next/types/routes.d.ts` |

## 판단

Step 17 source recovery overlay를 적용하면 다음 계열의 missing source issue는 정적 import scan 기준으로 해소된다.

```text
mailbox source recovery
photo-album source recovery
headquarters-sites source recovery
shared UI/util recovery
document API bridge helper recovery
report session mapper root constants/types recovery
```

`./.next/types/routes.d.ts`는 `apps/web/next-env.d.ts`가 참조하는 Next.js generated type 파일이다. 실제 `next build` 과정에서 생성되는 파일이므로 일반 source recovery 대상과 분리해서 본다.
