# Import Resolution Gate

## Gate 기준

| Gate | 기준 | 현재 Step 19 결과 |
|---|---|---|
| missing source import | 0 일반 source missing | PASS |
| generated Next type | build generated file은 별도 처리 | `1` unresolved |
| clean build | 실제 `npm run build` 필요 | pending |

## Release 의미

정적 import scan 통과는 release 가능을 의미하지 않는다. 다음을 추가로 확인해야 한다.

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```
