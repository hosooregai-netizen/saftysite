# 02_CLEAN_BUILD_QA

```text
너는 source recovery 이후 clean build QA를 수행한다.

명령:
rm -rf apps/web/.next
cd apps/web
npm run build

확인 route:
- /mailbox
- /photo-album
- /headquarters
- /sites
- /reports/new

산출물:
- build result
- remaining missing imports
- type errors
- next action
```
