# Next Env DTS Note

## 발견 항목

정적 import scan에서 아래 참조가 남을 수 있다.

```text
apps/web/next-env.d.ts
→ ./.next/types/routes.d.ts
```

## 해석

이 파일은 일반 source file이 아니라 Next.js가 build 과정에서 생성하는 typed routes 관련 declaration일 수 있다. 따라서 source recovery overlay로 직접 생성하기보다, 실제 build 환경에서 Next.js가 생성하는지 확인한다.

## 검증

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## 대응 기준

| 상황 | 대응 |
|---|---|
| build 중 자동 생성됨 | 조치 없음 |
| build 전 TypeScript가 먼저 실패 | next-env.d.ts typed routes reference 정책 확인 |
| Next config typedRoutes 사용 중 | Next generated type 생성 순서 확인 |
| 계속 실패 | minimal declaration 또는 next-env 정책 패치 검토 |
