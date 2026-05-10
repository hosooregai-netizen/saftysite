# Step 15 Manifest: Code ↔ Docs Verification

## 목적

Step 14 통합 문서 패키지가 최신 코드와 맞는지 검증한다.

## 생성 범위

```text
docs/safety-features/_verification/
├─ README.md
├─ STEP15_MANIFEST.md
├─ specs/
└─ prompts/
```

## 실제 스캔 결과 요약

| 항목 | 결과 |
|---|---:|
| Frontend app routes | 27 |
| FastAPI endpoints | 109 |
| Watched source files | 13 |
| Missing watched source files | 13 |

## 주요 확인 필요 사항

- 실제 route에는 `/dashboard`, `/pricing`이 존재한다. registry에 누락되어 있으면 추가해야 한다.
- mailbox/photo-album/headquarters-sites 관련 watched source file 다수가 source tree에서 누락된 것으로 확인된다.
- FastAPI endpoint가 109개로 많으므로 `_registry/api_registry.md`는 실제 endpoint inventory 기준으로 보강해야 한다.
