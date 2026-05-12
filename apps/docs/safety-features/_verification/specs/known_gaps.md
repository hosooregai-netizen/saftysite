# Known Gaps

## G1. Missing source files

Mailbox, photo-album, headquarters-sites 관련 source readiness 파일이 최신 zip source tree에서 누락되어 있다.

## G2. Dashboard/Pricing route registry

실제 app route에 `/dashboard`, `/pricing`이 있으므로 registry 추가 여부를 결정해야 한다.

## G3. API registry depth

FastAPI endpoint가 109개로 많다. 기존 group-level registry를 actual endpoint-level registry로 보강할지 결정해야 한다.

## G4. Combined docs package는 아직 코드에 적용된 상태를 전제로 하지 않는다

Step 14 combined overlay는 문서 패키지다. 실제 repository에 적용한 뒤 Step 15 verification prompt를 실행해야 한다.
