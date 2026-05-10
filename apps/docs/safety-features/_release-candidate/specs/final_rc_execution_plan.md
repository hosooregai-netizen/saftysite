# Final RC Execution Plan

## 실행 순서

```text
0. Step 17 source recovery 적용 여부 확인
1. clean build
2. source readiness check
3. route smoke
4. security gates
5. business workflow QA
6. visual/accessibility QA
7. docs coverage / reverse map QA
8. release decision
```

## Clean build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

Backend:

```bash
cd apps/api
python -m compileall app
```

## Release blocking 기준

- frontend clean build 실패
- workspace access guard 실패
- public share boundary 실패
- OAuth state/security 실패
- Toss confirm/webhook idempotency 실패
- report export gate 실패
- mailbox account state contradiction
- webhard Drive-like layout regression
