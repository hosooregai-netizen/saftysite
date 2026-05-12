# Release Blocker Patch Templates

`_blocker-patches/`는 RC QA에서 발견된 blocker를 기능별 patch sprint로 전환하기 위한 템플릿 모음이다.

## 사용 순서

```text
1. Step 27 release decision report에서 blocker를 확인한다.
2. severity를 S0~S4로 분류한다.
3. feature owner를 지정한다.
4. 기능별 prompt를 실제 blocker 정보로 채운다.
5. patch 적용 후 focused QA와 related regression을 실행한다.
6. release decision report를 업데이트한다.
```
